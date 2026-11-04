// El bosque de Marialópoda: un solo paisaje que nunca deja de crecer.
// Cada semana con entrenos planta un árbol en un sitio fijo, y los árboles siguen creciendo con los años.
// Lo demás llega con los entrenos acumulados, así que con tiempo todo se vuelve más grande y más vivo.

const ANCHO = 360, ALTO = 340, HORIZONTE = 104, FONDO = 318;
const ETAPAS = [[0, 'Un brote'], [25, 'Un claro'], [100, 'Arboleda'], [250, 'Bosque joven'], [500, 'Bosque frondoso'], [750, 'Bosque antiguo'], [1000, 'Bosque majestuoso'], [1500, 'Gran bosque'], [2000, 'Bosque legendario'], [3000, 'Reino del bosque'], [5000, 'Bosque eterno']];
const MARAVILLAS = [[25, 'flores silvestres', '🌼'], [50, 'mariposas', '🦋'], [100, 'abejas', '🐝'], [150, 'pájaros', '🐦'], [200, 'montañas', '⛰️'], [300, 'un río', '🏞️'], [400, 'un arcoíris', '🌈'], [600, 'una cascada', '💦'], [800, 'luciérnagas', '✨'], [1200, 'nubes de pétalos', '🌸'], [1600, 'una aurora', '🌌']];
const ANIMALES = ['🐕', '🐘', '🐿️', '🦔', '🐇', '🦌', '🦉', '🐞', '🦊', '🦢', '🐢', '🦜', '🐑', '🦚', '🐻', '🦩'];
const LUGARES = ['🏡', '⛲', '🏰', '🎡', '🗼', '🛕', '🎠'];
const ESTACION = (mes) => (mes < 2 || mes === 11 ? 'invierno' : mes < 5 ? 'primavera' : mes < 8 ? 'verano' : 'otono');
const ESPECIES = { primavera: ['cerezo', 'magnolio'], verano: ['roble', 'abedul'], otono: ['arce', 'haya'], invierno: ['pino', 'abeto'] };

function etapaDe(entrenos) {
  let i = 0;
  while (i + 1 < ETAPAS.length && entrenos >= ETAPAS[i + 1][0]) i++;
  return { nombre: ETAPAS[i][1], siguiente: ETAPAS[i + 1] ? { en: ETAPAS[i + 1][0], nombre: ETAPAS[i + 1][1] } : null };
}

// Cada 100 entrenos llega un animal y cada 500 un lugar. Las listas dan la vuelta: siempre llega alguien más.
function habitanteDe(k) {
  if (k % 500 === 0) return { k, emoji: LUGARES[(k / 500 - 1) % LUGARES.length], lugar: true };
  return { k, emoji: ANIMALES[(k / 100 - 1 - Math.floor(k / 500)) % ANIMALES.length], lugar: false };
}
function habitantesHasta(entrenos) {
  const lista = [];
  for (let k = 100; k <= entrenos; k += 100) lista.push(habitanteDe(k));
  return lista;
}
// Lo próximo que traerá el bosque: un habitante, una maravilla o una etapa nueva.
function proximoRegalo(entrenos) {
  const k = (Math.floor(entrenos / 100) + 1) * 100;
  const opciones = [{ en: k, texto: habitanteDe(k).emoji }];
  const m = MARAVILLAS.find((x) => x[0] > entrenos);
  if (m) opciones.push({ en: m[0], texto: `${m[2]} ${m[1]}` });
  const e = etapaDe(entrenos).siguiente;
  if (e) opciones.push({ en: e.en, texto: e.nombre });
  return opciones.sort((a, b) => a.en - b.en)[0];
}
// Qué ha llegado entre dos recuentos, para celebrarlo.
function novedadesBosque(antes, ahora) {
  const nuevas = [];
  for (const [en, nombre] of ETAPAS) if (en > antes && en <= ahora) nuevas.push({ titulo: 'Tu bosque ha cambiado', grande: nombre, emoji: '🌳' });
  for (const [en, nombre, emoji] of MARAVILLAS) if (en > antes && en <= ahora) nuevas.push({ titulo: 'Algo nuevo en tu bosque', grande: emoji, texto: `Han llegado ${nombre}.` });
  for (let k = (Math.floor(antes / 100) + 1) * 100; k <= ahora; k += 100) nuevas.push({ titulo: 'Alguien ha llegado a tu bosque', grande: habitanteDe(k).emoji, texto: `Entreno número ${k}.` });
  return nuevas;
}

