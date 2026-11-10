'use strict';

// ---------- Almacén local ----------
const leer = (k, def) => { try { const v = localStorage.getItem('mlp.' + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } };
const guardar = (k, v) => { try { localStorage.setItem('mlp.' + k, JSON.stringify(v)); } catch (e) { /* sin espacio: seguimos en memoria */ } };

// Columnas de una fila: como las pestaña Registro.
const F = { FECHA: 0, DIA: 1, EJ: 2, MUSC: 3, SERIE: 4, REPS: 5, KG: 6, NOTA: 7, ORIGEN: 8, ID: 9 };

// Nombres del Sheet que mezclaban máquinas distintas: se separan al leer, sin reescribir el Sheet
// (el Apps Script marcaría como "app" las filas importadas y se perdería de dónde vienen).
const ABD_POLEA = 'Abductores sentada en polea';
const TRI_BARRA = 'Tríceps en polea alta con barra';
const NUEVO_NOMBRE = {
  'Press militar': () => 'Press militar con mancuernas',
  // Todo lo del Excel fue en la Technogym de discos; desde la app, en la sentada con polea.
  Abductores: (f) => (f && f[F.ORIGEN] !== 'app' ? 'Abductores Technogym con discos' : ABD_POLEA),
  // Desde 2025, polea alta con minibarra. Antes, el día 2 era con mancuerna a dos manos (~20 kg) y el 4, a una mano en polea baja (~5 kg).
  'Tríceps en polea': (f) => (!f || f[F.FECHA] >= '2025-01-01' ? TRI_BARRA
    : +f[F.DIA] === 4 ? 'Tríceps unilateral en polea baja' : 'Extensión de tríceps con mancuerna a dos manos')
};
function renombrarFila(f) {
  const n = NUEVO_NOMBRE[f[F.EJ]];
  if (!n) return f;
  const c = f.slice(); c[F.EJ] = n(f); return c;
}
const renombrarRutina = (r) => (NUEVO_NOMBRE[r.ejercicio] ? { ...r, ejercicio: NUEVO_NOMBRE[r.ejercicio](null) } : r);

const NOTA_SUELTA = 'Nota';
// El mapa del cuerpo compara con el baremo de una mujer de este peso; no se le pide el suyo.
const PESO_REFERENCIA = 60;

const estado = {
  sueltas: leer('sueltas', []),
  todasNotas: false,
  cartas: [],
  dueloCelebrado: {},
  floresVistas: Infinity,
  toquesBicho: 0,
  codigo: leer('codigo', null),
  rutina: leer('rutina', []).map(renombrarRutina),
  filas: leer('filas', []).map(renombrarFila),
  cola: leer('cola', []),
  vista: 'hoy',
  dia: null,
  ejercicio: null,
  borrador: {},      // { 'ejercicio': { kg, reps, serie } }
  plan: leer('plan', null),
  medidas: leer('medidas', {}),
  pique: leer('pique', null),
  serieElegida: {},
  verMas: false,
  editando: null,
  musculo: null,
  grafica: null,
  descanso: null,
  segundos: leer('segundos', 120),
  sincronizando: false,
  errorClave: false
};

// Este bicho sale siempre igual: lo dibuja dev/mascota.py.
let svgBicho = '', svgBase = '';
const azar = (l) => l[Math.floor(Math.random() * l.length)];
const hoyIso = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const num = (v) => String(Math.round(v * 100) / 100).replace('.', ',');
const miles = (v) => Math.round(v).toLocaleString('de-DE'); // es-ES no separa los miles de 4 cifras
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const $ = (s) => document.querySelector(s);
const SIN_LASTRE = { Dominadas: true, 'Fondos de tríceps': true };
const fechaCorta = (iso) => { const [a, m, d] = iso.split('-'); return `${+d} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]} ${a.slice(2)}`; };

// ---------- Cálculos ----------
const diasRutina = () => {
  const m = new Map();
  estado.rutina.forEach((r) => { if (!m.has(r.dia)) m.set(r.dia, r.nombre); });
  return [...m.entries()].sort((a, b) => a[0] - b[0]).map(([dia, nombre]) => ({ dia, nombre }));
};
const filasDe = (ej) => estado.filas.filter((f) => f[F.EJ] === ej);
const filasHoy = (d, ej) => estado.filas.filter((f) => f[F.FECHA] === hoyIso() && f[F.DIA] === d && f[F.EJ] === ej).sort((a, b) => a[F.SERIE] - b[F.SERIE]);

// Lo que se cambia solo para hoy (saltos, orden, ejercicios) y caduca al cambiar de fecha.
function planHoy() {
  if (!estado.plan || estado.plan.fecha !== hoyIso()) estado.plan = { fecha: hoyIso(), saltos: {}, orden: {}, cambios: {} };
  estado.plan.extras = estado.plan.extras || {};
  return estado.plan;
}
const guardarPlan = () => guardar('plan', estado.plan);

function ejerciciosDia(d) {
  const plan = planHoy();
  const base = estado.rutina.filter((r) => r.dia === d && r.ejercicio).sort((a, b) => a.orden - b.orden);
  // Un día sin ejercicios es de descanso, salvo que hoy quiera hacer el mini entreno.
  const lista = (base.length ? base : circuitoActivo(d) ? CIRCUITO.map((x) => ({ ...x, dia: d })) : []).map((r) => {
    const nuevo = plan.cambios[`${d}|${r.ejercicio}`];
    const copia = { ...r, original: r.ejercicio };
    if (nuevo) {
      const f = estado.filas.find((x) => x[F.EJ] === nuevo);
      copia.ejercicio = nuevo;
      if (f) copia.musculo = f[F.MUSC];
    }
    return copia;
  });
  // Lo añadido solo para hoy, como un test de fuerza.
  const nombre = (lista[0] || estado.rutina.find((r) => r.dia === d) || {}).nombre || '';
  for (const x of plan.extras[d] || []) if (!lista.some((y) => y.ejercicio === x.ejercicio)) lista.push({ dia: d, nombre, orden: 99, ...x, original: x.ejercicio });
  const orden = plan.orden[d];
  if (orden) lista.sort((a, b) => orden.indexOf(a.original) - orden.indexOf(b.original));
  return lista;
}

// Qué series están hechas, saltadas o libres, y cuál toca ahora.
function seriesDe(r) {
  const hechas = filasHoy(estado.dia, r.ejercicio);
  const saltos = planHoy().saltos[`${estado.dia}|${r.ejercicio}`] || [];
  const ocupadas = new Set([...hechas.map((f) => f[F.SERIE]), ...saltos]);
  const libres = [];
  for (let i = 1; i <= r.series; i++) if (!ocupadas.has(i)) libres.push(i);
  const elegida = estado.serieElegida[r.ejercicio];
  const activa = libres.includes(elegida) ? elegida : (libres.length ? libres[0] : Math.max(r.series, ...ocupadas) + 1);
  return { hechas, saltos, libres, activa, completo: !libres.length };
}

// La hoja de julio numeraba 1 pierna, 2 espalda, 3 pierna y 4 hombro; ahora son 1, 2, 4 y 5.
const DIA_ANTIGUO = { 3: 4, 4: 5 };

function diaSugerido() {
  const dias = diasRutina();
  if (!dias.length) return null;
  let ultima = null;
  for (const f of estado.filas) if (!ultima || f[F.FECHA] >= ultima[F.FECHA]) ultima = f;
  if (!ultima) return dias[0].dia;
  const diaUltimo = ultima[F.ORIGEN] === 'app' ? ultima[F.DIA] : (DIA_ANTIGUO[ultima[F.DIA]] || ultima[F.DIA]);
  if (ultima[F.FECHA] === hoyIso() && dias.some((d) => d.dia === diaUltimo)) return diaUltimo;
  let i = (dias.findIndex((d) => d.dia === diaUltimo) + 1) % dias.length;
  const haceDias = Math.round((new Date(hoyIso()) - new Date(ultima[F.FECHA])) / 864e5);
  // Si ya pasó más de un día desde el último entreno, el descanso ya está hecho.
  if (!estado.rutina.some((r) => r.dia === dias[i].dia && r.ejercicio) && haceDias > 1) i = (i + 1) % dias.length;
  return dias[i].dia;
}

// Sesiones anteriores a hoy de un ejercicio, de la más reciente a la más antigua.
// Con conHoy también entra la de hoy (cuando ya terminó el ejercicio, para verla en la lista).
function sesionesPrevias(ej, cuantas, conHoy) {
  const porFecha = new Map();
  for (const f of filasDe(ej)) {
    if (conHoy ? f[F.FECHA] > hoyIso() : f[F.FECHA] >= hoyIso()) continue;
    if (!porFecha.has(f[F.FECHA])) porFecha.set(f[F.FECHA], []);
    porFecha.get(f[F.FECHA]).push(f);
  }
  return [...porFecha.keys()].sort().reverse().slice(0, cuantas)
    .map((fecha) => ({ fecha, series: porFecha.get(fecha).sort((a, b) => a[F.SERIE] - b[F.SERIE]) }));
}
const ultimaVez = (ej) => sesionesPrevias(ej, 1)[0] || null;
const terminadoHoy = (r) => { const s = seriesDe(r); return s.completo && s.hechas.length > 0; };
const fechaFila = (fecha) => (fecha === hoyIso() ? 'Hoy' : fechaCorta(fecha).slice(0, -3));

const mediana = (a) => { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };

// Valor de cada sesión. En lo importado del Excel usa la mediana, porque una celda suelta
// (170 en abductores, 57,8 en remo) suele ser una errata y no debe robarle récords de verdad.
function valoresPorFecha(ej, medir) {
  const porFecha = new Map();
  for (const f of filasDe(ej)) {
    const v = medir(f);
    const l = porFecha.get(f[F.FECHA]) || { app: [], excel: [] };
    (f[F.ORIGEN] === 'app' ? l.app : l.excel).push(v);
    porFecha.set(f[F.FECHA], l);
  }
  return [...porFecha.entries()].map(([fecha, l]) => [fecha, Math.max(l.app.length ? Math.max(...l.app) : 0, l.excel.length ? mediana(l.excel) : 0)]);
}

function mejorMarca(ej) {
  const kg = Math.max(0, ...valoresPorFecha(ej, (f) => +f[F.KG]).map((p) => p[1]));
  let reps = 0;
  for (const f of filasDe(ej)) if (+f[F.KG] === kg && +f[F.REPS] > reps) reps = +f[F.REPS];
  return { kg, reps };
}

// Cuál es la serie siguiente y con qué números rellenarla.
function borradorDe(r) {
  const { hechas, activa: serie } = seriesDe(r);
  const b = estado.borrador[r.ejercicio];
  if (b && b.serie === serie) return b;
  const ult = ultimaVez(r.ejercicio);
  const previa = hechas[hechas.length - 1];
  const modelo = previa || (ult && (ult.series.find((f) => f[F.SERIE] === serie) || ult.series[ult.series.length - 1]));
  const nuevo = { serie, kg: modelo ? +modelo[F.KG] : (r.kg || 0), reps: modelo && modelo[F.REPS] !== '' ? +modelo[F.REPS] : r.reps };
  if (r.medida) nuevo.seg = modelo ? segundosDe(modelo) : 0;
  estado.borrador[r.ejercicio] = nuevo;
  return nuevo;
}

// Solo sugiere subir si la última vez completó todas las series con las repeticiones objetivo.
function tocaSubir(r) {
  const ult = ultimaVez(r.ejercicio);
  if (!ult || r.circuito || SIN_LASTRE[r.ejercicio] || ult.series.length < r.series) return null;
  if (!ult.series.every((f) => +f[F.REPS] >= r.reps)) return null;
  const kg = Math.max(...ult.series.map((f) => +f[F.KG]));
  return kg > 0 ? kg + r.salto : null;
}

// Discos por lado para dibujar el peso; es una representación, no un cálculo de barra real.
function discos(kg) {
  const out = [];
  let resto = kg / 2;
  for (const [p, c] of [[25, 'd25'], [20, 'd20'], [15, 'd15'], [10, 'd10'], [5, 'd5'], [2.5, 'd2'], [1.25, 'd1']]) {
    while (resto >= p - 0.01 && out.length < 10) { out.push(c); resto -= p; }
  }
  return out;
}

// ---------- Red ----------
const partesCodigo = () => {
  const i = (estado.codigo || '').indexOf('#');
  return i < 0 ? null : { url: estado.codigo.slice(0, i), k: estado.codigo.slice(i + 1) };
};

function fusionar(servidor) {
  const pendientes = new Map();
  const borradas = new Set();
  for (const op of estado.cola) {
    if (op.tipo === 'borrar') borradas.add(op.id);
    else pendientes.set(op.fila.id, renombrarFila(aFila(op.fila)));
  }
  const filas = servidor.map(renombrarFila).filter((f) => !borradas.has(f[F.ID]) && !pendientes.has(f[F.ID]));
  // Las notas sueltas de los Excel antiguos no son series: solo salen en la lista de notas.
  estado.sueltas = filas.filter((f) => f[F.EJ] === NOTA_SUELTA);
  estado.filas = filas.filter((f) => f[F.EJ] !== NOTA_SUELTA).concat([...pendientes.values()]);
  guardar('sueltas', estado.sueltas);
}

// Todas las notas, de la más reciente a la más antigua.
function todasLasNotas() {
  return estado.filas.filter((f) => notaDe(f).trim()).concat(estado.sueltas)
    .sort((a, b) => (a[F.FECHA] < b[F.FECHA] ? 1 : a[F.FECHA] > b[F.FECHA] ? -1 : 0));
}

function pintarNotas() {
  const notas = todasLasNotas();
  const visibles = estado.todasNotas ? notas : notas.slice(0, 5);
  $('#notas').innerHTML = notas.length ? `<ul class="notas">${visibles.map((f) => {
    const suelta = f[F.EJ] === NOTA_SUELTA;
    const serie = suelta ? '' : ES_MEDIDO.has(f[F.EJ])
      ? `<small>Vuelta ${f[F.SERIE]}, ${miles(+f[F.REPS])} m${segundosDe(f) ? ` en ${aTiempo(segundosDe(f))}` : ''}</small>`
      : `<small>${ES_CIRCUITO.has(f[F.EJ]) ? 'Vuelta' : 'Serie'} ${f[F.SERIE]}${f[F.KG] !== '' ? `, ${num(+f[F.KG])} kg` : ''}${f[F.REPS] !== '' ? ` × ${f[F.REPS]}` : ''}</small>`;
    return `<li><span class="nota-fecha">${fechaCorta(f[F.FECHA])}</span><div>${suelta ? '' : `<b>${esc(f[F.EJ])}</b>`}${serie}<p>${esc(notaDe(f))}</p></div></li>`;
  }).join('')}</ul>${notas.length > 5 ? `<button type="button" class="ver-mas" data-accion="ver-notas">${estado.todasNotas ? 'Ver menos' : `Ver las ${notas.length}`}</button>` : ''}`
    : '<p class="pie">Cuando añadas una nota a una serie, la verás aquí con su fecha y su ejercicio.</p>';
}

async function descargar() {
  const c = partesCodigo();
  if (!c) return false;
  const r = await fetch(`${c.url}?k=${encodeURIComponent(c.k)}&t=${Date.now()}`, { redirect: 'follow' });
  const d = await r.json();
  if (d.error === 'clave') { estado.errorClave = true; return false; }
  estado.errorClave = false;
  estado.rutina = d.rutina.map(renombrarRutina);
  fusionar(d.filas);
  guardar('rutina', estado.rutina);
  guardar('filas', estado.filas);
  return true;
}

async function subirCola() {
  const c = partesCodigo();
  if (!c || !estado.cola.length || estado.sincronizando) return;
  estado.sincronizando = true;
  const enviando = estado.cola.slice();
  try {
    // text/plain evita la comprobación previa que Apps Script no sabe contestar.
    const r = await fetch(c.url, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ k: c.k, ops: enviando }) });
    const d = await r.json();
    if (d.ok) {
      estado.cola = estado.cola.slice(enviando.length);
      guardar('cola', estado.cola);
    } else if (d.error === 'clave') {
      estado.errorClave = true;
    }
  } catch (e) { /* sin red: se reintenta luego */ }
  estado.sincronizando = false;
  pintarPendiente();
  if (estado.cola.length && estado.cola.length !== enviando.length) subirCola();
}

