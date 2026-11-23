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
    if (estado.vista === 'salud' && $('#capa').hidden && (!activo || !activo.matches('input, textarea'))) pintar();
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
  let t = dias[fechas[0]].peso, ultima = fechas[0];
  for (let d = fechas[0]; d <= hoy; d = desplazar(d, 1)) {
    if (dias[d] && dias[d].peso) {
      t = (Date.parse(d) - Date.parse(ultima)) / 864e5 > 30 ? dias[d].peso : t + 0.1 * (dias[d].peso - t);
      ultima = d;
    }
    out.push([d, t]);
  }
  return out;
}
// Pendiente en kg por día de unas pesadas sueltas, con su fecha real.
function pendienteFechas(puntos) {
  const xs = puntos.map(([d]) => Date.parse(d) / 864e5), mx = mediaSalud(xs), my = mediaSalud(puntos.map((p) => p[1]));
  let a = 0, b = 0;
  puntos.forEach((p, i) => { a += (xs[i] - mx) * (p[1] - my); b += (xs[i] - mx) ** 2; });
  return b ? a / b : 0;
}
function rectaHoy(puntos, pendiente, hoy) {
  const xs = puntos.map(([d]) => Date.parse(d) / 864e5);
  return mediaSalud(puntos.map((p) => p[1])) + pendiente * (Date.parse(hoy) / 864e5 - mediaSalud(xs));
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
  const tend = tendenciaPeso(dias, hoy);
  const pesadas = rango(hoy, 28).filter((d) => dias[d] && dias[d].peso);
  const hayTendencia = pesadas.length >= 4 && (Date.parse(pesadas[pesadas.length - 1]) - Date.parse(pesadas[0])) / 864e5 >= 10;
  // El ritmo sale de sus pesadas reales del último mes (recta de mínimos cuadrados por fecha): la tendencia suavizada
  // va con retraso cuando se pesa a ratos, y daría un ritmo más lento del real.
  const kgDia = hayTendencia ? pendienteFechas(pesadas.map((d) => [d, dias[d].peso])) : null;
  const semana = kgDia === null ? null : kgDia * 7;
  // Su peso de hoy: el de esa recta (sin el ruido de un día); sin pesadas suficientes, la tendencia suavizada.
  const peso = hayTendencia ? rectaHoy(pesadas.map((d) => [d, dias[d].peso]), kgDia, hoy) : tend.length ? tend[tend.length - 1][1] : null;
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
  // Para lo visual: semanas de comida, rachas y de dónde viene su peso.
  const comida56 = diasComida(dias, marcas, rango(ayer, 56));
  const semanas = Array.from({ length: 8 }, (_, i) => {
    const desde = desplazar(ayer, -(8 - i) * 7 + 1), hasta = desplazar(desde, 6);
    const l = comida56.filter((d) => d.estado === 'cuenta' && d.fecha >= desde && d.fecha <= hasta);
    return { desde, media: l.length >= 3 ? mediaSalud(l.map((d) => d.kcal)) : null };
  });
  let racha = 0;
  for (let d = dias[hoy] && dias[hoy].kcal > 0 ? hoy : ayer; dias[d] && dias[d].kcal > 0; d = desplazar(d, -1)) racha++;
  const protDias = peso ? v7.filter((d) => dias[d] && dias[d].prot >= 1.6 * peso).length : 0;
  const pasos10k = v7.filter((d) => dias[d] && dias[d].pasos >= 10000).length;
  // El punto de partida de su objetivo: lo más lejos de la meta en los últimos seis meses (por la tendencia).
  const seisMeses = tend.filter(([d]) => d >= desplazar(hoy, -182) && Object.keys(dias).some((x) => x <= d && x >= desplazar(d, -14) && dias[x].peso));
  const inicio = objetivo && objetivo.peso && seisMeses.length && objetivo.tipo !== 'mantener'
    ? seisMeses.reduce((m, p) => ((objetivo.tipo === 'volumen' ? p[1] < m[1] : p[1] > m[1]) ? p : m)) : null;
  const kgConMeta = objetivo && objetivo.kcal && mantenimiento && hayComida ? (objetivo.kcal - mantenimiento) * 7 / KCAL_KG : null;
  const pico = ultimaPesada && ultimaPesada >= desplazar(hoy, -2) && peso ? dias[ultimaPesada].peso - peso : null;
  return {
    suelo, enSuelo: sinSuelo !== null && sinSuelo < suelo, kcalFinde, kcalSemana, huecosFinde, huecosSemana, pico, discrepancia: datos !== null && formula !== null ? datos - formula : null,
    hayComida, llegaComida: Object.keys(dias).some((d) => dias[d].kcal > 0), dias, objetivo, perfil, peso, tend, semana, comida28, fuera, sinApuntar, cuentan: cuentan14.length, comeMedia,
    prot: macro('prot'), carb: macro('carb'), grasa: macro('grasa'), pasos30: rango(hoy, 30).map((d) => [d, (dias[d] && dias[d].pasos) || 0]),
    pasos7, pasosAntes, act7, actAntes, entrenosSemana, formula, datos, mantenimiento, confianza, balance, ritmo, comerPara,
    llegaSiSigue: semana !== null && Math.abs(semana) >= 0.03 ? llegar(semana) : null, llegaConRitmo: llegar(ritmo),
    fuerza: cambiosFuerza(filas, hoy), ultimo: Object.keys(dias).sort().pop(),
    hoy, semanas, racha, protDias, pasos10k, inicio, kgConMeta, pesadasTodas: Object.keys(dias).filter((d) => dias[d].peso && d <= hoy).sort().map((d) => [d, dias[d].peso])
  };
}


