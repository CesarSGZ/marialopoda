'use strict';
// ---------- El pique con Cesarlópodo y los tests de fuerza ----------
// De Cesarlópodo solo llega un resumen: si ha entrenado hoy, el peso que ha movido, marcas que ha superado frente a sí
// mismo y kilómetros de caminadora. Los días entrenados no se comparan, porque vuestras rutinas tienen distintos días:
// el duelo de la semana es el peso movido por cada uno frente a su propia media de las cuatro semanas anteriores.

const PIQUE_URL = 'https://cesar-solla.pages.dev/api/pique';
const CARLITOS_URL = 'https://cesar-solla.pages.dev/api/carlitos';

async function traerPique() {
  const c = partesCodigo();
  if (!c) return;
  try {
    const r = await fetch(PIQUE_URL, { headers: { 'x-pique': c.k } });
    const d = await r.json();
    if (!d.ok) return;
    estado.pique = d.rival;
    guardar('pique', d.rival);
    if (d.carlitos) { estado.carlitos = d.carlitos; guardar('carlitos', d.carlitos); }
    const pendiente = leer('valePendiente', null);
    if (pendiente) { guardar('valePendiente', null); enviarCarlitos({ type: 'vale', text: pendiente }).catch(() => {}); }
    const activo = document.activeElement, quieto = Date.now() - (estado.toqueCarlitos || 0) > 8000;
    if (!$('#capa').hidden || (activo && activo.matches('input, textarea'))) return;
    if (estado.vista === 'hoy' || (estado.vista === 'carlitos' && quieto)) pintar();
  } catch (e) { /* sin red o sin conectar todavía: no sale el pique */ }
}

