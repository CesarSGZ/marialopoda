// El mundo de Marialópoda: oruga, mapa del cuerpo, duelos y cumpleaños. El bosque vive en bosque.js y sus animales en vida.js.
// Todo se calcula desde las series apuntadas, sin límite de años.

const NACIO_EN = 1997;
const ES_CUMPLE = (iso) => iso.slice(5) === '08-25';
const entero = (texto) => { let n = 7; for (const c of String(texto)) n = (n * 33 + c.charCodeAt(0)) >>> 0; return n; };

// ---------- Entrenos ----------
const lunesDe = (iso) => {
  const d = new Date(`${iso}T12:00:00Z`);
  return new Date(d.getTime() - ((d.getUTCDay() + 6) % 7) * 864e5).toISOString().slice(0, 10);
};

let memoMundo = { clave: '', datos: null };
function datosMundo(filas) {
  const ultima = filas[filas.length - 1];
  const clave = `${filas.length}|${ultima ? ultima[F.ID] : ''}`;
  if (memoMundo.clave === clave) return memoMundo.datos;
  const fechas = [...new Set(filas.filter((f) => f[F.EJ] !== 'Caminadora').map((f) => f[F.FECHA]))].filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
  const semanas = new Map();
  fechas.forEach((f) => { const l = lunesDe(f); semanas.set(l, (semanas.get(l) || 0) + 1); });
  const kilos = filas.reduce((s, f) => s + (+f[F.KG] || 0) * (+f[F.REPS] || 0), 0);
  memoMundo = { clave, datos: { fechas, semanas, entrenos: fechas.length, toneladas: kilos / 1000 } };
  return memoMundo.datos;
}

// ---------- La oruga ----------
const ENTRENOS_POR_NIVEL = 25;
const NIVEL_MARIPOSA = 40;
function nivelDe(entrenos) {
  return { nivel: Math.floor(entrenos / ENTRENOS_POR_NIVEL) + 1, dentro: entrenos % ENTRENOS_POR_NIVEL, falta: ENTRENOS_POR_NIVEL - (entrenos % ENTRENOS_POR_NIVEL) };
}
function tituloNivel(n) {
  if (n < 10) return 'Oruguita';
  if (n < 20) return 'Oruga entrenada';
  if (n < 30) return 'Oruga fuerte';
  if (n < NIVEL_MARIPOSA - 1) return 'Oruga legendaria';
  if (n === NIVEL_MARIPOSA - 1) return 'Crisálida';
  if (n < 60) return 'Mariposa';
  if (n < 100) return 'Mariposa imperial';
  return 'Mariposa de leyenda';
}
const ACCESORIOS = [
  { n: 10, id: 'cinta', nombre: 'Cinta de campeona' }, { n: 20, id: 'medalla', nombre: 'Medalla' }, { n: 25, id: 'gafas', nombre: 'Gafas de sol' },
  { n: 30, id: 'capa', nombre: 'Capa' }, { n: 35, id: 'sable', nombre: 'Sable de luz' }, { n: NIVEL_MARIPOSA, id: 'alas', nombre: 'Alas de mariposa' },
  { n: 50, id: 'corona', nombre: 'Corona' }
];
const PIEZAS_DETRAS = {
  capa: '<path d="M120 92 Q70 130 62 178 Q104 160 136 168 Z" fill="#7C3AED"/>',
  alas: (n) => { const h = (n * 36) % 360; return `<g class="ala-oruga"><ellipse cx="82" cy="78" rx="44" ry="30" fill="hsl(${h} 85% 68%)" transform="rotate(-24 82 78)"/><ellipse cx="78" cy="136" rx="32" ry="22" fill="hsl(${(h + 40) % 360} 85% 70%)" transform="rotate(18 78 136)"/><circle cx="72" cy="76" r="9" fill="#fff" opacity=".7"/></g>`; }
};
const PIEZAS_DELANTE = {
  cinta: '<path d="M111 88 Q145 70 179 88 L179 96 Q145 78 111 96 Z" fill="#E5344B"/>',
  medalla: '<path d="M116 134 L122 150 L128 134 Z" fill="#2F6BFF"/><circle cx="122" cy="155" r="8" fill="#FFC531" stroke="#B8860B"/>',
  gafas: '<rect x="120" y="90" width="22" height="15" rx="6" fill="#2B1033"/><rect x="148" y="90" width="22" height="15" rx="6" fill="#2B1033"/><path d="M142 95h6" stroke="#2B1033" stroke-width="3"/>',
  sable: '<path d="M58 118 L58 42" stroke="#8FE9FF" stroke-width="7" stroke-linecap="round" opacity=".9"/><path d="M58 118 L58 42" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="54" y="118" width="8" height="18" rx="2" fill="#9AA3AD"/>',
  corona: '<path d="M122 68 L128 50 L138 62 L145 46 L152 62 L162 50 L168 68 Z" fill="#FFC531" stroke="#B8860B"/>'
};
const GORRO = '<path d="M128 72 L145 34 L162 72 Z" fill="#2F6BFF"/><circle cx="145" cy="34" r="5" fill="#FFC531"/><path d="M134 60h22M138 50h14" stroke="#FFC531" stroke-width="3"/>';
function piezasBicho(nivel, cumple) {
  const tiene = (id) => ACCESORIOS.some((a) => a.id === id && nivel >= a.n);
  let detras = tiene('capa') ? PIEZAS_DETRAS.capa : '';
  if (tiene('alas')) detras += PIEZAS_DETRAS.alas(nivel);
  let delante = ['cinta', 'medalla', 'gafas', 'sable', 'corona'].filter(tiene).map((id) => PIEZAS_DELANTE[id]).join('');
  if (cumple) delante += GORRO;
  return { detras, delante };
}
function vestirBicho(svg, nivel, cumple) {
  if (!svg) return svg;
  const { detras, delante } = piezasBicho(nivel, cumple);
  return svg.replace(/(<g [^>]*>)/, `$1${detras}`).replace('</g></svg>', `${delante}</g></svg>`);
}