// ---------- Lo que se le cuenta: poco texto, todo lo demás en gráficas ----------
const kgSemana = (v) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${num(Math.abs(Math.round(v * 100) / 100))} kg/sem`;
const kcalTexto = (v) => `${miles(redondea(v, 10))} kcal`;
const kgTexto = (v) => `${num(Math.round(v * 10) / 10)} kg`;

// En qué punto está frente a su objetivo.
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
  const fuerza = sube ? ` Y estás más fuerte en ${sube.ej.toLowerCase()}. 💪` : '';
  if (a.semana === null) return { t: 'Ya casi, Lópoda 🌱', s: 'Pésate unas mañanas por semana y te enseño hacia dónde vas.' };
  if (!o) return { t: 'Esto dicen tus datos 📊', s: `Elige tu objetivo abajo y te enseño cómo llegar.${fuerza}` };
  if (e === 'bien') return { t: o.tipo === 'mantener' ? 'Estable y fuerte 🌻' : '¡Vas genial, Lópoda! 🌻', s: `Justo al ritmo que buscas.${fuerza}` };
  if (o.tipo === 'volumen') return e === 'falta' ? { t: 'Te falta gasolina ⛽', s: `Para crecer, un poco más de comida.${fuerza}` } : { t: 'Frena un poquito 🐢', s: `Más despacio, casi todo será músculo.${fuerza}` };
  if (o.tipo === 'definicion') return e === 'falta' ? { t: 'Casi: ajustamos un poco 🎯', s: `Un pequeño cambio y empieza a bajar.${fuerza}` } : { t: 'Demasiado rápido: cuídate 💛', s: `Más despacio no pierdes fuerza.${fuerza}` };
  return { t: 'Casi estable 🌿', s: `Un pequeño ajuste y te quedas donde quieres.${fuerza}` };
}
// Como mucho dos frases cortas: solo lo que pide hacer algo.
function frasesSalud(a) {
  const out = [], o = a.objetivo, e = estadoObjetivo(a), c = a.hayComida && a.comerPara ? kcalTexto(a.comerPara) : null;
  if (o && e === 'falta') {
    if (o.tipo === 'volumen') out.push(c ? `Para crecer, sube a unas ${c} al día.` : 'Tu peso casi no se mueve: come un poco más.');
    else if (o.tipo === 'definicion') out.push(c ? `Para bajar, unas ${c} al día.` : 'Tu peso no baja: un poco menos de comida o más pasos.');
    else if (c) out.push(`Para quedarte estable, unas ${c} al día.`);
  } else if (o && e === 'rapido' && c) out.push(o.tipo === 'volumen' ? `Con unas ${c} subirías a ${kgSemana(a.ritmo)}, casi todo músculo.` : `Sube a unas ${c} para no perder músculo.`);
  if (a.hayComida && a.enSuelo) out.push(`No bajes de ${kcalTexto(a.suelo)}: mejor más pasos que menos comida.`);
  if (a.kgConMeta !== null && a.ritmo !== null && Math.abs(a.kgConMeta - a.ritmo) > 0.1) out.push(`Con tu meta de ${kcalTexto(o.kcal)} irías a ${kgSemana(a.kgConMeta)}; tu ritmo ideal es ${kgSemana(a.ritmo)}.`);
  if (a.prot && a.peso && a.prot < 1.6 * a.peso) out.push(`Proteína: ${miles(a.prot)} g al día. Te faltan unos ${miles(redondea(1.6 * a.peso - a.prot, 5))} g.`);
  if (!a.hayComida) out.push('Con una semana de comida apuntada entera, te enseño tu mantenimiento real.');
  if (!a.perfil.edad || !a.perfil.altura) out.push('Pon tu edad y tu altura abajo.');
  return out.slice(0, 2);
}
// Una idea práctica, corta.
function ideaSalud(a) {
  const o = a.objetivo, e = estadoObjetivo(a), peso = a.peso || 60;
  if (a.pico !== null && a.pico >= 0.8) return `💧 Tu última pesada está ${kgTexto(a.pico)} por encima de tu tendencia: es agua, no grasa. Mira la línea, no el número de un día.`;
  if (o && o.tipo === 'volumen' && e === 'falta') return '⛽ Fácil de sumar: frutos secos (180 kcal), un chorrito de aceite (90) o un batido de leche, plátano y avena (400).';
  if (o && o.tipo === 'definicion' && e === 'falta') return `🚶‍♀️ 2.000 pasos más al día son unas ${miles(redondea(2000 * KCAL_PASO_KG * peso, 10))} kcal más de gasto, sin tocar la comida.`;
  if (e === 'rapido' && o && o.tipo === 'volumen') return '🐢 Para frenar: menos bollería, salsas y bebidas con azúcar; la proteína y la verdura, igual.';
  if (a.prot && a.prot < 1.6 * peso) return '🥚 Proteína fácil: yogur proteico (20 g), 100 g de pollo (25 g), 3 huevos (18 g) o una lata de atún (25 g).';
  if (a.kcalFinde && a.kcalSemana && a.kcalFinde < a.kcalSemana * 0.85) return '🍽️ Los findes apuntas menos. Si comes fuera, ponlo a ojo: vale más que nada.';
  if (a.discrepancia !== null && a.discrepancia < -300) return '🫒 Lo que más se escapa al apuntar: el aceite (100 kcal la cucharada), salsas, picoteo y comidas fuera.';
  return null;
}
const MOTIVA_SALUD = [
  'Cada día que apuntas y entrenas te acerca a tu objetivo, y a Alemania. Estoy muy orgulloso de ti.',
  'No hace falta que sea perfecto: con que sea constante, ya estás ganando.',
  'Tu cuerpo está respondiendo. Confía en el proceso, Lópoda.',
  'Lo estás haciendo genial. Y si una semana sale regular, la siguiente la recuperamos.',
  'Me encanta verte cuidarte así. Eres increíble.',
  'Fuerte por fuera y por dentro. Así es mi Lópoda.',
  'Un poquito cada día y, cuando te des cuenta, ya estás ahí.'
];

// ---------- Gráficas ----------
const MES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const fechaMes = (d) => `${+d.slice(8)} ${MES_CORTO[+d.slice(5, 7) - 1]}`;
const diasEntre = (a, b) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const RANGOS_PESO = { '3m': ['3 meses', 91], '6m': ['6 meses', 182], '1a': ['1 año', 365], todo: ['Todo', 0] };

// Hacia dónde va su objetivo: de dónde salió, dónde está y cuánto falta.
function barraObjetivo(a) {
  const o = a.objetivo;
  if (!o || !o.peso || !a.peso || !a.inicio || o.tipo === 'mantener') return '';
  const [dIni, pIni] = a.inicio, total = o.peso - pIni, hecho = a.peso - pIni;
  if (Math.abs(total) < 0.3) return '';
  const pct = Math.max(0, Math.min(100, hecho / total * 100)), falta = o.peso - a.peso;
  const llegada = Math.abs(falta) < 0.3 ? '¡Ya estás en tu meta! 🎉' : a.llegaSiSigue ? `llegas hacia el ${fechaMes(a.llegaSiSigue)} ${a.llegaSiSigue.slice(2, 4)} 🎯` : 'a este ritmo aún no te acercas';
  return `<div class="meta-peso">
    <div class="meta-cab"><span>${kgTexto(pIni)}<small>${fechaMes(dIni)}</small></span><span class="dcha">${kgTexto(o.peso)}<small>tu meta</small></span></div>
    <div class="meta-pista"><i style="width:${pct.toFixed(1)}%"></i><em style="left:${pct.toFixed(1)}%">${kgTexto(a.peso)}</em></div>
    <p><b>${Math.round(pct)} %</b> del camino · ${Math.abs(falta) >= 0.3 ? `faltan ${kgTexto(Math.abs(falta))} · ` : ''}${llegada}</p></div>`;
}

// Peso: pesadas (puntos), tendencia (línea), previsión (discontinua) y meta (amarilla), con ejes y unidades.
function graficaPeso(a, rangoSel) {
  const o = a.objetivo, hoy = a.hoy, todas = a.pesadasTodas;
  if (!todas.length) return '';
  const nDias = (RANGOS_PESO[rangoSel] || RANGOS_PESO['6m'])[1];
  const desde = nDias ? desplazar(hoy, -nDias) : todas[0][0];
  const pts = todas.filter(([d]) => d >= desde);
  // La línea es la media de las pesadas de alrededor (±7 días, pesan más las cercanas). Solo se dibuja entre su
  // primera y su última pesada de cada racha: en los huecos sin pesarse no se inventa nada.
  const pesoDe = new Map(todas), tramos = [];
  let tramo = [];
  const inicioLinea = todas.find(([d]) => d >= desplazar(desde, -7));
  for (let d = inicioLinea ? inicioLinea[0] : hoy; d <= hoy; d = desplazar(d, 1)) {
    let sw = 0, sv = 0, antes = false, despues = false;
    for (let k = -7; k <= 7; k++) {
      const v = pesoDe.get(desplazar(d, k));
      if (v === undefined) continue;
      const w = 1 - Math.abs(k) / 8;
      sw += w; sv += w * v;
      if (k <= 0) antes = true; if (k >= 0) despues = true;
    }
    if (sw && antes && despues && d >= desde) tramo.push([d, sv / sw]); else if (tramo.length) { tramos.push(tramo); tramo = []; }
  }
  if (tramo.length) tramos.push(tramo);
  // Previsión: al ritmo de ahora hasta la meta (si llega en menos de un año); si no, seis semanas.
  let prevision = null;
  if (a.semana !== null && a.peso) {
    const fin = a.llegaSiSigue && diasEntre(hoy, a.llegaSiSigue) <= 365 ? a.llegaSiSigue : desplazar(hoy, 42);
    prevision = [[hoy, a.peso], [fin, a.peso + a.semana / 7 * diasEntre(hoy, fin)]];
  }
  const finX = prevision ? prevision[1][0] : hoy;
  const W = 340, H = 206, L = 34, R = 8, T = 22, B = 24;
  const t0 = Date.parse(desde), t1 = Date.parse(finX) + 864e5 * 3;
  const vals = pts.map((q) => q[1]).concat(tramos.flat().map((q) => q[1]), prevision ? prevision.map((q) => q[1]) : [], o && o.peso ? [o.peso] : []);
  let min = Math.min(...vals), max = Math.max(...vals);
  if (max - min < 1.5) { const m = (max + min) / 2; min = m - 0.75; max = m + 0.75; }
  min -= 0.3; max += 0.3;
  const x = (d) => (L + (Date.parse(d) - t0) / (t1 - t0) * (W - L - R)).toFixed(1);
  const y = (v) => (T + (max - v) / (max - min) * (H - T - B)).toFixed(1);
  const paso = [0.5, 1, 2, 5, 10].find((st) => (max - min) / st <= 5) || 10;
  const yTicks = [];
  for (let v = Math.ceil(min / paso) * paso; v <= max; v += paso) yTicks.push(v);
  // Marcas del eje x: meses, cada dos meses o años según lo largo del tramo.
  const span = (t1 - t0) / 864e5, cada = span <= 200 ? 1 : span <= 420 ? 2 : 12, xTicks = [];
  const d0 = new Date(t0);
  for (let d = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1)); d.getTime() <= t1; d.setUTCMonth(d.getUTCMonth() + 1)) {
    if (d.getUTCMonth() % cada !== 0) continue;
    const iso = d.toISOString().slice(0, 10);
    xTicks.push([iso, cada === 12 ? String(d.getUTCFullYear()) : MES_CORTO[d.getUTCMonth()] + (d.getUTCMonth() === 0 ? ` ${String(d.getUTCFullYear()).slice(2)}` : '')]);
  }
  const linea = (l) => l.map(([d, v]) => `${x(d)},${y(v)}`).join(' ');
  const chips = Object.entries(RANGOS_PESO).map(([k, [t]]) => `<button type="button" data-rango-peso="${k}" aria-pressed="${k === rangoSel}">${t}</button>`).join('');
  const meta = o && o.peso ? `<line class="gp-meta" x1="${L}" x2="${W - R}" y1="${y(o.peso)}" y2="${y(o.peso)}"/><text class="gp-meta-t" x="${L + 4}" y="${(+y(o.peso) - 5).toFixed(1)}">meta ${kgTexto(o.peso)}</text>` : '';
  const llega = prevision && o && o.peso && a.llegaSiSigue === prevision[1][0];
  const diana = llega ? `<circle class="gp-diana" cx="${x(prevision[1][0])}" cy="${y(o.peso)}" r="5"/><text class="gp-diana-t" x="${x(prevision[1][0])}" y="${(+y(o.peso) + (o.peso >= a.peso ? 17 : -9)).toFixed(1)}" text-anchor="end">${fechaMes(prevision[1][0])}</text>` : '';
  return `<div class="grafica-peso" id="grafica-peso">
    <div class="gp-cab"><b>${a.peso ? kgTexto(a.peso) : ''}</b>${a.semana !== null ? `<span class="${a.semana >= 0 ? 'sube' : 'baja'}">${a.semana >= 0 ? '▲' : '▼'} ${kgSemana(a.semana)}</span>` : ''}<small>tendencia de hoy</small></div>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Tu peso">
      ${yTicks.map((v) => `<line class="gp-rejilla" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="gp-eje" x="${L - 5}" y="${(+y(v) + 3.5).toFixed(1)}" text-anchor="end">${num(v)}</text>`).join('')}
      ${xTicks.map(([d, t]) => `<text class="gp-eje" x="${x(d)}" y="${H - 6}" text-anchor="middle">${t}</text>`).join('')}
      <text class="gp-eje" x="${L - 5}" y="${T - 10}" text-anchor="end">kg</text>
      ${meta}
      <line class="gp-hoy" x1="${x(hoy)}" x2="${x(hoy)}" y1="${T}" y2="${H - B}"/><text class="gp-eje" x="${x(hoy)}" y="${T - 10}" text-anchor="middle">hoy</text>
      ${pts.map(([d, v]) => `<circle class="gp-punto" cx="${x(d)}" cy="${y(v)}" r="2.3"/>`).join('')}
      ${tramos.map((l) => (l.length > 1 ? `<polyline class="gp-tendencia" points="${linea(l)}"/>` : '')).join('')}
      ${prevision ? `<polyline class="gp-prevision" points="${linea(prevision)}"/>` : ''}
      ${diana}
    </svg>
    <div class="gp-leyenda"><span><i class="l-punto"></i>pesadas</span><span><i class="l-tend"></i>tendencia</span>${prevision ? '<span><i class="l-prev"></i>si sigues así</span>' : ''}${o && o.peso ? '<span><i class="l-meta"></i>meta</span>' : ''}</div>
    <div class="gp-rangos">${chips}</div></div>`;
}
// Para cambiar el tramo sin repintar toda la pantalla.
function cambiarRangoPeso(r) {
  estado.rangoPeso = r; guardar('rangoPeso', r);
  const g = $('#grafica-peso');
  if (g) g.outerHTML = graficaPeso(analizarSalud(estado.salud || { dias: {} }, estado.filas, hoyIso()), r);
}

// Lo que come frente a su mantenimiento y su meta, en una regla.
function reglaKcal(a) {
  const o = a.objetivo, m = a.mantenimiento;
  if (!m) return '';
  const marcas = [{ v: m, t: 'Mantenimiento', c: 'r-mant' }];
  if (a.comeMedia) marcas.push({ v: a.comeMedia, t: 'Comes', c: 'r-come' });
  if (o && o.kcal) marcas.push({ v: o.kcal, t: 'Tu meta', c: 'r-meta' });
  const ideal = a.comerPara && o ? [a.comerPara - 75, a.comerPara + 75] : null;
  const vs = marcas.map((q) => q.v).concat(ideal || []);
  const lo = Math.floor((Math.min(...vs) - 200) / 100) * 100, hi = Math.ceil((Math.max(...vs) + 200) / 100) * 100;
  const pos = (v) => (v - lo) / (hi - lo) * 100;
  marcas.sort((q, w) => q.v - w.v);
  const etiqueta = (q, i) => {
    const px = pos(q.v), lado = px < 18 ? 'izq' : px > 82 ? 'dcha' : '';
    return `<div class="r-marca ${q.c} ${i % 2 ? 'abajo' : 'arriba'} ${lado}" style="left:${px.toFixed(1)}%"><small>${q.t}</small><b>${miles(redondea(q.v, 10))}</b></div>`;
  };
  const nombreIdeal = o && o.tipo === 'volumen' ? 'Ideal para crecer' : o && o.tipo === 'definicion' ? 'Ideal para definir' : 'Para mantenerte';
  const b = a.balance;
  return `<div class="regla-kcal">
    <p class="r-titulo">Calorías al día${a.datos === null ? ' <span>(mantenimiento por fórmula)</span>' : ''}</p>
    <div class="r-zona">
      ${marcas.map(etiqueta).join('')}
      <div class="r-pista"><i class="r-def" style="width:${pos(m).toFixed(1)}%"></i><i class="r-sup" style="left:${pos(m).toFixed(1)}%"></i>
        ${ideal ? `<i class="r-ideal" style="left:${pos(ideal[0]).toFixed(1)}%;width:${(pos(ideal[1]) - pos(ideal[0])).toFixed(1)}%"></i>` : ''}
        <span class="r-lado izq">◀ bajas</span><span class="r-lado dcha">subes ▶</span></div>
    </div>
    ${ideal ? `<p class="r-ley"><i></i>${nombreIdeal}: ${miles(redondea(a.comerPara, 10))} kcal</p>` : ''}
    ${b !== null ? `<p class="r-balance"><b class="${b >= 0 ? 'sube' : 'baja'}">${b >= 0 ? '+' : '−'}${miles(Math.abs(redondea(b, 10)))} kcal</b> ${b >= 0 ? 'sobre' : 'bajo'} tu mantenimiento${a.semana !== null ? ` → <b class="${a.semana >= 0 ? 'sube' : 'baja'}">${kgSemana(a.semana)}</b>` : ''}</p>`
      : !a.hayComida ? '<p class="r-balance">Comes: falta una semana apuntada entera</p>' : ''}
  </div>`;
}

// Lo que ha comido cada semana, con su mantenimiento y su meta como líneas.
function barrasSemanas(a) {
  if (a.semanas.filter((q) => q.media !== null).length < 2) return '';
  const o = a.objetivo, lineas = [];
  if (a.mantenimiento) lineas.push(['gs-mant', a.mantenimiento, 'mant.']);
  if (o && o.kcal) lineas.push(['gs-meta', o.kcal, 'meta']);
  const vs = a.semanas.filter((q) => q.media !== null).map((q) => q.media).concat(lineas.map((l) => l[1]));
  const base = Math.max(0, Math.floor((Math.min(...vs) - 300) / 100) * 100), top = Math.ceil((Math.max(...vs) + 150) / 100) * 100;
  const W = 340, H = 150, L = 6, R = 62, T = 14, B = 22, ancho = (W - L - R) / a.semanas.length;
  const y = (v) => (T + (top - v) / (top - base) * (H - T - B)).toFixed(1);
  const barras = a.semanas.map((q, i) => {
    const cx = (L + ancho * i + ancho / 2).toFixed(1);
    const etiqueta = i % 2 === a.semanas.length % 2 ? '' : `<text class="gp-eje" x="${cx}" y="${H - 6}" text-anchor="middle">${fechaMes(q.desde)}</text>`;
    if (q.media === null) return `${etiqueta}<text class="gp-eje" x="${cx}" y="${H - B - 4}" text-anchor="middle">–</text>`;
    return `<rect class="gs-barra" x="${(+cx - ancho * 0.33).toFixed(1)}" y="${y(q.media)}" width="${(ancho * 0.66).toFixed(1)}" height="${(H - B - +y(q.media)).toFixed(1)}" rx="4"/>
      <text class="gs-valor" x="${cx}" y="${(+y(q.media) - 4).toFixed(1)}" text-anchor="middle">${miles(redondea(q.media, 10))}</text>${etiqueta}`;
  }).join('');
  return `<div class="grafica-semanas"><p class="r-titulo">Lo que comes cada semana <span>(media al día)</span></p>
    <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Calorías por semana">${barras}
    ${lineas.map(([c, v, t]) => `<line class="${c}" x1="${L}" x2="${W - R + 4}" y1="${y(v)}" y2="${y(v)}"/><text class="${c}-t" x="${W - 2}" y="${(+y(v) + 3.5).toFixed(1)}" text-anchor="end">${t} ${miles(redondea(v, 10))}</text>`).join('')}</svg></div>`;
}

// Lo que ya ha conseguido: medallas pequeñas.
function logrosSalud(a) {
  const l = [];
  if (a.racha >= 3) l.push(['🔥', a.racha, 'días seguidos apuntando']);
  if (a.peso && a.prot) l.push(['💪', `${a.protDias}/7`, 'días con tu proteína']);
  if (a.pasos7) l.push(['👟', miles(redondea(a.pasos7, 10)), 'pasos al día']);
  if (a.pasos10k) l.push(['🌳', `${a.pasos10k}/7`, 'días de +10.000 pasos']);
  if (a.act7.entrenos) l.push(['🏋️‍♀️', a.act7.entrenos, a.act7.entrenos === 1 ? 'entreno en 7 días' : 'entrenos en 7 días']);
  for (const q of a.fuerza.suben.slice(0, 2)) l.push(['📈', `+${Math.round(q.cambio * 100)} %`, q.ej.toLowerCase()]);
  return l.length ? `<ul class="logros-salud">${l.slice(0, 6).map(([e, v, t]) => `<li><span>${e}</span><b>${v}</b><small>${esc(t)}</small></li>`).join('')}</ul>` : '';
}

const ETIQUETA_DIA = { cuenta: 'Cuenta', fuera: 'No cuenta', sospechoso: 'Parece incompleto' };

function pintarSalud() {
  const s = estado.salud || { dias: {} };
  const hayDatos = s.dias && Object.keys(s.dias).length;
  const a = analizarSalud(s, estado.filas, hoyIso()), o = a.objetivo, p = a.perfil;
  const formulario = `<details class="ajustes-salud"${o ? '' : ' open'}><summary>⚙️ Tu objetivo${o ? `: ${NOMBRE_OBJETIVO[o.tipo]}${o.peso ? ` · ${kgTexto(o.peso)}` : ''}${o.kcal ? ` · ${miles(o.kcal)} kcal` : ''}` : ''}</summary>
    <div class="opciones-objetivo">${Object.keys(NOMBRE_OBJETIVO).map((t) => `<button type="button" data-objetivo="${t}" aria-pressed="${!!(o && o.tipo === t)}">${NOMBRE_OBJETIVO[t]}</button>`).join('')}</div>
    <div class="campos-salud">
      <label>Peso meta<input id="peso-objetivo" inputmode="decimal" placeholder="kg" value="${o && o.peso ? num(o.peso) : ''}"></label>
      <label>Kcal al día<input id="kcal-objetivo" inputmode="numeric" placeholder="${a.comerPara ? redondea(a.comerPara, 10) : 'kcal'}" value="${o && o.kcal ? o.kcal : ''}"></label>
      <label>Kg por semana<input id="ritmo-objetivo" inputmode="decimal" placeholder="${a.ritmo !== null ? num(Math.round(a.ritmo * 100) / 100) : 'auto'}" value="${o && o.ritmo !== null && o.ritmo !== undefined ? num(o.ritmo) : ''}"></label>
      <label>Edad<input id="edad-perfil" inputmode="numeric" placeholder="años" value="${p.edad || ''}"></label>
      <label>Altura<input id="altura-perfil" inputmode="numeric" placeholder="cm" value="${p.altura || ''}"></label>
    </div>
    <button type="button" class="guardar-salud" data-objetivo="">Guardar</button></details>`;
  if (!hayDatos) {
    return `<h2 class="gorda seccion">Comida, peso y pasos</h2>
      <section class="tarjeta-salud"><p>Aún no ha llegado nada de Salud. 🌱</p>${formulario}</section>`;
  }
  const titular = titularSalud(a), frases = frasesSalud(a), idea = ideaSalud(a);
  const motiva = MOTIVA_SALUD[Math.round(Date.parse(`${hoyIso()}T12:00:00Z`) / 864e5) % MOTIVA_SALUD.length];
  return `<h2 class="gorda seccion">Comida, peso y pasos</h2>
    <section class="tarjeta-salud">
      <div class="titular-salud"><b>${esc(titular.t)}</b><span>${esc(titular.s)}</span></div>
      ${barraObjetivo(a)}
      ${graficaPeso(a, estado.rangoPeso || '6m')}
      ${reglaKcal(a)}
      ${barrasSemanas(a)}
      ${logrosSalud(a)}
      ${frases.length ? `<ul class="consejos">${frases.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>` : ''}
      ${idea ? `<p class="idea-salud">${esc(idea)}</p>` : ''}
      <p class="cesar">${esc(motiva)}<br>Cesarlópodo</p>
      ${a.comida28.length ? `<details class="dias-comida"><summary>📅 Tus días de comida</summary>
        <p class="pie">Toca un día para que no cuente.</p>
        <ul>${a.comida28.slice().reverse().slice(0, 21).map((d) => `<li><button type="button" class="dia-${d.estado}" data-dia-comida="${d.fecha}" data-estado="${d.estado}"><span>${fechaMes(d.fecha)}</span><b>${miles(d.kcal)} kcal</b><em>${ETIQUETA_DIA[d.estado]}</em></button></li>`).join('')}</ul></details>` : ''}
      ${formulario}
    </section>`;
}
