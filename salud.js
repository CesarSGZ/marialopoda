'use strict';
// ---------- Comida, peso y pasos ----------
// Llegan de Salud del iPhone (MyFitnessPal, Libra y el Apple Watch escriben allí) a través de Health Auto Export, que los
// manda al servidor de Cesarlópodo. Aquí se leen y se convierten en consejos.
const SALUD_URL = 'https://cesar-solla.pages.dev/api/salud';
const KCAL_KG = 7700; // calorías que hay en un kilo de peso corporal, aproximadamente
// Ritmo recomendado por semana, en % del peso: volumen lento para ganar sobre todo músculo, definición sin perder fuerza.
const RITMO = { volumen: 0.25, definicion: -0.5, mantener: 0 };
const NOMBRE_OBJETIVO = { volumen: 'Volumen', definicion: 'Definición', mantener: 'Mantener' };

async function traerSalud() {
  const c = partesCodigo();
  if (!c) return;
  try {
    const d = await (await fetch(SALUD_URL, { headers: { 'x-pique': c.k } })).json();
    if (!d.ok) return;
    estado.salud = d.salud; guardar('salud', d.salud);
    const activo = document.activeElement;
    if (estado.vista === 'progreso' && $('#capa').hidden && (!activo || !activo.matches('input, textarea'))) pintar();
  } catch (e) { /* sin red: lo guardado */ }
}
async function guardarObjetivo(tipo) {
  const c = partesCodigo(), peso = parseFloat(String(($('#peso-objetivo') || {}).value || '').replace(',', '.'));
  const objetivo = { tipo, peso: Number.isFinite(peso) ? peso : (estado.salud && estado.salud.objetivo && estado.salud.objetivo.peso) || null };
  estado.salud = { ...(estado.salud || { dias: {} }), objetivo }; guardar('salud', estado.salud);
  pintar();
  try { await fetch(SALUD_URL, { method: 'POST', headers: { 'x-pique': c.k, 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ objetivo }) }); } catch (e) { /* se vuelve a mandar al cambiarlo */ }
}

// Tendencia del peso como la de Libra: media móvil exponencial (10 %), que no se asusta por un día de retención.
function tendenciaPeso(dias, hoy) {
  const fechas = Object.keys(dias).filter((d) => dias[d].peso).sort();
  if (!fechas.length) return [];
  const out = [];
  let t = dias[fechas[0]].peso;
  for (let d = fechas[0]; d <= hoy; d = desplazar(d, 1)) {
    if (dias[d] && dias[d].peso) t += 0.1 * (dias[d].peso - t);
    out.push([d, t]);
  }
  return out;
}
// Pendiente en kg por día de la tendencia en una ventana (mínimos cuadrados).
function pendienteKg(puntos) {
  if (puntos.length < 2) return 0;
  const n = puntos.length, xs = puntos.map((_, i) => i), mx = (n - 1) / 2, my = puntos.reduce((s, p) => s + p[1], 0) / n;
  const num = xs.reduce((s, x, i) => s + (x - mx) * (puntos[i][1] - my), 0), den = xs.reduce((s, x) => s + (x - mx) ** 2, 0);
  return num / den;
}
const mediaSalud = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const redondea = (v, paso) => Math.round(v / paso) * paso;

function analizarSalud(salud, hoy) {
  const dias = (salud && salud.dias) || {}, objetivo = salud && salud.objetivo;
  const rango = (n) => Array.from({ length: n }, (_, i) => desplazar(hoy, -i)).reverse();
  const ultimos14 = rango(14), ultimos21 = rango(21);
  // Pasos
  const pasos = rango(30).map((d) => [d, dias[d] && dias[d].pasos ? dias[d].pasos : 0]);
  const conPasos = (l) => l.filter((p) => p[1] > 0).map((p) => p[1]);
  const pasos7 = mediaSalud(conPasos(pasos.slice(-7))), pasos30 = mediaSalud(conPasos(pasos));
  // Peso
  const tend = tendenciaPeso(dias, hoy), tendHoy = tend.length ? tend[tend.length - 1][1] : null;
  const pesos21 = ultimos21.filter((d) => dias[d] && dias[d].peso);
  const ventana = tend.filter(([d]) => d >= ultimos21[0]);
  const kgDia = pesos21.length >= 2 && Date.parse(pesos21[pesos21.length - 1]) - Date.parse(pesos21[0]) >= 9 * 864e5 ? pendienteKg(ventana) : null;
  // Comida: días con algo apuntado de verdad (más de 500 kcal); un día a medias falsearía la media.
  const comidos = ultimos14.filter((d) => dias[d] && dias[d].kcal > 500);
  const medio = (campo) => mediaSalud(comidos.map((d) => dias[d][campo]).filter((v) => v > 0));
  const kcal = medio('kcal'), prot = medio('prot'), carb = medio('carb'), grasa = medio('grasa');
  const comidos21 = ultimos21.filter((d) => dias[d] && dias[d].kcal > 500);
  // Gasto: lo que comes menos lo que el peso dice que sobra o falta. Necesita al menos 10 días apuntados y 10 días de peso.
  const gasto = kgDia !== null && comidos21.length >= 10 ? mediaSalud(comidos21.map((d) => dias[d].kcal)) - kgDia * KCAL_KG : null;
  const semana = kgDia !== null ? kgDia * 7 : null;
  let meta = null;
  if (gasto && objetivo && tendHoy) {
    const ritmo = RITMO[objetivo.tipo] / 100 * tendHoy; // kg por semana
    meta = { kcal: redondea(gasto + ritmo * KCAL_KG / 7, 50), ritmo };
  }
  return { dias, objetivo, pasos, pasos7, pasos30, hoyPasos: dias[hoy] && dias[hoy].pasos, tend, tendHoy, semana, kcal, prot, carb, grasa, comidos: comidos.length, gasto, meta, ultimo: Object.keys(dias).sort().pop() };
}