// ---------- La oruga en su tarjeta ----------
// El mismo dibujo que el icono, pero con cada parte suelta para que pueda moverse.
function orugaArticulada(nivel, cumple) {
  const { detras, delante } = piezasBicho(nivel, cumple);
  const hondo = '#D9417F', rosa = '#FF7DB0';
  const pata = (x1, y1, x2, y2, i) => `<line class="pata-o" style="transform-origin:${x1}px ${y1}px;animation-delay:-${i * 0.11}s" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${hondo}" stroke-width="8" stroke-linecap="round"/>`;
  const seg = (x, y, r, i) => `<g class="seg" style="animation-delay:-${i * 0.16}s"><circle cx="${x}" cy="${y}" r="${r + 2}" fill="${hondo}"/><circle cx="${x}" cy="${y}" r="${r}" fill="${rosa}"/></g>`;
  return `<g class="oru-cuerpo">${detras}
    ${[[40, 150, 36, 170], [52, 150, 48, 170], [62, 156, 60, 176], [86, 158, 86, 178], [98, 156, 99, 177], [110, 156, 112, 176], [132, 148, 138, 168]].map((p, i) => pata(...p, i)).join('')}
    ${seg(42, 136, 18, 0)}${seg(66, 138, 21, 1)}${seg(94, 136, 23, 2)}${seg(122, 126, 25, 3)}
    <g class="oru-brazos">
      <line x1="122" y1="84" x2="122" y2="50" stroke="${hondo}" stroke-width="9" stroke-linecap="round"/><line x1="168" y1="84" x2="168" y2="50" stroke="${hondo}" stroke-width="9" stroke-linecap="round"/>
      <line x1="74" y1="46" x2="216" y2="46" stroke="#F5EFF7" stroke-width="7" stroke-linecap="round"/>
      <rect x="92" y="30" width="8" height="32" rx="3" fill="#2F6BFF"/><rect x="102" y="22" width="10" height="48" rx="3" fill="#E5344B"/><rect x="178" y="22" width="10" height="48" rx="3" fill="#E5344B"/><rect x="190" y="30" width="8" height="32" rx="3" fill="#2F6BFF"/>
    </g>
    <g class="oru-cabeza"><circle cx="145" cy="100" r="36" fill="${rosa}"/>
      <g class="oru-ojos"><circle class="ojo" cx="131" cy="98" r="5" fill="#2B1033"/><circle class="ojo" cx="159" cy="98" r="5" fill="#2B1033"/><circle cx="133" cy="96" r="1.8" fill="#fff"/><circle cx="161" cy="96" r="1.8" fill="#fff"/></g>
      <circle cx="122" cy="110" r="7" fill="#FF4F8E"/><circle cx="168" cy="110" r="7" fill="#FF4F8E"/>
      <path class="oru-boca" d="M137 108 Q145 120 153 108" fill="none" stroke="#2B1033" stroke-width="3.5" stroke-linecap="round"/>
      <path class="oru-lazo" d="M132 66L145 73L132 80ZM158 66L145 73L158 80Z" fill="#FFC531" stroke="#FFC531" stroke-width="3" stroke-linejoin="round"/><circle cx="145" cy="73" r="4" fill="#FFA400"/>
      ${delante}</g></g>`;
}
function escenarioOruga(nivel) {
  const noche = momentoDe(new Date().getHours()) === 'noche';
  const flor = (x, y, s, i) => `<g class="flor-o" style="transform-origin:${x}px ${y}px;animation-delay:-${i * 0.7}s"><use href="#o-girasol" x="${x - 9 * s}" y="${y - 26 * s}" width="${18 * s}" height="${27 * s}"/></g>`;
  const hojas = '<g class="hoja-o"><path d="M300 138 Q322 118 340 128 Q330 150 300 138Z" fill="#4FA65A"/><path d="M302 137 Q320 130 338 129" stroke="#2F7D4F" stroke-width="1.4" fill="none"/></g>';
  return `<svg class="escena-oruga" data-noche="${noche}" viewBox="0 0 360 178" aria-hidden="true">
    <defs><symbol id="o-girasol" viewBox="-7 -20 14 21"><path d="M0 0 V-11" stroke="#3E8B47" stroke-width="1.5"/><g fill="#FFC531"><circle cy="-17" r="2"/><circle cy="-11" r="2"/><circle cx="-3" cy="-14" r="2"/><circle cx="3" cy="-14" r="2"/><circle cx="-2.2" cy="-16.2" r="1.8"/><circle cx="2.2" cy="-16.2" r="1.8"/><circle cx="-2.2" cy="-11.8" r="1.8"/><circle cx="2.2" cy="-11.8" r="1.8"/></g><circle cy="-14" r="2.4" fill="#7A4A1C"/></symbol></defs>
    <rect width="360" height="178" fill="${noche ? '#17103F' : '#3D1E52'}"/>
    ${[[40, 28], [94, 54], [150, 20], [214, 42], [280, 24], [330, 60]].map(([x, y], i) => `<circle class="destello-o" style="animation-delay:-${i * 0.6}s" cx="${x}" cy="${y}" r="1.6" fill="#FFE27A"/>`).join('')}
    <path d="M0 150 Q90 136 180 148 T360 144 V178 H0Z" fill="#2F8450"/><path d="M0 160 Q120 150 220 160 T360 156 V178 H0Z" fill="#256B42"/>
    ${flor(24, 158, 1.5, 0)}${flor(52, 164, 1.15, 1)}${flor(332, 160, 1.5, 2)}${hojas}
    <g class="oru-giro" transform="translate(180 0)"><g transform="translate(-75 38) scale(.62)">${orugaArticulada(nivel, ES_CUMPLE(hoyIso()))}</g></g>
    <g class="oru-fx"></g>
  </svg>`;
}
let cronoOruga = null;
function pararOruga() { clearTimeout(cronoOruga); cronoOruga = null; }
function fxOruga(x, y, dentro, ms = 1300) {
  const capa = document.querySelector('.escena-oruga .oru-fx');
  if (!capa) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = `<g transform="translate(${x} ${y})"><g class="fx-sube" style="animation-duration:${ms}ms">${dentro}</g></g>`;
  capa.appendChild(g);
  setTimeout(() => g.remove(), ms);
}
const textoOruga = (t, c = '#fff', tam = 18) => `<text text-anchor="middle" font-size="${tam}" font-weight="800" fill="${c}" stroke="#2B1033" stroke-width="3" paint-order="stroke">${esc(t)}</text>`;
const COR_ORUGA = '<path transform="scale(3)" d="M0 3 C-5 -1 -3 -5 0 -2.5 C3 -5 5 -1 0 3Z" fill="#FF4F8E"/>';
let posOruga = 180;
function ponPoseOruga(clase) {
  const svg = document.querySelector('.escena-oruga');
  if (svg) svg.setAttribute('class', `escena-oruga ${clase}`);
}
function llevarOruga(destino, mira = 1) {
  const g = document.querySelector('.escena-oruga .oru-giro');
  if (!g) return 0;
  const ms = Math.abs(destino - posOruga) * 34 + 200;
  g.style.transition = `transform ${ms}ms linear`;
  g.style.transform = `translate(${destino}px, 0) scaleX(${mira})`;
  posOruga = destino;
  return ms;
}
// Va encadenando escenas sueltas, cada una con su final: así nunca hace dos veces seguidas lo mismo.
const RUTINA_ORUGA = {
  press(fin) {
    ponPoseOruga('press');
    let n = 0;
    const rep = () => {
      if (!document.querySelector('.escena-oruga')) return;
      if (n++ >= 4) { fxOruga(posOruga, 26, textoOruga('¡Bien!', '#FFC531')); fin(); return; }
      fxOruga(posOruga + 62, 58, textoOruga(String(n), '#FFC531', 22), 900);
      if (n > 1) fxOruga(posOruga - 28, 74, '<path d="M0 -5 Q4 0 0 4 Q-4 0 0 -5Z" fill="#9BE3FF"/>', 800);
      cronoOruga = setTimeout(rep, 1100);
    };
    rep();
  },
  andar(fin) {
    const destino = 90 + Math.random() * 150;
    ponPoseOruga('andar');
    cronoOruga = setTimeout(fin, llevarOruga(destino, destino < posOruga ? -1 : 1));
  },
  flexo(fin) { ponPoseOruga('flexo'); fxOruga(posOruga, 34, textoOruga('💪', '#fff', 22)); cronoOruga = setTimeout(fin, 2000); },
  come(fin) {
    ponPoseOruga('andar');
    cronoOruga = setTimeout(() => {
      ponPoseOruga('come');
      const hoja = document.querySelector('.hoja-o');
      if (hoja) hoja.classList.add('mordida');
      fxOruga(286, 104, textoOruga('ñam', '#6FE08A', 16), 1200);
      cronoOruga = setTimeout(() => { if (hoja) hoja.classList.remove('mordida'); fin(); }, 2600);
    }, llevarOruga(248));
  },
  baila(fin) { ponPoseOruga('baila'); for (let i = 0; i < 3; i++) setTimeout(() => fxOruga(posOruga - 40 + i * 40, 36, textoOruga(i % 2 ? '♪' : '♫', '#FFC531', 20)), i * 480); cronoOruga = setTimeout(fin, 2400); },
  siesta(fin) { ponPoseOruga('siesta'); let n = 0; const z = () => { if (n++ < 4 && document.querySelector('.escena-oruga')) { fxOruga(posOruga + 34, 66, textoOruga('z', '#fff', 15 + n * 2)); cronoOruga = setTimeout(z, 1100); } else fin(); }; z(); }
};
function rutinaOruga() {
  const svg = document.querySelector('.escena-oruga');
  if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const noche = svg.dataset.noche === 'true';
  const opciones = Object.keys(RUTINA_ORUGA).filter((k) => k !== rutinaOruga.ultima && (k !== 'siesta' || noche));
  const k = opciones[Math.floor(Math.random() * opciones.length)];
  rutinaOruga.ultima = k;
  RUTINA_ORUGA[k](() => {
    ponPoseOruga('reposo');
    cronoOruga = setTimeout(rutinaOruga, 700 + Math.random() * 1200);
  });
}
function reaccionOruga() {
  if (!document.querySelector('.escena-oruga')) return;
  pararOruga();
  ponPoseOruga(azar(['brinco', 'giro', 'flexo']));
  fxOruga(posOruga, 36, COR_ORUGA);
  cronoOruga = setTimeout(rutinaOruga, 1500);
}
function iniciarOruga() {
  pararOruga();
  posOruga = 180;
  const g = document.querySelector('.escena-oruga .oru-giro');
  if (!g) return;
  g.style.transform = 'translate(180px, 0)';
  cronoOruga = setTimeout(rutinaOruga, 500);
}
function pintarOruga() {
  const d = datosMundo(estado.filas), v = nivelDe(d.entrenos);
  const hechos = ACCESORIOS.filter((a) => v.nivel >= a.n), sig = ACCESORIOS.find((a) => v.nivel < a.n);
  const avance = v.dentro / ENTRENOS_POR_NIVEL * 100;
  return `<section class="tarjeta-mundo oruga"><button class="bicho escenario" type="button" aria-label="Saludar a Marialópoda" data-accion="bicho">${escenarioOruga(v.nivel)}</button>
    <h2 class="gorda oruga-titulo">${esc(tituloNivel(v.nivel))}</h2><p class="mundo-dato">Nivel ${v.nivel}, ${miles(d.entrenos)} entrenos</p>
    <div class="senda" role="progressbar" aria-valuemin="0" aria-valuemax="${ENTRENOS_POR_NIVEL}" aria-valuenow="${v.dentro}"><i class="senda-llena" style="--avance:${avance}%"></i><b class="senda-bicho" style="--avance:${avance}%"><svg viewBox="0 0 34 22" aria-hidden="true"><g fill="#FF7DB0" stroke="#D9417F" stroke-width="1"><circle class="seg" cx="5" cy="15" r="4"/><circle class="seg" style="animation-delay:-.15s" cx="12" cy="14.5" r="4.6"/><circle class="seg" style="animation-delay:-.3s" cx="19" cy="14" r="5"/><circle cx="27" cy="10" r="6.5"/></g><circle cx="25" cy="9" r="1" fill="#2B1033"/><circle cx="29.4" cy="9" r="1" fill="#2B1033"/><path d="M25.4 11.6 Q27.2 13.4 29 11.6" fill="none" stroke="#2B1033" stroke-width=".8"/></svg></b><span>${sig ? '🎁' : '⭐'}</span></div>
    <p class="mundo-dato">${v.falta} ${v.falta === 1 ? 'entreno' : 'entrenos'} para el nivel ${v.nivel + 1}${sig ? `. En el nivel ${sig.n} consigues: ${esc(sig.nombre)}` : ''}.${v.nivel >= NIVEL_MARIPOSA ? ' Cada 10 niveles, tus alas cambian de color.' : ` En el nivel ${NIVEL_MARIPOSA}, por fin, mariposa.`}</p>
    ${hechos.length ? `<p class="mundo-dato">Lleva puesto: ${hechos.map((a) => esc(a.nombre.toLowerCase())).join(', ')}.</p>` : ''}</section>`;
}