// Secuencias áureas: cada punto nuevo cae en el hueco más libre, sin cambiar los anteriores.
const reparto = (i, base) => ((i + 1) * base) % 1;
const centroRio = (y) => 186 + 46 * Math.sin((y - HORIZONTE) / 62);
const anchoRio = (y) => 3 + (y - HORIZONTE) * 0.1;
function posicionEn(i) {
  const y = HORIZONTE + 6 + reparto(i, 0.7548776662) * (FONDO - HORIZONTE - 6);
  let x = 6 + reparto(i, 0.5698402910) * (ANCHO - 12);
  const c = centroRio(y), w = anchoRio(y) + 7;
  if (Math.abs(x - c) < w) x = x < c ? c - w : c + w;
  return { x, y };
}
const perspectiva = (y) => 0.34 + ((y - HORIZONTE) / (FONDO - HORIZONTE)) * 0.82;
// Un árbol sigue creciendo varios años; luego llega a su tamaño de árbol viejo.
const porEdad = (anios) => Math.min(1.34, 0.52 + anios * 0.3);

const copa = (c1, c2, c3) => `<rect x="17" y="30" width="6" height="26" rx="2" fill="#6B3E20"/><path d="M20 56v-16" stroke="#54301A" stroke-width="2"/><circle cx="20" cy="16" r="15" fill="${c1}"/><circle cx="8" cy="28" r="9.5" fill="${c2}"/><circle cx="32" cy="28" r="9.5" fill="${c3}"/><circle cx="20" cy="30" r="12" fill="${c1}"/><circle cx="15" cy="11" r="5" fill="#fff" opacity=".18"/>`;
const conifera = (c1, c2, nieve) => `<rect x="17" y="46" width="6" height="10" rx="2" fill="#5C3519"/><path d="M20 1 L33 22 H7 Z" fill="${nieve || c1}"/><path d="M20 12 L36 36 H4 Z" fill="${c1}"/><path d="M20 24 L39 48 H1 Z" fill="${c2}"/>${nieve ? '<path d="M20 12 L27 22 Q20 19 13 22 Z" fill="#F2F7FB"/>' : ''}`;
const simbolo = (id, dentro) => `<symbol id="a-${id}" viewBox="0 0 40 56">${dentro}</symbol>`;
const DEFINICIONES = `<defs>
  <linearGradient id="b-cielo" x2="0" y2="1"><stop offset="0" stop-color="#3B2A6E"/><stop offset=".6" stop-color="#C7669A"/><stop offset="1" stop-color="#FFC59A"/></linearGradient>
  <linearGradient id="b-suelo" x2="0" y2="1"><stop offset="0" stop-color="#6FAE6A"/><stop offset=".45" stop-color="#3F8F54"/><stop offset="1" stop-color="#1F6340"/></linearGradient>
  <linearGradient id="b-rio" x2="0" y2="1"><stop offset="0" stop-color="#BFE6F2"/><stop offset="1" stop-color="#4AA6C9"/></linearGradient>
  ${simbolo('cerezo', copa('#FF9DC4', '#FFB7D3', '#FF7DB0'))}${simbolo('magnolio', copa('#F7D6E8', '#FFFFFF', '#F2B6D4'))}
  ${simbolo('roble', copa('#2FA85C', '#3DBF6E', '#238A4A'))}${simbolo('abedul', `<rect x="18" y="26" width="4" height="30" rx="2" fill="#EDEFF2"/><path d="M18 36h2M20 44h2" stroke="#444"/><circle cx="20" cy="15" r="14" fill="#8CCF5F"/><circle cx="10" cy="26" r="8" fill="#A5DC73"/><circle cx="30" cy="26" r="8" fill="#76BC4C"/>`)}
  ${simbolo('arce', copa('#F08A24', '#FFC531', '#D9531E'))}${simbolo('haya', copa('#C9602B', '#E08A3C', '#A8431F'))}
  ${simbolo('pino', conifera('#2C6E5A', '#23594A', '#E8F1F8'))}${simbolo('abeto', conifera('#1F6B50', '#175640'))}
  ${simbolo('gigante', `<rect x="15" y="28" width="10" height="28" rx="3" fill="#6B3E20"/><circle cx="20" cy="15" r="15" fill="#E8B923"/><circle cx="7" cy="27" r="10" fill="#FFD54A"/><circle cx="33" cy="27" r="10" fill="#D9A21B"/><circle cx="20" cy="29" r="12" fill="#F2C531"/><circle cx="14" cy="10" r="4" fill="#fff" opacity=".5"/>`)}
</defs>`;