function consejosSalud(a) {
  const out = [], o = a.objetivo, kgSem = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(Math.round(v * 100) / 100))} kg`;
  if (a.comidos < 10) out.push(`Para afinar los consejos hacen falta más días apuntados en MyFitnessPal: con casi todos los días de las dos últimas semanas ya funciona.`);
  if (a.semana === null) out.push('Para saber hacia dónde va tu peso hacen falta pesadas de al menos diez días. Con pesarte unas cuantas mañanas por semana basta.');
  if (a.gasto) out.push(`Tu gasto estimado es de unas ${miles(redondea(a.gasto, 50))} kcal al día: lo que comes, corregido por lo que hace tu peso.`);
  if (o && a.meta && a.semana !== null) {
    const objetivoSem = a.meta.ritmo, va = a.semana, diff = va - objetivoSem;
    const comes = a.kcal ? `comes unas ${miles(redondea(a.kcal, 50))} kcal y ` : '';
    // "En ritmo" es al menos la mitad del ritmo recomendado; por debajo, en la práctica, está en mantenimiento o en déficit.
    if (o.tipo === 'volumen') {
      if (va < objetivoSem * 0.5) out.push(`Estás en volumen, pero ${comes}tu peso ${va <= -0.05 ? `baja (${kgSem(va)} por semana): sigues en déficit` : `casi no se mueve (${kgSem(va)} por semana): estás en mantenimiento`}. Para subir unos ${kgSem(objetivoSem)} por semana, come unas ${miles(a.meta.kcal)} kcal al día.`);
      else if (diff > Math.abs(objetivoSem) * 0.8) out.push(`Subes ${kgSem(va)} por semana, algo rápido para un volumen limpio. Bajar a unas ${miles(a.meta.kcal)} kcal te deja en ${kgSem(objetivoSem)} por semana, más músculo y menos grasa.`);
      else out.push(`Vas genial: subes ${kgSem(va)} por semana, justo el ritmo de un buen volumen. Sigue con unas ${miles(a.meta.kcal)} kcal. 🌻`);
    } else if (o.tipo === 'definicion') {
      if (va > objetivoSem * 0.5) out.push(`Estás en definición, pero ${comes}tu peso ${va >= 0.05 ? `sube (${kgSem(va)} por semana)` : `casi no baja (${kgSem(va)} por semana): estás en mantenimiento`}. Para bajar unos ${kgSem(-objetivoSem)} por semana sin perder fuerza, come unas ${miles(a.meta.kcal)} kcal.`);
      else if (diff < -Math.abs(objetivoSem) * 0.8) out.push(`Bajas ${kgSem(va)} por semana: demasiado rápido, y así se pierde músculo. Sube a unas ${miles(a.meta.kcal)} kcal.`);
      else out.push(`Bajas ${kgSem(va)} por semana, buen ritmo para definir sin perder fuerza. Sigue con unas ${miles(a.meta.kcal)} kcal. 🌻`);
    } else {
      out.push(Math.abs(va) < 0.1 ? `Tu peso está estable: tu mantenimiento ronda las ${miles(a.meta.kcal)} kcal.` : `Tu peso ${va > 0 ? 'sube' : 'baja'} ${kgSem(va)} por semana. Para mantenerte, unas ${miles(a.meta.kcal)} kcal.`);
    }
    if (o.peso && a.tendHoy && Math.abs(o.peso - a.tendHoy) > 0.3 && Math.abs(objetivoSem) > 0) {
      const semanas = Math.round((o.peso - a.tendHoy) / objetivoSem);
      if (semanas > 0) out.push(`Al ritmo recomendado, llegarías a ${num(o.peso)} kg en unas ${semanas} ${semanas === 1 ? 'semana' : 'semanas'}.`);
    }
  } else if (!o) out.push('Elige abajo tu objetivo (volumen, definición o mantener) y te digo cuánto comer.');
  if (a.prot && a.tendHoy) {
    const min = 1.6 * a.tendHoy;
    out.push(a.prot < min ? `Proteína: tomas unos ${miles(a.prot)} g al día. Para ganar o mantener músculo se recomiendan 1,6–2,2 g por kilo: unos ${miles(redondea(min, 5))}–${miles(redondea(2.2 * a.tendHoy, 5))} g para ti.` : `Proteína: unos ${miles(a.prot)} g al día, dentro de lo recomendado para tu músculo (1,6–2,2 g por kilo). 💪`);
  }
  if (a.pasos7 && a.pasos30) out.push(a.pasos7 > a.pasos30 * 1.1 ? `Esta semana caminas más que de costumbre: unos ${miles(a.pasos7)} pasos al día. 🚶‍♀️` : a.pasos7 < a.pasos30 * 0.85 ? `Esta semana caminas menos que de costumbre (unos ${miles(a.pasos7)} pasos al día frente a ${miles(a.pasos30)}). Los pasos también cuentan para el gasto.` : `Caminas unos ${miles(a.pasos7)} pasos al día, como de costumbre.`);
  return out;
}

function barritas(lista, color) {
  const max = Math.max(1, ...lista.map((p) => p[1]));
  return `<div class="barritas" aria-hidden="true">${lista.map(([d, v]) => `<i title="${fechaCorta(d)}: ${miles(v)}" style="height:${Math.max(3, Math.round(v / max * 100))}%;background:${color}"></i>`).join('')}</div>`;
}
function lineaPeso(tend) {
  const p = tend.slice(-60);
  if (p.length < 2) return '';
  const min = Math.min(...p.map((x) => x[1])) - 0.3, max = Math.max(...p.map((x) => x[1])) + 0.3;
  const pts = p.map(([, v], i) => `${(i / (p.length - 1) * 300).toFixed(1)},${(60 - (v - min) / (max - min) * 56 - 2).toFixed(1)}`).join(' ');
  return `<svg class="linea-peso" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--chicle)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}

