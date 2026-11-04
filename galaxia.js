// La galaxia de Marialópoda: un pequeño videojuego que se alimenta de los entrenos de verdad.
// Las toneladas descubren planetas y hacen más potente la nave, cada entreno da vuelos,
// y en cada vuelo se conquista un planeta contra su jefe. Los planetas no se acaban nunca.

const TONELADAS_POR_PLANETA = 100, PLANETAS_POR_SECTOR = 8, VUELOS_INICIALES = 5, VUELOS_POR_ENTRENO = 3;
const SECTORES = ['Borde Exterior', 'Nebulosa de la Oruga', 'Cúmulo Salchicha', 'Anillo del Elefante', 'Mar de Agujetas', 'Constelación del Girasol', 'Vía Proteica', 'Corazón de Marialópoda'];
const JEFES = ['Mancuerna Errante', 'Disco de 25', 'Rey Kettlebell', 'Cometa Burpee', 'Lord Agujetas', 'Prensa Imperial', 'Conde Isométrico', 'Darth Búlgara', 'Barra Olímpica', 'Sargento Zancada', 'Gran Peso Muerto', 'Emperador del Lunes'];
const RANGOS = [[0, 'Caza de entrenamiento', 1], [500, 'Caza ligero', 2], [2000, 'Halcón de hierro', 3], [5000, 'Crucero Oruga', 4], [10000, 'Acorazado Marialópoda', 5], [20000, 'Estrella de la Fuerza', 6], [50000, 'Leyenda de la galaxia', 7]];
const MEJORAS = {
  cadencia: { nombre: 'Disparo rápido', emoji: '⚡', max: 12, base: 60 },
  iman: { nombre: 'Imán de estrellas', emoji: '🧲', max: 8, base: 40 },
  escudo: { nombre: 'Escudo de beskar', emoji: '🛡️', max: 5, base: 120 }
};
const PIELES = [
  { id: 'rosa', nombre: 'Rosa chicle', color: '#FF7DB0', precio: 0 },
  { id: 'oro', nombre: 'Dorado', color: '#FFC531', precio: 150 },
  { id: 'beskar', nombre: 'Beskar', color: '#C5D0DB', precio: 300 },
  { id: 'grogu', nombre: 'Verde Grogu', color: '#8DCF7A', precio: 300 },
  { id: 'azul', nombre: 'Sable azul', color: '#5AA9FF', precio: 500 },
  { id: 'rojo', nombre: 'Sable rojo', color: '#FF4B55', precio: 500 },
  { id: 'violeta', nombre: 'Sable violeta', color: '#B57BFF', precio: 800 }
];
const COPILOTOS = [
  { id: 'grogu', nombre: 'Grogu', emoji: '👽', poder: 'Cada 15 segundos, la Fuerza borra los disparos enemigos.', precio: 0 },
  { id: 'salchicha', nombre: 'Perro salchicha', emoji: '🐕', poder: 'Trae un 25 % más de estrellas.', precio: 200 },
  { id: 'elefante', nombre: 'Elefante', emoji: '🐘', poder: 'Un corazón más en cada vuelo.', precio: 400 },
  { id: 'oruga', nombre: 'Oruga', emoji: '🐛', poder: 'Encuentra más regalos por el camino.', precio: 400 },
  { id: 'mariposa', nombre: 'Mariposa', emoji: '🦋', poder: 'Tu nave es más difícil de alcanzar.', precio: 800 }
];

// ---------- Reglas ----------
function viaje(toneladas) {
  const recorrido = Math.max(0, toneladas) / TONELADAS_POR_PLANETA, indice = Math.floor(recorrido);
  return { indice, avance: recorrido - indice, falta: (indice + 1) * TONELADAS_POR_PLANETA - toneladas };
}
function rangoDe(toneladas) {
  let i = 0;
  while (i + 1 < RANGOS.length && toneladas >= RANGOS[i + 1][0]) i++;
  const s = RANGOS[i + 1];
  return { i, nombre: RANGOS[i][1], disparos: RANGOS[i][2], siguiente: s ? { en: s[0], nombre: s[1] } : null };
}
const sectorDe = (i) => Math.floor(i / PLANETAS_POR_SECTOR);
function nombreSector(s) {
  const vuelta = Math.floor(s / SECTORES.length);
  return `${SECTORES[s % SECTORES.length]}${vuelta ? ` ${vuelta + 1}` : ''}`;
}
function planetaDe(i) {
  const h = entero(`planeta-${i}`);
  const capital = (i + 1) % PLANETAS_POR_SECTOR === 0;
  const rasgos = { i, capital, anillo: capital || h % 3 === 0, luna: h % 4 === 1, bandas: h % 3 };
  if (i < FRASES.planetas.length) {
    const [nombre, color, frase] = FRASES.planetas[i].split('|');
    return { ...rasgos, nombre, color, frase };
  }
  const a = ['Ka', 'Zo', 'Mi', 'Lu', 'Ve', 'Ta', 'No', 'Ri', 'Dra', 'Sa', 'Be', 'Or'], b = ['ri', 'lo', 'na', 'ra', 'mi', 'do', 've', 'sha', 'tu', 'ga'], c = ['a', 'on', 'is', 'ar', 'ia', 'os', 'ine', 'oo', 'um'];
  return { ...rasgos, nombre: `${a[h % 12]}${b[(h >> 4) % 10]}${c[(h >> 8) % 9]}`, color: `hsl(${h % 360},60%,62%)`, frase: FRASES.exploracion[h % FRASES.exploracion.length] };
}
function jefeDe(i) {
  const vuelta = Math.floor(i / JEFES.length), capital = (i + 1) % PLANETAS_POR_SECTOR === 0;
  return {
    nombre: `${JEFES[i % JEFES.length]}${vuelta ? ` ${vuelta + 1}` : ''}`,
    vida: Math.round((40 + Math.min(i, 100) * 8) * (capital ? 1.5 : 1)),
    patron: i % 4, forma: i % 3, color: `hsl(${(i * 47) % 360},70%,58%)`
  };
}
const precioMejora = (id, n) => Math.round(MEJORAS[id].base * 1.55 ** n);
const combustible = (g, entrenos) => Math.max(0, VUELOS_INICIALES + VUELOS_POR_ENTRENO * (entrenos - g.base) - g.usados);

