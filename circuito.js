'use strict';
// El mini entreno de los días de descanso, la caminadora y su evolución.
// Se guarda en las mismas columnas de Registro, con Kg a 0 para no sumar toneladas:
//   Remo y Esquí: Reps = metros, Nota = "Tiempo 1:32" (con "1:32" a secas, el Sheet lo convertiría en una hora).
//   Caminadora: Reps = minutos, Nota = "5,5 km/h, 0°".

const CAMINADORA = 'Caminadora';
const CAMINADORA_DEFECTO = { inc: 0, vel: 5.5, min: 20 };
const METROS_DEFECTO = 300;
const CIRCUITO = [
  { ejercicio: 'Lanzar la pelota', icono: '🏐', musculo: 'Cardio', series: 3, reps: 20, kg: 3, salto: 1, circuito: true },
  { ejercicio: 'Remo', icono: '🚣', musculo: 'Cardio', series: 3, reps: METROS_DEFECTO, kg: 0, salto: 0, medida: 'metros', circuito: true },
  { ejercicio: 'Sentadilla con mancuernas', icono: '🏋️', musculo: 'Piernas', series: 3, reps: 20, kg: 4, salto: 1, circuito: true },
  { ejercicio: 'Esquí', icono: '⛷️', musculo: 'Cardio', series: 3, reps: METROS_DEFECTO, kg: 0, salto: 0, medida: 'metros', circuito: true },
  { ejercicio: 'Abdominales de pie en polea con cuerda', icono: '🔥', musculo: 'Abdomen', series: 4, reps: 15, kg: 0, salto: 2.5, final: true }
].map((x, i) => ({ ...x, orden: i + 1, nombre: 'Mini entreno' }));
const ES_CIRCUITO = new Set(CIRCUITO.map((x) => x.ejercicio));
const ES_MEDIDO = new Set(CIRCUITO.filter((x) => x.medida).map((x) => x.ejercicio));