function encolar(op) {
  estado.cola.push(op);
  guardar('cola', estado.cola);
  guardar('filas', estado.filas);
  pintarPendiente();
  subirCola();
}

const aFila = (o) => [o.fecha, o.dia, o.ejercicio, o.musculo, o.serie, o.reps === null ? '' : o.reps, o.kg, o.nota || '', 'app', o.id];
const nuevoId = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function pintarPendiente() {
  let e = $('.pendiente');
  const n = estado.cola.length;
  if (!n) { if (e) e.remove(); return; }
  if (!e) { e = document.createElement('div'); e.className = 'pendiente'; document.body.appendChild(e); }
  e.textContent = n === 1 ? '1 cambio por subir' : `${n} cambios por subir`;
}

// ---------- Hoy ----------
// Casi siempre un saludo general; a veces uno que sabe qué hora o qué día es.
function objetivoSemanal() {
  return diasRutina().filter((d) => estado.rutina.some((r) => r.dia === d.dia && r.ejercicio)).length || 4;
}

function saludoDeHoy() {
  if (ES_CUMPLE(hoyIso())) return azar(FRASES.cumple);
  const ahora = new Date(), h = ahora.getHours(), d = ahora.getDay();
  if (Math.random() > 0.35) return azar(FRASES.saludo);
  if (d === 1) return azar(FRASES.lunes);
  if (d === 5) return azar(FRASES.viernes);
  if (d === 0 || d === 6) return azar(FRASES.finde);
  return azar(h < 13 ? FRASES.manana : h < 21 ? FRASES.tarde : FRASES.noche);
}

function pintarHoy() {
  const m = $('#pantalla');
  if (!estado.rutina.length) {
    m.innerHTML = `<div class="cabecera"><div class="bicho">${svgBicho}</div><p class="saludo">Estoy trayendo tu rutina. Si tarda, comprueba la conexión.</p></div>`;
    return;
  }
  if (estado.dia === null) estado.dia = diaSugerido();
  const dias = diasRutina();
  if (!dias.some((d) => d.dia === estado.dia)) estado.dia = dias[0].dia;
  const dia = dias.find((d) => d.dia === estado.dia);
  const lista = ejerciciosDia(estado.dia);
  if (estado.floresVistas === Infinity) estado.floresVistas = estado.filas.filter((f) => f[F.FECHA] === hoyIso() && f[F.ORIGEN] === 'app').length;
  if (!estado.saludo) estado.saludo = saludoDeHoy();
  const cabecera = `
    <div class="cabecera">
      <p class="saludo">${esc(estado.saludo)}</p>
      <button class="bicho" type="button" aria-label="Saludar a Marialópoda" data-accion="bicho">${svgBicho}</button>
    </div>
    ${pintarPique()}
    <h1 class="gorda titulo-dia">Día ${estado.dia}, ${lista.length && lista[0].nombre === 'Mini entreno' ? 'mini entreno' : esc(dia.nombre.toLowerCase())}</h1>
    <div class="dias" role="group" aria-label="Elegir día">
      ${dias.map((d) => `<button type="button" data-dia="${d.dia}" aria-pressed="${d.dia === estado.dia}"><b>${d.dia}</b>${esc(d.nombre)}</button>`).join('')}
    </div>`;
  if (!lista.length) {
    if (!estado.fraseReposo) estado.fraseReposo = azar(FRASES.reposo);
    m.innerHTML = `${cabecera}<section class="reposo"><p class="gorda">${esc(estado.fraseReposo)}</p>
      <p>¿Te apetece moverte un poco? Tienes un mini entreno tranquilo: pelota, remo, sentadilla y esquí en circuito, 3 vueltas, y abdominales para acabar.</p>
      <button type="button" class="hecha" data-accion="circuito">Hacer el mini entreno</button>
      <p>Si prefieres pesas, elige otro día arriba.</p></section>
      ${pintarCaminadoraHoy()}`;
    return;
  }
  const pendiente = lista.find((r) => !seriesDe(r).completo);
  if (!estado.ejercicio || !lista.some((r) => r.ejercicio === estado.ejercicio)) estado.ejercicio = (siguienteDelCircuito(lista) || pendiente || lista[0]).ejercicio;
  const r = lista.find((x) => x.ejercicio === estado.ejercicio);
  const hayAlgo = lista.some((x) => filasHoy(estado.dia, x.ejercicio).length);

  m.innerHTML = `${cabecera}
    ${pintarFoco(r)}
    ${pintarJardin('jardin')}
    <div class="lista-cab"><h2 class="gorda">Lo que queda</h2><button type="button" data-accion="ordenar">Cambiar orden</button></div>
    <ul class="lista">
      ${lista.filter((x) => x !== r).map((x) => {
        const s = seriesDe(x);
        return `<li class="${s.completo ? 'hecho' : ''}"><button type="button" data-ej="${esc(x.ejercicio)}"><span class="nombre">${esc(x.ejercicio)}</span>
          <span class="puntos" aria-label="${s.hechas.length} de ${x.series} series">${Array.from({ length: x.series }, (_, i) => {
            const n = i + 1;
            const clase = s.hechas.some((f) => f[F.SERIE] === n) ? 'ok' : (s.saltos.includes(n) ? 'sal' : '');
            return `<i class="${clase}"></i>`;
          }).join('')}</span></button></li>`;
      }).join('')}
    </ul>
    ${r.circuito || r.final ? (hayAlgo ? '' : '<button class="saltar sin-circuito" type="button" data-accion="sin-circuito">Hoy mejor descanso</button>') : ''}
    ${pintarCaminadoraHoy()}
    ${hayAlgo ? '<button class="terminar" type="button" data-accion="terminar">Terminar entreno</button>' : ''}`;
}

// Las sesiones anteriores en filas: cada celda se rellena según su peso, para ver de un vistazo si sube.
function pintarAnteriores(r) {
  if (r.medida) return pintarAnterioresMedidos(r);
  const cuantas = estado.verMas ? 6 : 2;
  const todas = sesionesPrevias(r.ejercicio, 7, terminadoHoy(r));
  if (!todas.length) return '<p class="ultima">Primera vez. Busca un peso cómodo y apúntalo.</p>';
  const visibles = todas.slice(0, cuantas);
  const techo = Math.max(...visibles.flatMap((s) => s.series.map((f) => +f[F.KG])), 1);
  const columnas = Math.max(r.series, ...visibles.map((s) => s.series.length));
  const filas = visibles.map((s, i) => {
    const previa = todas[i + 1];
    const tope = Math.max(...s.series.map((f) => +f[F.KG]));
    const dif = previa ? tope - Math.max(...previa.series.map((f) => +f[F.KG])) : 0;
    const celdas = [];
    for (let c = 0; c < columnas; c++) {
      const f = s.series[c];
      if (!f) { celdas.push('<span class="celda vacia"></span>'); continue; }
      const kg = +f[F.KG];
      celdas.push(`<span class="celda" style="--h:${Math.round(kg / techo * 100)}%"><b>${kg ? num(kg) : 'Libre'}</b><small>${f[F.REPS] === '' ? 'sin repes' : `× ${f[F.REPS]}`}</small></span>`);
    }
    const notas = s.series.filter((f) => notaDe(f).trim()).map((f) => `<p class="nota-antes">${r.circuito ? 'Vuelta' : 'Serie'} ${f[F.SERIE]}: ${esc(notaDe(f))}</p>`).join('');
    return `<div class="fila-antes ${i ? '' : 'reciente'}" style="--cols:${columnas}">
      <span class="fecha">${fechaFila(s.fecha)}${dif ? `<em class="${dif > 0 ? 'sube' : 'baja'}">${dif > 0 ? '+' : '−'}${num(Math.abs(dif))}</em>` : ''}</span>${celdas.join('')}</div>${notas}`;
  }).join('');
  return `<div class="antes" aria-label="Sesiones anteriores">${filas}</div>`;
}

