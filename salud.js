'use strict';
// ---------- Comida, peso y pasos ----------
// Llegan de Salud del iPhone (MyFitnessPal, Libra y el Apple Watch escriben allí) con un atajo de la app Atajos, que los
// manda al servidor de Cesarlópodo. Aquí se cruzan con sus entrenos y se convierten en un análisis con consejos.
const SALUD_URL = 'https://cesar-solla.pages.dev/api/salud';
const KCAL_KG = 7700;                 // calorías en un kilo de peso corporal, aproximadamente
const KCAL_PASO_KG = 0.0006;          // gasto de un paso por kilo de peso (unas 360 kcal por 10.000 pasos a 60 kg)
const KCAL_SESION_KG = 2.5;           // gasto extra de una sesión de pesas de una hora por kilo de peso
// Ritmo recomendado por semana, en % del peso: volumen lento para ganar sobre todo músculo, definición sin perder fuerza.
const MIN_DIAS_COMIDA = 7;          // días completos de comida antes de dar una media
const RITMO_RECOMENDADO = { volumen: 0.25, definicion: -0.5, mantener: 0 };
const NOMBRE_OBJETIVO = { volumen: 'Volumen', definicion: 'Definición', mantener: 'Mantener' };

// ---------- Red ----------
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
async function mandarSalud(cuerpo) {
  const c = partesCodigo();
  try { const d = await (await fetch(SALUD_URL, { method: 'POST', headers: { 'x-pique': c.k, 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify(cuerpo) })).json(); if (d.ok && d.salud) { estado.salud = d.salud; guardar('salud', d.salud); } } catch (e) { /* se guarda aquí y se manda la próxima vez */ }
}
const leerCampo = (id) => { const v = parseFloat(String(($('#' + id) || {}).value || '').replace(',', '.')); return Number.isFinite(v) ? v : null; };
function guardarObjetivo(tipo) {
  const s = estado.salud || { dias: {} }, antes = s.objetivo || {};
  const objetivo = { tipo: tipo || antes.tipo || 'mantener', peso: leerCampo('peso-objetivo') ?? antes.peso ?? null, ritmo: leerCampo('ritmo-objetivo') ?? null, kcal: leerCampo('kcal-objetivo') ?? null };
  if (tipo && tipo !== antes.tipo) objetivo.ritmo = null; // al cambiar de objetivo, vuelve al ritmo recomendado
  const perfil = { edad: leerCampo('edad-perfil') ?? (s.perfil || {}).edad ?? null, altura: leerCampo('altura-perfil') ?? (s.perfil || {}).altura ?? null };
  estado.salud = { ...s, objetivo, perfil }; guardar('salud', estado.salud);
  pintar();
  mandarSalud({ objetivo, perfil });
}
// Un toque cambia el día: cuenta → fuera; fuera → como diga la app; "parece incompleto" → cuenta.
function marcarDia(fecha, ahora) {
  const s = estado.salud || { dias: {} }, marcas = { ...(s.marcas || {}) };
  const siguiente = ahora === 'cuenta' ? 'fuera' : ahora === 'sospechoso' ? 'dentro' : null;
  if (siguiente) marcas[fecha] = siguiente; else delete marcas[fecha];
  estado.salud = { ...s, marcas }; guardar('salud', estado.salud);
  pintar();
  mandarSalud({ marcar: { fecha, estado: siguiente } });
}

// ---------- Cálculos ----------
const mediaSalud = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : null);
const medianaSalud = (l) => { const s = [...l].sort((a, b) => a - b), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2) : null; };
const redondea = (v, paso) => Math.round(v / paso) * paso;
const rango = (hoy, n, desde = 0) => Array.from({ length: n }, (_, i) => desplazar(hoy, -(n - 1 - i) - desde));