function galEstado() {
  const g = { conq: 0, estrellas: 0, usados: 0, record: 0, jefe: null, mej: {}, piel: 'rosa', copi: 'grogu', tengo: [], ...(leer('galaxia', null) || {}) };
  if (g.base === undefined) { g.base = datosMundo(estado.filas).entrenos; guardar('galaxia', g); }
  return g;
}
const colorNave = (g) => (PIELES.find((p) => p.id === g.piel) || PIELES[0]).color;

// ---------- Dibujos ----------
const NAVE = {
  cuerpo: 'M0 -20C6 -12 9 -2 8 11L-8 11C-9 -2 -6 -12 0 -20Z',
  alas: 'M-7 0L-20 13L-7 11ZM7 0L20 13L7 11Z',
  alas2: 'M-8 -6L-25 3L-20 13L-8 4ZM8 -6L25 3L20 13L8 4Z',
  alas3: 'M-5 7L-13 21L-3 12ZM5 7L13 21L3 12Z'
};
function svgNave(color, rango) {
  return `${rango >= 4 ? `<path d="${NAVE.alas3}" fill="#FFC531"/>` : ''}${rango >= 2 ? `<path d="${NAVE.alas2}" fill="${color}" opacity=".65"/>` : ''}<path d="${NAVE.alas}" fill="${color}"/><path d="${NAVE.cuerpo}" fill="${color}"/><path d="${NAVE.cuerpo}" fill="#fff" opacity=".2"/><circle cy="-6" r="3.6" fill="#BFEFFF"/>`;
}
function svgPlaneta(p, x, y, r) {
  const bandas = p.bandas ? `<ellipse cx="${x}" cy="${y - r * 0.28}" rx="${r * 0.86}" ry="${r * 0.13}" fill="#000" opacity=".14"/>${p.bandas > 1 ? `<ellipse cx="${x}" cy="${y + r * 0.34}" rx="${r * 0.82}" ry="${r * 0.15}" fill="#fff" opacity=".16"/>` : ''}` : '';
  const anillo = p.anillo ? `<ellipse cx="${x}" cy="${y}" rx="${r * 1.55}" ry="${r * 0.42}" fill="none" stroke="#FFE7B8" stroke-width="2" opacity=".85" transform="rotate(-18 ${x} ${y})"/>` : '';
  const luna = p.luna ? `<circle cx="${x + r * 1.15}" cy="${y - r * 0.9}" r="${r * 0.2}" fill="#E7DFF0"/>` : '';
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.color}"/>${bandas}<circle cx="${x - r * 0.32}" cy="${y - r * 0.36}" r="${r * 0.2}" fill="#fff" opacity=".35"/>${anillo}${luna}`;
}
const RUTA = [[42, 58], [106, 34], [172, 62], [240, 36], [312, 66], [270, 128], [188, 112], [100, 142]];

function pintarMapa(g, v, sector) {
  const base = sector * PLANETAS_POR_SECTOR;
  const puntos = RUTA.map(([x, y], k) => ({ x, y, p: planetaDe(base + k) }));
  const camino = RUTA.map(([x, y]) => `${x} ${y}`).join('L');
  const estrellas = Array.from({ length: 34 }, (_, k) => `<circle class="${k % 3 ? '' : 'titila'}" cx="${(reparto(k, 0.7548776662) * 360).toFixed(0)}" cy="${(reparto(k, 0.5698402910) * 178).toFixed(0)}" r="${k % 5 ? 0.8 : 1.4}" fill="#fff" opacity=".8"/>`).join('');
  const dibujo = puntos.map(({ x, y, p }) => {
    const r = p.capital ? 19 : 12 + (entero(p.nombre) % 4), visto = p.i <= v.indice, hecho = p.i < g.conq, mision = p.i === g.conq && visto;
    return `<g data-gal="planeta" data-i="${p.i}" class="planeta${mision ? ' objetivo' : ''}">
      <circle cx="${x}" cy="${y}" r="24" fill="transparent"/>
      ${visto ? svgPlaneta(p, x, y, r) : `<circle cx="${x}" cy="${y}" r="${r}" fill="#2A1A47" stroke="#6A5A8E" stroke-dasharray="3 3"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="#A99BC4" style="font-size:14px">?</text>`}
      ${hecho ? `<text x="${x + r * 0.5}" y="${y - r * 0.5}" style="font-size:13px">🚩</text>` : ''}
      ${mision ? `<circle class="pulso" cx="${x}" cy="${y}" r="${r + 5}" fill="none" stroke="#FFC531" stroke-width="2"/>` : ''}</g>`;
  }).join('');
  let nave = '';
  if (sectorDe(v.indice) === sector) {
    const k = v.indice - base, a = RUTA[k], b = RUTA[k + 1] || a;
    const x = a[0] + (b[0] - a[0]) * v.avance, y = a[1] + (b[1] - a[1]) * v.avance;
    const ang = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI + 90;
    nave = `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="nave" transform="rotate(${ang.toFixed(0)}) scale(.72)">${svgNave(colorNave(g), rangoDe(v.indice * TONELADAS_POR_PLANETA).i)}</g></g>`;
  }
  else if (sectorDe(Math.min(g.conq, v.indice)) === sector) {
    // Si el viaje va más adelante, la nave espera aparcada junto al planeta que toca conquistar.
    const [x, y] = RUTA[Math.min(g.conq, v.indice) - base];
    nave = `<g transform="translate(${x + 24} ${y + 16})"><g class="nave" transform="rotate(-30) scale(.62)">${svgNave(colorNave(g), rangoDe(v.indice * TONELADAS_POR_PLANETA).i)}</g></g>`;
  }
  return `<svg class="mapa" viewBox="0 0 360 178" role="img" aria-label="${esc(nombreSector(sector))}">${estrellas}<path d="M${camino}" fill="none" stroke="#8B7BB5" stroke-width="1.5" stroke-dasharray="3 6"/>${dibujo}${nave}</svg>`;
}