// Cada serie de hoy planta una flor; la de cada id es siempre la misma para que no bailen al repintar.
const FLORES = ['🌸', '🌼', '🌷', '🌺', '🌻', '🪻', '🌹'];
function florDe(id) {
  let n = 0;
  for (const c of String(id)) n = (n * 31 + c.charCodeAt(0)) % 9973;
  return FLORES[n % FLORES.length];
}
function pintarJardin(clase) {
  const hoy = estado.filas.filter((f) => f[F.FECHA] === hoyIso() && f[F.ORIGEN] === 'app');
  if (!hoy.length) return '';
  const nueva = hoy.length > estado.floresVistas;
  estado.floresVistas = hoy.length;
  return `<div class="${clase}" role="img" aria-label="Tu jardín de hoy: ${hoy.length} ${hoy.length === 1 ? 'flor' : 'flores'}">${hoy.map((f, i) => `<span class="${nueva && i === hoy.length - 1 ? 'brota' : ''}">${florDe(f[F.ID])}</span>`).join('')}</div>`;
}

function pintarFoco(r) {
  const s = seriesDe(r);
  const { hechas, completo } = s;
  const b = borradorDe(r);
  const marca = mejorMarca(r.ejercicio);
  const sub = hechas.length ? null : tocaSubir(r);
  const palabra = r.circuito ? 'Vuelta' : 'Serie';
  const mejorSeg = r.medida ? mejorTiempo(r.ejercicio, b.reps) : 0;
  const huecos = Math.max(r.series, Math.max(0, ...hechas.map((f) => f[F.SERIE])), completo ? 0 : s.activa);
  const celdas = [];
  for (let i = 1; i <= huecos; i++) {
    const f = hechas.find((x) => x[F.SERIE] === i);
    if (f && r.medida) celdas.push(`<button type="button" class="ok" data-editar="${esc(f[F.ID])}" aria-label="Corregir vuelta ${i}">${segundosDe(f) ? aTiempo(segundosDe(f)) : 'Sin tiempo'}${notaDe(f) ? ' ✎' : ''}<small>${miles(+f[F.REPS])} m</small></button>`);
    else if (f) celdas.push(`<button type="button" class="ok" data-editar="${esc(f[F.ID])}" aria-label="Corregir ${palabra.toLowerCase()} ${i}${notaDe(f) ? ', tiene nota' : ''}">${f[F.REPS] === '' ? '?' : f[F.REPS]}${notaDe(f) ? ' ✎' : ''}<small>${num(f[F.KG])} kg</small></button>`);
    else if (s.saltos.includes(i)) celdas.push(`<button type="button" class="saltada" data-recuperar="${i}" aria-label="Recuperar ${palabra.toLowerCase()} ${i}">Saltada<small>Recuperar</small></button>`);
    else if (i === s.activa) celdas.push('<button type="button" class="ahora" disabled>Ahora</button>');
    else celdas.push(`<button type="button" data-elegir="${i}">${palabra} ${i}</button>`);
  }
  const discosL = discos(b.kg);
  const ultimaHecha = hechas[hechas.length - 1];
  return `<section class="foco">
    ${pintarCabCircuito(r, ejerciciosDia(estado.dia))}
    <div class="foco-cab">
      <h2 class="gorda">${esc(r.ejercicio)}</h2>
      ${r.circuito ? '' : '<button type="button" class="cambiar" data-accion="cambiar">Cambiar</button>'}
    </div>
    ${bannerTest(r)}
    ${r.ejercicio !== r.original ? `<p class="ultima">Hoy en lugar de ${esc(r.original.toLowerCase())}.</p>` : ''}
    ${pintarAnteriores(r)}
    <div class="bajo-antes">
      <span>${r.medida ? (mejorSeg ? `Tu mejor: ${aTiempo(mejorSeg)} en ${miles(b.reps)} m` : '') : marca.kg ? `Tu récord: ${num(marca.kg)} kg` : ''}</span>
      ${sesionesPrevias(r.ejercicio, 3, terminadoHoy(r)).length > 2 ? `<button type="button" class="ver-mas" data-accion="ver-mas">${estado.verMas ? 'Ver menos' : 'Ver más'}</button>` : ''}
    </div>
    ${pintarDuelo(r, b.kg, b.reps)}
    ${sub ? `<button type="button" class="subir" data-subir="${sub}">Las hiciste todas a ${r.reps} o más. ¿Pruebas con ${num(sub)} kg?</button>` : ''}
    ${completo ? `<p class="ultima" style="color:var(--tinta);margin-top:12px">Ejercicio terminado. Si te queda una más, adelante.</p>` : ''}
    ${r.circuito ? '' : `<div class="barra" aria-hidden="true">
      <div class="lado izq">${discosL.map((c) => `<span class="disco ${c}"></span>`).join('')}</div>
      <div class="centro"></div>
      <div class="lado der">${discosL.map((c) => `<span class="disco ${c}"></span>`).join('')}</div>
    </div>`}
    ${r.medida ? pintarNumerosMedidos(b) : `<div class="numeros">
      <div class="numero"><label for="kg">Kilos</label>
        <input id="kg" inputmode="decimal" value="${num(b.kg)}" autocomplete="off">
        <div class="pasos"><button type="button" data-paso="kg" data-v="${-r.salto}" aria-label="Quitar ${num(r.salto)} kilos">−</button><button type="button" data-paso="kg" data-v="${r.salto}" aria-label="Añadir ${num(r.salto)} kilos">+</button></div>
      </div>
      <div class="numero"><label for="reps">Repes</label>
        <input id="reps" inputmode="numeric" value="${b.reps}" autocomplete="off">
        <div class="pasos"><button type="button" data-paso="reps" data-v="-1" aria-label="Una repetición menos">−</button><button type="button" data-paso="reps" data-v="1" aria-label="Una repetición más">+</button></div>
      </div>
    </div>`}
    <button type="button" class="hecha" data-accion="hecha">${palabra} ${b.serie} hecha</button>
    <div class="series">${celdas.join('')}</div>
    <div class="acciones-serie">
      ${completo ? '' : `<button type="button" class="saltar" data-accion="saltar">Saltar ${palabra.toLowerCase()} ${s.activa}</button>`}
      ${ultimaHecha ? `<button type="button" class="saltar" data-nota="${esc(ultimaHecha[F.ID])}">${notaDe(ultimaHecha) ? 'Ver nota' : 'Añadir nota'} de la ${palabra.toLowerCase()} ${ultimaHecha[F.SERIE]}</button>` : ''}
    </div>
  </section>`;
}

function pasarAlSiguiente(r) {
  const lista = ejerciciosDia(estado.dia);
  if (r.circuito) {
    const toca = siguienteDelCircuito(lista, r);
    if (toca) { estado.ejercicio = toca.ejercicio; return; }
  }
  if (!seriesDe(r).completo) return;
  const sig = lista.find((x) => !seriesDe(x).completo);
  if (sig) estado.ejercicio = sig.ejercicio;
}

function saltarSerie() {
  const r = ejerciciosDia(estado.dia).find((x) => x.ejercicio === estado.ejercicio);
  const plan = planHoy(), clave = `${estado.dia}|${r.ejercicio}`;
  plan.saltos[clave] = (plan.saltos[clave] || []).concat(seriesDe(r).activa);
  guardarPlan();
  delete estado.serieElegida[r.ejercicio];
  pasarAlSiguiente(r);
  pintar();
}

function recuperarSerie(n) {
  const r = ejerciciosDia(estado.dia).find((x) => x.ejercicio === estado.ejercicio);
  const plan = planHoy(), clave = `${estado.dia}|${r.ejercicio}`;
  plan.saltos[clave] = (plan.saltos[clave] || []).filter((x) => x !== n);
  guardarPlan();
  estado.serieElegida[r.ejercicio] = n;
  pintar();
}

function pintarOrden() {
  const lista = ejerciciosDia(estado.dia);
  $('#capa').innerHTML = `<div class="tarjeta sobria" role="dialog" aria-label="Cambiar orden">
    <h2 class="gorda">Orden de hoy</h2>
    <ol class="orden">${lista.map((x, i) => `<li><span>${esc(x.ejercicio)}</span>
      <button type="button" data-mover="${i}" data-v="-1" ${i ? '' : 'disabled'} aria-label="Subir ${esc(x.ejercicio)}">↑</button>
      <button type="button" data-mover="${i}" data-v="1" ${i < lista.length - 1 ? '' : 'disabled'} aria-label="Bajar ${esc(x.ejercicio)}">↓</button></li>`).join('')}</ol>
    <button type="button" class="principal" data-accion="cerrar-orden">Listo</button>
  </div>`;
  $('#capa').hidden = false;
}

function moverEjercicio(i, v) {
  const lista = ejerciciosDia(estado.dia).map((x) => x.original);
  const [e] = lista.splice(i, 1);
  lista.splice(i + v, 0, e);
  planHoy().orden[estado.dia] = lista;
  guardarPlan();
  pintarOrden();
}

// Primero los que se parecen por nombre (peso muerto con peso muerto) y luego los del mismo músculo.
function alternativas(r) {
  const enElDia = new Set(ejerciciosDia(estado.dia).map((x) => x.ejercicio));
  const palabra = r.original.split(' ')[0].toLowerCase();
  const vistos = new Map();
  for (const f of estado.filas) {
    if (f[F.MUSC] !== r.musculo || enElDia.has(f[F.EJ])) continue;
    vistos.set(f[F.EJ], (vistos.get(f[F.EJ]) || 0) + 1);
  }
  return [...vistos.entries()].sort((a, b) => {
    const pa = a[0].toLowerCase().startsWith(palabra) ? 1 : 0, pb = b[0].toLowerCase().startsWith(palabra) ? 1 : 0;
    return pb - pa || b[1] - a[1];
  }).slice(0, 8).map((p) => p[0]);
}

function pintarCambio() {
  const r = ejerciciosDia(estado.dia).find((x) => x.ejercicio === estado.ejercicio);
  $('#capa').innerHTML = `<div class="tarjeta sobria" role="dialog" aria-label="Cambiar ejercicio">
    <h2 class="gorda">Cambiar por</h2>
    <p>Solo para hoy. Lo que apuntes se guarda en el ejercicio que elijas.</p>
    <div class="opciones">
      ${r.ejercicio !== r.original ? `<button type="button" class="volver" data-cambiar="${esc(r.original)}">Volver a ${esc(r.original.toLowerCase())}</button>` : ''}
      ${alternativas(r).map((n) => `<button type="button" data-cambiar="${esc(n)}">${esc(n)}</button>`).join('')}
    </div>
    <input class="nota" id="otro" placeholder="O escribe otro ejercicio" autocomplete="off">
    <button type="button" class="principal" data-accion="cambiar-otro">Usar este</button>
    <button type="button" class="secundario" data-accion="cerrar">Cancelar</button>
  </div>`;
  $('#capa').hidden = false;
}