// Tendencia del peso como la de Libra: media móvil exponencial (10 %), que no se asusta por un día de retención.
function tendenciaPeso(dias, hoy) {
  const fechas = Object.keys(dias).filter((d) => dias[d].peso && d <= hoy).sort();
  if (!fechas.length) return [];
  const out = [];
  let t = dias[fechas[0]].peso;
  for (let d = fechas[0]; d <= hoy; d = desplazar(d, 1)) {
    if (dias[d] && dias[d].peso) t += 0.1 * (dias[d].peso - t);
    out.push([d, t]);
  }
  return out;
}
// Pendiente en kg por día de la tendencia (mínimos cuadrados).
function pendienteKg(puntos) {
  if (puntos.length < 2) return 0;
  const n = puntos.length, mx = (n - 1) / 2, my = puntos.reduce((s, p) => s + p[1], 0) / n;
  let a = 0, b = 0;
  puntos.forEach((p, i) => { a += (i - mx) * (p[1] - my); b += (i - mx) ** 2; });
  return a / b;
}
// Qué días de comida cuentan. Un día sin nada no existe; uno marcado por ella manda; y uno muy por debajo de lo normal
// (menos del 65 % de la mediana) parece incompleto: una cena fuera sin apuntar, unas vacaciones…
function diasComida(dias, marcas, fechas) {
  const conAlgo = fechas.filter((d) => dias[d] && dias[d].kcal > 0);
  const tipica = medianaSalud(conAlgo.map((d) => dias[d].kcal)) || 0;
  return conAlgo.map((d) => {
    const m = marcas[d], bajo = dias[d].kcal < tipica * 0.65 || dias[d].kcal < 800;
    const estadoDia = m === 'fuera' ? 'fuera' : m === 'dentro' ? 'cuenta' : bajo ? 'sospechoso' : 'cuenta';
    return { fecha: d, kcal: dias[d].kcal, estado: estadoDia, manual: Boolean(m) };
  });
}
// Lo que se mueve: entrenos, peso movido y caminadora, de sus propias filas.
function actividadEntre(filas, desde, hasta) {
  const dentro = filas.filter((f) => f[F.FECHA] >= desde && f[F.FECHA] <= hasta);
  const pesas = dentro.filter((f) => f[F.EJ] !== CAMINADORA);
  return {
    entrenos: new Set(pesas.map((f) => f[F.FECHA])).size,
    kg: pesas.reduce((s, f) => s + (typeof kilosMovidos === 'function' ? kilosMovidos(f) : (+f[F.KG] || 0) * (+f[F.REPS] || 0)), 0),
    km: dentro.filter((f) => f[F.EJ] === CAMINADORA).reduce((s, f) => s + datosCaminata(f).km, 0)
  };
}
// Cómo ha cambiado su fuerza: mejor 1RM estimado de cada ejercicio en las últimas 4 semanas frente a las 4 anteriores.
function cambiosFuerza(filas, hoy) {
  const ahora = desplazar(hoy, -27), antes = desplazar(hoy, -55);
  const mejor = new Map();
  for (const f of filas) {
    if (f[F.EJ] === CAMINADORA || SIN_LASTRE[f[F.EJ]] || ES_MEDIDO.has(f[F.EJ]) || f[F.FECHA] < antes || f[F.FECHA] > hoy) continue;
    const v = e1rmDe(+f[F.KG], +f[F.REPS]);
    if (!v) continue;
    const e = mejor.get(f[F.EJ]) || { antes: 0, ahora: 0 };
    if (f[F.FECHA] >= ahora) e.ahora = Math.max(e.ahora, v); else e.antes = Math.max(e.antes, v);
    mejor.set(f[F.EJ], e);
  }
  const lista = [...mejor].filter(([, e]) => e.antes && e.ahora).map(([ej, e]) => ({ ej, cambio: e.ahora / e.antes - 1 }));
  return { suben: lista.filter((x) => x.cambio >= 0.025).sort((a, b) => b.cambio - a.cambio), bajan: lista.filter((x) => x.cambio <= -0.025).sort((a, b) => a.cambio - b.cambio), comparados: lista.length };
}

