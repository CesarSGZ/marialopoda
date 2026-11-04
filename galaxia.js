// La galaxia de Marialópoda: todo depende de las toneladas levantadas de verdad.
// Descubren planetas, suben su rango Jedi, hacen crecer la flota y traen aliados.
// Aquí no se puede perder: se mira, se toca y se viaja por el hiperespacio. Nunca se acaba.

const TONELADAS_POR_PLANETA = 100, PLANETAS_POR_SECTOR = 8, TONELADAS_POR_ALIADO = 500, ESCOLTA_MAXIMA = 12;
const SECTORES = ['Borde Exterior', 'Nebulosa de la Oruga', 'Cúmulo Salchicha', 'Anillo del Elefante', 'Mar de Agujetas', 'Constelación del Girasol', 'Vía Proteica', 'Corazón de Marialópoda'];
const RANGOS = [
  [0, 'Iniciada', 'Caza de entrenamiento', '#6BB7FF'],
  [500, 'Padawan', 'Caza ligero', '#6FE08A'],
  [2000, 'Caballera Jedi', 'Halcón de hierro', '#5AA9FF'],
  [5000, 'Maestra Jedi', 'Crucero Oruga', '#B57BFF'],
  [10000, 'Miembro del Consejo', 'Acorazado Marialópoda', '#FFC531'],
  [20000, 'Gran Maestra', 'Estrella de la Fuerza', '#F4F4FF'],
  [50000, 'Leyenda de la Fuerza', 'Leyenda de la galaxia', '#FF7DB0']
];

// ---------- Reglas ----------
function viaje(toneladas) {
  const recorrido = Math.max(0, toneladas) / TONELADAS_POR_PLANETA, indice = Math.floor(recorrido);
  return { indice, avance: recorrido - indice, falta: (indice + 1) * TONELADAS_POR_PLANETA - toneladas };
}
function rangoDe(toneladas) {
  let i = 0;
  while (i + 1 < RANGOS.length && toneladas >= RANGOS[i + 1][0]) i++;
  const [desde, nombre, nave, color] = RANGOS[i], s = RANGOS[i + 1];
  return { i, nombre, nave, color, avance: s ? (toneladas - desde) / (s[0] - desde) : 1, siguiente: s ? { en: s[0], nombre: s[1], nave: s[2] } : null };
}
const sectorDe = (i) => Math.floor(i / PLANETAS_POR_SECTOR);
function nombreSector(s) {
  const vuelta = Math.floor(s / SECTORES.length);
  return `${SECTORES[s % SECTORES.length]}${vuelta ? ` ${vuelta + 1}` : ''}`;
}
function planetaDe(i) {
  const capital = (i + 1) % PLANETAS_POR_SECTOR === 0;
  const rasgos = { i, capital, anillo: capital || i % 3 === 0, luna: i % 4 === 1, bandas: i % 3 };
  if (i < FRASES.planetas.length) {
    const [nombre, color, frase] = FRASES.planetas[i].split('|');
    return { ...rasgos, nombre, color, frase };
  }
  const a = ['Ka', 'Zo', 'Mi', 'Lu', 'Ve', 'Ta', 'No', 'Ri', 'Dra', 'Sa', 'Be', 'Or'], b = ['ri', 'lo', 'na', 'ra', 'mi', 'do', 've', 'sha', 'tu', 'ga'], c = ['a', 'on', 'is', 'ar', 'ia', 'os', 'ine', 'oo', 'um'];
  return { ...rasgos, nombre: `${a[i % 12]}${b[(i * 7) % 10]}${c[(i * 5) % 9]}`, color: `hsl(${Math.round((i * 137.508) % 360)},60%,62%)`, frase: FRASES.exploracion[i % FRASES.exploracion.length] };
}
// El primer aliado va de serie y luego llega uno cada 500 toneladas. Cuando se acaba la lista, se unen pilotos.
function aliadoDe(k) {
  if (k < FRASES.aliados.length) {
    const [nombre, emoji, frase] = FRASES.aliados[k].split('|');
    return { k, nombre, emoji, frase };
  }
  return { k, nombre: `Piloto del Escuadrón Rosa ${k - FRASES.aliados.length + 1}`, emoji: '🚀', frase: 'Se ha unido a tu flota al oír lo que levantas.', piloto: true };
}
const cuantosAliados = (toneladas) => Math.floor(Math.max(0, toneladas) / TONELADAS_POR_ALIADO) + 1;
const escoltaDe = (toneladas) => Math.min(ESCOLTA_MAXIMA, Math.floor(Math.max(0, toneladas) / TONELADAS_POR_ALIADO));