function pintarMundo(objetivo) {
  $('#pantalla').innerHTML = `<h1 class="gorda titulo-mundo">Tu mundo</h1>${pintarOruga()}${pintarBosque(objetivo)}`;
  iniciarOruga();
  iniciarVida(datosMundo(estado.filas).entrenos);
}

// 1RM estimado (Epley). El mapa de fuerza vive en fuerza.js.
const e1rmDe = (kg, reps) => (kg > 0 && reps >= 1 && reps <= 15 ? (reps === 1 ? kg : kg * (1 + reps / 30)) : 0);

// ---------- Duelos contra tu yo del pasado ----------
// El rival es la sesión más cercana a hace tres meses, y nunca una de hace menos de cuatro semanas.
function rivalDe(ej, hoy) {
  const t = new Date(`${hoy}T12:00:00Z`).getTime(), dia = 864e5;
  const previas = valoresPorFecha(ej, (f) => e1rmDe(+f[F.KG], +f[F.REPS])).filter((p) => p[1] > 0 && t - new Date(`${p[0]}T12:00:00Z`).getTime() >= 28 * dia);
  if (!previas.length) return null;
  const objetivo = t - 91 * dia;
  const cerca = previas.reduce((a, b) => (Math.abs(new Date(`${b[0]}T12:00:00Z`) - objetivo) < Math.abs(new Date(`${a[0]}T12:00:00Z`) - objetivo) ? b : a));
  const series = estado.filas.filter((f) => f[F.EJ] === ej && f[F.FECHA] === cerca[0]);
  const top = series.reduce((a, b) => (e1rmDe(+b[F.KG], +b[F.REPS]) > e1rmDe(+a[F.KG], +a[F.REPS]) ? b : a));
  return { fecha: cerca[0], valor: cerca[1], kg: +top[F.KG], reps: +top[F.REPS] };
}
function mejorDeHoy(ej, hoy, kg, reps) {
  const hechas = estado.filas.filter((f) => f[F.EJ] === ej && f[F.FECHA] === hoy).map((f) => e1rmDe(+f[F.KG], +f[F.REPS]));
  return Math.max(0, e1rmDe(kg, reps), ...hechas);
}
// Nunca marca una derrota: si hoy no se supera, solo cuenta qué hizo entonces.
function pintarDuelo(r, kg, reps) {
  const rival = rivalDe(r.ejercicio, hoyIso());
  if (!rival) return '';
  const fecha = fechaCorta(rival.fecha).slice(0, -3);
  return mejorDeHoy(r.ejercicio, hoyIso(), kg, reps) > rival.valor
    ? `<p class="duelo gana">🥊 Vas por delante de tu yo del ${fecha} (${rival.reps} × ${num(rival.kg)} kg)</p>`
    : `<p class="duelo">🥊 Tu yo del ${fecha} hizo ${rival.reps} × ${num(rival.kg)} kg. Hoy, a tu ritmo.</p>`;
}
function duelosGanadosHoy(hoy) {
  const ejercicios = new Set(estado.filas.filter((f) => f[F.FECHA] === hoy).map((f) => f[F.EJ]));
  return [...ejercicios].filter((ej) => { const r = rivalDe(ej, hoy); return r && mejorDeHoy(ej, hoy, 0, 0) > r.valor; }).length;
}