function analizarSalud(salud, filas, hoy) {
  const dias = (salud && salud.dias) || {}, marcas = (salud && salud.marcas) || {}, objetivo = salud && salud.objetivo, perfil = (salud && salud.perfil) || {};
  // Hoy siempre está a medias (aún no ha cenado ni ha terminado de andar): comida y pasos se cuentan hasta ayer.
  const ayer = desplazar(hoy, -1);
  const v28 = rango(ayer, 28), v14 = rango(ayer, 14), v7 = rango(ayer, 7), previas = rango(ayer, 28, 7);
  // Peso: el de hoy sí vale.
  const tend = tendenciaPeso(dias, hoy), peso = tend.length ? tend[tend.length - 1][1] : null;
  const pesadas = rango(hoy, 28).filter((d) => dias[d] && dias[d].peso);
  const hayTendencia = pesadas.length >= 4 && (Date.parse(pesadas[pesadas.length - 1]) - Date.parse(pesadas[0])) / 864e5 >= 10;
  const kgDia = hayTendencia ? pendienteKg(tend.filter(([d]) => d >= pesadas[0])) : null;
  const semana = kgDia === null ? null : kgDia * 7;
  // Comida
  const comida28 = diasComida(dias, marcas, v28), cuentan28 = comida28.filter((d) => d.estado === 'cuenta');
  const cuentan14 = cuentan28.filter((d) => d.fecha >= v14[0]);
  const fuera = comida28.filter((d) => d.estado !== 'cuenta');
  const sinApuntar = v14.filter((d) => d >= (Object.keys(dias).filter((x) => dias[x].kcal > 0).sort()[0] || hoy) && !(dias[d] && dias[d].kcal > 0)).length;
  // Sin una semana de días completos no hay media: con uno o dos días saldría un número que no es verdad.
  const hayComida = cuentan28.length >= MIN_DIAS_COMIDA;
  const base = cuentan14.length >= MIN_DIAS_COMIDA ? cuentan14 : cuentan28;
  const comeMedia = hayComida ? mediaSalud(base.map((d) => d.kcal)) : null;
  const macro = (campo) => (hayComida ? mediaSalud(base.map((d) => dias[d.fecha][campo]).filter((v) => v > 0)) : null);
  // Actividad: esta semana frente a las cuatro anteriores
  const pasosDe = (l) => mediaSalud(l.map((d) => dias[d] && dias[d].pasos).filter((v) => v > 0));
  const pasos7 = pasosDe(v7), pasosAntes = pasosDe(previas), pasos28 = pasosDe(v28);
  const act7 = actividadEntre(filas, v7[0], hoy), actAntes = actividadEntre(filas, previas[0], previas[previas.length - 1]), act28 = actividadEntre(filas, v28[0], hoy);
  const entrenosSemana = act28.entrenos / 4;
  // Mantenimiento por fórmula: Mifflin-St Jeor para mujeres, más lo que gastan sus pasos y sus entrenos, más la digestión (10 %).
  let formula = null, bmr = null;
  if (peso && perfil.edad && perfil.altura) {
    bmr = 10 * peso + 6.25 * perfil.altura - 5 * perfil.edad - 161;
    formula = (bmr + (pasos28 || 0) * KCAL_PASO_KG * peso + entrenosSemana * KCAL_SESION_KG * peso / 7) / 0.9;
  }
  // Mantenimiento por sus datos: lo que come menos lo que el peso dice que sobra o falta.
  const datos = kgDia !== null && cuentan28.length >= 10 ? mediaSalud(cuentan28.map((d) => d.kcal)) - kgDia * KCAL_KG : null;
  // Cuanto más completos los datos, más mandan ellos; la fórmula rellena lo que falta.
  const peso_datos = datos === null ? 0 : Math.min(1, cuentan28.length / 21);
  const mantenimiento = datos !== null && formula !== null ? datos * peso_datos + formula * (1 - peso_datos) : datos ?? formula;
  const confianza = datos !== null && peso_datos >= 0.8 ? 'alta' : datos !== null ? 'media' : formula !== null ? 'baja' : null;
  const balance = mantenimiento && comeMedia ? comeMedia - mantenimiento : null;
  // Objetivo
  const ritmo = objetivo ? (objetivo.ritmo ?? (peso ? RITMO_RECOMENDADO[objetivo.tipo] / 100 * peso : 0)) : null; // kg/semana
  // Nunca por debajo de su metabolismo basal ni de 1.200 kcal: por debajo se pierde músculo, energía y ganas.
  const suelo = Math.max(1200, bmr ? redondea(bmr, 50) : 0);
  const sinSuelo = mantenimiento && ritmo !== null ? redondea(mantenimiento + ritmo * KCAL_KG / 7, 50) : null;
  const comerPara = sinSuelo === null ? null : Math.max(suelo, sinSuelo);
  const llegar = (velocidad) => {
    if (!objetivo || !objetivo.peso || !peso || !velocidad || Math.abs(objetivo.peso - peso) < 0.3) return null;
    const semanas = (objetivo.peso - peso) / velocidad;
    return semanas > 0 && semanas < 260 ? desplazar(hoy, Math.round(semanas * 7)) : null;
  };
  // Patrones: fines de semana, el último peso frente a la tendencia, y si su cuerpo gasta lo que dice la fórmula.
  const esFinde = (d) => [0, 6].includes(new Date(`${d}T12:00:00Z`).getUTCDay());
  const finde = cuentan28.filter((d) => esFinde(d.fecha)), laborable = cuentan28.filter((d) => !esFinde(d.fecha));
  const comparable = finde.length >= 3 && laborable.length >= 6;
  const kcalFinde = comparable ? mediaSalud(finde.map((d) => d.kcal)) : null, kcalSemana = comparable ? mediaSalud(laborable.map((d) => d.kcal)) : null;
  const apuntado = (d) => dias[d] && dias[d].kcal > 0 && marcas[d] !== 'fuera';
  const primeraComida = Object.keys(dias).filter((d) => dias[d].kcal > 0).sort()[0] || hoy;
  const desdeComida = v28.filter((d) => d >= primeraComida);
  // Los huecos solo se miran desde que empezó a llegar su comida: antes no es que no apuntara, es que no se enviaba.
  const huecosFinde = !hayComida ? 0 : desdeComida.filter((d) => esFinde(d) && !apuntado(d)).length / Math.max(1, desdeComida.filter(esFinde).length);
  const huecosSemana = !hayComida ? 0 : desdeComida.filter((d) => !esFinde(d) && !apuntado(d)).length / Math.max(1, desdeComida.filter((d) => !esFinde(d)).length);
  const ultimaPesada = pesadas.length ? pesadas[pesadas.length - 1] : null;
  const pico = ultimaPesada && ultimaPesada >= desplazar(hoy, -2) && peso ? dias[ultimaPesada].peso - peso : null;
  return {
    suelo, enSuelo: sinSuelo !== null && sinSuelo < suelo, kcalFinde, kcalSemana, huecosFinde, huecosSemana, pico, discrepancia: datos !== null && formula !== null ? datos - formula : null,
    hayComida, llegaComida: Object.keys(dias).some((d) => dias[d].kcal > 0), dias, objetivo, perfil, peso, tend, semana, comida28, fuera, sinApuntar, cuentan: cuentan14.length, comeMedia,
    prot: macro('prot'), carb: macro('carb'), grasa: macro('grasa'), pasos30: rango(hoy, 30).map((d) => [d, (dias[d] && dias[d].pasos) || 0]),
    pasos7, pasosAntes, act7, actAntes, entrenosSemana, formula, datos, mantenimiento, confianza, balance, ritmo, comerPara,
    llegaSiSigue: semana !== null && Math.abs(semana) >= 0.03 ? llegar(semana) : null, llegaConRitmo: llegar(ritmo),
    fuerza: cambiosFuerza(filas, hoy), ultimo: Object.keys(dias).sort().pop()
  };
}