function cambiarEjercicio(nuevo) {
  const n = nuevo.trim();
  if (!n) return;
  const r = ejerciciosDia(estado.dia).find((x) => x.ejercicio === estado.ejercicio);
  const plan = planHoy(), clave = `${estado.dia}|${r.original}`;
  if (n === r.original) delete plan.cambios[clave]; else plan.cambios[clave] = n;
  guardarPlan();
  estado.ejercicio = n;
  cerrarCapa();
  pintar();
}

const leerNumero = (id, def) => { const v = parseFloat(String($('#' + id).value).replace(',', '.')); return Number.isFinite(v) && v >= 0 ? v : def; };

function serieHecha() {
  const lista = ejerciciosDia(estado.dia);
  const r = lista.find((x) => x.ejercicio === estado.ejercicio);
  const b = borradorDe(r);
  if (r.medida) guardarBorrador();
  const kg = r.medida ? 0 : leerNumero('kg', b.kg), reps = r.medida ? b.reps : leerNumero('reps', b.reps);
  const seg = r.medida ? b.seg : 0;
  const mejorSeg = r.medida ? mejorTiempo(r.ejercicio, reps, hoyIso()) : 0;
  const marca = mejorMarca(r.ejercicio);
  const o = { id: nuevoId(), fecha: hoyIso(), dia: estado.dia, ejercicio: r.ejercicio, musculo: r.musculo, serie: b.serie, reps, kg, nota: componerNota(seg, '') };
  estado.filas.push(aFila(o));
  encolar({ tipo: 'guardar', fila: o });
  const esRecord = SIN_LASTRE[r.ejercicio]
    ? (kg === marca.kg && reps > marca.reps && marca.reps > 0) || (kg > marca.kg && marca.kg > 0)
    : marca.kg > 0 && (kg > marca.kg || (kg === marca.kg && reps > marca.reps));
  delete estado.serieElegida[r.ejercicio];
  const terminado = seriesDe(r).completo;
  const test = r.test && terminado ? resultadoTest(r) : '';
  const rival = rivalDe(r.ejercicio, hoyIso());
  const adelanta = rival && e1rmDe(kg, reps) > rival.valor && !estado.dueloCelebrado[r.ejercicio];
  if (adelanta) estado.dueloCelebrado[r.ejercicio] = true;
  const boton = document.querySelector('[data-accion="hecha"]').getBoundingClientRect();
  // En el circuito se encadenan las estaciones: el descanso llega al acabar la vuelta.
  const finVuelta = r.circuito && vueltaCompleta(lista, b.serie);
  pasarAlSiguiente(r);
  if (!r.circuito || finVuelta) empezarDescanso();
  pedirPantalla();
  pintar();
  flotar(florDe(o.id), boton.left + boton.width / 2, boton.top);
  sonar(esRecord ? 'record' : terminado ? 'ejercicio' : 'serie');
  vibrar(esRecord || terminado ? [18, 50, 28] : 14);
  brotar(document.querySelector(`.series [data-editar="${CSS.escape(o.id)}"]`));
  brotar(document.querySelector('[data-accion="hecha"]'));
  if (esRecord) { celebrar(r.ejercicio, kg, reps, kg > marca.kg); if (test) mostrarCarta(test); return undefined; }
  if (test) { mostrarCarta(test); return undefined; }
  const apuntadas = estado.filas.filter((f) => f[F.ORIGEN] === 'app').length;
  if (seg && mejorSeg && seg < mejorSeg) { decir(`¡Tu mejor tiempo en ${miles(reps)} m! ${aTiempo(seg)}`); lluvia(['🌻', '🌸', '✨'], 24); }
  else if (finVuelta) decir(azar(FRASES.circuito));
  else if (adelanta) decir(azar(FRASES.duelo));
  else if (apuntadas % 50 === 0) { decir(`¡Serie número ${apuntadas} en la app! Tienes un jardín enorme.`); lluvia(['🌻', '🌸', '🌼'], 30); }
  else if (terminado && Math.random() < 0.6) pasearSalchicha(azar(FRASES.salchicha));
  else if (terminado) decir(azar(FRASES.ejercicio));
  else if (Math.random() < 0.15) decir(azar(FRASES.sorpresa));
  return undefined;
}

function celebrar(ej, kg, reps, porPeso) {
  const c = $('#capa');
  c.innerHTML = `<div class="tarjeta" role="dialog" aria-label="Récord nuevo">
    <div class="bicho salta">${svgBicho}</div>
    <h2 class="gorda">¡Récord!</h2>
    <p class="cifra">${kg > 0 ? `${num(kg)} kg` : `${reps} repes`}</p>
    <p>${esc(ej)}${porPeso ? '' : ` a ${reps} repes`}</p>
    <p>${esc(azar(FRASES.record))}</p>
    <p class="cesar">${esc(azar(FRASES.cesar))}</p>
    <button type="button" class="principal" data-accion="cerrar">Seguir entrenando</button>
  </div>`;
  c.hidden = false;
  confeti();
  lluvia(['🌻', '🌻', '🌸', '🌼', '✨', '🐘'], 34);
  pasearSalchicha();
}

// Lo que celebrar al acabar: récords de hoy, frente a la última vez de este día y cuánto ha durado.
const volumenDe = (filas) => filas.reduce((s, f) => s + (+f[F.KG] || 0) * (+f[F.REPS] || 0), 0);
const horaDeId = (id) => (/^a[0-9a-z]{6,}$/.test(String(id)) ? parseInt(String(id).slice(1, -5), 36) : null);
function logrosDeHoy(hoy) {
  const nombres = [...new Set(hoy.map((f) => f[F.EJ]))].filter((n) => !SIN_LASTRE[n] && !ES_MEDIDO.has(n));
  const records = nombres.filter((n) => {
    const mejor = (filas) => Math.max(0, ...filas.map((f) => e1rmDe(+f[F.KG], +f[F.REPS])));
    const antes = mejor(estado.filas.filter((f) => f[F.EJ] === n && f[F.FECHA] < hoyIso()));
    return antes > 0 && mejor(hoy.filter((f) => f[F.EJ] === n)) > antes;
  });
  const dia = String(estado.dia);
  const previas = estado.filas.filter((f) => f[F.FECHA] < hoyIso() && String(f[F.DIA]) === dia && f[F.EJ] !== CAMINADORA);
  const ultima = previas.reduce((m, f) => (f[F.FECHA] > m ? f[F.FECHA] : m), '');
  const antes = ultima ? volumenDe(previas.filter((f) => f[F.FECHA] === ultima)) : 0, ahora = volumenDe(hoy);
  const cambio = antes ? ahora / antes - 1 : null;
  const horas = hoy.map((f) => horaDeId(f[F.ID])).filter(Boolean).sort((a, b) => a - b);
  const minutos = horas.length >= 2 ? Math.round((horas[horas.length - 1] - horas[0]) / 6e4) + 2 : null;
  return { records, ultima, // Solo cuando sube: un entreno a medias no tiene por qué amargar el resumen. Más del doble suele ser que la última vez se apuntó a medias.
    cambio: cambio !== null && cambio >= 0.03 && cambio <= 1 ? cambio : null, minutos: minutos && minutos <= 300 ? minutos : null };
}

function terminar() {
  const hoy = estado.filas.filter((f) => f[F.FECHA] === hoyIso() && f[F.EJ] !== CAMINADORA);
  const total = hoy.reduce((s, f) => s + (+f[F.KG]) * (+f[F.REPS] || 0), 0);
  const metros = hoy.filter((f) => ES_MEDIDO.has(f[F.EJ])).reduce((s, f) => s + (+f[F.REPS] || 0), 0);
  const caminatas = caminatasDeHoy().map(datosCaminata);
  const minCamina = caminatas.reduce((s, c) => s + c.min, 0), kmCamina = caminatas.reduce((s, c) => s + c.km, 0);
  const ejercicios = new Set(hoy.map((f) => f[F.EJ])).size;
  // Un perro salchicha adulto pesa unos 9 kg, y un elefante unos 5.000.
  const salchichas = Math.round(total / 9);
  const elefantes = Math.round(total / 500) / 10;
  const enSalchichas = `unos ${miles(salchichas)} perros salchicha`;
  // Con muy poco peso diría "0 elefantes": ahí solo cuentan los salchichas.
  const equivale = elefantes < 0.1 ? enSalchichas : azar([enSalchichas, `unos ${num(elefantes)} elefantes`, `unos ${num(elefantes)} elefantes o ${miles(salchichas)} perros salchicha`]);
  const semana = entrenosDeEstaSemana();
  const objetivo = objetivoSemanal();
  const ganados = duelosGanadosHoy(hoyIso());
  const logros = logrosDeHoy(hoy);
  const c = $('#capa');
  c.innerHTML = `<div class="tarjeta" role="dialog" aria-label="Entreno terminado">
    <div class="bicho salta">${svgBicho}</div>
    <h2 class="gorda">${esc(azar(FRASES.fin))}</h2>
    <p class="cifra">${total ? `${miles(total)} kg` : `${miles(metros)} m`}</p>
    ${total ? `<p>Eso es lo que has movido hoy: ${equivale}, en ${hoy.length} ${hoy.length === 1 ? 'serie' : 'series'} y ${ejercicios} ${ejercicios === 1 ? 'ejercicio' : 'ejercicios'}.</p>` : ''}
    ${logros.minutos ? `<p>⏱️ ${logros.minutos} minutos de entreno.</p>` : ''}
    ${logros.records.length ? `<p class="logro">🏆 ${logros.records.length === 1 ? `Récord en ${esc(logros.records[0].toLowerCase())}` : `${logros.records.length} récords: ${esc(logros.records.slice(0, 3).join(', ').toLowerCase())}${logros.records.length > 3 ? '…' : ''}`}. ¡Más fuerte que nunca!</p>` : ''}
    ${logros.cambio !== null ? `<p class="logro">📈 Un ${num(Math.round(logros.cambio * 100))} % más de peso movido que la última vez que hiciste este día (${fechaCorta(logros.ultima)}). ¡Subiendo!</p>` : ''}
    ${metros ? `<p>🚣 ${miles(metros)} metros entre remo y esquí.</p>` : ''}
    ${minCamina ? `<p>🚶‍♀️ ${num(minCamina)} min de caminadora, ${textoKm(kmCamina)}.</p>` : ''}
    <button type="button" class="otra" data-accion="caminadora">🚶‍♀️ ${minCamina ? 'Añadir más caminadora' : '¿Has hecho caminadora?'}</button>
    ${pintarJardin('jardin final')}
    <p>🌳 Tu árbol de esta semana ya lleva ${semana} ${semana === 1 ? 'entreno' : 'entrenos'}.</p>
    ${lineaSemanaPique()}
    ${ganados ? `<p>🥊 Has ido por delante de tu yo del pasado en ${ganados} ${ganados === 1 ? 'ejercicio' : 'ejercicios'}.</p>` : ''}
    <p>${semana >= objetivo ? esc(azar(FRASES.semana)) : `Llevas ${semana} de ${objetivo} entrenos esta semana.`}</p>
    <p class="cesar">${esc(azar(FRASES.cesar))}<br>Cesarlópodo</p>
    <button type="button" class="principal" data-accion="cerrar-fin">Hasta la próxima</button>
  </div>`;
  c.hidden = false;
  confeti();
  sonar('fin');
  vibrar([20, 60, 20, 60, 40]);
  lluvia(semana >= objetivo ?['🌻', '🌻', '🌻', '🏅', '🌸'] : ['🌸', '🌼', '🌷', '🌻'], 40);
  pasearSalchicha();
  pararDescanso();
  soltarPantalla();
  comprobarLogros();
}