// ---------- Medidas guardadas en la nota ----------
const aTiempo = (s) => { const t = Math.round(s); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const segundosDe = (f) => { const m = /^Tiempo (\d+):(\d\d)/.exec(String(f[F.NOTA] || '')); return m ? +m[1] * 60 + +m[2] : 0; };
const componerNota = (seg, nota) => [seg ? `Tiempo ${aTiempo(seg)}` : '', nota].filter(Boolean).join(' · ');
const decimal = (s) => parseFloat(String(s).replace(',', '.'));

// Lo que ha escrito ella, sin las medidas que comparten columna.
function notaDe(f) {
  const n = String(f[F.NOTA] || '');
  if (f[F.EJ] === CAMINADORA) return '';
  return ES_MEDIDO.has(f[F.EJ]) ? n.replace(/^Tiempo \d+:\d\d(?: · )?/, '') : n;
}

function datosCaminata(f) {
  const m = /^([\d.,]+) km\/h, ([\d.,]+)°/.exec(String(f[F.NOTA] || ''));
  const vel = m ? decimal(m[1]) : CAMINADORA_DEFECTO.vel, inc = m ? decimal(m[2]) : CAMINADORA_DEFECTO.inc, min = +f[F.REPS] || 0;
  return { vel, inc, min, km: vel * min / 60 };
}
const textoKm = (km) => `${num(Math.round(km * 100) / 100)} km`;
const caminatasDeHoy = () => estado.filas.filter((f) => f[F.EJ] === CAMINADORA && f[F.FECHA] === hoyIso());

// El mejor tiempo solo se compara con la misma distancia.
function mejorTiempo(ej, metros, antesDe) {
  const l = filasDe(ej).filter((f) => +f[F.REPS] === metros && (!antesDe || f[F.FECHA] < antesDe)).map(segundosDe).filter(Boolean);
  return l.length ? Math.min(...l) : 0;
}

// ---------- El circuito ----------
const hayCircuitoHoy = (d) => estado.filas.some((f) => f[F.FECHA] === hoyIso() && f[F.DIA] === d && ES_CIRCUITO.has(f[F.EJ]));
const circuitoActivo = (d) => !!planHoy().circuito || hayCircuitoHoy(d);
const hechasDe = (r) => r.series - seriesDe(r).libres.length;

// Toca la estación con menos vueltas; si empatan, la siguiente a la que acaba de hacer.
function siguienteDelCircuito(lista, actual) {
  const todas = lista.filter((x) => x.circuito);
  const libres = todas.filter((x) => !seriesDe(x).completo);
  if (!libres.length) return null;
  const minimo = Math.min(...libres.map(hechasDe));
  const i = actual ? todas.findIndex((x) => x.ejercicio === actual.ejercicio) : -1;
  for (let k = 1; k <= todas.length; k++) {
    const x = todas[(i + k + todas.length) % todas.length];
    if (libres.includes(x) && hechasDe(x) === minimo) return x;
  }
  return libres[0];
}

function vueltaCompleta(lista, vuelta) {
  return lista.filter((x) => x.circuito).every((x) => !seriesDe(x).libres.some((n) => n <= vuelta));
}

function pintarCabCircuito(r, lista) {
  if (r.final) return '<div class="circuito-cab"><span class="gorda">Para acabar</span><span>Circuito hecho. Ya solo queda esto.</span></div>';
  if (!r.circuito) return '';
  const est = lista.filter((x) => x.circuito);
  const vuelta = Math.min(est[0].series, Math.min(...est.map(hechasDe)) + 1);
  return `<div class="circuito-cab"><span class="gorda">Vuelta ${vuelta} de ${est[0].series}</span>
    <ol class="estaciones" aria-label="Estaciones de esta vuelta">${est.map((x) => `<li class="${x.ejercicio === r.ejercicio ? 'ahora' : hechasDe(x) >= vuelta ? 'ok' : ''}" aria-label="${esc(x.ejercicio)}">${x.icono}</li>`).join('')}</ol></div>`;
}

function pintarNumerosMedidos(b) {
  return `<div class="numeros">
    <div class="numero"><label for="metros">Metros</label>
      <input id="metros" inputmode="numeric" value="${b.reps}" autocomplete="off">
      <div class="pasos"><button type="button" data-paso-medida="metros" data-v="-50" aria-label="50 metros menos">−</button><button type="button" data-paso-medida="metros" data-v="50" aria-label="50 metros más">+</button></div>
    </div>
    <div class="numero"><label for="tmin">Tiempo</label>
      <div class="reloj"><input id="tmin" inputmode="numeric" value="${Math.floor(b.seg / 60)}" aria-label="Minutos" autocomplete="off"><span>:</span><input id="tseg" inputmode="numeric" value="${String(b.seg % 60).padStart(2, '0')}" aria-label="Segundos" autocomplete="off"></div>
      <div class="pasos"><button type="button" data-paso-medida="seg" data-v="-5" aria-label="5 segundos menos">−</button><button type="button" data-paso-medida="seg" data-v="5" aria-label="5 segundos más">+</button></div>
    </div>
  </div>`;
}
const leerTiempo = (min, seg) => Math.round(leerNumero(min, 0) * 60 + leerNumero(seg, 0));

// Las sesiones anteriores de remo y esquí: cada celda se rellena según lo rápido que fue.
function pintarAnterioresMedidos(r) {
  const cuantas = estado.verMas ? 6 : 2;
  const todas = sesionesPrevias(r.ejercicio, 7);
  if (!todas.length) return '<p class="ultima">Primera vez. Apunta los metros y el tiempo que marque la máquina.</p>';
  const visibles = todas.slice(0, cuantas);
  const ritmo = (f) => { const s = segundosDe(f); return s ? +f[F.REPS] / s : 0; };
  const techo = Math.max(...visibles.flatMap((s) => s.series.map(ritmo)), 0.001);
  const columnas = Math.max(r.series, ...visibles.map((s) => s.series.length));
  return `<div class="antes" aria-label="Sesiones anteriores">${visibles.map((s, i) => {
    const celdas = [];
    for (let c = 0; c < columnas; c++) {
      const f = s.series[c];
      celdas.push(f ? `<span class="celda" style="--h:${Math.round(ritmo(f) / techo * 100)}%"><b>${segundosDe(f) ? aTiempo(segundosDe(f)) : '–'}</b><small>${miles(+f[F.REPS])} m</small></span>` : '<span class="celda vacia"></span>');
    }
    const mejor = (x) => { const l = x.series.map(segundosDe).filter(Boolean); return l.length ? Math.min(...l) : 0; };
    const previa = todas[i + 1], ahora = mejor(s), antes = previa ? mejor(previa) : 0;
    const dif = ahora && antes && s.series[0][F.REPS] === previa.series[0][F.REPS] ? ahora - antes : 0;
    return `<div class="fila-antes ${i ? '' : 'reciente'}" style="--cols:${columnas}"><span class="fecha">${fechaCorta(s.fecha).slice(0, -3)}${dif ? `<em class="${dif < 0 ? 'sube' : 'baja'}">${dif < 0 ? '−' : '+'}${Math.abs(dif)} s</em>` : ''}</span>${celdas.join('')}</div>`;
  }).join('')}</div>`;
}

// ---------- La caminadora ----------
function pintarCaminadoraHoy() {
  const hoy = caminatasDeHoy();
  return `<section class="camina">
    <div class="camina-cab"><h2 class="gorda">🚶‍♀️ Caminadora</h2><button type="button" data-accion="caminadora">${hoy.length ? 'Añadir' : 'Apuntar'}</button></div>
    ${hoy.length ? hoy.map((f) => { const c = datosCaminata(f); return `<button type="button" class="caminata" data-caminata="${esc(f[F.ID])}"><b>${num(c.min)} min</b><span>${num(c.vel)} km/h, ${num(c.inc)}°, ${textoKm(c.km)}</span></button>`; }).join('') : '<p>¿Has hecho un rato de cinta? Apúntalo aquí, en cualquier día.</p>'}
  </section>`;
}

function campoCaminadora(id, etiqueta, valor, paso) {
  return `<div class="numero"><label for="${id}">${etiqueta}</label><input id="${id}" inputmode="decimal" value="${num(valor)}" autocomplete="off">
    <div class="pasos"><button type="button" data-cam="${id}" data-v="${-paso}" aria-label="Bajar ${etiqueta.toLowerCase()}">−</button><button type="button" data-cam="${id}" data-v="${paso}" aria-label="Subir ${etiqueta.toLowerCase()}">+</button></div></div>`;
}

function abrirCaminadora(id) {
  const f = id ? estado.filas.find((x) => x[F.ID] === id) : null;
  const v = f ? datosCaminata(f) : CAMINADORA_DEFECTO;
  guardarBorrador();
  estado.editando = f ? id : null;
  const c = $('#capa');
  c.innerHTML = `<div class="tarjeta sobria" role="dialog" aria-label="Caminadora">
    <h2 class="gorda">🚶‍♀️ Caminadora</h2>
    <div class="numeros tres">${campoCaminadora('cinc', 'Inclinación', v.inc, 0.5)}${campoCaminadora('cvel', 'km/h', v.vel, 0.5)}${campoCaminadora('cmin', 'Minutos', v.min, 5)}</div>
    <p class="camina-km" id="camina-km"></p>
    <button type="button" class="principal" data-accion="guardar-caminadora">${f ? 'Guardar cambios' : 'Apuntar caminadora'}</button>
    ${f ? '<button type="button" class="secundario" data-accion="borrar-serie">Borrar</button>' : ''}
    <button type="button" class="secundario" data-accion="cerrar">Cancelar</button>
  </div>`;
  c.hidden = false;
  actualizarKmCaminadora();
}

function actualizarKmCaminadora() {
  const e = $('#camina-km');
  if (e) e.textContent = `Son unos ${textoKm(leerNumero('cvel', 0) * leerNumero('cmin', 0) / 60)}`;
}

function pasoCaminadora(id, v) {
  const e = $('#' + id);
  e.value = num(Math.max(0, Math.round((leerNumero(id, 0) + v) * 10) / 10));
  actualizarKmCaminadora();
}

function guardarCaminadora() {
  const min = leerNumero('cmin', 0), vel = leerNumero('cvel', 0), inc = leerNumero('cinc', 0);
  if (!min) { $('#cmin').focus(); return; }
  const nota = `${num(vel)} km/h, ${num(inc)}°`;
  const f = estado.filas.find((x) => x[F.ID] === estado.editando);
  let o;
  if (f) {
    f[F.REPS] = min; f[F.NOTA] = nota;
    o = { id: f[F.ID], fecha: f[F.FECHA], dia: f[F.DIA], ejercicio: CAMINADORA, musculo: f[F.MUSC], serie: f[F.SERIE], reps: min, kg: 0, nota };
  } else {
    o = { id: nuevoId(), fecha: hoyIso(), dia: estado.dia === null ? diaSugerido() : estado.dia, ejercicio: CAMINADORA, musculo: 'Cardio', serie: caminatasDeHoy().length + 1, reps: min, kg: 0, nota };
    estado.filas.push(aFila(o));
  }
  encolar({ tipo: 'guardar', fila: o });
  cerrarCapa();
  pintar();
  decir(`${num(min)} min, ${textoKm(vel * min / 60)}. ${azar(FRASES.caminadora)}`);
}

// ---------- Evolución ----------
const NOMBRE_CORTO = { 'Lanzar la pelota': 'Pelota', 'Sentadilla con mancuernas': 'Sentadilla', 'Abdominales de pie en polea con cuerda': 'Abdominales' };

function sesionesDe(ej) {
  const m = new Map();
  filasDe(ej).forEach((f) => { if (!m.has(f[F.FECHA])) m.set(f[F.FECHA], []); m.get(f[F.FECHA]).push(f); });
  return [...m.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([fecha, series]) => ({ fecha, series: series.sort((a, b) => a[F.SERIE] - b[F.SERIE]) }));
}

function graficaEvolucion(puntos, formato, invertir, resumen) {
  if (!puntos.length) return '';
  const W = 340, H = 170, pi = 42, pd = 14, ps = 12, pa = 24;
  const t = (iso) => new Date(iso).getTime();
  const x0 = t(puntos[0][0]), x1 = t(puntos[puntos.length - 1][0]);
  const vals = puntos.map((p) => p[1]);
  const bajo = Math.min(...vals), alto = Math.max(...vals), margen = (alto - bajo) * 0.15 || Math.max(alto * 0.1, 1);
  const y0 = Math.max(0, bajo - margen), y1 = alto + margen;
  const X = (iso) => (x1 === x0 ? (pi + W - pd) / 2 : pi + (t(iso) - x0) / (x1 - x0) * (W - pi - pd));
  const Y = (v) => { const r = (v - y0) / (y1 - y0); return H - pa - (invertir ? 1 - r : r) * (H - pa - ps); };
  const rejilla = [y0, (y0 + y1) / 2, y1].map((v) => `<line x1="${pi}" x2="${W - pd}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--ciruela-2)" stroke-width="1"/><text x="${pi - 6}" y="${Y(v) + 4}" text-anchor="end">${formato(v)}</text>`).join('');
  const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('');
  const ultimo = puntos[puntos.length - 1];
  const fechas = puntos.length > 1
    ? `<text x="${pi}" y="${H - 6}">${fechaCorta(puntos[0][0]).slice(0, -3)}</text><text x="${W - pd}" y="${H - 6}" text-anchor="end">${fechaCorta(ultimo[0]).slice(0, -3)}</text>`
    : `<text x="${X(ultimo[0])}" y="${H - 6}" text-anchor="middle">${fechaCorta(ultimo[0]).slice(0, -3)}</text>`;
  return `<div class="grafica"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(resumen)}">${rejilla}${fechas}
    <path d="${d}" fill="none" stroke="var(--chicle)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    ${puntos.map((p) => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="${p === ultimo ? 5 : 3}" fill="${p === ultimo ? 'var(--amarillo)' : 'var(--chicle)'}" stroke="var(--ciruela)" stroke-width="${p === ultimo ? 2 : 0}"/>`).join('')}
  </svg></div>`;
}

function pintarDatosEvolucion(pares) {
  return `<div class="evo-datos">${pares.map(([v, e]) => `<div><b class="gorda">${v}</b><small>${e}</small></div>`).join('')}</div>`;
}
function pintarTablaEvolucion(filas) {
  return `<table class="evo-tabla">${filas.slice(-10).reverse().map(([fecha, detalle, extra]) => `<tr><td>${fechaCorta(fecha)}</td><td>${detalle}</td><td>${extra}</td></tr>`).join('')}</table>`;
}

function evolucionMedida(ej) {
  const sesiones = sesionesDe(ej);
  const metros = sesiones.flatMap((s) => s.series).reduce((a, f) => a + (+f[F.REPS] || 0), 0);
  // Si un día cambió los metros, el ritmo se lleva a 300 m para que siga siendo comparable.
  const puntos = sesiones.map((s) => {
    const l = s.series.filter((f) => segundosDe(f) && +f[F.REPS]).map((f) => segundosDe(f) * METROS_DEFECTO / +f[F.REPS]);
    return l.length ? [s.fecha, Math.min(...l)] : null;
  }).filter(Boolean);
  const mejor = puntos.length ? Math.min(...puntos.map((p) => p[1])) : 0;
  const dif = puntos.length > 1 ? Math.round(puntos[0][1] - puntos[puntos.length - 1][1]) : 0;
  const texto = puntos.length > 1
    ? `De ${aTiempo(puntos[0][1])} a ${aTiempo(puntos[puntos.length - 1][1])} cada 300 m${dif > 0 ? `: ${dif} s menos` : ''}`
    : puntos.length ? `${aTiempo(puntos[0][1])} cada 300 m` : 'Sin tiempos todavía';
  return `<p class="res"><b>${texto}</b></p>
    ${pintarDatosEvolucion([[mejor ? aTiempo(mejor) : '–', 'mejor en 300 m'], [`${num(Math.round(metros / 100) / 10)} km`, 'en total'], [sesiones.length, sesiones.length === 1 ? 'sesión' : 'sesiones']])}
    ${graficaEvolucion(puntos, aTiempo, true, texto)}
    ${puntos.length ? '<p class="pie">Mejor tiempo de cada día. Más arriba, más rápido.</p>' : ''}
    ${pintarTablaEvolucion(sesiones.map((s) => [s.fecha, s.series.map((f) => (segundosDe(f) ? aTiempo(segundosDe(f)) : '–')).join(' · '), `${miles(s.series.reduce((a, f) => a + (+f[F.REPS] || 0), 0))} m`]))}`;
}

function evolucionPesos(ej) {
  const sesiones = sesionesDe(ej);
  const puntos = sesiones.map((s) => [s.fecha, Math.max(...s.series.map((f) => +f[F.KG] || 0))]);
  const mejor = Math.max(...puntos.map((p) => p[1]));
  const reps = sesiones.flatMap((s) => s.series).reduce((a, f) => a + (+f[F.REPS] || 0), 0);
  const texto = puntos.length > 1 ? `De ${num(puntos[0][1])} a ${num(puntos[puntos.length - 1][1])} kg` : `${num(puntos[0][1])} kg`;
  return `<p class="res"><b>${texto}</b></p>
    ${pintarDatosEvolucion([[`${num(mejor)} kg`, 'lo más alto'], [miles(reps), 'repes en total'], [sesiones.length, sesiones.length === 1 ? 'sesión' : 'sesiones']])}
    ${graficaEvolucion(puntos, (v) => num(Math.round(v * 10) / 10), false, texto)}
    ${pintarTablaEvolucion(sesiones.map((s) => [s.fecha, s.series.map((f) => f[F.REPS]).join(' · ') + ' repes', `${num(Math.max(...s.series.map((f) => +f[F.KG] || 0)))} kg`]))}`;
}

function evolucionCaminadora() {
  const sesiones = sesionesDe(CAMINADORA);
  const puntos = sesiones.map((s) => [s.fecha, s.series.reduce((a, f) => a + datosCaminata(f).km, 0)]);
  const km = puntos.reduce((a, p) => a + p[1], 0);
  const min = sesiones.flatMap((s) => s.series).reduce((a, f) => a + datosCaminata(f).min, 0);
  const texto = `${textoKm(km)} caminados en ${sesiones.length} ${sesiones.length === 1 ? 'día' : 'días'}`;
  return `<p class="res"><b>${texto}</b></p>
    ${pintarDatosEvolucion([[textoKm(km), 'en total'], [min >= 120 ? `${num(Math.round(min / 6) / 10)} h` : `${num(min)} min`, 'caminando'], [sesiones.length, sesiones.length === 1 ? 'día' : 'días']])}
    ${graficaEvolucion(puntos, (v) => num(Math.round(v * 10) / 10), false, texto)}
    ${puntos.length ? '<p class="pie">Kilómetros de cada día.</p>' : ''}
    ${pintarTablaEvolucion(sesiones.flatMap((s) => s.series.map((f) => { const c = datosCaminata(f); return [s.fecha, `${num(c.min)} min, ${num(c.vel)} km/h, ${num(c.inc)}°`, textoKm(c.km)]; })))}`;
}

// Para ver desde la primera sesión: no espera a tener cuatro, como las gráficas de fuerza.
function pintarEvolucionCircuito() {
  const e = $('#evolucion');
  if (!e) return;
  const nombres = [...CIRCUITO.map((x) => x.ejercicio), CAMINADORA].filter((n) => filasDe(n).length);
  if (!nombres.length) {
    e.innerHTML = '<p class="pie">Cuando hagas tu primer mini entreno o apuntes caminadora, aquí verás cómo evoluciona.</p>';
    return;
  }
  if (!nombres.includes(estado.evolucion)) estado.evolucion = nombres.includes('Remo') ? 'Remo' : nombres[0];
  const ej = estado.evolucion;
  e.innerHTML = `<div class="chips" role="group" aria-label="Elegir ejercicio">${nombres.map((n) => `<button type="button" data-evolucion="${esc(n)}" aria-pressed="${n === ej}">${esc(NOMBRE_CORTO[n] || n)}</button>`).join('')}</div>
    <div class="grafica-caja"><h3 class="gorda">${esc(ej)}</h3>${ej === CAMINADORA ? evolucionCaminadora() : ES_MEDIDO.has(ej) ? evolucionMedida(ej) : evolucionPesos(ej)}</div>`;
}