// ---------- Dibujos ----------
const NAVE = {
  cuerpo: 'M0 -20C6 -12 9 -2 8 11L-8 11C-9 -2 -6 -12 0 -20Z',
  alas: 'M-7 0L-20 13L-7 11ZM7 0L20 13L7 11Z',
  alas2: 'M-8 -6L-25 3L-20 13L-8 4ZM8 -6L25 3L20 13L8 4Z',
  alas3: 'M-5 7L-13 21L-3 12ZM5 7L13 21L3 12Z'
};
function svgNave(color, rango) {
  return `${rango >= 3 ? `<path d="${NAVE.alas3}" fill="#FFC531"/>` : ''}${rango >= 1 ? `<path d="${NAVE.alas2}" fill="${color}" opacity=".65"/>` : ''}<path d="${NAVE.alas}" fill="${color}"/><path d="${NAVE.cuerpo}" fill="${color}"/><path d="${NAVE.cuerpo}" fill="#fff" opacity=".2"/><circle cy="-6" r="3.6" fill="#BFEFFF"/>`;
}
const SVG_GROGU = '<g><path d="M-14 -4 L-5 -3 L-5 3 Z M14 -4 L5 -3 L5 3 Z" fill="#8DBF7A"/><circle r="6.5" fill="#A5D391"/><circle cx="-2.5" cy="-.5" r="1.6" fill="#231528"/><circle cx="2.5" cy="-.5" r="1.6" fill="#231528"/></g>';
function svgPlaneta(p, x, y, r) {
  const bandas = p.bandas ? `<ellipse cx="${x}" cy="${y - r * 0.28}" rx="${r * 0.86}" ry="${r * 0.13}" fill="#000" opacity=".14"/>${p.bandas > 1 ? `<ellipse cx="${x}" cy="${y + r * 0.34}" rx="${r * 0.82}" ry="${r * 0.15}" fill="#fff" opacity=".16"/>` : ''}` : '';
  const anillo = p.anillo ? `<ellipse cx="${x}" cy="${y}" rx="${r * 1.55}" ry="${r * 0.42}" fill="none" stroke="#FFE7B8" stroke-width="2" opacity=".85" transform="rotate(-18 ${x} ${y})"/>` : '';
  const luna = p.luna ? `<circle cx="${x + r * 1.15}" cy="${y - r * 0.9}" r="${r * 0.2}" fill="#E7DFF0"/>` : '';
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="${p.color}"/>${bandas}<circle cx="${x - r * 0.32}" cy="${y - r * 0.36}" r="${r * 0.2}" fill="#fff" opacity=".35"/>${anillo}${luna}`;
}
const ANCHO_ESCENA = 360, ALTO_ESCENA = 176;
function estrellasEscena(cuantas, base) {
  const puntos = Array.from({ length: cuantas }, (_, k) => `<circle cx="${(reparto(k, base) * ANCHO_ESCENA).toFixed(0)}" cy="${(reparto(k, 0.5698) * ALTO_ESCENA).toFixed(0)}" r="${k % 5 ? 0.9 : 1.5}" fill="#fff"/>`).join('');
  return `${puntos}<g transform="translate(${ANCHO_ESCENA} 0)">${puntos}</g>`;
}
// La escena crece sola: más toneladas, más escolta alrededor de la nave y el planeta de destino cada vez más cerca.
function pintarEscena(toneladas) {
  const v = viaje(toneladas), r = rangoDe(toneladas), destino = planetaDe(v.indice + 1), n = escoltaDe(toneladas);
  const escolta = Array.from({ length: n }, (_, k) => {
    const fila = Math.floor(k / 2) + 1, lado = k % 2 ? 1 : -1;
    return `<g transform="translate(${118 - fila * 22} ${88 + lado * fila * 15}) rotate(90) scale(.38)"><g class="vaiven" style="animation-delay:-${(k * 0.37).toFixed(2)}s">${svgNave(r.color, 0)}</g></g>`;
  }).join('');
  return `<svg class="escena" viewBox="0 0 ${ANCHO_ESCENA} ${ALTO_ESCENA}" role="img" aria-label="Tu flota, con ${n} naves de escolta, rumbo a ${esc(destino.nombre)}">
    <g class="fondo-lento" opacity=".55">${estrellasEscena(24, 0.7548)}</g><g class="fondo-rapido">${estrellasEscena(14, 0.3247)}</g>
    <g data-gal="destino" class="toca">${svgPlaneta(destino, 300, 88, 15 + v.avance * 36)}</g>
    ${escolta}
    <g data-gal="nave" class="toca"><circle cx="124" cy="88" r="32" fill="transparent"/><g transform="translate(124 88)"><g id="nave-gorda" class="vaiven"><g transform="rotate(90)"><path class="llama" d="M-5 11L0 25L5 11Z" fill="#FFB347"/>${svgNave('#FF7DB0', r.i)}</g></g></g>
      <g transform="translate(150 60)"><g class="vaiven lento" style="animation-delay:-1s"><circle r="11" fill="#E8E2EF"/><g transform="scale(.8)">${SVG_GROGU}</g></g></g></g>
  </svg>`;
}
function pintarSable(r) {
  const largo = Math.max(14, r.avance * 268);
  return `<button type="button" class="sable" data-gal="sable" aria-label="${esc(r.nombre)}: ${Math.round(r.avance * 100)} por ciento del camino al siguiente rango"><svg viewBox="0 0 360 40" aria-hidden="true">
    <rect x="62" y="14" width="${268}" height="12" rx="6" fill="#fff" opacity=".07"/>
    <g id="hoja"><rect x="62" y="11" width="${largo.toFixed(1)}" height="18" rx="9" fill="${r.color}" opacity=".35"/><rect x="62" y="14" width="${largo.toFixed(1)}" height="12" rx="6" fill="${r.color}"/><rect x="62" y="17" width="${largo.toFixed(1)}" height="6" rx="3" fill="#fff"/></g>
    <rect x="8" y="12" width="54" height="16" rx="3" fill="#B9BCC6"/><rect x="16" y="12" width="6" height="16" fill="#54586A"/><rect x="28" y="12" width="6" height="16" fill="#54586A"/><rect x="42" y="9" width="12" height="22" rx="2" fill="#7A7E8E"/><circle cx="48" cy="20" r="2.5" fill="#FF5C7A"/>
  </svg></button>`;
}
const RUTA = [[42, 58], [106, 34], [172, 62], [240, 36], [312, 66], [270, 128], [188, 112], [100, 142]];
function pintarMapa(v, sector, visitados) {
  const base = sector * PLANETAS_POR_SECTOR;
  const camino = RUTA.map(([x, y]) => `${x} ${y}`).join('L');
  const estrellas = Array.from({ length: 34 }, (_, k) => `<circle class="${k % 3 ? '' : 'titila'}" cx="${(reparto(k, 0.7548776662) * 360).toFixed(0)}" cy="${(reparto(k, 0.5698402910) * 178).toFixed(0)}" r="${k % 5 ? 0.8 : 1.4}" fill="#fff" opacity=".8"/>`).join('');
  const dibujo = RUTA.map(([x, y], k) => {
    const p = planetaDe(base + k), r = p.capital ? 19 : 12 + (entero(p.nombre) % 4), visto = p.i <= v.indice, sello = visitados.includes(p.i);
    return `<g data-gal="planeta" data-i="${p.i}" class="toca"><circle cx="${x}" cy="${y}" r="24" fill="transparent"/>
      ${visto ? svgPlaneta(p, x, y, r) : `<circle cx="${x}" cy="${y}" r="${r}" fill="#2A1A47" stroke="#6A5A8E" stroke-dasharray="3 3"/><text x="${x}" y="${y + 5}" text-anchor="middle" fill="#A99BC4" style="font-size:14px">?</text>`}
      ${sello ? `<text x="${x + r * 0.5}" y="${y - r * 0.5}" style="font-size:13px">🚩</text>` : ''}
      ${visto && !sello ? `<circle class="pulso" cx="${x}" cy="${y}" r="${r + 4}" fill="none" stroke="#FFC531" stroke-width="1.5"/>` : ''}</g>`;
  }).join('');
  return `<svg class="mapa" viewBox="0 0 360 178" role="img" aria-label="${esc(nombreSector(sector))}">${estrellas}<path d="M${camino}" fill="none" stroke="#8B7BB5" stroke-width="1.5" stroke-dasharray="3 6"/>${dibujo}</svg>`;
}

// ---------- La tarjeta ----------
let sectorVisto = null, fichaGalaxia = '';
const leerSellos = () => { const s = leer('sellos', []); return Array.isArray(s) ? s : []; };
function cuerpoGalaxia() {
  const d = datosMundo(estado.filas), t = d.toneladas, v = viaje(t), r = rangoDe(t), sellos = leerSellos();
  const ultimo = sectorDe(v.indice), sector = Math.min(sectorVisto === null ? ultimo : sectorVisto, ultimo);
  const siguiente = planetaDe(v.indice + 1), nuevos = v.indice + 1 - sellos.filter((i) => i <= v.indice).length;
  const enSector = Array.from({ length: PLANETAS_POR_SECTOR }, (_, k) => sector * PLANETAS_POR_SECTOR + k);
  const medalla = enSector.every((i) => sellos.includes(i)) ? ' 🏅' : '';
  const n = cuantosAliados(t), conNombre = Math.min(n, FRASES.aliados.length), pilotos = n - conNombre;
  const aliados = Array.from({ length: conNombre }, (_, k) => { const a = aliadoDe(k); return `<button type="button" data-gal="aliado" data-i="${k}" aria-label="${esc(a.nombre)}">${a.emoji}</button>`; }).join('');
  const faltaAliado = n * TONELADAS_POR_ALIADO - t, proximo = aliadoDe(n);
  return `<h2 class="gorda">${esc(r.nombre)}</h2>
    <p class="mundo-dato">${miles(t)} toneladas levantadas, como ${miles(Math.max(1, t / 100))} Halcones Milenarios.</p>
    ${pintarEscena(t)}
    <div class="barra-nivel" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(v.avance * 100)}"><i style="width:${v.avance * 100}%"></i></div>
    <p class="mundo-dato">${miles(Math.max(1, v.falta))} toneladas más y descubres <b>${esc(siguiente.nombre)}</b>, como ${miles(Math.max(1, v.falta / 5))} elefantes.</p>
    <button type="button" class="principal" data-gal="saltar">🌌 Saltar al hiperespacio</button>
    <button type="button" class="ver-mas" data-gal="revivir">▶ Revivir todo mi viaje</button>
    ${pintarSable(r)}
    <p class="mundo-dato">${r.siguiente ? `A ${miles(r.siguiente.en)} toneladas serás <b>${esc(r.siguiente.nombre)}</b>, con ${esc(r.siguiente.nave)}.` : 'Ya no quedan rangos: la Fuerza eres tú.'} Tu nave: <b>${esc(r.nave)}</b>.</p>
    <div class="sector"><button type="button" data-gal="sector" data-i="${sector - 1}" aria-label="Sector anterior" ${sector ? '' : 'disabled'}>‹</button><b>${esc(nombreSector(sector))}${medalla}</b><button type="button" data-gal="sector" data-i="${sector + 1}" aria-label="Sector siguiente" ${sector < ultimo ? '' : 'disabled'}>›</button></div>
    ${pintarMapa(v, sector, sellos)}
    <p class="mundo-dato" id="ficha-galaxia">${fichaGalaxia || (nuevos ? `Toca un planeta para saltar hasta él. Te quedan ${miles(nuevos)} por visitar.` : 'Has visitado todos tus planetas. Entrena para descubrir más.')}</p>
    <h3 class="aliados-titulo">Tu flota</h3>
    <div class="aliados">${aliados}${pilotos ? `<span>+ ${miles(pilotos)} 🚀</span>` : ''}</div>
    <p class="mundo-dato" id="ficha-aliado">Dentro de ${miles(Math.max(1, faltaAliado))} toneladas se une ${proximo.piloto ? 'otro piloto' : 'alguien más'} a tu flota.</p>`;
}
function pintarGalaxia() { return `<section class="tarjeta-mundo galaxia" id="caja-galaxia">${cuerpoGalaxia()}</section>`; }
function refrescarGalaxia() { const c = document.getElementById('caja-galaxia'); if (c) c.innerHTML = cuerpoGalaxia(); }

// ---------- Hiperespacio ----------
let hiper = null;
function cerrarHiper() {
  if (!hiper) return;
  hiper.vivo = false;
  clearTimeout(hiper.crono);
  hiper.raiz.remove();
  hiper = null;
  refrescarGalaxia();
}
function animarEstelas(h) {
  const canvas = h.raiz.querySelector('canvas'), x = canvas.getContext('2d');
  const k = Math.min(2, window.devicePixelRatio || 1), W = (canvas.width = h.raiz.clientWidth * k), H = (canvas.height = h.raiz.clientHeight * k);
  const estrellas = Array.from({ length: 180 }, () => ({ a: Math.random() * 7, d: 0.05 + Math.random(), z: Math.random() }));
  let antes = 0;
  const paso = (ahora) => {
    if (!h.vivo) return;
    const dt = antes ? Math.min(0.05, (ahora - antes) / 1000) : 0.016;
    antes = ahora;
    h.vel += (h.meta - h.vel) * Math.min(1, dt * 2.5);
    x.fillStyle = 'rgba(10,4,28,.55)'; x.fillRect(0, 0, W, H);
    x.lineCap = 'round'; x.lineWidth = 1.5 * k;
    const R = Math.max(W, H) * 0.75;
    for (const s of estrellas) {
      const z0 = s.z;
      s.z += h.vel * dt * (0.4 + s.z);
      if (s.z > 1) { s.z = 0.02; s.a = Math.random() * 7; s.d = 0.05 + Math.random(); continue; }
      const c = Math.cos(s.a) * s.d * R, e = Math.sin(s.a) * s.d * R;
      x.strokeStyle = `rgba(${s.d > 0.6 ? '190,225,255' : '255,255,255'},${Math.min(1, s.z * 2.2)})`;
      x.beginPath(); x.moveTo(W / 2 + c * z0 * z0, H / 2 + e * z0 * z0); x.lineTo(W / 2 + c * s.z * s.z, H / 2 + e * s.z * s.z); x.stroke();
    }
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
function abrirHiper() {
  pararBosque();
  const raiz = document.createElement('div');
  raiz.id = 'hiper';
  raiz.innerHTML = '<canvas aria-hidden="true"></canvas><div class="h-centro"></div><button type="button" class="h-salir" data-gal="cerrar-hiper" aria-label="Volver a la galaxia">✕</button>';
  document.body.appendChild(raiz);
  hiper = { raiz, vivo: true, vel: 0.15, meta: 2.6, crono: 0 };
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) animarEstelas(hiper);
  return hiper;
}
function llegada(h, p, nuevoSello) {
  h.meta = 0.05;
  h.raiz.classList.add('destello');
  const c = h.raiz.querySelector('.h-centro');
  c.innerHTML = `<div class="h-llegada"><svg viewBox="0 0 220 170" width="220" height="170" aria-hidden="true">${svgPlaneta(p, 110, 85, 56)}</svg>
    <h2 class="gorda">${esc(p.nombre)}</h2><p class="h-sector">${esc(nombreSector(sectorDe(p.i)))}${nuevoSello ? ' · 🚩 Planeta visitado' : ''}</p><p>${esc(p.frase)}</p>
    <button type="button" class="principal" data-gal="cerrar-hiper">Seguir explorando</button></div>`;
  if (nuevoSello) confeti();
}
function saltarA(i) {
  if (hiper) return;
  const h = abrirHiper(), p = planetaDe(i), sellos = leerSellos(), nuevo = !sellos.includes(i);
  if (nuevo) { sellos.push(i); guardar('sellos', sellos); }
  fichaGalaxia = '';
  h.raiz.querySelector('.h-centro').innerHTML = `<p class="h-rumbo">Rumbo a ${esc(p.nombre)}</p>`;
  h.crono = setTimeout(() => llegada(h, p, nuevo), 1900);
}
// Repasa toda su historia en unos 14 segundos, sea cual sea su longitud, celebrando rangos y aliados por el camino.
function revivirViaje() {
  if (hiper) return;
  const t = datosMundo(estado.filas).toneladas, total = viaje(t).indice + 1, h = abrirHiper(), c = h.raiz.querySelector('.h-centro');
  h.meta = 1.5;
  const espera = Math.max(120, Math.min(800, 14000 / total)), salto = Math.max(1, Math.ceil(total / 110));
  let i = 0;
  const paso = () => {
    if (!h.vivo) return;
    const ton = i * TONELADAS_POR_PLANETA, p = planetaDe(i);
    const rango = RANGOS.find(([en]) => en && en > Math.max(0, i - salto) * TONELADAS_POR_PLANETA && en <= ton);
    const aliado = i && Math.floor(ton / TONELADAS_POR_ALIADO) > Math.floor(Math.max(0, i - salto) * TONELADAS_POR_PLANETA / TONELADAS_POR_ALIADO) ? aliadoDe(Math.floor(ton / TONELADAS_POR_ALIADO)) : null;
    c.innerHTML = `<div class="h-viaje"><svg viewBox="0 0 160 130" width="160" height="130" aria-hidden="true">${svgPlaneta(p, 80, 65, 42)}</svg><b>${esc(p.nombre)}</b><span>${miles(ton)} toneladas</span>
      ${rango ? `<em>🗡️ Ahora eres ${esc(rango[1])}</em>` : aliado ? `<em>${aliado.emoji} Se une ${esc(aliado.nombre)}</em>` : ''}</div>`;
    if (i >= total - 1) { h.crono = setTimeout(() => { if (h.vivo) llegada(h, { ...planetaDe(total - 1), frase: `Y aquí sigues: ${miles(t)} toneladas, ${total} planetas y una flota entera detrás. Este es el camino.` }, false); confeti(); }, 900); return; }
    i = Math.min(total - 1, i + salto);
    h.crono = setTimeout(paso, rango || aliado ? Math.max(espera, 650) : espera);
  };
  paso();
}

if (typeof document !== 'undefined') {
  // Lo que guardó el juego de la versión anterior ya no sirve para nada.
  try { localStorage.removeItem('mlp.galaxia'); } catch { /* sin almacenamiento no hay nada que limpiar */ }
  document.addEventListener('click', (ev) => {
    const t = ev.target.closest('[data-gal]');
    if (!t || t.disabled) return;
    const que = t.dataset.gal, toneladas = () => datosMundo(estado.filas).toneladas;
    if (que === 'saltar') saltarA(viaje(toneladas()).indice);
    else if (que === 'revivir') revivirViaje();
    else if (que === 'cerrar-hiper') cerrarHiper();
    else if (que === 'sector') { sectorVisto = +t.dataset.i; fichaGalaxia = ''; refrescarGalaxia(); }
    else if (que === 'planeta') {
      const i = +t.dataset.i, v = viaje(toneladas());
      if (i <= v.indice) saltarA(i);
      else { fichaGalaxia = `<b>Sin descubrir.</b> Llegarás a ${miles(i * TONELADAS_POR_PLANETA)} toneladas.`; document.getElementById('ficha-galaxia').innerHTML = fichaGalaxia; }
    } else if (que === 'aliado') {
      const a = aliadoDe(+t.dataset.i);
      document.getElementById('ficha-aliado').innerHTML = `<b>${esc(a.nombre)}.</b> ${esc(a.frase)}`;
    } else if (que === 'nave') {
      const n = document.getElementById('nave-gorda');
      n.classList.remove('pirueta'); void n.getBoundingClientRect(); n.classList.add('pirueta');
      decir(azar(FRASES.copiloto));
    } else if (que === 'destino') {
      const v = viaje(toneladas());
      decir(`${planetaDe(v.indice + 1).nombre}: a ${miles(Math.max(1, v.falta))} toneladas.`);
    } else if (que === 'sable') {
      const h = document.getElementById('hoja'), r = rangoDe(toneladas());
      h.classList.remove('enciende'); void h.getBoundingClientRect(); h.classList.add('enciende');
      decir(r.siguiente ? `Faltan ${miles(Math.max(1, r.siguiente.en - toneladas()))} toneladas para ${r.siguiente.nombre}.` : 'Que la Fuerza te acompañe, Leyenda.');
    }
  });
}