function entrenosDeEstaSemana() {
  const hoy = new Date(hoyIso()), lunes = new Date(hoy.getTime() - ((hoy.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
  return new Set(estado.filas.filter((f) => f[F.ORIGEN] === 'app' && f[F.EJ] !== CAMINADORA && f[F.FECHA] >= lunes).map((f) => f[F.FECHA])).size;
}

function editarSerie(id, soloNota) {
  const f = estado.filas.find((x) => x[F.ID] === id);
  if (!f) return;
  if (f[F.EJ] === CAMINADORA) { abrirCaminadora(id); return; }
  estado.editando = id;
  const c = $('#capa');
  const seg = segundosDe(f);
  const campos = ES_MEDIDO.has(f[F.EJ])
    ? `<div class="numero"><label for="emetros">Metros</label><input id="emetros" inputmode="numeric" value="${f[F.REPS]}"></div>
      <div class="numero"><label for="etmin">Tiempo</label><div class="reloj"><input id="etmin" inputmode="numeric" value="${Math.floor(seg / 60)}" aria-label="Minutos"><span>:</span><input id="etseg" inputmode="numeric" value="${String(seg % 60).padStart(2, '0')}" aria-label="Segundos"></div></div>`
    : `<div class="numero"><label for="ekg">Kilos</label><input id="ekg" inputmode="decimal" value="${num(f[F.KG])}"></div>
      <div class="numero"><label for="ereps">Repes</label><input id="ereps" inputmode="numeric" value="${f[F.REPS]}"></div>`;
  c.innerHTML = `<div class="tarjeta sobria" role="dialog" aria-label="Corregir serie">
    <h2 class="gorda">${ES_CIRCUITO.has(f[F.EJ]) ? 'Vuelta' : 'Serie'} ${f[F.SERIE]}</h2><p>${esc(f[F.EJ])}</p>
    <div class="numeros">${campos}</div>
    <label class="nota-label" for="enota">Nota (opcional)</label>
    <textarea class="nota" id="enota" rows="2" maxlength="300" placeholder="Tirón en la lumbar, cambio de máquina...">${esc(notaDe(f))}</textarea>
    <button type="button" class="principal" data-accion="guardar-edicion">Guardar cambios</button>
    <button type="button" class="secundario" data-accion="borrar-serie">Borrar serie</button>
    <button type="button" class="secundario" data-accion="cerrar">Cancelar</button>
  </div>`;
  c.hidden = false;
  if (soloNota) $('#enota').focus();
}

function guardarEdicion() {
  const f = estado.filas.find((x) => x[F.ID] === estado.editando);
  if (!f) return cerrarCapa();
  if (ES_MEDIDO.has(f[F.EJ])) {
    f[F.REPS] = leerNumero('emetros', +f[F.REPS] || 0);
    f[F.NOTA] = componerNota(leerTiempo('etmin', 'etseg'), $('#enota').value.trim());
  } else {
    f[F.KG] = leerNumero('ekg', f[F.KG]);
    f[F.REPS] = leerNumero('ereps', +f[F.REPS] || 0);
    f[F.NOTA] = $('#enota').value.trim();
  }
  encolar({ tipo: 'guardar', fila: { id: f[F.ID], fecha: f[F.FECHA], dia: f[F.DIA], ejercicio: f[F.EJ], musculo: f[F.MUSC], serie: f[F.SERIE], reps: f[F.REPS], kg: f[F.KG], nota: f[F.NOTA] } });
  estado.borrador = {};
  cerrarCapa();
  pintar();
}

function borrarSerie() {
  const id = estado.editando;
  estado.filas = estado.filas.filter((x) => x[F.ID] !== id);
  estado.cola = estado.cola.filter((op) => !(op.tipo === 'guardar' && op.fila.id === id));
  encolar({ tipo: 'borrar', id });
  estado.borrador = {};
  cerrarCapa();
  pintar();
}

function cerrarCapa() {
  const c = $('#capa');
  c.hidden = true; c.innerHTML = ''; estado.editando = null;
  const siguiente = estado.cartas.shift();
  if (siguiente) { c.innerHTML = siguiente; c.hidden = false; confeti(); }
}

// Si ya hay una tarjeta abierta, la nueva espera su turno.
function mostrarCarta(html) {
  const c = $('#capa');
  if (!c.hidden) { estado.cartas.push(html); return; }
  c.innerHTML = html; c.hidden = false; confeti();
}


// ---------- Descanso ----------
// Guarda la hora de fin, no una cuenta atrás: si iOS duerme la app, al volver sigue siendo correcta.
function empezarDescanso() {
  estado.descanso = { fin: Date.now() + estado.segundos * 1000, frase: azar(Math.random() < 0.3 ? FRASES.serie : FRASES.descanso), listo: azar(FRASES.listo), aviso: false };
  pintarDescanso();
}
function pararDescanso() { estado.descanso = null; pintarDescanso(); }

function pintarDescanso() {
  const e = $('#descanso');
  const d = estado.descanso;
  if (!d || estado.vista !== 'hoy') { e.hidden = true; return; }
  const resta = Math.ceil((d.fin - Date.now()) / 1000);
  const acabado = resta <= 0;
  const texto = acabado ? '¡Ya!' : `${Math.floor(resta / 60)}:${String(resta % 60).padStart(2, '0')}`;
  if (e.hidden || !e.querySelector('.tiempo')) {
    e.innerHTML = `<span class="tiempo" role="timer"></span><span class="frase"></span>
      <button type="button" data-accion="mas30" aria-label="Sumar 30 segundos">+30</button>
      <button type="button" data-accion="cerrar-descanso">Listo</button>`;
    e.hidden = false;
  }
  e.querySelector('.tiempo').textContent = texto;
  e.querySelector('.frase').textContent = acabado ? d.listo : d.frase;
  e.classList.toggle('acabado', acabado);
  if (acabado && !d.aviso) { d.aviso = true; pitar(); }
}

let audio = null;
function pitar() {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    [0, 0.18, 0.36].forEach((t, i) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.frequency.value = [660, 880, 1175][i];
      g.gain.setValueAtTime(0.18, audio.currentTime + t);
      g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + t + 0.16);
      o.connect(g).connect(audio.destination);
      o.start(audio.currentTime + t);
      o.stop(audio.currentTime + t + 0.17);
    });
  } catch (e) { /* sin sonido no pasa nada: el aviso visual sigue */ }
}

// ---------- Premios pequeños: un tintineo y un toque al apuntar; más largo al acabar un ejercicio o el entreno ----------
const NOTAS = {
  serie: [[880, 0], [1319, 0.07]],
  ejercicio: [[784, 0], [988, 0.08], [1175, 0.16], [1568, 0.25]],
  record: [[880, 0], [1109, 0.08], [1319, 0.16], [1760, 0.26], [2217, 0.36]],
  fin: [[523, 0], [659, 0.13], [784, 0.26], [1047, 0.4], [880, 0.56], [1047, 0.7], [1319, 0.86]]
};
function sonar(tipo) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const ahora = audio.currentTime, largo = tipo === 'fin' ? 0.5 : 0.3;
    NOTAS[tipo].forEach(([f, t]) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, ahora + t);
      g.gain.exponentialRampToValueAtTime(0.13, ahora + t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, ahora + t + largo);
      o.connect(g).connect(audio.destination);
      o.start(ahora + t); o.stop(ahora + t + largo + 0.02);
    });
  } catch (e) { /* con el móvil en silencio queda lo visual */ }
}
const vibrar = (patron) => { try { if (navigator.vibrate) navigator.vibrate(patron); } catch (e) { /* iOS no vibra desde la web */ } };
function brotar(nodo) {
  if (!nodo || SIN_MOVIMIENTO()) return;
  nodo.classList.remove('brota'); void nodo.offsetWidth; nodo.classList.add('brota');
  nodo.addEventListener('animationend', () => nodo.classList.remove('brota'), { once: true });
}

// ---------- Pantalla encendida ----------
let cerrojoPantalla = null;
async function pedirPantalla() {
  try { if ('wakeLock' in navigator && !cerrojoPantalla) { cerrojoPantalla = await navigator.wakeLock.request('screen'); cerrojoPantalla.addEventListener('release', () => { cerrojoPantalla = null; }); } } catch (e) { /* iOS puede negarlo */ }
}
function soltarPantalla() { if (cerrojoPantalla) { cerrojoPantalla.release(); cerrojoPantalla = null; } }

// ---------- Progreso ----------
function historialSemanal(ej) {
  return valoresPorFecha(ej, (f) => (SIN_LASTRE[ej] ? +f[F.REPS] || 0 : +f[F.KG])).filter((p) => p[1] > 0).sort((a, b) => (a[0] < b[0] ? -1 : 1));
}

function resumenes() {
  const orden = ['Glúteos', 'Piernas', 'Femoral', 'Espalda', 'Hombros', 'Brazos', 'Pecho'];
  const porEj = new Map();
  for (const f of estado.filas) {
    let e = porEj.get(f[F.EJ]);
    if (!e) { e = { ej: f[F.EJ], musc: f[F.MUSC], n: 0, ultima: '' }; porEj.set(f[F.EJ], e); }
    e.n++;
    if (f[F.FECHA] > e.ultima) e.ultima = f[F.FECHA];
  }
  const lista = [...porEj.values()];
  lista.forEach((e) => {
    const h = historialSemanal(e.ej);
    e.hist = h;
    if (h.length) {
      const prim = h.slice(0, 3).map((p) => p[1]).sort((a, b) => a - b)[Math.min(1, h.slice(0, 3).length - 1)];
      e.primero = prim;
      e.mejor = Math.max(...h.map((p) => p[1]));
      e.sube = prim > 0 ? e.mejor / prim - 1 : 0;
    }
  });
  // Lo de la rutina sale desde la primera sesión; lo antiguo, solo si tiene historia.
  const conDatos = lista.filter((e) => e.hist.length >= 4 || (e.hist.length && estado.rutina.some((r) => r.ejercicio === e.ej)));
  return { orden: orden.filter((m) => conDatos.some((e) => e.musc === m)), lista: conDatos };
}

