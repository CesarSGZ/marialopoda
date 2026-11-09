'use strict';
// ---------- El pique con César y los tests de fuerza ----------
// De César solo llega un resumen: días entrenados, si ha entrenado hoy, marcas que ha superado frente a sí mismo
// y kilómetros de caminadora. Los pesos de dos personas no se comparan: cada uno compite con su yo del pasado.

const PIQUE_URL = 'https://cesar-solla.pages.dev/api/pique';

async function traerPique() {
  const c = partesCodigo();
  if (!c) return;
  try {
    const r = await fetch(PIQUE_URL, { headers: { 'x-pique': c.k } });
    const d = await r.json();
    if (!d.ok) return;
    estado.pique = d.rival;
    guardar('pique', d.rival);
    const activo = document.activeElement;
    if (estado.vista === 'hoy' && $('#capa').hidden && (!activo || !activo.matches('input, textarea'))) pintar();
  } catch (e) { /* sin red o sin conectar todavía: no sale el pique */ }
}

// Lo mismo que se cuenta de César, calculado aquí con tus filas (así lo de hace un minuto ya cuenta).
function miResumen() {
  const hoy = hoyIso(), lunes = lunesDe(hoy), desde = desplazar(hoy, -13);
  const pesas = estado.filas.filter((f) => f[F.EJ] !== CAMINADORA && f[F.FECHA] <= hoy);
  const dias = new Set(pesas.map((f) => f[F.FECHA]));
  const camina = estado.filas.filter((f) => f[F.EJ] === CAMINADORA && f[F.FECHA] >= lunes && f[F.FECHA] <= hoy);
  const tieneSemana = (l) => [0, 1, 2, 3, 4, 5, 6].some((i) => dias.has(desplazar(l, i)));
  let racha = 0, l = tieneSemana(lunes) ? lunes : desplazar(lunes, -7);
  while (racha < 200 && tieneSemana(l)) { racha++; l = desplazar(l, -7); }
  const porEj = new Map();
  for (const f of pesas) {
    const v = e1rmDe(+f[F.KG], +f[F.REPS]);
    if (!v) continue;
    const e = porEj.get(f[F.EJ]) || { antes: 0, ahora: 0 };
    if (f[F.FECHA] < desde) e.antes = Math.max(e.antes, v); else if (f[F.ORIGEN] === 'app') e.ahora = Math.max(e.ahora, v);
    porEj.set(f[F.EJ], e);
  }
  return {
    entrenoHoy: dias.has(hoy), semana: [...dias].filter((d) => d >= lunes).length, racha,
    records: [...porEj.values()].filter((e) => e.antes && e.ahora > e.antes * 1.001).length,
    km: Math.round(camina.reduce((s, f) => s + datosCaminata(f).km, 0) * 10) / 10, caminoHoy: camina.some((f) => f[F.FECHA] === hoy)
  };
}