// Puntos de color dibujados de un trazo: cientos de flores cuestan lo mismo que una.
function floresDe(cuantas) {
  const colores = ['#FFF4F8', '#FFC531', '#FF7DB0', '#C69CFF', '#FF6B6B'];
  const trazos = colores.map(() => []);
  for (let i = 0; i < cuantas; i++) {
    const y = HORIZONTE + 3 + reparto(i, 0.3819660113) * (ALTO - HORIZONTE - 5), x = reparto(i, 0.8191725134) * ANCHO;
    if (Math.abs(x - centroRio(y)) < anchoRio(y) + 2) continue;
    trazos[i % colores.length].push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
  }
  return colores.map((c, i) => `<path d="${trazos[i].join('')}" stroke="${c}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`).join('');
}
function repetir(n, hacer) { return Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => hacer(i)).join(''); }

// semanas: lista [lunes, entrenos] en orden. hasta: última semana que se pinta, para poder viajar en el tiempo.
function escenaBosque(semanas, hasta, esActual, objetivo) {
  const vivas = semanas.slice(0, hasta + 1);
  const entrenos = vivas.reduce((s, x) => s + x[1], 0);
  const hoy = vivas.length ? new Date(`${vivas[vivas.length - 1][0]}T12:00:00Z`).getTime() : 0;
  const tiene = (n) => entrenos >= n;
  const anioVisto = new Set();
  const arboles = vivas.map(([lunes, n], i) => {
    const anio = lunes.slice(0, 4), primero = !anioVisto.has(anio);
    anioVisto.add(anio);
    const { x, y } = posicionEn(i);
    const lista = ESPECIES[ESTACION(+lunes.slice(5, 7) - 1)];
    const edad = (hoy - new Date(`${lunes}T12:00:00Z`).getTime()) / (365.25 * 864e5);
    const empuje = primero ? 1.3 : 0.84 + Math.min(n, 5) * 0.06;
    return { lunes, n, x, y, primero, especie: primero ? 'gigante' : lista[i % 2], s: perspectiva(y) * porEdad(edad) * empuje, ultima: esActual && i === vivas.length - 1 };
  }).sort((a, b) => a.y - b.y);
  const bruma = (y) => `<rect y="${HORIZONTE}" width="${ANCHO}" height="${y - HORIZONTE}" fill="#E9D3F2" opacity=".1"/>`;
  let dibujo = '', franja = 0;
  const franjas = [HORIZONTE + 70, HORIZONTE + 140];
  for (const a of arboles) {
    if (franja < 2 && a.y > franjas[franja]) { dibujo += bruma(franjas[franja]); franja++; }
    const w = 40 * a.s, h = 56 * a.s;
    const flor = a.n >= objetivo && !a.primero ? `<text x="${(a.x + w * 0.28).toFixed(1)}" y="${a.y.toFixed(1)}" style="font-size:${(8 + a.s * 5).toFixed(1)}px">🌻</text>` : '';
    dibujo += `<g data-semana="${a.lunes}" data-n="${a.n}"${a.ultima ? ' class="crece"' : ''}><ellipse cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" rx="${(w * 0.42).toFixed(1)}" ry="${(w * 0.11).toFixed(1)}" fill="#0F3D28" opacity=".3"/><use href="#a-${a.especie}" x="${(a.x - w / 2).toFixed(1)}" y="${(a.y - h).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>${flor}</g>`;
  }
  const habitantes = habitantesHasta(entrenos).map((m) => {
    const y = HORIZONTE + 22 + reparto(m.k / 100, 0.6180339887) * (FONDO - HORIZONTE - 18);
    const x = 14 + reparto(m.k / 100, 0.4142135624) * (ANCHO - 28), s = perspectiva(y);
    return `<text class="${m.lugar ? '' : 'vive'}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" style="font-size:${((m.lugar ? 34 : 19) * s + 5).toFixed(1)}px;animation-delay:-${(m.k / 100) % 5}s">${m.emoji}</text>`;
  }).join('');
  const puntosRio = [];
  for (let y = HORIZONTE; y <= ALTO; y += 12) puntosRio.push([y, centroRio(y), anchoRio(y)]);
  const rio = tiene(300) ? `<path d="M${puntosRio.map(([y, c, w]) => `${(c - w).toFixed(1)} ${y}`).join('L')}L${puntosRio.reverse().map(([y, c, w]) => `${(c + w).toFixed(1)} ${y}`).join('L')}Z" fill="url(#b-rio)"/>` : '';
  const brillo = (i) => `<circle class="luz" cx="${(reparto(i, 0.7071) * ANCHO).toFixed(1)}" cy="${(HORIZONTE + 20 + reparto(i, 0.3247) * 200).toFixed(1)}" r="1.8" fill="#FFF7A8" style="animation-delay:-${(i % 7) * 0.6}s"/>`;
  return `<svg class="bosque" viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${esc(etapaDe(entrenos).nombre)}: ${vivas.length} árboles y ${habitantesHasta(entrenos).length} habitantes">${DEFINICIONES}
    <rect width="${ANCHO}" height="${HORIZONTE + 6}" fill="url(#b-cielo)"/><circle cx="288" cy="38" r="17" fill="#FFF0B8"/><circle cx="288" cy="38" r="27" fill="#FFF0B8" opacity=".2"/>
    ${tiene(1600) ? '<path d="M0 34 Q90 4 180 30 T360 18 V62 Q270 40 180 66 T0 56 Z" fill="#7CFFCB" opacity=".22"/>' : ''}
    <g class="nube" fill="#fff" opacity=".6"><ellipse cx="52" cy="30" rx="22" ry="8"/><ellipse cx="66" cy="24" rx="14" ry="8"/></g><g class="nube lenta" fill="#fff" opacity=".45"><ellipse cx="176" cy="54" rx="20" ry="6"/><ellipse cx="190" cy="50" rx="12" ry="6"/></g>
    ${tiene(400) ? `<g fill="none" stroke-width="3" opacity=".55">${['#FF6B6B', '#FFC531', '#6FE08A', '#6BB7FF', '#C69CFF'].map((c, i) => `<path d="M${50 + i * 4} 106 A${100 - i * 4} ${84 - i * 4} 0 0 1 ${250 - i * 4} 106" stroke="${c}"/>`).join('')}</g>` : ''}
    ${tiene(200) ? '<path d="M0 108 L46 58 L84 92 L132 42 L186 96 L232 60 L280 94 L322 52 L360 92 V110 H0 Z" fill="#6D5A9C"/><path d="M132 42 L118 57 L132 52 L146 58 Z M46 58 L36 69 L47 65 L57 68 Z M322 52 L311 64 L323 60 L334 65 Z" fill="#F2EDF7"/>' : ''}
    <path d="M0 98 Q60 86 130 98 T260 96 T360 94 V110 H0 Z" fill="#7BB779"/>
    ${tiene(600) ? '<path d="M150 108 L164 70 Q168 60 178 60 L194 60 Q204 60 208 70 L224 108 Z" fill="#5A4A86"/><path d="M164 70 Q168 60 178 60 L194 60 Q204 60 208 70 Q186 76 164 70 Z" fill="#7BB779"/><path d="M180 66 L192 66 L190 108 L182 108 Z" fill="#DDF5FB"/><path class="cae" d="M184 66V106M188 66V106" stroke="#fff" stroke-width="1.4" stroke-dasharray="5 7" fill="none"/><ellipse cx="186" cy="107" rx="10" ry="3.2" fill="#fff" opacity=".85"/>' : ''}
    <rect y="${HORIZONTE}" width="${ANCHO}" height="${ALTO - HORIZONTE}" fill="url(#b-suelo)"/>${rio}${floresDe(tiene(25) ? Math.min(520, entrenos / 1.6) : 0)}
    ${dibujo}${habitantes}
    ${tiene(150) ? repetir(Math.min(7, (entrenos - 150) / 120 + 1), (i) => `<path class="pajaro" style="animation-delay:-${i * 3.7}s" transform="translate(0 ${16 + (i * 13) % 58})" d="M0 0 q5 -5 9 0 q4 -5 9 0" stroke="#2B1033" stroke-width="1.6" fill="none"/>`) : ''}
    ${tiene(50) ? repetir(Math.min(12, (entrenos - 50) / 60 + 1), (i) => `<text class="vuela" x="${(reparto(i, 0.4) * ANCHO).toFixed(1)}" y="${(HORIZONTE + 30 + reparto(i, 0.71) * 170).toFixed(1)}" style="font-size:11px;animation-delay:-${i * 1.3}s">🦋</text>`) : ''}
    ${tiene(100) ? repetir(Math.min(16, (entrenos - 100) / 45 + 1), (i) => `<text class="zumba" x="${(reparto(i, 0.27) * ANCHO).toFixed(1)}" y="${(HORIZONTE + 44 + reparto(i, 0.83) * 170).toFixed(1)}" style="font-size:9px;animation-delay:-${i * 0.7}s">🐝</text>`) : ''}
    ${tiene(800) ? repetir(Math.min(30, (entrenos - 800) / 30 + 8), brillo) : ''}
    ${tiene(1200) ? repetir(14, (i) => `<circle class="petalo" cx="${(reparto(i, 0.31) * ANCHO).toFixed(1)}" cy="-8" r="2.2" fill="#FFB7D3" style="animation-delay:-${i * 0.9}s"/>`) : ''}
  </svg>`;
}