function haceUnAno(lista) {
  const hoy = new Date(hoyIso());
  const objetivo = new Date(hoy); objetivo.setFullYear(hoy.getFullYear() - 1);
  const iso = objetivo.toISOString().slice(0, 10);
  const candidatos = lista.filter((e) => estado.rutina.some((r) => r.ejercicio === e.ej) && !SIN_LASTRE[e.ej]).map((e) => {
    const antes = e.hist.filter((p) => p[0] <= iso).slice(-1)[0];
    return antes ? { ej: e.ej, antes: antes[1], ahora: e.hist[e.hist.length - 1][1] } : null;
  // Más del doble en un año suele ser un cambio de máquina o de forma de apuntar, no progreso real.
  }).filter((c) => c && c.ahora > c.antes * 1.04 && c.ahora < c.antes * 2);
  // Además de cada ejercicio, cada músculo frente a otras mujeres: ahí cuenta aunque haya cambiado de máquina.
  const todas = candidatos.map((c) => ({ texto: `Hace un año, en ${esc(c.ej.toLowerCase())}, movías ${num(c.antes)} kg.`, grande: `Ahora mueves ${num(c.ahora)}.` }))
    .concat(ultimoAnoMusculos(PESO_REFERENCIA).filter((m) => m.ahora > m.antes).map((m) => ({ texto: `Hace un año superabas al ${m.antes} % de las mujeres en ${esc(m.nombre.toLowerCase())}.`, grande: `Ahora, al ${m.ahora} %.` })));
  if (!todas.length) return [];
  // Cada día empieza por una distinta; al tocar, la siguiente.
  const desde = Math.floor(hoy.getTime() / 864e5) % todas.length;
  return todas.slice(desde).concat(todas.slice(0, desde));
}
// Las cifras de siempre: desde cuándo entrena y cómo han subido sus tres básicos (1RM estimado: mejor marca y la primera).
function pintarCifras() {
  const todas = estado.filas.filter((f) => f[F.EJ] !== CAMINADORA);
  if (!todas.length) return '';
  const desde = todas.reduce((m, f) => (f[F.FECHA] < m ? f[F.FECHA] : m), hoyIso());
  const enApp = todas.filter((f) => f[F.ORIGEN] === 'app').length;
  const basicos = ['Hip thrust', 'Sentadilla', 'Jalón al pecho'].map((ej) => {
    const h = valoresPorFecha(ej, (f) => e1rmDe(+f[F.KG], +f[F.REPS])).filter((p) => p[1] > 0).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    return h.length ? { ej, primero: h[0][1], mejor: Math.max(...h.map((p) => p[1])) } : null;
  }).filter(Boolean);
  return `<div class="cifras">
    <div><small>Desde</small><b class="gorda">${desde.slice(0, 4)}</b><span>${miles(todas.length)} series, ${miles(enApp)} en la app</span></div>
    ${basicos.map((b) => `<div><small>${esc(b.ej)}</small><b class="gorda">${miles(b.mejor)}</b><span>1RM, desde ${miles(b.primero)} kg</span></div>`).join('')}
  </div>`;
}
// Los grupos que más esperan, de lo entrenado en el último medio año. Al tocar uno se abre su gráfica.
function pintarSinEntrenar(orden) {
  const ultima = new Map();
  for (const f of estado.filas) {
    const m = f[F.MUSC];
    if (!m || m === 'Cardio' || f[F.EJ] === CAMINADORA || f[F.FECHA] > hoyIso()) continue;
    if (!ultima.has(m) || f[F.FECHA] > ultima.get(m)) ultima.set(m, f[F.FECHA]);
  }
  const dias = (iso) => Math.round((new Date(`${hoyIso()}T12:00:00Z`) - new Date(`${iso}T12:00:00Z`)) / 864e5);
  const lista = [...ultima].map(([m, iso]) => ({ m, dias: dias(iso) })).filter((x) => x.dias <= 182).sort((a, b) => b.dias - a.dias).slice(0, 6);
  if (!lista.length) return '';
  const cuando = (d) => (d === 0 ? 'hoy' : d === 1 ? 'ayer' : `hace ${d} días`);
  return `<h2 class="gorda seccion">Lo que más tiempo llevas sin entrenar</h2>
    <div class="sin-entrenar">${lista.map((x) => `<button type="button" class="${x.dias >= 14 ? 'mucho' : x.dias >= 7 ? 'algo' : ''}"${orden.includes(x.m) ? ` data-musculo="${esc(x.m)}" data-ir-grafica="1"` : ' disabled'}><b>${x.dias}</b><span>${esc(x.m)}<small>${cuando(x.dias)}</small></span></button>`).join('')}</div>`;
}
function pintarHace(lista) {
  if (!lista.length) return '';
  const i = (estado.haceVez || 0) % lista.length, h = lista[i];
  return `<button type="button" class="hace" data-accion="hace"${lista.length > 1 ? ' aria-label="Ver otra mejora"' : ''}>${h.texto}<span class="gorda">${h.grande}</span>${lista.length > 1 ? `<small>Toca para ver otra · ${i + 1} de ${lista.length}</small>` : ''}</button>`;
}

function pintarProgreso() {
  const florecidas = estado.filas.filter((f) => f[F.ORIGEN] === 'app').length;
  const m = $('#pantalla');
  const { orden, lista } = resumenes();
  if (!lista.length) { m.innerHTML = '<p>Todavía no hay datos: apunta tu primer entreno y aquí saldrá tu progreso.</p>'; return; }
  const deFuerza = estado.filas.filter((f) => f[F.EJ] !== CAMINADORA);
  const fechas = new Set(deFuerza.map((f) => f[F.FECHA].slice(0, 10)));
  const primeraF = [...fechas].sort()[0];
  const semanas = Math.max(1, Math.round((new Date(hoyIso()) - new Date(primeraF)) / 6048e5));
  const totalKg = estado.filas.reduce((s, f) => s + (+f[F.KG]) * (+f[F.REPS] || 0), 0);
  const conRecord = lista.filter((e) => e.sube > 0).length;
  if (!estado.musculo || !orden.includes(estado.musculo)) estado.musculo = orden[0];
  const delMusculo = lista.filter((e) => e.musc === estado.musculo).sort((a, b) => b.n - a.n);
  const conLineas = musculosDelGrupo(estado.musculo, PESO_REFERENCIA).length > 0;
  if (!estado.grafica || (estado.grafica === '*' ? !conLineas : !delMusculo.some((e) => e.ej === estado.grafica))) estado.grafica = conLineas ? '*' : delMusculo[0].ej;
  const hace = haceUnAno(lista);
  const toneladas = totalKg / 1000;

  m.innerHTML = `
    <div class="portada">
      <h1 class="gorda">Lo fuerte que te has puesto</h1>
      <button class="bicho" type="button" aria-label="Saludar a Marialópoda" data-accion="bicho">${svgBicho}</button>
    </div>
    <p class="datos-vida"><b>${semanas} semanas</b> entrenando, <b>${miles(deFuerza.length)} series</b> apuntadas y más de <b>${miles(toneladas)} toneladas</b> movidas.${florecidas ? ` Y <b>${miles(florecidas)} ${florecidas === 1 ? 'flor plantada' : 'flores plantadas'}</b> en tu jardín 🌻` : ''}</p>
    ${pintarCifras()}
    ${pintarHace(hace)}
    ${pintarSinEntrenar(orden)}
    ${pintarUltimoAno()}
    <h2 class="gorda seccion">Por músculo</h2>
    <div class="chips" role="group" aria-label="Elegir músculo">
      ${orden.map((o) => `<button type="button" data-musculo="${esc(o)}" aria-pressed="${o === estado.musculo}">${esc(o)}</button>`).join('')}
    </div>
    <div class="chips" role="group" aria-label="Elegir ejercicio">
      ${conLineas ? `<button type="button" data-grafica="*" aria-pressed="${estado.grafica === '*'}">Frente a otras</button>` : ''}${delMusculo.map((e) => `<button type="button" data-grafica="${esc(e.ej)}" aria-pressed="${e.ej === estado.grafica}">${esc(e.ej)}</button>`).join('')}
    </div>
    <div class="grafica-caja" id="caja"></div>
    <h2 class="gorda seccion">Mini entreno y caminadora</h2>
    <div id="evolucion"></div>
    <h2 class="gorda seccion">Tu fuerza, músculo a músculo</h2>
    ${pintarCuerpo(PESO_REFERENCIA)}
    <h2 class="gorda seccion">Tus últimas 26 semanas</h2>
    <div class="semanas" id="semanas"></div>
    <p class="pie">Cuanto más claro, más días entrenaste esa semana. Lo anterior a noviembre de 2026 tiene fechas aproximadas: el Excel solo decía "Semana N".</p>
    <h2 class="gorda seccion">Lo que más has subido</h2>
    <ul class="subidas" id="subidas"></ul>
    <h2 class="gorda seccion">Tus notas</h2>
    <div id="notas"></div>`;
  if (estado.grafica === '*') pintarGraficaMusculos(estado.musculo); else pintarGrafica(lista.find((e) => e.ej === estado.grafica));
  dibujarMaria();
  pintarEvolucionCircuito();
  pintarSemanas();
  pintarSubidas(lista, conRecord);
  pintarNotas();
}

function pintarSubidas(lista) {
  const top = lista.filter((e) => !SIN_LASTRE[e.ej] && e.sube > 0).sort((a, b) => b.sube - a.sube).slice(0, 8);
  const max = top.length ? top[0].sube : 1;
  $('#subidas').innerHTML = top.map((e) => `<li><span>${esc(e.ej)}</span><span class="kg">${num(e.primero)} a ${num(e.mejor)} kg</span>
    <span class="tira"><i style="width:${Math.max(6, e.sube / max * 100)}%"></i></span></li>`).join('');
}

function pintarSemanas() {
  const hoy = new Date(hoyIso());
  const dow = (hoy.getUTCDay() + 6) % 7;
  const lunes = new Date(hoy.getTime() - dow * 864e5);
  const cuenta = new Map();
  const dias = new Set(estado.filas.filter((f) => f[F.EJ] !== CAMINADORA).map((f) => f[F.FECHA]));
  dias.forEach((iso) => {
    const d = new Date(iso);
    const n = Math.floor((lunes.getTime() + 6048e5 - d.getTime() - 1) / 6048e5);
    if (n >= 0 && n < 26) cuenta.set(n, (cuenta.get(n) || 0) + 1);
  });
  const celdas = [];
  for (let n = 25; n >= 0; n--) {
    const v = Math.min(4, cuenta.get(n) || 0);
    celdas.push(`<i class="${v ? 'n' + v : ''}" title="${cuenta.get(n) || 0} días"></i>`);
  }
  $('#semanas').innerHTML = celdas.join('');
}

// ---------- Medidas de la evolución ----------
// Tres formas de medir cada sesión. En lo importado del Excel se usan medianas, por las erratas sueltas.
const MEDIDAS = {
  rm: { nombre: '1RM estimado', unidad: 'kg', explica: 'El peso que moverías a una sola repe, estimado con tu mejor serie (fórmula de Epley).' },
  volumen: { nombre: 'Kg × repes', unidad: 'kg·rep', explica: 'Peso medio por repes medias de cada serie: sube tanto si pones más peso como si haces más repes.' },
  medio: { nombre: 'Peso medio', unidad: 'kg', explica: 'La media del peso de todas las series de ese día.' },
  repes: { nombre: 'Repes', unidad: 'repes', explica: 'Repes medias por serie.' }
};
// Los aislados suben sobre todo a base de repes; los básicos, de peso.
const AISLADO = /Abductor|Aductor|Patada|Elevaciones|Face pull|Gemelos|Hiperextensiones|Hombro frontal|Bíceps|Tríceps|Remo al mentón|Extensión de cuádriceps|Curl femoral|Abdominales/;
const medidasDe = (ej) => (SIN_LASTRE[ej] ? ['repes'] : ['rm', 'volumen', 'medio']);
const medidaPorDefecto = (ej) => (SIN_LASTRE[ej] ? 'repes' : AISLADO.test(ej) ? 'volumen' : 'rm');
const medidaDe = (ej) => { const m = (estado.medidas || {})[ej]; return medidasDe(ej).includes(m) ? m : medidaPorDefecto(ej); };
const rmSerie = (kg, reps) => (kg > 0 && reps >= 1 && reps <= 20 ? (reps === 1 ? kg : kg * (1 + reps / 30)) : 0);
const media = (a) => a.reduce((s, v) => s + v, 0) / a.length;