// ---------- Carlitos ----------
async function enviarCarlitos(accion) {
  const c = partesCodigo();
  estado.toqueCarlitos = Date.now();
  const r = await fetch(CARLITOS_URL, { method: 'POST', headers: { 'x-pique': c.k, 'content-type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: accion }) });
  const d = await r.json();
  if (!d.ok) throw new Error(d.error || 'error');
  estado.carlitos = d.carlitos; guardar('carlitos', d.carlitos);
  return d.carlitos;
}
function pintarCarlitos() {
  const m = $('#pantalla');
  if (!estado.carlitos) {
    m.innerHTML = `<div class="carlitos-espera">${Carlitos.dibujo({ stage: 'cachorro', mood: 'contento', worn: ['collar'] })}
      <h1 class="gorda">Carlitos está llegando</h1><p>Necesita conexión para saber qué tal estáis los dos. Vuelve en un momento.</p></div>`;
    traerPique();
    return;
  }
  m.innerHTML = '<div class="carlitos-vista" id="carlitos-caja"></div>';
  Carlitos.montar($('#carlitos-caja'), { estado: estado.carlitos, viewer: 'maria', enviar: enviarCarlitos });
}

// ---------- Tu resumen, con tus filas (así lo de hace un minuto ya cuenta) ----------
function toneladasDe(filas, hoy) {
  const lunes = lunesDe(hoy), porDia = new Map(), porEj = new Map();
  for (const f of filas) {
    const kg = +f[F.KG] || 0, reps = +f[F.REPS] || 0;
    if (kg <= 0 || reps <= 0 || f[F.FECHA] > hoy) continue;
    const movido = kg * reps * ladosDe(f[F.EJ]);
    porDia.set(f[F.FECHA], (porDia.get(f[F.FECHA]) || 0) + movido);
    if (f[F.FECHA] >= lunes) porEj.set(f[F.EJ], (porEj.get(f[F.EJ]) || 0) + movido);
  }
  const t = (de, a = hoy) => Math.round([...porDia].reduce((s, [d, v]) => (d >= de && d <= a ? s + v : s), 0));
  const dia = Math.round((new Date(hoy) - new Date(lunes)) / 864e5);
  const ritmo = (ini, dias) => Math.round([1, 2, 3, 4].reduce((s, i) => s + t(desplazar(ini, -7 * i), desplazar(ini, -7 * i + dias)), 0) / 4);
  const mejor = [...porDia].filter(([d]) => d >= lunes).sort((x, y) => y[1] - x[1])[0];
  const top = [...porEj].sort((x, y) => y[1] - x[1])[0];
  const sesiones = [...porDia.keys()].filter((d) => d >= desplazar(hoy, -29)).length;
  const anterior = desplazar(lunes, -7);
  // Completo desde lo primero apuntado en la app; el duelo necesita cuatro semanas enteras antes (igual que el servidor).
  const since = filas.filter((f) => f[F.ORIGEN] === 'app').reduce((a, f) => (!a || f[F.FECHA] < a ? f[F.FECHA] : a), null);
  const completo = (ini) => Boolean(since) && lunesDe(since) <= desplazar(ini, -28);
  const daily = {};
  for (const [d, v] of porDia) if (d >= desplazar(hoy, -364)) daily[d] = Math.round(v);
  return {
    week: t(lunes), pace: completo(lunes) ? ritmo(lunes, dia) : null, lastWeek: t(anterior, desplazar(lunes, -1)), lastPace: completo(anterior) ? ritmo(anterior, 6) : null, since, daily,
    month: t(desplazar(hoy, -29)), year: t(desplazar(hoy, -364)), perSession: sesiones ? Math.round(t(desplazar(hoy, -29)) / sesiones) : 0,
    best: mejor ? { fecha: mejor[0], kg: Math.round(mejor[1]) } : null, top: top ? { ejercicio: top[0], kg: Math.round(top[1]) } : null
  };
}
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
    if (SIN_LASTRE[f[F.EJ]]) continue; // sus kilos son solo el lastre: un par de kilos parecerían un salto enorme
    const v = e1rmDe(+f[F.KG], +f[F.REPS]);
    if (!v) continue;
    const e = porEj.get(f[F.EJ]) || { antes: 0, ahora: 0 };
    if (f[F.FECHA] < desde) e.antes = Math.max(e.antes, v); else if (f[F.ORIGEN] === 'app') e.ahora = Math.max(e.ahora, v);
    porEj.set(f[F.EJ], e);
  }
  return {
    entrenoHoy: dias.has(hoy), racha,
    records: [...porEj.values()].filter((e) => e.antes && e.ahora > e.antes * 1.001).length,
    km: Math.round(camina.reduce((s, f) => s + datosCaminata(f).km, 0) * 10) / 10, caminoHoy: camina.some((f) => f[F.FECHA] === hoy),
    tonnage: toneladasDe(pesas, hoy)
  };
}

// Peso con su unidad: toneladas a partir de una.
const peso = (kg) => (kg >= 100000 ? `${miles(kg / 1000)} t` : kg >= 1000 ? `${num(Math.round(kg / 100) / 10)} t` : `${miles(kg)} kg`);
// Cuánto va cada uno por encima o por debajo de su propio ritmo; null si aún no hay con qué comparar o aún no ha empezado.
const frenteASi = (actual, ritmo) => (ritmo > 0 && actual > 0 ? Math.round((actual / ritmo - 1) * 100) : null);
const signo = (p) => `${p > 0 ? '+' : p < 0 ? '−' : ''}${Math.abs(p)} %`;
// En un mes o un año, solo los días que los dos tenéis apuntados enteros: antes, el registro de Cesarlópodo solo guardaba
// los días en que cambiaba de objetivo, y comparar eso con el tuyo no sería justo.
function justo(dias, M, T) {
  const normal = desplazar(hoyIso(), -(dias - 1)), inicio = [normal, M.since, T.since].filter(Boolean).sort().pop();
  const suma = (d) => Object.entries(d || {}).reduce((s, [f, v]) => (f >= inicio ? s + v : s), 0);
  return { inicio, yo: suma(M.daily), el: suma(T.daily), corte: inicio > normal };
}
function dueloSemana() {
  const C = estado.pique, yo = miResumen();
  if (!C || !C.tonnage) return null;
  return { yo: frenteASi(yo.tonnage.week, yo.tonnage.pace), el: frenteASi(C.tonnage.week, C.tonnage.pace),
    yoAntes: frenteASi(yo.tonnage.lastWeek, yo.tonnage.lastPace), elAntes: frenteASi(C.tonnage.lastWeek, C.tonnage.lastPace), mio: yo.tonnage, suyo: C.tonnage };
}

function lineasPique() {
  const C = estado.pique, yo = miResumen(), out = [];
  if (!C || C.today !== hoyIso()) return out;
  if (C.trainedToday && !yo.entrenoHoy) out.push('Cesarlópodo ya ha entrenado hoy. Dice que te espera en el podio. 😏');
  if (C.trainedToday && yo.entrenoHoy) out.push('Hoy habéis entrenado los dos. Equipo invencible. 💪');
  if (!C.trainedToday && yo.entrenoHoy) out.push('Tú ya has entrenado y Cesarlópodo todavía no. Recuérdaselo. 😇');
  const d = dueloSemana();
  if (d) {
    const T = d.suyo, M = d.mio;
    if (d.yo !== null && d.el !== null) {
      if (d.yo > d.el) out.push(`Duelo de la semana, cada uno contra su propia media: tú ${signo(d.yo)}, Cesarlópodo ${signo(d.el)}. Vas ganando. 🏆`);
      else if (d.el > d.yo) out.push(`Duelo de la semana: Cesarlópodo va ${signo(d.el)} frente a su media y tú ${signo(d.yo)}. ¿Se lo vas a permitir?`);
      else out.push(`Duelo de la semana empatado: los dos al ${signo(d.yo)} de vuestra media. Desempata.`);
    }
    if (d.yoAntes !== null && d.elAntes !== null && d.yoAntes !== d.elAntes) out.push(d.yoAntes > d.elAntes ? `La semana pasada ganaste el duelo: ${signo(d.yoAntes)} frente al ${signo(d.elAntes)} de Cesarlópodo. 👑` : `La semana pasada ganó Cesarlópodo el duelo (${signo(d.elAntes)} frente a tu ${signo(d.yoAntes)}). Esta es la revancha.`);
    if (T.week || M.week) out.push(`Peso movido esta semana: tú ${peso(M.week)}, Cesarlópodo ${peso(T.week)}.`);
    if (T.week + M.week >= 1000) out.push(`Entre los dos lleváis ${peso(T.week + M.week)} esta semana: lo que pesan ${miles((T.week + M.week) / 9)} perros salchicha. 🐶`);
    if (T.perSession && M.perSession) out.push(`Por entreno, este mes: tú mueves ${peso(M.perSession)} y Cesarlópodo ${peso(T.perSession)}.`);
    if (T.best && M.best) out.push(`Vuestro entreno más pesado de la semana: el tuyo, ${peso(M.best.kg)}; el de Cesarlópodo, ${peso(T.best.kg)}.`);
    if (T.top) out.push(`Lo que más ha cargado Cesarlópodo esta semana: ${T.top.ejercicio.toLowerCase()}, ${peso(T.top.kg)} en total.`);
    if (M.top) out.push(`Tu ejercicio estrella de la semana: ${M.top.ejercicio.toLowerCase()}, ${peso(M.top.kg)} movidos. 🌻`);
    const mes = justo(30, M, T), ano = justo(365, M, T);
    if (mes.yo && mes.el) out.push(`${mes.corte ? `Desde el ${fechaCorta(mes.inicio).slice(0, -3)}, que lo apuntáis todo` : 'Último mes'}: tú ${peso(mes.yo)}, Cesarlópodo ${peso(mes.el)}. Juntos, ${num(Math.round((mes.yo + mes.el) / 500) / 10)} elefantes. 🐘`);
    if (ano.inicio < mes.inicio && ano.yo && ano.el) out.push(`En el último año habéis movido ${peso(ano.yo + ano.el)} entre los dos. Tú, ${peso(ano.yo)}.`);
  }
  const rec = C.records && C.records[0];
  if (rec) out.push(`Cesarlópodo se ha superado en ${rec.ejercicio}: ${rec.reps} × ${num(rec.kg)} kg, un ${num(rec.mejora)} % más que su mejor marca. Te toca superarte a ti.`);
  const suyos = (C.records || []).length;
  if (suyos || yo.records) out.push(`Marcas superadas estas dos semanas: tú ${yo.records}, Cesarlópodo ${suyos}.${yo.records > suyos ? ' Vas ganando. 🌻' : ''}`);
  if (C.walkedToday && !yo.caminoHoy) out.push('Cesarlópodo ya ha hecho caminadora hoy. 🚶');
  if (C.walkWeek || yo.km) out.push(yo.km > C.walkWeek ? `Caminadora esta semana: tú ${num(yo.km)} km, Cesarlópodo ${num(C.walkWeek)}. Las orugas caminan más. 🐛` : `Cesarlópodo lleva ${num(C.walkWeek)} km de caminadora esta semana y tú ${num(yo.km)}.`);
  if (yo.racha > C.streak && yo.racha >= 2) out.push(`Llevas ${yo.racha} semanas seguidas entrenando; Cesarlópodo, ${C.streak}. 😎`);
  else if (C.streak >= 3) out.push(`Cesarlópodo lleva ${C.streak} semanas seguidas entrenando. Tú, ${yo.racha}.`);
  if (!C.trainedToday && C.lastDay && new Date(hoyIso()) - new Date(C.lastDay) >= 4 * 864e5) out.push(`Cesarlópodo no entrena desde el ${fechaCorta(C.lastDay).slice(0, -3)}. Pídele explicaciones.`);
  return out;
}
function pintarPique() {
  const l = lineasPique();
  if (!l.length) return '';
  estado.piqueVez = (estado.piqueVez === undefined ? Math.floor(Math.random() * l.length) : estado.piqueVez) % l.length;
  return `<button type="button" class="pique" data-accion="pique" aria-label="Otro pique con Cesarlópodo"><small>Pique con Cesarlópodo</small>${esc(l[estado.piqueVez])}</button>`;
}
// Al terminar: cómo va el duelo, no cuántos días lleva cada uno.
function lineaSemanaPique() {
  const d = estado.pique && estado.pique.today === hoyIso() ? dueloSemana() : null;
  if (!d || d.yo === null || d.el === null) return '';
  return `<p>🥊 Duelo de la semana: tú ${signo(d.yo)} frente a tu media, Cesarlópodo ${signo(d.el)}.${d.yo > d.el ? ' ¡Vas ganando!' : ''}</p>`;
}
// En Progreso, todo el pique de un vistazo.
function pintarPiqueTabla() {
  const d = estado.pique && estado.pique.today === hoyIso() ? dueloSemana() : null;
  if (!d) return '';
  const C = estado.pique, yo = miResumen(), M = d.mio, T = d.suyo;
  const fila = (nombre, a, b, texto = peso) => `<tr><td>${nombre}</td><td class="${a > b ? 'gana' : ''}">${texto(a)}</td><td class="${b > a ? 'gana' : ''}">${texto(b)}</td></tr>`;
  const caja = (quien, p, otro) => `<div class="${p !== null && (otro === null || p > otro) ? 'gana' : ''}"><small>${quien}</small><b>${p === null ? '—' : signo(p)}</b></div>`;
  return `<h2 class="gorda seccion">Pique con Cesarlópodo</h2>
    <p class="pie">El duelo de la semana compara lo que mueve cada uno con su propia media de las cuatro semanas anteriores, a estas alturas de la semana. Así gana quien más se supera, entrene los días que entrene.</p>
    <div class="duelo-semana">${caja('Tú', d.yo, d.el)}${caja('Cesarlópodo', d.el, d.yo)}</div>
    ${d.yo === null || d.el === null ? `<p class="pie">El duelo empieza cuando los dos tengáis cuatro semanas enteras apuntadas en la app${T.since ? `: a partir del ${fechaCorta(desplazar([M.since, T.since].filter(Boolean).sort().pop(), 28)).slice(0, -3)}` : ''}.</p>` : ''}
    <table class="pique-tabla"><thead><tr><th></th><th>Tú</th><th>Cesarlópodo</th></tr></thead><tbody>
      ${fila('Esta semana', M.week, T.week)}
      ${fila('Semana pasada', M.lastWeek, T.lastWeek)}
      ${fila('Por entreno (mes)', M.perSession, T.perSession)}
      ${fila('Entreno más pesado', M.best ? M.best.kg : 0, T.best ? T.best.kg : 0)}
      ${(() => { const m = justo(30, M, T), a = justo(365, M, T); return `${fila(m.corte ? `Desde el ${fechaCorta(m.inicio).slice(0, -3)}` : 'Último mes', m.yo, m.el)}${a.inicio < m.inicio ? fila('Último año', a.yo, a.el) : ''}`; })()}
      ${fila('Marcas superadas (2 sem.)', yo.records, (C.records || []).length, (v) => miles(v))}
      ${fila('Caminadora (semana)', yo.km, C.walkWeek, (v) => `${num(v)} km`)}
      ${fila('Semanas seguidas', yo.racha, C.streak, (v) => miles(v))}
    </tbody></table>`;
}

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
    <p>¿Quieres saber de verdad lo fuerte que eres frente a otras mujeres? Las máquinas y poleas pesan distinto en cada gimnasio, así que lo fiable de verdad es la barra, las mancuernas o tu propio peso. Con polea sale una estimación.</p>
    <p>Elige uno: se añade a tu entreno de hoy con 4 series. Calienta en las dos primeras y en las dos últimas busca tu tope para 3 a 6 repes. Con tu mejor serie te digo a cuántas mujeres superas.</p>
    ${musculos.map((m) => `<h3 class="test-musculo">${esc(m.nombre)} <small>${m.f.mejor ? `superas al ${m.f.mejor.estimacion ? '≈' : ''}${m.f.mejor.por} %` : 'sin datos'}</small></h3>
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
  const libre = LIBRES.has(r.ejercicio), p = conTope({ libre, ...posicionFuerza(mejor, baremoPara(b.tipo, PESO_REFERENCIA)) });
  return `<div class="tarjeta" role="dialog" aria-label="Resultado del test">
    <div class="bicho salta">${svgBicho}</div>
    <h2 class="gorda">Test de ${esc(b.m.nombre.toLowerCase())}</h2>
    <p class="cifra">${libre ? '' : '≈'}${p.por} %</p>
    <p>${libre ? '' : 'Estimación con polea o máquina, que nunca pasa del 75 % porque cada una pesa distinto. '}Superas al ${libre ? '' : '≈'}${p.por} % de las mujeres que entrenan en ${esc(r.ejercicio.toLowerCase())}: ${DE_REPES.has(b.tipo) ? `${miles(mejor)} repes seguidas` : `1RM estimado de ${miles(mejor)} kg`}, nivel ${p.nivel < 0 ? 'empezando' : NOMBRE_NIVEL[p.nivel].toLowerCase()}.</p>
    <p>Ya sale en tu mapa de fuerza, en la pestaña Fuerza.</p>
    <button type="button" class="principal" data-accion="cerrar">Seguir</button>
  </div>`;
}