const entrenos = (n) => (n === 1 ? '1 entreno' : `${n} entrenos`);
function lineasPique() {
  const C = estado.pique, yo = miResumen(), out = [];
  if (!C || C.today !== hoyIso()) return out;
  if (C.trainedToday && !yo.entrenoHoy) out.push('César ya ha entrenado hoy. Dice que te espera en el podio. 😏');
  if (C.trainedToday && yo.entrenoHoy) out.push('Hoy habéis entrenado los dos. Equipo invencible. 💪');
  if (!C.trainedToday && yo.entrenoHoy) out.push('Tú ya has entrenado y César todavía no. Recuérdaselo. 😇');
  if (C.week > yo.semana) out.push(`César lleva ${entrenos(C.week)} esta semana y tú ${yo.semana}. ¿Se lo vas a permitir?`);
  else if (C.week && C.week === yo.semana) out.push(`Empate con César: ${entrenos(C.week)} cada uno esta semana.`);
  else if (yo.semana > C.week) out.push(`Vas ganando a César esta semana: ${yo.semana} a ${C.week}. 🏆`);
  const rec = C.records && C.records[0];
  if (rec) out.push(`César se ha superado en ${rec.ejercicio}: ${rec.reps} × ${num(rec.kg)} kg, un ${num(rec.mejora)} % más que su mejor marca. Te toca superarte a ti.`);
  const suyos = (C.records || []).length;
  if (suyos || yo.records) out.push(`Marcas superadas estas dos semanas: tú ${yo.records}, César ${suyos}.${yo.records > suyos ? ' Vas ganando. 🌻' : ''}`);
  if (C.walkedToday && !yo.caminoHoy) out.push('César ya ha hecho caminadora hoy. 🚶');
  if (C.walkWeek || yo.km) out.push(yo.km > C.walkWeek ? `Caminadora esta semana: tú ${num(yo.km)} km, César ${num(C.walkWeek)}. Las orugas caminan más. 🐛` : `César lleva ${num(C.walkWeek)} km de caminadora esta semana y tú ${num(yo.km)}.`);
  if (yo.racha > C.streak && yo.racha >= 2) out.push(`Llevas ${yo.racha} semanas seguidas entrenando; César, ${C.streak}. 😎`);
  else if (C.streak >= 3) out.push(`César lleva ${C.streak} semanas seguidas entrenando. Tú, ${yo.racha}.`);
  if (!C.trainedToday && C.lastDay && new Date(hoyIso()) - new Date(C.lastDay) >= 4 * 864e5) out.push(`César no entrena desde el ${fechaCorta(C.lastDay).slice(0, -3)}. Pídele explicaciones.`);
  return out;
}
function pintarPique() {
  const l = lineasPique();
  if (!l.length) return '';
  estado.piqueVez = (estado.piqueVez === undefined ? Math.floor(Math.random() * l.length) : estado.piqueVez) % l.length;
  return `<button type="button" class="pique" data-accion="pique" aria-label="Otro pique con César"><small>Pique con César</small>${esc(l[estado.piqueVez])}</button>`;
}
const lineaSemanaPique = () => (estado.pique && estado.pique.today === hoyIso() ? `<p>🥊 Esta semana: tú ${entrenos(miResumen().semana)}, César ${entrenos(estado.pique.week)}.</p>` : '');

// ---------- Tests de fuerza ----------
// Ejercicios que pesan igual en cualquier gimnasio (barra, mancuernas, polea), para saber de verdad dónde estás.
const TESTS_FUERZA = [
  ['gluteo', 'Hip thrust', 'Con barra, apoyada en el banco.'],
  ['gluteo', 'Patada de glúteo en polea', 'En polea baja, una pierna: apunta el peso de la polea.'],
  ['gluteoMedio', 'Abductores sentada en polea', 'Sentada, en la polea de abductores.'],
  ['cuadriceps', 'Sentadilla', 'Con barra, al menos hasta paralelo.'],
  ['cuadriceps', 'Extensión de cuádriceps', 'Con las dos piernas.'],
  ['femoral', 'Peso muerto rumano', 'Con barra.'],
  ['femoral', 'Curl femoral de pie', 'En la máquina de pie.'],
  ['aductor', 'Aductores', 'En la máquina de aductores.'],
  ['gemelo', 'Gemelos', 'De pie en máquina, hasta 15 repes.'],
  ['dorsal', 'Jalón al pecho', 'En polea con barra.'],
  ['espalda', 'Remo bajo', 'Sentada en polea baja.'],
  ['deltAnt', 'Press militar con mancuernas', 'Sentada: apunta el peso de una mancuerna.'],
  ['deltLat', 'Elevaciones laterales', 'Con mancuernas: apunta el peso de una.'],
  ['deltPost', 'Face pull', 'En polea con cuerda.'],
  ['pecho', 'Press banca', 'Con barra libre.'],
  ['biceps', 'Bíceps en polea', 'En polea baja.'],
  ['triceps', 'Tríceps en polea alta con barra', 'En polea alta con la barrita.']
];
const GRUPO_POR_DEFECTO = { gluteo: 'Glúteos', gluteoMedio: 'Glúteos', cuadriceps: 'Piernas', aductor: 'Piernas', gemelo: 'Piernas', femoral: 'Femoral', dorsal: 'Espalda', espalda: 'Espalda', deltAnt: 'Hombros', deltLat: 'Hombros', deltPost: 'Hombros', pecho: 'Pecho', biceps: 'Brazos', triceps: 'Brazos' };
const baremoDe = (ej) => { for (const m of MUSCULOS) { const e = m.ej.find(([n]) => n === ej); if (e) return { m, tipo: e[1], factor: e[2] || 1 }; } return null; };