function sesionesMedidas(ej) {
  const porFecha = new Map();
  for (const f of filasDe(ej)) { if (!porFecha.has(f[F.FECHA])) porFecha.set(f[F.FECHA], []); porFecha.get(f[F.FECHA]).push(f); }
  return [...porFecha.keys()].sort().map((fecha) => {
    const fs = porFecha.get(fecha).sort((a, b) => a[F.SERIE] - b[F.SERIE]);
    const app = fs.some((f) => f[F.ORIGEN] === 'app');
    const junta = app ? media : mediana;
    const kgs = fs.map((f) => +f[F.KG]).filter((v) => v > 0);
    const reps = fs.map((f) => +f[F.REPS]).filter((v) => v > 0 && v <= 30);
    const rms = fs.map((f) => rmSerie(+f[F.KG], +f[F.REPS])).filter((v) => v > 0);
    const kg = kgs.length ? junta(kgs) : 0, rp = reps.length ? junta(reps) : 0;
    return { fecha, fs, rm: rms.length ? (app ? Math.max(...rms) : mediana(rms)) : 0, medio: kg, volumen: kg * rp, repes: rp };
  });
}
const redondeo = (v) => (v >= 100 ? Math.round(v) : Math.round(v * 10) / 10);
const resumenSesion = (s) => {
  const reps = s.fs.map((f) => f[F.REPS]).filter((r) => r !== '');
  const kgs = [...new Set(s.fs.map((f) => +f[F.KG]).filter((v) => v > 0))];
  return `${reps.join(' · ')}${reps.length ? ' repes' : ''}${kgs.length ? ` a ${kgs.map(num).join('/')} kg` : ''}`;
};