function pintarSalud() {
  const s = estado.salud;
  const hayDatos = s && s.dias && Object.keys(s.dias).length;
  const objetivos = (o) => `<div class="objetivo-salud"><p>Tu objetivo</p>
    <div class="opciones-objetivo">${Object.keys(NOMBRE_OBJETIVO).map((t) => `<button type="button" data-objetivo="${t}" aria-pressed="${!!(o && o.tipo === t)}">${NOMBRE_OBJETIVO[t]}</button>`).join('')}</div>
    <label for="peso-objetivo">Peso al que quieres llegar (opcional)</label>
    <div class="fila-objetivo"><input id="peso-objetivo" inputmode="decimal" placeholder="kg" value="${o && o.peso ? num(o.peso) : ''}"><button type="button" data-objetivo="${o ? o.tipo : 'mantener'}">Guardar</button></div></div>`;
  if (!hayDatos) {
    return `<h2 class="gorda seccion">Comida, peso y pasos</h2>
      <section class="tarjeta-salud"><p>Aquí verás tus pasos del Apple Watch, tu peso de Libra y tu comida de MyFitnessPal, con consejos para tu objetivo. Todavía no ha llegado nada de Salud: Cesarlópodo tiene que conectarlo en tu iPhone.</p>${objetivos(s && s.objetivo)}</section>`;
  }
  const a = analizarSalud(s, hoyIso());
  const consejos = consejosSalud(a);
  return `<h2 class="gorda seccion">Comida, peso y pasos</h2>
    <section class="tarjeta-salud">
      <div class="cifras-salud">
        <div><small>Pasos hoy</small><b>${a.hoyPasos ? miles(a.hoyPasos) : '—'}</b><span>${a.pasos7 ? `media semana ${miles(a.pasos7)}` : ''}</span></div>
        <div><small>Peso (tendencia)</small><b>${a.tendHoy ? `${num(Math.round(a.tendHoy * 10) / 10)} kg` : '—'}</b><span>${a.semana !== null ? `${a.semana >= 0 ? '+' : '−'}${num(Math.abs(Math.round(a.semana * 100) / 100))} kg/semana` : ''}</span></div>
        <div><small>Comes (14 días)</small><b>${a.kcal ? `${miles(a.kcal)} kcal` : '—'}</b><span>${a.prot ? `P ${miles(a.prot)} · C ${miles(a.carb || 0)} · G ${miles(a.grasa || 0)} g` : ''}</span></div>
        <div><small>Gasto estimado</small><b>${a.gasto ? `${miles(redondea(a.gasto, 50))} kcal` : '—'}</b><span>${a.meta ? `para tu objetivo: ${miles(a.meta.kcal)}` : ''}</span></div>
      </div>
      ${lineaPeso(a.tend)}
      <p class="mini-titulo">Pasos, último mes</p>${barritas(a.pasos, 'var(--amarillo)')}
      <ul class="consejos">${consejos.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      ${objetivos(a.objetivo)}
      <p class="pie">Llega de Salud: MyFitnessPal, Libra y el Apple Watch escriben allí y Health Auto Export lo manda aquí. Último día recibido: ${a.ultimo ? fechaCorta(a.ultimo) : '—'}. El gasto sale de comparar lo que comes con lo que hace tu peso (unas 7.700 kcal por kilo): es una estimación que mejora con más días apuntados.</p>
    </section>`;
}