// ---------- Logros y cumpleaños ----------
function cartaCumple(anio) {
  const edad = +anio - NACIO_EN;
  return `<div class="tarjeta" role="dialog" aria-label="Feliz cumpleaños">
    <div class="bicho salta">${svgBicho}</div><h2 class="gorda">¡Feliz cumpleaños, Marialópoda!</h2>
    <p class="cifra">${edad} años</p><p>${esc(azar(FRASES.cumple))}</p>
    <p class="cesar">${esc(azar(FRASES.cumpleCesar))}<br>Cesarlópodo</p>
    <button type="button" class="principal" data-accion="cerrar">Gracias, oruga</button></div>`;
}
function cartaLogro(titulo, grande, texto) {
  return `<div class="tarjeta" role="dialog" aria-label="${esc(titulo)}"><div class="bicho salta">${svgBicho}</div><h2 class="gorda">${esc(titulo)}</h2>
    <p class="cifra">${esc(grande)}</p><p>${esc(texto)}</p><button type="button" class="principal" data-accion="cerrar">Seguir</button></div>`;
}
// Compara con lo último ya celebrado; la primera vez solo apunta dónde está para no felicitar años de historia de golpe.
function comprobarLogros() {
  const d = datosMundo(estado.filas);
  if (!d.entrenos) return;
  const hoy = hoyIso(), n = nivelDe(d.entrenos).nivel;
  const visto = leer('logros', null);
  if (!visto || visto.entrenos === undefined) {
    mostrarCarta(cartaLogro('Tu mundo ha crecido', '🐛🌳🐘', azar(FRASES.novedades)));
  } else {
    if (!leer('avisoCircuito', false)) { guardar('avisoCircuito', true); mostrarCarta(cartaLogro('Novedad', '🚣🚶‍♀️', azar(FRASES.novedades))); }
    if (n > visto.nivel) mostrarCarta(cartaLogro(`¡Nivel ${n}!`, tituloNivel(n), `${azar(FRASES.nivel)}${ACCESORIOS.some((a) => a.n === n) ? ` Nuevo: ${ACCESORIOS.find((a) => a.n === n).nombre.toLowerCase()}.` : ''}`));
    novedadesBosque(visto.entrenos, d.entrenos).forEach((x) => mostrarCarta(cartaLogro(x.titulo, x.grande, x.texto || azar(FRASES.bosque))));
  }
  if (ES_CUMPLE(hoy) && leer('cumple', '') !== hoy.slice(0, 4)) {
    guardar('cumple', hoy.slice(0, 4));
    mostrarCarta(cartaCumple(hoy.slice(0, 4)));
    lluvia(['🎂', '🎈', '🌻', '🐘', '💗', '🌸'], 60);
    pasearSalchicha();
  }
  guardar('logros', { nivel: n, entrenos: d.entrenos });
}