function pintarGrafica(e) {
  const caja = $('#caja');
  const medida = medidaDe(e.ej), M = MEDIDAS[medida];
  const unidad = M.unidad;
  const sesiones = sesionesMedidas(e.ej).filter((s) => s[medida] > 0);
  if (!sesiones.length) { caja.innerHTML = `<h3 class="gorda">${esc(e.ej)}</h3><p class="res">Sin datos que medir.</p>`; return; }
  const h = sesiones.map((s) => [s.fecha, redondeo(s[medida])]);
  e = { ...e, primero: h.slice(0, 3).map((p) => p[1]).sort((a, b) => a - b)[Math.min(1, h.slice(0, 3).length - 1)], mejor: Math.max(...h.map((p) => p[1])) };
  e.sube = e.primero > 0 ? e.mejor / e.primero - 1 : 0;
  const W = 340, H = 210, pi = 34, pd = 12, ps = 10, pa = 24;
  const t = (iso) => new Date(iso).getTime();
  const x0 = t(h[0][0]), x1 = Math.max(t(h[h.length - 1][0]), x0 + 864e5);
  const vals = h.map((p) => p[1]);
  const techo = Math.max(...vals);
  const paso = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000].find((s) => techo / s <= 5) || 2000;
  const yMax = Math.ceil(techo / paso) * paso;
  const X = (iso) => pi + (t(iso) - x0) / (x1 - x0) * (W - pi - pd);
  const Y = (v) => H - pa - v / yMax * (H - pa - ps);
  // Una línea por semana quedaría serrada: la gráfica une sesiones, y marca los récords con un aro.
  const d = h.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  const rejilla = [];
  for (let v = 0; v <= yMax; v += paso) rejilla.push(`<line x1="${pi}" x2="${W - pd}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--ciruela-2)" stroke-width="1"/><text x="${pi - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`);
  const anios = [];
  for (let a = +h[0][0].slice(0, 4) + 1; a <= +h[h.length - 1][0].slice(0, 4); a++) {
    const px = X(`${a}-01-01`);
    if (px > pi + 16 && px < W - pd - 16) anios.push(`<text x="${px}" y="${H - 6}" text-anchor="middle">${a}</text>`);
  }
  let marca = -1; const aros = [];
  h.forEach((p) => { if (p[1] > marca) { marca = p[1]; aros.push(p); } });
  const ultimos = aros.slice(-1);
  const texto = `<b>De ${num(e.primero)} a ${num(e.mejor)} ${unidad}</b>${e.sube > 0 ? `: +${Math.round(e.sube * 100)} %` : ''}`;
  const opciones = medidasDe(e.ej);
  caja.innerHTML = `<h3 class="gorda">${esc(e.ej)}</h3>
    ${opciones.length > 1 ? `<div class="medidas" role="group" aria-label="Qué medir">${opciones.map((m) => `<button type="button" data-medida="${m}" aria-pressed="${m === medida}">${MEDIDAS[m].nombre}</button>`).join('')}</div>` : ''}
    <p class="res" id="res">${texto}</p>
    <div class="grafica" id="graf"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(e.ej)}: de ${num(e.primero)} a ${num(e.mejor)} ${unidad}">
      ${rejilla.join('')}${anios.join('')}
      <path d="${d}" fill="none" stroke="var(--chicle)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
      ${ultimos.map((p) => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="5" fill="var(--amarillo)" stroke="var(--ciruela)" stroke-width="2"/>`).join('')}
      <line id="guia" y1="${ps}" y2="${H - pa}" stroke="var(--tinta-2)" stroke-width="1" visibility="hidden"/>
      <circle id="punto" r="5" fill="var(--tinta)" stroke="var(--ciruela)" stroke-width="2" visibility="hidden"/>
    </svg></div>
    <p class="pie medida-pie">${esc(M.explica)}</p>
    <details class="sesiones"><summary>Ver las últimas sesiones</summary><table>${sesiones.slice(-10).reverse().map((s) => `<tr><td>${fechaCorta(s.fecha)}</td><td class="detalle">${esc(resumenSesion(s))}</td><td>${num(redondeo(s[medida]))} ${unidad}</td></tr>`).join('')}</table></details>`;
  const graf = $('#graf'), guia = $('#guia'), punto = $('#punto'), res = $('#res');
  const mover = (ev) => {
    const r = graf.getBoundingClientRect();
    const px = (ev.clientX - r.left) / r.width * W;
    let mejor = h[0], dist = Infinity;
    for (const p of h) { const dd = Math.abs(X(p[0]) - px); if (dd < dist) { dist = dd; mejor = p; } }
    guia.setAttribute('x1', X(mejor[0])); guia.setAttribute('x2', X(mejor[0])); guia.setAttribute('visibility', 'visible');
    punto.setAttribute('cx', X(mejor[0])); punto.setAttribute('cy', Y(mejor[1])); punto.setAttribute('visibility', 'visible');
    res.innerHTML = `<b>${num(mejor[1])} ${unidad}</b>, ${fechaCorta(mejor[0])}`;
  };
  const salir = () => { guia.setAttribute('visibility', 'hidden'); punto.setAttribute('visibility', 'hidden'); res.innerHTML = texto; };
  graf.addEventListener('pointerdown', mover);
  graf.addEventListener('pointermove', mover);
  graf.addEventListener('pointerleave', salir);
  graf.addEventListener('pointerup', (ev) => { if (ev.pointerType !== 'mouse') salir(); });
  graf.addEventListener('pointercancel', salir);
}

// ---------- Confeti de discos ----------
function confeti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = $('#confeti'), g = c.getContext('2d');
  const dpr = devicePixelRatio || 1;
  c.width = innerWidth * dpr; c.height = innerHeight * dpr;
  const colores = ['#E5344B', '#2F6BFF', '#FFC531', '#22B573', '#F5EFF7', '#FF7DB0'];
  const piezas = Array.from({ length: 70 }, () => ({
    x: Math.random() * innerWidth, y: -20 - Math.random() * innerHeight * .6, r: 5 + Math.random() * 8,
    vy: 2.2 + Math.random() * 3, vx: -1 + Math.random() * 2, c: azar(colores), f: Math.random() * 6.28
  }));
  const fin = performance.now() + 2600;
  (function frame(ahora) {
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, innerWidth, innerHeight);
    if (ahora > fin) return;
    piezas.forEach((p) => {
      p.y += p.vy; p.x += p.vx + Math.sin(p.f += .08) * .6;
      g.fillStyle = p.c;
      g.beginPath(); g.ellipse(p.x, p.y, p.r, p.r * Math.abs(Math.cos(p.f)) + 1, 0, 0, 6.29); g.fill();
      g.fillStyle = 'rgba(43,16,51,.55)';
      g.beginPath(); g.ellipse(p.x, p.y, p.r * .3, p.r * .3 * Math.abs(Math.cos(p.f)) + .3, 0, 0, 6.29); g.fill();
    });
    requestAnimationFrame(frame);
  })(performance.now());
}

// ---------- Sorpresas ----------
const SIN_MOVIMIENTO = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

// Emojis cayendo por encima de todo; no interfieren con los toques.
function lluvia(emojis, cuantos) {
  if (SIN_MOVIMIENTO()) return;
  for (let i = 0; i < cuantos; i++) {
    const e = document.createElement('span');
    e.className = 'cae';
    e.textContent = azar(emojis);
    e.style.left = `${Math.random() * 96}%`;
    e.style.fontSize = `${18 + Math.random() * 18}px`;
    e.style.animationDuration = `${2.2 + Math.random() * 1.8}s`;
    e.style.animationDelay = `${Math.random() * 0.9}s`;
    e.addEventListener('animationend', () => e.remove());
    document.body.appendChild(e);
  }
}

function flotar(emoji, x, y) {
  if (SIN_MOVIMIENTO()) return;
  const e = document.createElement('span');
  e.className = 'flota';
  e.textContent = emoji;
  e.style.left = `${x}px`;
  e.style.top = `${y}px`;
  e.addEventListener('animationend', () => e.remove());
  document.body.appendChild(e);
}

let temporizadorDecir = null;
function decir(texto) {
  let b = document.getElementById('bocadillo');
  if (!b) { b = document.createElement('div'); b.id = 'bocadillo'; b.setAttribute('role', 'status'); document.body.appendChild(b); }
  b.textContent = texto;
  b.classList.remove('sale'); void b.offsetWidth; b.classList.add('sale');
  clearTimeout(temporizadorDecir);
  temporizadorDecir = setTimeout(() => b.classList.remove('sale'), 3600);
}

const SVG_SALCHICHA = `<svg viewBox="0 0 124 50" aria-hidden="true"><path d="M24 23 L10 12" stroke="#9A5A2B" stroke-width="5" stroke-linecap="round"/><g class="pata a"><rect x="30" y="32" width="6" height="14" rx="3" fill="#7C4520"/></g><g class="pata b"><rect x="42" y="32" width="6" height="14" rx="3" fill="#6E3B1A"/></g><g class="pata b"><rect x="74" y="32" width="6" height="14" rx="3" fill="#7C4520"/></g><g class="pata a"><rect x="85" y="32" width="6" height="14" rx="3" fill="#6E3B1A"/></g><rect x="22" y="18" width="72" height="18" rx="9" fill="#9A5A2B"/><rect x="86" y="18" width="5" height="17" rx="2" fill="#FF7DB0"/><circle cx="100" cy="17" r="12" fill="#9A5A2B"/><ellipse cx="113" cy="21" rx="9" ry="6" fill="#9A5A2B"/><circle cx="121" cy="19" r="2.6" fill="#2B1033"/><ellipse cx="94" cy="20" rx="5" ry="11" fill="#6E3B1A"/><circle cx="104" cy="14" r="2" fill="#2B1033"/><text x="97" y="9" font-size="13">🌻</text></svg>`;
function pasearSalchicha(texto) {
  if (texto) decir(texto);
  if (SIN_MOVIMIENTO() || document.querySelector('.salchicha')) return;
  const d = document.createElement('div');
  d.className = 'salchicha';
  // A veces el que pasa es un elefante.
  d.innerHTML = Math.random() < 0.35 ? '<span class="elefante">🐘</span>' : SVG_SALCHICHA;
  d.addEventListener('animationend', (ev) => { if (ev.target === d) d.remove(); });
  document.body.appendChild(d);
}

// ---------- Bienvenida ----------
function pintarBienvenida() {
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  $('#menu').hidden = true;
  $('#pantalla').innerHTML = `<div class="bienvenida">
    <div class="bicho">${svgBicho}</div>
    <h1 class="gorda">Hola, Marialópoda</h1>
    <p>Aquí vas a apuntar tus pesos, la más linda y la más fuerte.</p>
    ${standalone ? '' : `<ol><li>Toca el botón de compartir de Safari.</li><li>Elige "Añadir a pantalla de inicio".</li><li>Abre la app desde el icono nuevo y pega ahí tu código.</li></ol>`}
    <label for="cod">Tu código (te lo da Cesarlópodo)</label>
    <textarea id="cod" autocomplete="off" autocapitalize="off" spellcheck="false"></textarea>
    ${estado.errorClave ? '<p class="error">Ese código no funciona. Pídele a Cesarlópodo uno nuevo.</p>' : ''}
    <button type="button" class="hecha" data-accion="emparejar">Entrar</button>
  </div>`;
}

async function emparejar() {
  const v = $('#cod').value.trim();
  if (!/^https?:\/\/.+#.+/.test(v)) { estado.errorClave = true; return pintarBienvenida(); }
  estado.codigo = v;
  guardar('codigo', v);
  const boton = document.querySelector('[data-accion="emparejar"]');
  boton.textContent = 'Entrando…'; boton.disabled = true;
  try {
    await descargar();
  } catch (e) {
    estado.errorClave = true;
  }
  if (estado.errorClave) { estado.codigo = null; guardar('codigo', null); return pintarBienvenida(); }
  arrancar();
}

// ---------- Pintado y eventos ----------
function pintar() {
  document.querySelectorAll('#menu button').forEach((b) => {
    if (b.dataset.ver === estado.vista) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
  });
  pararBosque(); pararVida(); pararOruga();
  svgBicho = vestirBicho(svgBase, nivelDe(datosMundo(estado.filas).entrenos).nivel, ES_CUMPLE(hoyIso()));
  if (estado.vista === 'hoy') pintarHoy();
  else if (estado.vista === 'mundo') pintarMundo(objetivoSemanal());
  else pintarProgreso();
  pintarDescanso();
  pintarPendiente();
}

function guardarBorrador() {
  const b = estado.borrador[estado.ejercicio];
  if (b && $('#metros')) { b.reps = leerNumero('metros', b.reps); b.seg = leerTiempo('tmin', 'tseg'); return; }
  if (!b || !$('#kg')) return;
  b.kg = leerNumero('kg', b.kg); b.reps = leerNumero('reps', b.reps);
}

function saludarBicho(el) {
  el.classList.remove('salta'); void el.offsetWidth; el.classList.add('salta');
  const caja = el.getBoundingClientRect();
  flotar(azar(['💗', '🌸', '🌻', '🌼']), caja.left + caja.width / 2, caja.top + 8);
  estado.toquesBicho++;
  // Quien insiste encuentra el jardín secreto.
  const secreto = estado.toquesBicho % 7 === 0;
  if (secreto) { lluvia(['🌻', '🌸', '🌼', '🌷', '💗'], 45); pasearSalchicha(); }
  const texto = secreto ? azar(FRASES.secreto) : Math.random() < 0.25 ? azar(FRASES.cesar) : azar(FRASES.bicho);
  const s = document.querySelector('.saludo') || document.querySelector('.datos-vida');
  if (s) s.textContent = texto; else decir(texto);
  if (document.querySelector('.saludo')) estado.saludo = texto;
  if (el.classList.contains('escenario')) reaccionOruga();
}

// El bosque se toca con eventos de puntero: en Safari un toque sobre un dibujo que se mueve no siempre acaba en clic.
let toqueBosque = null;
document.addEventListener('pointerdown', (ev) => {
  toqueBosque = ev.target.closest && ev.target.closest('svg.bosque') ? { x: ev.clientX, y: ev.clientY, t: Date.now() } : null;
});
document.addEventListener('pointerup', (ev) => {
  const inicio = toqueBosque, svgB = inicio && document.querySelector('svg.bosque');
  toqueBosque = null;
  // Si el dedo se ha movido, estaba desplazando la pantalla.
  if (!svgB || Math.hypot(ev.clientX - inicio.x, ev.clientY - inicio.y) > 10 || Date.now() - inicio.t > 700) return;
  const bajo = document.elementFromPoint(ev.clientX, ev.clientY);
  const arbol = bajo && bajo.closest && bajo.closest('[data-semana]');
  if (tocarBosque(ev, svgB, arbol)) return;
  if (arbol) decir(`Semana del ${fechaCorta(arbol.dataset.semana)}: ${arbol.dataset.n} ${arbol.dataset.n === '1' ? 'entreno' : 'entrenos'}`);
});

document.addEventListener('click', (ev) => {
  const t = ev.target.closest('button');
  if (!t) return;
  if (t.dataset.ver) { guardarBorrador(); estado.vista = t.dataset.ver; $('#pantalla').scrollTo(0, 0); return pintar(); }
  if (t.dataset.dia) { guardarBorrador(); estado.dia = +t.dataset.dia; estado.ejercicio = null; return pintar(); }
  if (t.dataset.ej) { guardarBorrador(); estado.ejercicio = t.dataset.ej; $('#pantalla').scrollTo({ top: 0, behavior: 'smooth' }); return pintar(); }
  if (t.dataset.musculo) {
    estado.musculo = t.dataset.musculo; estado.grafica = null; pintar();
    if (t.dataset.irGrafica) $('#caja')?.scrollIntoView({ behavior: SIN_MOVIMIENTO() ? 'auto' : 'smooth', block: 'center' });
    return undefined;
  }
  if (t.dataset.grafica) { estado.grafica = t.dataset.grafica; return pintar(); }
  if (t.dataset.medida) { estado.medidas = { ...(estado.medidas || {}), [estado.grafica]: t.dataset.medida }; guardar('medidas', estado.medidas); return pintarGrafica(resumenes().lista.find((x) => x.ej === estado.grafica)); }
  if (t.dataset.musculoMapa) return mostrarMusculo(t.dataset.musculoMapa);
  if (t.dataset.editar) return editarSerie(t.dataset.editar);
  if (t.dataset.nota) return editarSerie(t.dataset.nota, true);
  if (t.dataset.elegir) { guardarBorrador(); estado.serieElegida[estado.ejercicio] = +t.dataset.elegir; return pintar(); }
  if (t.dataset.recuperar) return recuperarSerie(+t.dataset.recuperar);
  if (t.dataset.mover) return moverEjercicio(+t.dataset.mover, +t.dataset.v);
  if (t.dataset.cambiar) return cambiarEjercicio(t.dataset.cambiar);
  if (t.dataset.subir) { estado.borrador[estado.ejercicio].kg = +t.dataset.subir; return pintar(); }
  if (t.dataset.evolucion) { estado.evolucion = t.dataset.evolucion; return pintarEvolucionCircuito(); }
  if (t.dataset.caminata) return abrirCaminadora(t.dataset.caminata);
  if (t.dataset.test) return empezarTest(t.dataset.test);
  if (t.dataset.cam) return pasoCaminadora(t.dataset.cam, +t.dataset.v);
  if (t.dataset.pasoMedida) {
    guardarBorrador();
    const b = estado.borrador[estado.ejercicio], clave = t.dataset.pasoMedida === 'metros' ? 'reps' : 'seg';
    b[clave] = Math.max(0, b[clave] + +t.dataset.v);
    return pintar();
  }
  if (t.dataset.paso) {
    const v = +t.dataset.v, id = t.dataset.paso;
    const b = estado.borrador[estado.ejercicio];
    const actual = leerNumero(id, b[id]);
    b[id] = Math.max(0, Math.round((actual + v) * 100) / 100);
    if (id === 'kg') b.reps = leerNumero('reps', b.reps); else b.kg = leerNumero('kg', b.kg);
    return pintar();
  }
  switch (t.dataset.accion) {
    case 'hecha': return serieHecha();
    case 'hace': { estado.haceVez = (estado.haceVez || 0) + 1; const el = document.querySelector('.hace'); if (el) el.outerHTML = pintarHace(haceUnAno(resumenes().lista)); return undefined; }
    case 'pique': estado.piqueVez = (estado.piqueVez || 0) + 1; return pintar();
    case 'tests': return abrirTests();
    case 'circuito': planHoy().circuito = true; guardarPlan(); estado.ejercicio = null; return pintar();
    case 'sin-circuito': planHoy().circuito = false; guardarPlan(); estado.ejercicio = null; return pintar();
    case 'caminadora': return abrirCaminadora();
    case 'guardar-caminadora': return guardarCaminadora();
    case 'saltar': guardarBorrador(); return saltarSerie();
    case 'ordenar': guardarBorrador(); return pintarOrden();
    case 'cerrar-orden': cerrarCapa(); estado.ejercicio = null; return pintar();
    case 'cambiar': guardarBorrador(); return pintarCambio();
    case 'cambiar-otro': return cambiarEjercicio($('#otro').value);
    case 'ver-mas': guardarBorrador(); estado.verMas = !estado.verMas; return pintar();
    case 'bosque-play': return reproducirBosque();
    case 'ver-notas': estado.todasNotas = !estado.todasNotas; return pintarNotas();
    case 'terminar': return terminar();
    case 'cerrar': cerrarCapa(); return undefined;
    case 'cerrar-fin': cerrarCapa(); estado.ejercicio = null; estado.saludo = null; return pintar();
    case 'guardar-edicion': return guardarEdicion();
    case 'borrar-serie': return borrarSerie();
    case 'mas30': if (estado.descanso) { estado.descanso.fin = Math.max(estado.descanso.fin, Date.now()) + 30000; estado.descanso.aviso = false; pintarDescanso(); } return undefined;
    case 'cerrar-descanso': return pararDescanso();
    case 'emparejar': return emparejar();
    case 'bicho': return saludarBicho(t);
    default: return undefined;
  }
});

// Un toque en la cifra selecciona todo para sobrescribirla directamente.
// Mover la barra del tiempo del bosque detiene la reproducción y lleva a esa semana.
document.addEventListener('input', (ev) => {
  if (['cinc', 'cvel', 'cmin'].includes(ev.target.id)) return actualizarKmCaminadora();
  if (ev.target.id !== 'tiempo-bosque') return undefined;
  pararBosque();
  verBosqueEn(+ev.target.value);
  return undefined;
});

document.addEventListener('focusin', (ev) => { if (ev.target.matches('.numero input')) ev.target.select(); });

// Al cerrarse el teclado, iOS puede dejar la página desplazada: se devuelve a su sitio.
document.addEventListener('focusout', () => setTimeout(() => window.scrollTo(0, 0), 60));

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible') return;
  pintarDescanso();
  if (estado.descanso) pedirPantalla();
  subirCola();
});
window.addEventListener('online', subirCola);
setInterval(() => { if (estado.descanso) pintarDescanso(); }, 500);
setInterval(subirCola, 30000);

async function arrancar() {
  $('#menu').hidden = false;
  pintar();
  try {
    await subirCola();
    const ok = await descargar();
    if (estado.errorClave) { estado.codigo = null; guardar('codigo', null); return pintarBienvenida(); }
    if (ok) { guardarBorrador(); const activo = document.activeElement; if (!activo || !activo.matches('input, textarea')) pintar(); comprobarLogros(); traerPique(); }
  } catch (e) { /* sin red: se usa lo guardado */ }
  return undefined;
}

(async function inicio() {
  try { svgBase = await (await fetch('icons/mascota.svg')).text(); } catch (e) { svgBase = ''; }
  svgBicho = svgBase;
  // Cuando llega una versión nueva, se carga sola una vez.
  let recargada = false;
  if ('serviceWorker' in navigator) navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recargada && navigator.serviceWorker.controller) { recargada = true; location.reload(); } });
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.search.includes('sw'))) navigator.serviceWorker.register('sw.js').catch(() => {});
  if (estado.codigo) arrancar(); else pintarBienvenida();
})();