let sectorVisto = null, planetaVisto = null;
function cuerpoGalaxia() {
  const d = datosMundo(estado.filas), g = galEstado(), v = viaje(d.toneladas), r = rangoDe(d.toneladas);
  const ultimo = sectorDe(v.indice), sector = Math.min(sectorVisto === null ? sectorDe(Math.min(g.conq, v.indice)) : sectorVisto, ultimo);
  const vuelos = combustible(g, d.entrenos), hayMision = g.conq <= v.indice;
  const objetivo = planetaDe(Math.min(g.conq, v.indice)), jefe = jefeDe(objetivo.i);
  const siguiente = planetaDe(v.indice + 1);
  const pendientes = v.indice - g.conq + 1;
  const dano = g.jefe && g.jefe.p === g.conq ? Math.round((g.jefe.dano / jefe.vida) * 100) : 0;
  const elegido = planetaVisto === null ? null : planetaDe(planetaVisto);
  const ficha = elegido && sectorDe(elegido.i) === sector ? (elegido.i <= v.indice
    ? `<b>${esc(elegido.nombre)}${elegido.i < g.conq ? ' 🚩' : ''}.</b> ${esc(elegido.frase)}`
    : `<b>Sin descubrir.</b> Llegarás a ${miles(elegido.i * TONELADAS_POR_PLANETA)} toneladas.`) : '';
  return `<h2 class="gorda">Galaxia</h2>
    <div class="sector"><button type="button" data-gal="sector" data-i="${sector - 1}" aria-label="Sector anterior" ${sector ? '' : 'disabled'}>‹</button><b>${esc(nombreSector(sector))}</b><button type="button" data-gal="sector" data-i="${sector + 1}" aria-label="Sector siguiente" ${sector < ultimo ? '' : 'disabled'}>›</button></div>
    ${pintarMapa(g, v, sector)}
    ${ficha ? `<p class="mundo-dato">${ficha}</p>` : ''}
    <div class="barra-nivel" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v.avance * 100)}"><i style="width:${v.avance * 100}%"></i></div>
    <p class="mundo-dato">${miles(Math.max(1, v.falta))} toneladas más y descubres ${esc(siguiente.nombre)}, como ${miles(Math.max(1, v.falta / 5))} elefantes.</p>
    <div class="marcador"><span>⛽ <b>${miles(vuelos)}</b> ${vuelos === 1 ? 'vuelo' : 'vuelos'}</span><span>⭐ <b>${miles(g.estrellas)}</b></span><span>🚩 <b>${miles(g.conq)}</b> de ${miles(v.indice + 1)}</span></div>
    <p class="mundo-dato">${hayMision
    ? `Misión: conquistar <b>${esc(objetivo.nombre)}</b>. Te espera <b>${esc(jefe.nombre)}</b>${dano ? `, con un ${dano} % de daño que ya le hiciste` : ''}.${pendientes > 1 ? ` Tienes ${miles(pendientes)} planetas por conquistar.` : ''}`
    : 'Has conquistado todo lo descubierto. Entrena para descubrir más, o sal de patrulla a por estrellas.'}</p>
    ${vuelos ? `<button type="button" class="principal" data-gal="despegar" data-modo="${hayMision ? 'mision' : 'patrulla'}">🚀 ${hayMision ? '¡Despegar!' : 'Salir de patrulla'}</button>` : '<p class="mundo-frase">Depósito vacío. Tu próximo entreno lo llena: cada uno da 3 vuelos.</p>'}
    <div class="gal-botones">${hayMision && vuelos && g.conq ? '<button type="button" class="ver-mas" data-gal="despegar" data-modo="patrulla">Patrulla sin fin</button>' : ''}<button type="button" class="ver-mas" data-gal="hangar">🛠️ Hangar</button></div>
    <p class="mundo-dato">Tu nave: <b>${esc(r.nombre)}</b>, ${r.disparos} ${r.disparos === 1 ? 'cañón' : 'cañones'}.${r.siguiente ? ` A ${miles(r.siguiente.en)} toneladas, ${esc(r.siguiente.nombre)}.` : ''}${g.record ? ` Récord de patrulla: ${miles(g.record)} ⭐.` : ''}</p>`;
}
function pintarGalaxia() { return `<section class="tarjeta-mundo galaxia" id="caja-galaxia">${cuerpoGalaxia()}</section>`; }
function refrescarGalaxia() { const c = document.getElementById('caja-galaxia'); if (c) c.innerHTML = cuerpoGalaxia(); }