function abrirTests() {
  const fuerza = fuerzaPorMusculo(PESO_REFERENCIA, hoyIso());
  const musculos = MUSCULOS.filter((m) => TESTS_FUERZA.some((t) => t[0] === m.id)).map((m) => ({ ...m, f: fuerza.find((x) => x.id === m.id) }))
    .sort((a, b) => (a.f.mejor ? 1 : 0) - (b.f.mejor ? 1 : 0));
  const c = $('#capa');
  c.innerHTML = `<div class="tarjeta sobria" role="dialog" aria-label="Test de fuerza">
    <h2 class="gorda">Test de fuerza</h2>
    <p>¿Quieres saber de verdad lo fuerte que eres frente a otras mujeres? Las máquinas pesan distinto en cada gimnasio, así que lo fiable son ejercicios con barra, mancuernas o polea.</p>
    <p>Elige uno: se añade a tu entreno de hoy con 4 series. Calienta en las dos primeras y en las dos últimas busca tu tope para 3 a 6 repes. Con tu mejor serie te digo a cuántas mujeres superas.</p>
    ${musculos.map((m) => `<h3 class="test-musculo">${esc(m.nombre)} <small>${m.f.mejor ? `superas al ${m.f.mejor.por} %` : 'sin datos'}</small></h3>
      <div class="opciones">${TESTS_FUERZA.filter((t) => t[0] === m.id).map((t) => `<button type="button" data-test="${esc(t[1])}"><b>${esc(t[1])}</b><small>${esc(t[2])}</small></button>`).join('')}</div>`).join('')}
    <button type="button" class="secundario" data-accion="cerrar">Ahora no</button>
  </div>`;
  c.hidden = false;
}

function empezarTest(ej) {
  const t = TESTS_FUERZA.find((x) => x[1] === ej), b = baremoDe(ej);
  if (estado.dia === null) estado.dia = diaSugerido();
  const plan = planHoy();
  const f = estado.filas.find((x) => x[F.EJ] === ej);
  plan.extras[estado.dia] = (plan.extras[estado.dia] || []).filter((x) => x.ejercicio !== ej)
    .concat({ ejercicio: ej, musculo: f ? f[F.MUSC] : (b && grupoDeMusculo(b.m)) || GRUPO_POR_DEFECTO[t[0]], series: 4, reps: 5, salto: SIN_LASTRE[ej] ? 0 : ej === 'Elevaciones laterales' ? 1 : 2.5, test: true, como: t[2] });
  guardarPlan();
  estado.vista = 'hoy'; estado.ejercicio = ej;
  cerrarCapa();
  $('#pantalla').scrollTo(0, 0);
  pintar();
}

const bannerTest = (r) => (r.test ? `<div class="test-aviso"><b>Test de fuerza</b> ${esc(r.como || '')} Series 1 y 2: calienta, unas 10 y 5 repes ligeras. Series 3 y 4: tu tope para 3 a 6 repes. Cuenta la mejor.</div>` : '');

function resultadoTest(r) {
  const b = baremoDe(r.ejercicio);
  if (!b) return '';
  const mejor = Math.max(0, ...estado.filas.filter((f) => f[F.EJ] === r.ejercicio && f[F.FECHA] === hoyIso()).map((f) => (DE_REPES.has(b.tipo) ? +f[F.REPS] || 0 : e1rmDe(+f[F.KG] * b.factor, +f[F.REPS]))));
  if (!mejor) return '';
  const p = posicionFuerza(mejor, baremoPara(b.tipo, PESO_REFERENCIA));
  return `<div class="tarjeta" role="dialog" aria-label="Resultado del test">
    <div class="bicho salta">${svgBicho}</div>
    <h2 class="gorda">Test de ${esc(b.m.nombre.toLowerCase())}</h2>
    <p class="cifra">${p.por} %</p>
    <p>Superas al ${p.por} % de las mujeres que entrenan en ${esc(r.ejercicio.toLowerCase())}: ${DE_REPES.has(b.tipo) ? `${miles(mejor)} repes seguidas` : `1RM estimado de ${miles(mejor)} kg`}, nivel ${p.nivel < 0 ? 'empezando' : NOMBRE_NIVEL[p.nivel].toLowerCase()}.</p>
    <p>Ya sale en tu mapa de fuerza, en Progreso.</p>
    <button type="button" class="principal" data-accion="cerrar">Seguir</button>
  </div>`;
}