function semanasOrdenadas() {
  return [...datosMundo(estado.filas).semanas].sort((a, b) => (a[0] < b[0] ? -1 : 1));
}
function pintarBosque(objetivo) {
  const d = datosMundo(estado.filas), semanas = semanasOrdenadas();
  if (!semanas.length) return '<section class="tarjeta-mundo"><h2 class="gorda">Tu bosque</h2><p class="mundo-dato">Tu primer entreno plantará aquí el primer árbol.</p></section>';
  const etapa = etapaDe(d.entrenos), regalo = proximoRegalo(d.entrenos);
  const falta = regalo.en - d.entrenos, desde = Math.floor(d.entrenos / 100) * 100;
  const gente = habitantesHasta(d.entrenos), pendientes = MARAVILLAS.filter((m) => d.entrenos >= m[0]);
  return `<section class="tarjeta-mundo"><h2 class="gorda">${esc(etapa.nombre)}</h2>
    <div class="marco-bosque" id="escena-bosque">${escenaBosque(semanas, semanas.length - 1, true, objetivo)}</div>
    <div class="tiempo"><button type="button" class="play" data-accion="bosque-play" id="bosque-play" aria-label="Ver crecer el bosque">▶</button>
      <input type="range" id="tiempo-bosque" min="0" max="${semanas.length - 1}" value="${semanas.length - 1}" aria-label="Viajar en el tiempo por tu bosque"><span id="bosque-fecha">Hoy</span></div>
    <p class="mundo-dato" id="bosque-resumen">${resumenBosque(semanas, semanas.length - 1)}</p>
    <div class="barra-nivel" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${d.entrenos - desde}"><i style="width:${Math.min(100, d.entrenos - desde)}%"></i></div>
    <p class="mundo-dato">A ${falta} ${falta === 1 ? 'entreno' : 'entrenos'}: ${esc(regalo.texto)}</p>
    ${gente.length ? `<p class="mundo-dato habitantes">Viven aquí: ${gente.map((g) => g.emoji).join(' ')}</p>` : ''}
    ${pendientes.length ? `<p class="mundo-dato">También tienes: ${pendientes.map((m) => esc(m[1])).join(', ')}.</p>` : ''}
    <p class="mundo-dato">Cada semana planta un árbol, y crece durante años. El primero de cada año es dorado, y las semanas completas traen un girasol. Las que no entrenas, simplemente esperan.</p></section>`;
}
function resumenBosque(semanas, i) {
  const entrenos = semanas.slice(0, i + 1).reduce((s, x) => s + x[1], 0);
  return `${etapaDe(entrenos).nombre}: ${miles(i + 1)} ${i ? 'árboles' : 'árbol'}, ${miles(entrenos)} entrenos`;
}
function verBosqueEn(i) {
  const caja = document.getElementById('escena-bosque');
  if (!caja) return false;
  const semanas = semanasOrdenadas(), ultima = semanas.length - 1;
  caja.innerHTML = escenaBosque(semanas, i, i === ultima, objetivoSemanal());
  document.getElementById('tiempo-bosque').value = i;
  document.getElementById('bosque-fecha').textContent = i === ultima ? 'Hoy' : fechaCorta(semanas[i][0]);
  document.getElementById('bosque-resumen').textContent = resumenBosque(semanas, i);
  return true;
}
// Pasa toda la historia en unos 14 segundos, sea cual sea su longitud.
let cronoBosque = null;
function pararBosque() { clearInterval(cronoBosque); cronoBosque = null; const b = document.getElementById('bosque-play'); if (b) b.textContent = '▶'; }
function reproducirBosque() {
  if (cronoBosque) return pararBosque();
  const ultima = semanasOrdenadas().length - 1;
  let i = 0;
  const salto = Math.max(1, Math.ceil(ultima / 110));
  document.getElementById('bosque-play').textContent = '⏸';
  cronoBosque = setInterval(() => {
    if (!verBosqueEn(Math.min(i, ultima)) || i >= ultima) return pararBosque();
    i += salto;
    return undefined;
  }, 125);
  return undefined;
}