// ---------- Hangar ----------
function pintarHangar() {
  const g = galEstado(), c = $('#capa');
  const compra = (precio) => `${miles(precio)} ⭐`;
  const mejoras = Object.entries(MEJORAS).map(([id, m]) => {
    const n = g.mej[id] || 0, tope = n >= m.max, precio = precioMejora(id, n);
    return `<li><span class="ico">${m.emoji}</span><div><b>${esc(m.nombre)}</b><p>Nivel ${n} de ${m.max}</p></div><button type="button" data-gal="mejora" data-id="${id}" ${tope || g.estrellas < precio ? 'disabled' : ''}>${tope ? 'Máximo' : compra(precio)}</button></li>`;
  }).join('');
  const fila = (x, tipo, activo, ico, detalle) => {
    const mia = x.precio === 0 || g.tengo.includes(x.id);
    return `<li><span class="ico">${ico}</span><div><b>${esc(x.nombre)}</b>${detalle ? `<p>${esc(detalle)}</p>` : ''}</div><button type="button" data-gal="${tipo}" data-id="${x.id}" ${activo || (!mia && g.estrellas < x.precio) ? 'disabled' : ''}>${activo ? 'Puesto' : mia ? 'Poner' : compra(x.precio)}</button></li>`;
  };
  c.innerHTML = `<div class="tarjeta hangar" role="dialog" aria-label="Hangar"><h2 class="gorda">Hangar</h2><p class="cifra">⭐ ${miles(g.estrellas)}</p>
    <h3>Mejoras</h3><ul>${mejoras}</ul>
    <h3>Copiloto</h3><ul>${COPILOTOS.map((x) => fila(x, 'copi', g.copi === x.id, x.emoji, x.poder)).join('')}</ul>
    <h3>Pintura</h3><ul>${PIELES.map((x) => fila(x, 'piel', g.piel === x.id, `<i style="background:${x.color}"></i>`, '')).join('')}</ul>
    <button type="button" class="principal" data-accion="cerrar">Volver</button></div>`;
  c.hidden = false;
}
function comprarEnHangar(tipo, id) {
  const g = galEstado();
  if (tipo === 'mejora') {
    const n = g.mej[id] || 0, precio = precioMejora(id, n);
    if (n >= MEJORAS[id].max || g.estrellas < precio) return;
    g.estrellas -= precio; g.mej[id] = n + 1;
  } else {
    const x = (tipo === 'piel' ? PIELES : COPILOTOS).find((o) => o.id === id);
    if (!x) return;
    if (x.precio && !g.tengo.includes(id)) {
      if (g.estrellas < x.precio) return;
      g.estrellas -= x.precio; g.tengo.push(id);
    }
    g[tipo] = id;
  }
  guardar('galaxia', g);
  pintarHangar();
  refrescarGalaxia();
}