// ---------- Lo que se le cuenta ----------
const kgSemana = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(Math.round(v * 100) / 100))} kg por semana`;
const kcalTexto = (v) => `${miles(redondea(v, 10))} kcal`;
const listaY = (l) => (l.length > 1 ? `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}` : l[0] || '');

function analisisTexto(a) {
  const out = [], o = a.objetivo;
  // 1. Dónde está: mantenimiento y balance.
  if (a.mantenimiento && a.comeMedia) {
    const b = a.balance, dif = Math.abs(redondea(b, 10));
    out.push(`Comes de media unas ${kcalTexto(a.comeMedia)} al día y tu mantenimiento ronda las ${kcalTexto(a.mantenimiento)}: ${Math.abs(b) < 75 ? 'estás prácticamente en mantenimiento' : b > 0 ? `estás unas ${dif} kcal por encima (superávit)` : `estás unas ${dif} kcal por debajo (déficit)`}.${a.semana !== null ? ` Tu peso va a ${kgSemana(a.semana)}.` : ''}`);
  } else if (!a.hayComida) out.push(`${a.llegaComida ? 'Ya llega tu comida de MyFitnessPal.' : 'Aún no ha llegado tu comida de MyFitnessPal.'} Cuando tengas una semana apuntada entera, te digo cuánto comes de media y si estás en superávit.${a.formula ? ` Por ahora, por fórmula, tu mantenimiento ronda las ${kcalTexto(a.formula)}.` : ''}`);
  // 2. Hacia dónde va, frente a su objetivo.
  if (o && a.semana !== null && a.ritmo !== null && !a.hayComida) {
    const e = estadoObjetivo(a), quiere = `${o.tipo === 'volumen' ? 'tu volumen' : o.tipo === 'definicion' ? 'tu definición' : 'mantenerte'}`;
    out.push(e === 'bien' ? `Tu peso va a ${kgSemana(a.semana)}: justo el ritmo para ${quiere}. 🌻` : e === 'rapido' ? `Tu peso va a ${kgSemana(a.semana)}, algo más rápido de lo que buscas para ${quiere} (${kgSemana(a.ritmo)}).` : `Tu peso va a ${kgSemana(a.semana)}; para ${quiere} buscas ${kgSemana(a.ritmo)}.`);
  } else if (o && a.semana !== null && a.ritmo !== null) {
    const r = a.ritmo, va = a.semana;
    if (o.tipo === 'volumen') {
      if (va < r * 0.5) out.push(`Para tu volumen (${kgSemana(r)}) te falta comida: ${va <= -0.05 ? 'tu peso baja' : 'tu peso casi no se mueve'}. Sube a unas ${kcalTexto(a.comerPara)} al día.`);
      else if (va > r * 1.6 && va - r > 0.1) out.push(`Vas a ${kgSemana(va)}, más rápido de lo que el músculo puede aprovechar: parte se iría a grasa. Bajar a unas ${kcalTexto(a.comerPara)} te deja en ${kgSemana(r)}.`);
      else out.push(`Superávit limpio: vas a ${kgSemana(va)}, justo el ritmo que buscas. Sigue así. 🌻`);
    } else if (o.tipo === 'definicion') {
      if (va > r * 0.5) {
        // Si lo apuntado y el peso no cuadran, comer menos no es la respuesta: primero, apuntar bien.
        if (a.discrepancia !== null && a.discrepancia < -300) out.push(`Para tu definición (${kgSemana(r)}) tu peso ${va >= 0.05 ? 'sube' : 'casi no baja'}, aunque por lo que apuntas deberías estar bajando. Antes de comer menos, revisa cómo apuntas (mira las ideas de abajo): tu cuerpo se comporta como si comieras unas ${miles(redondea(-a.discrepancia, 50))} kcal más de lo apuntado.`);
        else out.push(`Para tu definición (${kgSemana(r)}) tu peso ${va >= 0.05 ? 'sube' : 'casi no baja'}. Baja a unas ${kcalTexto(a.comerPara)} al día.`);
      }
      else if (va < r * 1.6 && r - va > 0.15) out.push(`Bajas ${kgSemana(va)}: demasiado rápido, y así se pierde músculo y fuerza. Sube a unas ${kcalTexto(a.comerPara)}.`);
      else out.push(`Buen ritmo de definición: ${kgSemana(va)}. Sigue así. 🌻`);
    } else out.push(Math.abs(va) < 0.1 ? `Te mantienes estable, que es lo que buscas.` : `Para mantenerte, tu peso ${va > 0 ? 'sube' : 'baja'} algo (${kgSemana(va)}): unas ${kcalTexto(a.comerPara)} al día te dejarían estable.`);
  }
  if (a.hayComida && a.enSuelo) out.push(`Mejor no bajes de unas ${kcalTexto(a.suelo)} al día: por debajo de tu metabolismo basal se pierde músculo, energía y ganas de entrenar. Si quieres ir más rápido, suma pasos en vez de quitar comida.`);
  if (o && o.peso && a.peso) {
    if (a.llegaSiSigue) out.push(`Si sigues así, llegarías a ${num(o.peso)} kg hacia el ${fechaCorta(a.llegaSiSigue)}.`);
    else if (a.semana !== null && Math.abs(o.peso - a.peso) >= 0.3) out.push(`A este ritmo no te acercas a ${num(o.peso)} kg.`);
    if (a.hayComida && a.llegaConRitmo && a.comerPara && !a.enSuelo && estadoObjetivo(a) !== 'bien') out.push(`Comiendo unas ${kcalTexto(a.comerPara)}, llegarías hacia el ${fechaCorta(a.llegaConRitmo)}.`);
  }
  // 3. Por qué esta semana es distinta: pasos, caminadora, entrenos y comida.
  const causas = [];
  if (a.pasos7 && a.pasosAntes && Math.abs(a.pasos7 - a.pasosAntes) >= 1500 && a.peso) {
    const kcal = Math.abs(a.pasos7 - a.pasosAntes) * KCAL_PASO_KG * a.peso;
    causas.push(`${a.pasos7 > a.pasosAntes ? 'has caminado más' : 'has caminado menos'} (${miles(a.pasos7)} pasos al día frente a ${miles(a.pasosAntes)}: unas ${miles(redondea(kcal, 10))} kcal ${a.pasos7 > a.pasosAntes ? 'más' : 'menos'} de gasto al día)`);
  }
  const kmAntes = a.actAntes.km / 4;
  if (Math.abs(a.act7.km - kmAntes) >= 3) causas.push(`${a.act7.km > kmAntes ? 'más' : 'menos'} caminadora (${num(Math.round(a.act7.km * 10) / 10)} km frente a unos ${num(Math.round(kmAntes * 10) / 10)} por semana)`);
  const entAntes = a.actAntes.entrenos / 4;
  if (Math.abs(a.act7.entrenos - entAntes) >= 1) causas.push(`${a.act7.entrenos > entAntes ? 'has entrenado más' : 'has entrenado menos'} (${a.act7.entrenos} ${a.act7.entrenos === 1 ? 'entreno' : 'entrenos'} frente a unos ${num(Math.round(entAntes * 10) / 10)} por semana)`);
  if (causas.length) out.push(`Esta semana, frente a las anteriores: ${listaY(causas)}.`);
  // 4. Su fuerza con este balance.
  const f = a.fuerza, suben = f.suben.slice(0, 3).map((x) => `${x.ej.toLowerCase()} (+${num(Math.round(x.cambio * 100))} %)`), bajan = f.bajan.slice(0, 2).map((x) => `${x.ej.toLowerCase()} (−${num(Math.abs(Math.round(x.cambio * 100)))} %)`);
  const deficit = a.semana !== null ? a.semana < -0.05 : a.balance !== null && a.balance < -150;
  const superavit = a.semana !== null ? a.semana > 0.05 : a.balance !== null && a.balance > 150;
  const rapido = o && o.tipo === 'volumen' && a.semana !== null && a.ritmo && a.semana > a.ritmo * 1.6 && a.semana - a.ritmo > 0.1;
  if (f.comparados) {
    if (deficit) {
      if (suben.length) out.push(`¡Qué bien! Estás en déficit y aun así has subido en ${listaY(suben)}. Eso es ganar fuerza mientras bajas, lo más difícil. 💪`);
      if (bajan.length) out.push(`Has bajado un poco en ${listaY(bajan)}. En déficit es normal, no te preocupes: con la proteína alta y entrenando pesado, vuelve en cuanto comas un poco más.`);
      if (!suben.length && !bajan.length) out.push('En déficit y manteniendo todas tus marcas: perfecto, no estás perdiendo músculo.');
    } else if (superavit) {
      if (suben.length) out.push(`${rapido ? 'Ese superávit se nota en la barra' : 'Superávit limpio y se nota'}: has subido en ${listaY(suben)}. 🚀`);
      if (bajan.length) out.push(`Con superávit deberías subir, pero has bajado en ${listaY(bajan)}. Puede ser cansancio o poco descanso: mira cómo duermes.`);
      if (!suben.length && !bajan.length) out.push('Estás en superávit pero tus marcas no se mueven: aprovecha esa energía para subir peso o repes.');
    } else if (suben.length) out.push(`Tu peso está estable y has subido en ${listaY(suben)}: recomposición, más fuerte con el mismo peso. 🌻`);
    else if (bajan.length) out.push(`Has bajado algo en ${listaY(bajan)}. Con el peso estable suele ser cansancio: unos días suaves y vuelve.`);
  }
  // 5. Proteína y lo que falta para afinar.
  if (a.prot && a.peso) {
    const min = 1.6 * a.peso;
    out.push(a.prot < min ? `Proteína: unos ${miles(a.prot)} g al día. Para ganar o mantener músculo se recomiendan 1,6–2,2 g por kilo: ${miles(redondea(min, 5))}–${miles(redondea(2.2 * a.peso, 5))} g para ti.` : `Proteína: unos ${miles(a.prot)} g al día, dentro de lo recomendado (1,6–2,2 g por kilo). 💪`);
  }
  if (a.hayComida && a.fuera.length) out.push(`No cuentan ${a.fuera.length === 1 ? 'un día' : `${a.fuera.length} días`} con la comida incompleta: la media sale del resto. Puedes cambiarlo abajo.`);
  if (a.hayComida && a.sinApuntar >= 4) out.push(`Hay ${a.sinApuntar} días de las dos últimas semanas sin nada en MyFitnessPal. No pasa nada: se calcula con los demás, pero cuantos más días, más fino.`);
  if (a.semana === null) out.push('Para ver hacia dónde va tu peso hacen falta pesadas en al menos diez días distintos: con pesarte unas mañanas por semana basta.');
  if (!a.perfil.edad || !a.perfil.altura) out.push('Pon tu edad y tu altura abajo para calcular tu mantenimiento.');
  else if (!o) out.push('Elige abajo tu objetivo y te digo cuánto comer y cuándo llegarías.');
  return out.slice(0, 4);
}

// En qué punto está, en una frase: lo primero que lee.
function estadoObjetivo(a) {
  const o = a.objetivo;
  if (!o || a.semana === null || a.ritmo === null) return null;
  const r = a.ritmo, va = a.semana;
  if (o.tipo === 'volumen') return va < r * 0.5 ? 'falta' : va > r * 1.6 && va - r > 0.1 ? 'rapido' : 'bien';
  if (o.tipo === 'definicion') return va > r * 0.5 ? 'falta' : va < r * 1.6 && r - va > 0.15 ? 'rapido' : 'bien';
  return Math.abs(va) < 0.1 ? 'bien' : 'falta';
}
function titularSalud(a) {
  const e = estadoObjetivo(a), o = a.objetivo, sube = a.fuerza.suben[0];
  const fuerza = sube ? ` Y encima estás más fuerte en ${sube.ej.toLowerCase()}.` : '';
  if (a.semana === null || !a.comeMedia) return { t: 'Ya casi, Lópoda 🌱', s: 'Unos días más de datos y te lo cuento todo con detalle.' };
  if (!o) return { t: 'Esto es lo que dicen tus datos 📊', s: `Elige tu objetivo abajo y te digo cómo llegar.${fuerza}` };
  if (e === 'bien') return { t: o.tipo === 'mantener' ? 'Estable y fuerte: perfecto 🌻' : '¡Vas genial, Lópoda! 🌻', s: `Lo que comes, tu peso y tu objetivo van en la misma dirección.${fuerza}` };
  if (o.tipo === 'volumen') return e === 'falta' ? { t: 'Te falta un poquito de gasolina ⛽', s: `Para crecer, tu cuerpo necesita algo más de comida.${fuerza}` } : { t: 'Frena un poquito, que vas lanzada 🐢', s: `Más despacio, casi todo lo que subas será músculo.${fuerza}` };
  if (o.tipo === 'definicion') return e === 'falta' ? { t: 'Estás muy cerca: ajustamos un poco 🎯', s: `Un pequeño cambio y empieza a bajar.${fuerza}` } : { t: 'Vas demasiado rápido: cuídate 💛', s: `Más despacio no pierdes fuerza ni músculo.${fuerza}` };
  return { t: 'Casi estable 🌿', s: `Un pequeño ajuste y te quedas donde quieres.${fuerza}` };
}
// Lo que puede hacer esta semana: lo más útil primero, como mucho dos.
function ideasSalud(a) {
  const ideas = [], o = a.objetivo, e = estadoObjetivo(a), peso = a.peso || 60;
  // Cuando lo apuntado y el peso no cuadran, lo más habitual es que se escapen calorías al apuntar.
  const apuntaMenos = (a.discrepancia !== null && a.discrepancia < -300) || (o && o.tipo === 'definicion' && e === 'falta' && a.balance !== null && a.balance < -150);
  if (apuntaMenos) ideas.push('🫒 Todo apunta a que comes algo más de lo que apuntas, y es lo más normal del mundo. Lo que más se escapa: el aceite (una cucharada son unas 100 kcal y casi nunca se pesa), las salsas y aliños, el picoteo mientras cocinas, las bebidas y las comidas fuera, que suelen llevar un 20–30 % más de lo que parece. Prueba una semana a pesar el aceite y apuntar también lo pequeñito.');
  if (a.discrepancia !== null && a.discrepancia > 300) ideas.push(`🔥 Tu cuerpo gasta más de lo que dice la fórmula: unas ${miles(redondea(a.discrepancia, 50))} kcal más al día. ¡Metabolismo con ganas! ${o && o.tipo === 'volumen' ? 'Para subir vas a necesitar comer más de lo que parece.' : 'Puedes comer más de lo que creías.'}`);
  if (a.kcalFinde && a.kcalSemana && a.kcalFinde < a.kcalSemana * 0.85) ideas.push(`🍽️ Los fines de semana apuntas menos que entre semana (${miles(redondea(a.kcalFinde, 10))} frente a ${miles(redondea(a.kcalSemana, 10))} kcal). Si son días de comer fuera, apúntalo aunque sea a ojo: una estimación vale mucho más que nada.`);
  else if (a.huecosFinde > a.huecosSemana + 0.25) ideas.push('🍽️ Los fines de semana se quedan más días sin apuntar. Si comes fuera, busca el plato en MyFitnessPal y ponlo a ojo: así la media no se queda corta.');
  if (a.pico !== null && a.pico >= 0.8) ideas.push(`💧 Tu última pesada está ${num(Math.round(a.pico * 10) / 10)} kg por encima de tu tendencia. Tranquila: eso es agua, no grasa. Pasa con la sal, los carbohidratos, la regla o un entreno fuerte de pierna. Fíjate en la línea, no en el número de un día.`);
  if (o && o.tipo === 'volumen' && e === 'falta') ideas.push('⛽ Para comer más sin llenarte: un puñado de frutos secos (unas 180 kcal), un chorrito de aceite de oliva en la comida (unas 90), un batido de leche, plátano y avena (unas 400) o yogur con miel y granola de postre.');
  if (o && o.tipo === 'definicion' && e === 'falta') ideas.push(`🚶‍♀️ Sin tocar la comida: 2.000 pasos más al día (unos 20 minutos andando) son unas ${miles(redondea(2000 * KCAL_PASO_KG * peso, 10))} kcal más de gasto. Y la proteína y la verdura llenan mucho con pocas calorías.`);
  if (e === 'rapido' && o && o.tipo === 'volumen') ideas.push('🐢 Para frenar sin pasar hambre: quita algo de lo más calórico y menos saciante (bollería, salsas, bebidas con azúcar) y deja intactas la proteína y la verdura.');
  if (a.prot && a.prot < 1.6 * peso) ideas.push('🥚 Para llegar a tu proteína, ideas fáciles: un yogur alto en proteína (15–20 g), 100 g de pollo o pavo (unos 25 g), 3 huevos (unos 18 g), una lata de atún (unos 25 g) o un batido de proteína (unos 25 g).');
  if (a.pasos7 && a.pasos7 < 6000) ideas.push('🌳 Esta semana te has movido poco: un paseo de 20 minutos después de comer suma unos 2.000 pasos y sienta genial.');
  if (a.act7.entrenos < a.actAntes.entrenos / 4 - 0.9) ideas.push('🏋️‍♀️ Esta semana has entrenado menos. ¡No pasa nada! Un entreno corto también cuenta, y tu cuerpo lo agradece.');
  if (a.sinApuntar >= 4) ideas.push('📱 Truco: pon MyFitnessPal en tu pantalla de inicio y apunta justo al terminar de comer. Con más días apuntados, los consejos son más finos.');
  if (!ideas.length && e === 'bien' && a.hayComida) ideas.push('🌻 Todo cuadra: lo que comes y tu peso van en la misma dirección. Sigue exactamente así, que lo estás haciendo de maravilla.');
  return ideas.slice(0, 2);
}
// Un mensaje de Cesarlópodo para cerrar, distinto cada día.
const MOTIVA_SALUD = [
  'Cada día que apuntas y entrenas te acerca a tu objetivo, y a Alemania. Estoy muy orgulloso de ti.',
  'No hace falta que sea perfecto: con que sea constante, ya estás ganando.',
  'Tu cuerpo está respondiendo. Confía en el proceso, Lópoda.',
  'Lo estás haciendo genial. Y si una semana sale regular, la siguiente la recuperamos.',
  'Me encanta verte cuidarte así. Eres increíble.',
  'Fuerte por fuera y por dentro. Así es mi Lópoda.',
  'Un poquito cada día y, cuando te des cuenta, ya estás ahí.'
];

// ---------- Pantalla ----------
function barritas(lista, color) {
  const max = Math.max(1, ...lista.map((p) => p[1]));
  return `<div class="barritas" aria-hidden="true">${lista.map(([d, v]) => `<i title="${fechaCorta(d)}: ${miles(v)}" style="height:${Math.max(3, Math.round(v / max * 100))}%;background:${color}"></i>`).join('')}</div>`;
}
function lineaPeso(tend, meta) {
  const p = tend.slice(-60);
  if (p.length < 2) return '';
  const valores = p.map((x) => x[1]).concat(meta ? [meta] : []), min = Math.min(...valores) - 0.3, max = Math.max(...valores) + 0.3, y = (v) => (60 - (v - min) / (max - min) * 56 - 2).toFixed(1);
  const pts = p.map(([, v], i) => `${(i / (p.length - 1) * 300).toFixed(1)},${y(v)}`).join(' ');
  return `<svg class="linea-peso" viewBox="0 0 300 60" preserveAspectRatio="none" aria-hidden="true">${meta ? `<line x1="0" x2="300" y1="${y(meta)}" y2="${y(meta)}" stroke="var(--amarillo)" stroke-dasharray="4 4" vector-effect="non-scaling-stroke"/>` : ''}<polyline points="${pts}" fill="none" stroke="var(--chicle)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;
}
const ETIQUETA_DIA = { cuenta: 'Cuenta', fuera: 'No cuenta', sospechoso: 'Parece incompleto' };

function pintarSalud() {
  const s = estado.salud || { dias: {} };
  const hayDatos = s.dias && Object.keys(s.dias).length;
  const a = analizarSalud(s, estado.filas, hoyIso()), o = a.objetivo, p = a.perfil;
  const formulario = `<div class="objetivo-salud"><p>Tu objetivo</p>
    <div class="opciones-objetivo">${Object.keys(NOMBRE_OBJETIVO).map((t) => `<button type="button" data-objetivo="${t}" aria-pressed="${!!(o && o.tipo === t)}">${NOMBRE_OBJETIVO[t]}</button>`).join('')}</div>
    <div class="campos-salud">
      <label>Peso meta<input id="peso-objetivo" inputmode="decimal" placeholder="kg" value="${o && o.peso ? num(o.peso) : ''}"></label>
      <label>Kg por semana<input id="ritmo-objetivo" inputmode="decimal" placeholder="${a.ritmo !== null ? num(Math.round(a.ritmo * 100) / 100) : 'recomendado'}" value="${o && o.ritmo !== null && o.ritmo !== undefined ? num(o.ritmo) : ''}"></label>
      <label>Kcal al día<input id="kcal-objetivo" inputmode="numeric" placeholder="${a.comerPara ? redondea(a.comerPara, 10) : 'kcal'}" value="${o && o.kcal ? o.kcal : ''}"></label>
      <label>Edad<input id="edad-perfil" inputmode="numeric" placeholder="años" value="${p.edad || ''}"></label>
      <label>Altura<input id="altura-perfil" inputmode="numeric" placeholder="cm" value="${p.altura || ''}"></label>
    </div>
    <button type="button" class="guardar-salud" data-objetivo="">Guardar</button>
    <p class="pie">Kg por semana: en positivo para subir, en negativo para bajar. Vacío, el recomendado: +0,25 % de tu peso en volumen, −0,5 % en definición. Kcal al día: las que tienes puestas en MyFitnessPal (tu iPhone no las manda).</p></div>`;
  if (!hayDatos) {
    return `<h2 class="gorda seccion">Comida, peso y pasos</h2>
      <section class="tarjeta-salud"><p>Aquí verás tus pasos del Apple Watch, tu peso de Libra y tu comida de MyFitnessPal, cruzados con tus entrenos: tu mantenimiento, si estás en déficit o en superávit, cuándo llegarías a tu peso y cómo responde tu fuerza. Todavía no ha llegado nada de Salud: Cesarlópodo tiene que conectarlo en tu iPhone.</p>${formulario}</section>`;
  }
  const texto = analisisTexto(a), titular = titularSalud(a), ideas = ideasSalud(a);
  const motiva = MOTIVA_SALUD[Math.round(Date.parse(`${hoyIso()}T12:00:00Z`) / 864e5) % MOTIVA_SALUD.length];
  const cifra = (t, v, sub) => `<div><small>${t}</small><b>${v}</b><span>${sub || ''}</span></div>`;
  const cifras = [
    a.peso && cifra('Peso', `${num(Math.round(a.peso * 10) / 10)} kg`, a.semana !== null ? kgSemana(a.semana) : ''),
    a.pasos7 && cifra('Pasos al día', miles(redondea(a.pasos7, 10)), 'última semana'),
    a.comeMedia && cifra('Comes', kcalTexto(a.comeMedia), 'de media al día'),
    o && o.kcal && cifra('Tu meta', kcalTexto(o.kcal), 'al día, la tuya'),
    a.hayComida && a.comerPara && estadoObjetivo(a) !== 'bien' && !(o && o.kcal && Math.abs(o.kcal - a.comerPara) < 100) && cifra('Para tu objetivo', kcalTexto(a.comerPara), 'al día')
  ].filter(Boolean);
  return `<h2 class="gorda seccion">Comida, peso y pasos</h2>
    <section class="tarjeta-salud">
      <div class="titular-salud"><b>${esc(titular.t)}</b><span>${esc(titular.s)}</span></div>
      <div class="cifras-salud">${cifras.join('')}</div>
      ${lineaPeso(a.tend, o && o.peso)}
      <h3 class="sub-salud">Cómo vas</h3>
      <ul class="consejos">${texto.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
      ${ideas.length ? `<h3 class="sub-salud">Ideas para esta semana</h3><ul class="ideas-salud">${ideas.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      <p class="cesar">${esc(motiva)}<br>Cesarlópodo</p>
      ${a.comida28.length ? `<details class="dias-comida"${a.fuera.length ? ' open' : ''}><summary>Tus días de comida</summary>
        <p class="pie">Toca un día para que no cuente (una cena fuera sin apuntar, vacaciones…) o para recuperarlo. Los muy por debajo de lo normal se apartan solos.</p>
        <ul>${a.comida28.slice().reverse().slice(0, 21).map((d) => `<li><button type="button" class="dia-${d.estado}" data-dia-comida="${d.fecha}" data-estado="${d.estado}"><span>${fechaCorta(d.fecha).slice(0, -3)}</span><b>${miles(d.kcal)} kcal</b><em>${ETIQUETA_DIA[d.estado]}</em></button></li>`).join('')}</ul></details>` : ''}
      ${formulario}
      <details class="como-se-calcula"><summary>Cómo se calcula</summary>
        <p>Tu mantenimiento se calcula de dos formas. Por fórmula: Mifflin-St Jeor con tu edad, altura y peso, más lo que gastan tus pasos y tus entrenos de pesas, más la digestión. Y por tus datos: lo que comes de media en las últimas cuatro semanas, corregido por lo que hace tu peso (cada kilo son unas 7.700 kcal). Cuantos más días completos tienes, más manda lo segundo: es tu cuerpo real, no una media de la población.</p>
        <p>El peso usa la misma tendencia que Libra, para que un día de retención no cambie nada. Los días sin nada apuntado no cuentan, y los que parecen incompletos se apartan solos. Tu fuerza compara tu mejor serie de cada ejercicio en las últimas cuatro semanas con las cuatro anteriores.</p>
        <p>Último día recibido de Salud: ${a.ultimo ? fechaCorta(a.ultimo) : '—'}.</p></details>
    </section>`;
}