// ---------- El juego ----------
let juego = null;
const ANCHO_J = 360;
function sprite(emoji, tam) {
  const k = 2, c = document.createElement('canvas');
  c.width = c.height = tam * 1.4 * k;
  const x = c.getContext('2d');
  x.font = `${tam * k}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(emoji, c.width / 2, c.height / 2 + tam * 0.08 * k);
  return c;
}
function spriteRoca(r, semilla) {
  const k = 2, c = document.createElement('canvas');
  c.width = c.height = (r * 2 + 6) * k;
  const x = c.getContext('2d');
  x.scale(k, k); x.translate(r + 3, r + 3);
  x.beginPath();
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2, q = r * (0.78 + reparto(i + semilla, 0.618) * 0.22);
    x[i ? 'lineTo' : 'moveTo'](Math.cos(a) * q, Math.sin(a) * q);
  }
  x.closePath(); x.fillStyle = '#7A6A8F'; x.fill();
  x.fillStyle = '#5B4C70';
  for (let i = 0; i < 3; i++) { x.beginPath(); x.arc((i - 1) * r * 0.45, reparto(i + semilla, 0.37) * r * 0.8 - r * 0.4, r * 0.17, 0, 7); x.fill(); }
  return c;
}
function dibujarJefe(x, b, destello) {
  x.save(); x.translate(b.x, b.y);
  x.fillStyle = destello ? '#fff' : b.color;
  if (b.forma === 0) {
    // Como en toda barra: el disco grande junto al centro y el pequeño hacia fuera.
    x.fillStyle = destello ? '#fff' : '#D8D2E0'; x.fillRect(-60, -5, 120, 10);
    x.fillStyle = destello ? '#fff' : b.color;
    for (const s of [-1, 1]) { x.fillRect(s * 27 - 5, -30, 10, 60); x.fillRect(s * 40 - 4, -21, 8, 42); }
    x.fillRect(-18, -16, 36, 32);
  } else if (b.forma === 1) {
    x.beginPath(); x.arc(0, 0, 38, 0, 7); x.fill();
    x.fillStyle = 'rgba(0,0,0,.2)'; x.beginPath(); x.arc(0, 0, 28, 0, 7); x.fill();
  } else {
    x.lineWidth = 9; x.strokeStyle = x.fillStyle; x.beginPath(); x.arc(0, -24, 15, Math.PI, 0); x.stroke();
    x.beginPath(); x.arc(0, 4, 32, 0, 7); x.fill();
  }
  x.fillStyle = '#fff';
  for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 10, -1, 6.5, 0, 7); x.fill(); }
  x.fillStyle = '#231528';
  for (const s of [-1, 1]) { x.beginPath(); x.arc(s * 9, 1, 3, 0, 7); x.fill(); }
  x.strokeStyle = '#231528'; x.lineWidth = 3;
  for (const s of [-1, 1]) { x.beginPath(); x.moveTo(s * 17, -10); x.lineTo(s * 4, -6); x.stroke(); }
  x.beginPath(); x.moveTo(-8, 13); x.quadraticCurveTo(0, 7, 8, 13); x.stroke();
  x.restore();
}

function despegar(modo) {
  const g = galEstado(), d = datosMundo(estado.filas);
  if (juego || combustible(g, d.entrenos) <= 0) return;
  const v = viaje(d.toneladas);
  if (modo === 'mision' && g.conq > v.indice) return;
  g.usados += 1; guardar('galaxia', g);
  pararBosque();
  const nivel = modo === 'mision' ? g.conq : Math.min(g.conq, v.indice);
  const raiz = document.createElement('div');
  raiz.id = 'juego';
  raiz.innerHTML = `<canvas aria-label="Arrastra el dedo para mover la nave"></canvas>
    <div class="j-hud"><span class="j-vidas"></span><span class="j-estrellas"></span><button type="button" data-gal="salir" aria-label="Salir del juego">✕</button></div>
    <div class="j-jefe" hidden><b></b><i><u></u></i></div><div class="j-aviso"></div><div class="j-fin" hidden></div>`;
  document.body.appendChild(raiz);
  const canvas = raiz.querySelector('canvas');
  const r = rangoDe(d.toneladas), m = g.mej;
  const nivelD = Math.min(nivel, 100);
  const j = {
    raiz, canvas, x: canvas.getContext('2d'), modo, nivel, planeta: planetaDe(nivel), g,
    W: ANCHO_J, H: 640, t: 0, ultimo: 0, fin: false, estrellas: 0, jefesCaidos: 0,
    nave: { x: 180, y: 520, inv: 2 }, vidas: 3 + (m.escudo || 0) + (g.copi === 'elefante' ? 1 : 0),
    disparos: r.disparos, cadencia: 0.34 * 0.94 ** (m.cadencia || 0), imanR: 34 + 14 * (m.iman || 0), radio: g.copi === 'mariposa' ? 7 : 10,
    color: colorNave(g), rango: r.i, proxDisparo: 0, poderHasta: 0, fuerza: 15,
    proxRoca: 2, proxEstrella: 1, proxRegalo: g.copi === 'oruga' ? 5 : 8, ritmoRoca: Math.max(0.42, 0.95 - nivelD * 0.005), velRoca: 75 + nivelD * 1.1, vidaRoca: 1 + Math.floor(nivelD / 12),
    tiempoJefe: modo === 'mision' ? Math.min(30, 16 + nivelD * 0.3) : 30, rocas: [], balas: [], enemigas: [], cosas: [], chispas: [], jefe: null, temblor: 0, hud: '',
    fondo: Array.from({ length: 90 }, (_, i) => ({ x: reparto(i, 0.7548) * ANCHO_J, y: reparto(i, 0.5698) * 900, v: 18 + (i % 3) * 34, r: i % 3 === 2 ? 1.5 : 1 })),
    img: { estrella: sprite('⭐', 18), pesa: sprite('🏋️', 26), corazon: sprite('💗', 24), salchicha: sprite('🐕', 30), elefante: sprite('🐘', 34), copi: sprite((COPILOTOS.find((c) => c.id === g.copi) || COPILOTOS[0]).emoji, 15), rocas: [spriteRoca(13, 1), spriteRoca(18, 7), spriteRoca(24, 13)] }
  };
  juego = j;
  ajustarJuego();
  let dedo = null;
  canvas.addEventListener('pointerdown', (e) => { dedo = { x: e.clientX, y: e.clientY }; try { canvas.setPointerCapture(e.pointerId); } catch { /* el dedo sigue funcionando sin captura */ } });
  canvas.addEventListener('pointermove', (e) => {
    if (!dedo || j.fin) return;
    const k = j.W / canvas.clientWidth;
    j.nave.x = Math.max(16, Math.min(j.W - 16, j.nave.x + (e.clientX - dedo.x) * k * 1.25));
    j.nave.y = Math.max(j.H * 0.32, Math.min(j.H - 34, j.nave.y + (e.clientY - dedo.y) * k * 1.25));
    dedo = { x: e.clientX, y: e.clientY };
  });
  const soltar = () => { dedo = null; };
  canvas.addEventListener('pointerup', soltar);
  canvas.addEventListener('pointercancel', soltar);
  avisoJuego(modo === 'mision' ? `${j.planeta.nombre}<small>Arrastra el dedo para mover la nave</small>` : `Patrulla<small>Aguanta todo lo que puedas</small>`);
  requestAnimationFrame(pasoJuego);
}
function ajustarJuego() {
  const j = juego;
  if (!j) return;
  const a = j.raiz.clientWidth, b = j.raiz.clientHeight, ancho = Math.min(a, b * 0.72), k = Math.min(2, window.devicePixelRatio || 1);
  j.canvas.style.width = `${ancho}px`; j.canvas.style.height = `${b}px`;
  j.canvas.width = Math.round(ancho * k); j.canvas.height = Math.round(b * k);
  j.H = (b / ancho) * j.W;
  j.escala = j.canvas.width / j.W;
  j.nave.y = Math.min(j.nave.y, j.H - 34);
  if (!j.t) j.nave.y = j.H - 110;
}
function avisoJuego(html) {
  const a = juego.raiz.querySelector('.j-aviso');
  a.innerHTML = html;
  a.classList.remove('sale'); void a.offsetWidth; a.classList.add('sale');
}
function chispas(j, x, y, color, n) {
  for (let i = 0; i < n && j.chispas.length < 130; i++) {
    const a = Math.random() * 7, v = 40 + Math.random() * 170;
    j.chispas.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0.3 + Math.random() * 0.45, color });
  }
}
function naceJefe(j) {
  const n = j.modo === 'mision' ? j.nivel : j.nivel + j.jefesCaidos;
  const datos = jefeDe(n);
  const hecho = j.modo === 'mision' && j.g.jefe && j.g.jefe.p === n ? j.g.jefe.dano : 0;
  j.jefe = { ...datos, n, x: j.W / 2, y: -60, vida: Math.max(1, datos.vida - hecho), max: datos.vida, proximo: 1.4, fase: 0, destello: 0 };
  avisoJuego(`¡${esc(datos.nombre)}!`);
  j.raiz.querySelector('.j-jefe').hidden = false;
  j.raiz.querySelector('.j-jefe b').textContent = datos.nombre;
}
function disparaJefe(j) {
  const b = j.jefe, nv = Math.min(b.n, 100), vel = 125 + nv * 0.8;
  const tira = (ang, v = vel) => { if (j.enemigas.length < 90) j.enemigas.push({ x: b.x, y: b.y + 24, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v }); };
  const alNave = Math.atan2(j.nave.y - b.y, j.nave.x - b.x);
  const rabia = b.vida < b.max * 0.5 ? 1 : 0;
  b.fase += 1;
  if (b.patron === 0) { tira(alNave); if (rabia) { tira(alNave - 0.3); tira(alNave + 0.3); } }
  else if (b.patron === 1) { for (let i = -2 - rabia; i <= 2 + rabia; i++) tira(Math.PI / 2 + i * 0.3); }
  else if (b.patron === 2) { for (let i = 0; i < 3 + rabia; i++) tira(Math.PI / 2 + Math.sin(b.fase * 0.7) * 0.9 + i * 0.16); }
  else { for (let i = 0; i < 6 + rabia * 2; i++) tira(b.fase * 0.45 + (i / (6 + rabia * 2)) * Math.PI * 2, vel * 0.85); }
  b.proximo = Math.max(0.55, 1.15 - nv * 0.006) * (rabia ? 0.8 : 1);
}
function golpeNave(j) {
  if (j.nave.inv > 0) return;
  j.vidas -= 1; j.nave.inv = 1.6; j.temblor = 0.28;
  chispas(j, j.nave.x, j.nave.y, '#FF7DB0', 22);
  if (j.vidas <= 0) terminarVuelo(j, false);
}
function actualizarJuego(j, dt) {
  const n = j.nave;
  j.t += dt; n.inv = Math.max(0, n.inv - dt); j.temblor = Math.max(0, j.temblor - dt);
  for (const f of j.fondo) { f.y += f.v * dt; if (f.y > j.H) { f.y = -2; f.x = Math.random() * j.W; } }
  // Los cañones son los de las toneladas de verdad.
  j.proxDisparo -= dt;
  if (j.proxDisparo <= 0 && !j.fin) {
    const poder = j.t < j.poderHasta;
    j.proxDisparo = j.cadencia * (poder ? 0.55 : 1);
    const total = j.disparos + (poder ? 1 : 0);
    for (let i = 0; i < total; i++) {
      const off = i - (total - 1) / 2;
      j.balas.push({ x: n.x + off * 8, y: n.y - 18, vx: off * 34, vy: -500 });
    }
  }
  const sinJefe = !j.jefe && !j.fin;
  if (sinJefe && j.t > j.tiempoJefe) naceJefe(j);
  if (sinJefe && j.t < j.tiempoJefe - 1.5) {
    j.proxRoca -= dt;
    if (j.proxRoca <= 0) {
      j.proxRoca = j.ritmoRoca * (0.7 + Math.random() * 0.6);
      const tipo = Math.floor(Math.random() * 3), r = [13, 18, 24][tipo];
      j.rocas.push({ x: r + Math.random() * (j.W - r * 2), y: -r, r, tipo, vy: j.velRoca * (1.15 - tipo * 0.18) * (0.85 + Math.random() * 0.3), vx: (Math.random() - 0.5) * 30, vida: j.vidaRoca * (tipo + 1), giro: Math.random() * 7, vg: (Math.random() - 0.5) * 2.5 });
    }
  }
  if (!j.fin) {
    j.proxEstrella -= dt;
    if (j.proxEstrella <= 0) { j.proxEstrella = 0.5 + Math.random() * 0.5; j.cosas.push({ tipo: 'estrella', x: 16 + Math.random() * (j.W - 32), y: -12, vy: 105, r: 11 }); }
    j.proxRegalo -= dt;
    if (j.proxRegalo <= 0) {
      j.proxRegalo = (j.g.copi === 'oruga' ? 5 : 8) * (0.8 + Math.random() * 0.5);
      const a = Math.random();
      const faltaVida = j.vidas < 3;
      const tipo = faltaVida && a < 0.35 ? 'corazon' : a < 0.6 ? 'pesa' : a < 0.88 ? 'salchicha' : 'elefante';
      j.cosas.push(tipo === 'salchicha' ? { tipo, x: -24, y: 90 + Math.random() * (j.H * 0.4), vx: 92, vy: 0, r: 22 } : { tipo, x: 24 + Math.random() * (j.W - 48), y: -18, vy: 95, r: 18 });
    }
  }
  if (j.g.copi === 'grogu' && j.jefe) {
    j.fuerza -= dt;
    if (j.fuerza <= 0 && j.enemigas.length) {
      j.fuerza = 15;
      j.enemigas.forEach((b) => chispas(j, b.x, b.y, '#A5D391', 1));
      j.enemigas = [];
      avisoJuego('Grogu usa la Fuerza');
    }
  }
  for (const b of j.balas) { b.x += b.vx * dt; b.y += b.vy * dt; }
  j.balas = j.balas.filter((b) => b.y > -12 && b.x > -12 && b.x < j.W + 12 && !b.fuera);
  for (const r of j.rocas) {
    r.y += r.vy * dt; r.x += r.vx * dt; r.giro += r.vg * dt;
    for (const b of j.balas) {
      if (b.fuera || Math.hypot(b.x - r.x, b.y - r.y) > r.r + 3) continue;
      b.fuera = true; r.vida -= 1;
      chispas(j, b.x, b.y, '#D8CBE5', 2);
      if (r.vida <= 0) {
        chispas(j, r.x, r.y, '#B9A9CC', 10);
        if (Math.random() < 0.38) j.cosas.push({ tipo: 'estrella', x: r.x, y: r.y, vy: 105, r: 11 });
        break;
      }
    }
    if (r.vida > 0 && Math.hypot(n.x - r.x, n.y - r.y) < r.r * 0.8 + j.radio) { r.vida = 0; chispas(j, r.x, r.y, '#B9A9CC', 8); golpeNave(j); }
  }
  j.rocas = j.rocas.filter((r) => r.vida > 0 && r.y < j.H + 30);
  const c = j.jefe;
  if (c && !j.fin) {
    c.y += (Math.min(158, c.y + 200) - c.y) * Math.min(1, dt * 2);
    c.x = j.W / 2 + Math.sin(j.t * 0.8) * (j.W / 2 - 66);
    c.destello = Math.max(0, c.destello - dt);
    c.proximo -= dt;
    if (c.y > 120 && c.proximo <= 0) disparaJefe(j);
    for (const b of j.balas) {
      if (b.fuera || Math.abs(b.x - c.x) > 44 || Math.abs(b.y - c.y) > 36) continue;
      b.fuera = true; c.vida -= 1; c.destello = 0.05;
      if (Math.random() < 0.3) chispas(j, b.x, b.y, '#FFE7B8', 1);
    }
    if (c.vida <= 0) {
      chispas(j, c.x, c.y, c.color, 70); chispas(j, c.x, c.y, '#FFC531', 40);
      j.enemigas = []; j.temblor = 0.4;
      if (j.modo === 'mision') terminarVuelo(j, true);
      else {
        j.jefesCaidos += 1; j.estrellas += 25; j.jefe = null; j.tiempoJefe = j.t + 22;
        j.vidaRoca += 1; j.velRoca += 7; j.raiz.querySelector('.j-jefe').hidden = true;
        avisoJuego('¡Jefe vencido! +25 ⭐');
      }
    }
  }
  for (const b of j.enemigas) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (Math.hypot(b.x - n.x, b.y - n.y) < j.radio + 4) { b.fuera = true; golpeNave(j); }
  }
  j.enemigas = j.enemigas.filter((b) => !b.fuera && b.y < j.H + 12 && b.y > -30 && b.x > -12 && b.x < j.W + 12);
  for (const o of j.cosas) {
    const dx = n.x - o.x, dy = n.y - o.y, dist = Math.hypot(dx, dy);
    if (o.tipo === 'estrella' && dist < j.imanR) { o.x += (dx / (dist || 1)) * 300 * dt; o.y += (dy / (dist || 1)) * 300 * dt; } else { o.x += (o.vx || 0) * dt; o.y += o.vy * dt; }
    if (dist < o.r + 14 && !j.fin) {
      o.fuera = true;
      if (o.tipo === 'estrella') j.estrellas += 1;
      else if (o.tipo === 'corazon') { j.vidas += 1; avisoJuego('+1 💗'); }
      else if (o.tipo === 'pesa') { j.poderHasta = j.t + 6; avisoJuego('¡Superserie!'); }
      else if (o.tipo === 'salchicha') { j.estrellas += 15; avisoJuego('¡Salchicha! +15 ⭐'); }
      else {
        j.rocas.forEach((r) => { chispas(j, r.x, r.y, '#B9A9CC', 5); });
        j.rocas = []; j.enemigas = []; j.temblor = 0.3;
        avisoJuego('¡Estampida de elefantes!');
      }
    }
  }
  j.cosas = j.cosas.filter((o) => !o.fuera && o.y < j.H + 26 && o.x < j.W + 40);
  for (const p of j.chispas) { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; }
  j.chispas = j.chispas.filter((p) => p.t > 0);
  const hud = `${j.vidas}|${j.estrellas}|${c ? Math.ceil(c.vida) : ''}`;
  if (hud !== j.hud) {
    j.hud = hud;
    j.raiz.querySelector('.j-vidas').textContent = j.vidas > 6 ? `💗 ${j.vidas}` : '💗'.repeat(Math.max(0, j.vidas));
    j.raiz.querySelector('.j-estrellas').textContent = `⭐ ${j.estrellas}`;
    if (c) j.raiz.querySelector('.j-jefe u').style.width = `${Math.max(0, (c.vida / c.max) * 100)}%`;
  }
}
function pintarJuego(j) {
  const x = j.x, e = j.escala, W = j.W, H = j.H;
  x.setTransform(e, 0, 0, e, 0, 0);
  if (j.temblor > 0 && !matchMedia('(prefers-reduced-motion: reduce)').matches) x.translate((Math.random() - 0.5) * 7, (Math.random() - 0.5) * 7);
  x.fillStyle = '#120828'; x.fillRect(-8, -8, W + 16, H + 16);
  // El planeta de la misión se va acercando según avanzas.
  const pr = Math.min(1, j.t / Math.max(1, j.tiempoJefe)), pl = 44 + pr * 44;
  x.globalAlpha = 0.72; x.fillStyle = j.planeta.color;
  x.beginPath(); x.arc(W * 0.74, -8 + pr * 62, pl, 0, 7); x.fill();
  x.globalAlpha = 1;
  x.fillStyle = '#fff';
  for (const f of j.fondo) { x.globalAlpha = f.r > 1 ? 0.9 : 0.5; x.fillRect(f.x, f.y, f.r, f.r * (1 + f.v / 70)); }
  x.globalAlpha = 1;
  const pon = (img, cx, cy, ang) => { const w = img.width / 2; if (ang) { x.save(); x.translate(cx, cy); x.rotate(ang); x.drawImage(img, -w / 2, -w / 2, w, w); x.restore(); } else x.drawImage(img, cx - w / 2, cy - w / 2, w, w); };
  for (const o of j.cosas) pon(j.img[o.tipo], o.x, o.y);
  for (const r of j.rocas) pon(j.img.rocas[r.tipo], r.x, r.y, r.giro);
  if (j.jefe && !(j.fin && j.jefe.vida <= 0)) dibujarJefe(x, j.jefe, j.jefe.destello > 0);
  x.fillStyle = '#FFE36B';
  for (const b of j.balas) x.fillRect(b.x - 1.5, b.y - 6, 3, 12);
  x.fillStyle = '#FF5C7A';
  for (const b of j.enemigas) { x.beginPath(); x.arc(b.x, b.y, 5, 0, 7); x.fill(); }
  for (const p of j.chispas) { x.globalAlpha = Math.min(1, p.t * 2.2); x.fillStyle = p.color; x.fillRect(p.x, p.y, 3, 3); }
  x.globalAlpha = 1;
  const n = j.nave;
  if (!j.fin && !(n.inv > 0 && Math.floor(j.t * 12) % 2)) {
    x.save(); x.translate(n.x, n.y);
    x.fillStyle = '#FFB347'; x.beginPath(); x.moveTo(-4, 11); x.lineTo(0, 17 + Math.random() * 9); x.lineTo(4, 11); x.fill();
    if (j.rango >= 4) { x.fillStyle = '#FFC531'; x.fill(new Path2D(NAVE.alas3)); }
    if (j.rango >= 2) { x.globalAlpha = 0.65; x.fillStyle = j.color; x.fill(new Path2D(NAVE.alas2)); x.globalAlpha = 1; }
    x.fillStyle = j.color; x.fill(new Path2D(NAVE.alas)); x.fill(new Path2D(NAVE.cuerpo));
    x.fillStyle = '#BFEFFF'; x.beginPath(); x.arc(0, -6, 3.6, 0, 7); x.fill();
    x.restore();
    pon(j.img.copi, n.x, n.y + 3);
    if (j.t < j.poderHasta) { x.strokeStyle = '#FFE36B'; x.lineWidth = 2; x.beginPath(); x.arc(n.x, n.y, 26, 0, 7); x.stroke(); }
  }
}
function pasoJuego(ahora) {
  const j = juego;
  if (!j) return;
  if (j.raiz.clientWidth && !document.hidden) {
    const dt = j.ultimo ? Math.min(0.05, (ahora - j.ultimo) / 1000) : 0.016;
    actualizarJuego(j, dt);
    pintarJuego(j);
  }
  j.ultimo = ahora;
  requestAnimationFrame(pasoJuego);
}
function terminarVuelo(j, gano, sinPantalla) {
  if (j.fin) return;
  j.fin = true;
  const g = galEstado();
  let extra = 0, nuevoSector = false;
  if (j.modo === 'mision') {
    if (gano) {
      const p = planetaDe(j.nivel);
      extra = 40 + j.nivel * 4 + (p.capital ? 150 : 0);
      nuevoSector = p.capital;
      g.conq = Math.max(g.conq, j.nivel + 1);
      g.jefe = null;
    } else if (j.jefe) {
      g.jefe = { p: j.nivel, dano: j.jefe.max - Math.max(1, Math.round(j.jefe.vida)) };
    }
  }
  const recogidas = Math.round(j.estrellas * (g.copi === 'salchicha' ? 1.25 : 1));
  const nuevoRecord = j.modo === 'patrulla' && recogidas > g.record;
  if (nuevoRecord) g.record = recogidas;
  g.estrellas += recogidas + extra;
  guardar('galaxia', g);
  sectorVisto = null;
  if (sinPantalla) return cerrarJuego();
  const hayVuelos = combustible(g, datosMundo(estado.filas).entrenos) > 0;
  const fin = j.raiz.querySelector('.j-fin');
  const p = j.planeta;
  const titulo = gano ? (nuevoSector ? '¡Sector conquistado!' : `¡${esc(p.nombre)} es tuyo!`) : j.modo === 'patrulla' ? (nuevoRecord ? '¡Nuevo récord!' : 'Fin de la patrulla') : j.jefe ? 'Casi lo tienes' : 'Te han dado';
  const texto = gano ? p.frase : j.modo === 'patrulla' ? `Has vencido a ${j.jefesCaidos} ${j.jefesCaidos === 1 ? 'jefe' : 'jefes'}.` : azar(FRASES.galaxiaPierde);
  const dano = !gano && j.jefe && j.modo === 'mision' ? `<p>${esc(j.jefe.nombre)} se queda con un ${Math.round((g.jefe.dano / j.jefe.max) * 100)} % de daño para la próxima.</p>` : '';
  setTimeout(() => {
    if (juego !== j) return;
    fin.innerHTML = `<div class="tarjeta"><svg viewBox="0 0 120 90" width="120" height="90" aria-hidden="true">${svgPlaneta(p, 60, 45, 28)}</svg>
      <h2 class="gorda">${titulo}</h2><p>${esc(texto)}</p>${dano}<p class="cifra">+${miles(recogidas + extra)} ⭐</p>
      ${hayVuelos ? `<button type="button" class="principal" data-gal="otra">🚀 ${gano && j.modo === 'mision' ? 'Siguiente misión' : 'Otra vez'}</button>` : '<p>Depósito vacío. Tu próximo entreno lo llena.</p>'}
      <button type="button" class="secundario" data-gal="salir">Volver</button></div>`;
    fin.hidden = false;
    if (gano) confeti();
  }, 900);
  return undefined;
}
function cerrarJuego() {
  if (!juego) return;
  juego.raiz.remove();
  juego = null;
  pintar();
}

if (typeof document !== 'undefined') {
  window.addEventListener('resize', ajustarJuego);
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-gal]');
    if (!t || t.disabled) return;
    const que = t.dataset.gal;
    if (que === 'despegar') despegar(t.dataset.modo);
    else if (que === 'hangar') pintarHangar();
    else if (que === 'sector') { sectorVisto = +t.dataset.i; planetaVisto = null; refrescarGalaxia(); }
    else if (que === 'planeta') { planetaVisto = +t.dataset.i; refrescarGalaxia(); }
    else if (que === 'mejora' || que === 'copi' || que === 'piel') comprarEnHangar(que, t.dataset.id);
    else if (que === 'salir') { if (juego && !juego.fin) terminarVuelo(juego, false, true); else cerrarJuego(); }
    else if (que === 'otra') {
      const g = galEstado(), hay = g.conq <= viaje(datosMundo(estado.filas).toneladas).indice, modo = juego.modo === 'patrulla' || !hay ? 'patrulla' : 'mision';
      cerrarJuego();
      despegar(modo);
    }
  });
}
