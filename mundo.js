// El mundo de Marialópoda: bosque, oruga, galaxia, mapa del cuerpo, duelos y cumpleaños.
// Todo se calcula desde las series apuntadas, sin límite de años: lo antiguo se pliega por años y las listas dan la vuelta.

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
  const fechas = [...new Set(filas.map((f) => f[F.FECHA]))].filter((x) => /^\d{4}-\d{2}-\d{2}$/.test(x)).sort();
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
  alas: (n) => { const h = (n * 36) % 360; return `<ellipse cx="82" cy="78" rx="44" ry="30" fill="hsl(${h} 85% 68%)" transform="rotate(-24 82 78)"/><ellipse cx="78" cy="136" rx="32" ry="22" fill="hsl(${(h + 40) % 360} 85% 70%)" transform="rotate(18 78 136)"/><circle cx="72" cy="76" r="9" fill="#fff" opacity=".7"/>`; }
};
const PIEZAS_DELANTE = {
  cinta: '<path d="M111 88 Q145 70 179 88 L179 96 Q145 78 111 96 Z" fill="#E5344B"/>',
  medalla: '<path d="M116 134 L122 150 L128 134 Z" fill="#2F6BFF"/><circle cx="122" cy="155" r="8" fill="#FFC531" stroke="#B8860B"/>',
  gafas: '<rect x="120" y="90" width="22" height="15" rx="6" fill="#2B1033"/><rect x="148" y="90" width="22" height="15" rx="6" fill="#2B1033"/><path d="M142 95h6" stroke="#2B1033" stroke-width="3"/>',
  sable: '<path d="M58 118 L58 42" stroke="#8FE9FF" stroke-width="7" stroke-linecap="round" opacity=".9"/><path d="M58 118 L58 42" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><rect x="54" y="118" width="8" height="18" rx="2" fill="#9AA3AD"/>',
  corona: '<path d="M122 68 L128 50 L138 62 L145 46 L152 62 L162 50 L168 68 Z" fill="#FFC531" stroke="#B8860B"/>'
};
const GORRO = '<path d="M128 72 L145 34 L162 72 Z" fill="#2F6BFF"/><circle cx="145" cy="34" r="5" fill="#FFC531"/><path d="M134 60h22M138 50h14" stroke="#FFC531" stroke-width="3"/>';
function vestirBicho(svg, nivel, cumple) {
  if (!svg) return svg;
  const tiene = (id) => ACCESORIOS.some((a) => a.id === id && nivel >= a.n);
  let detras = tiene('capa') ? PIEZAS_DETRAS.capa : '';
  if (tiene('alas')) detras += PIEZAS_DETRAS.alas(nivel);
  let delante = ['cinta', 'medalla', 'gafas', 'sable', 'corona'].filter(tiene).map((id) => PIEZAS_DELANTE[id]).join('');
  if (cumple) delante += GORRO;
  return svg.replace(/(<g [^>]*>)/, `$1${detras}`).replace('</g></svg>', `${delante}</g></svg>`);
}

// ---------- La galaxia ----------
const TONELADAS_POR_PLANETA = 300;
function viaje(toneladas, planetas) {
  const recorrido = toneladas / TONELADAS_POR_PLANETA;
  const i = Math.floor(recorrido);
  const planeta = (k) => { const [nombre, color, frase] = planetas[k % planetas.length].split('|'); return { nombre, color, frase }; };
  return { indice: i, vuelta: Math.floor(i / planetas.length) + 1, actual: planeta(i), siguiente: planeta(i + 1), avance: recorrido - i, falta: (i + 1) * TONELADAS_POR_PLANETA - toneladas, visitados: (i % planetas.length) + 1, planeta };
}
const SVG_GROGU = '<g transform="translate(0 -3)"><path d="M-14 -4 L-5 -3 L-5 3 Z M14 -4 L5 -3 L5 3 Z" fill="#8DBF7A"/><circle r="6.5" fill="#A5D391"/><circle cx="-2.5" cy="-.5" r="1.6" fill="#231528"/><circle cx="2.5" cy="-.5" r="1.6" fill="#231528"/></g>';
function pintarGalaxia() {
  const d = datosMundo(estado.filas), v = viaje(d.toneladas, FRASES.planetas);
  const x = 62 + v.avance * 236;
  const lista = estado.verPlanetas ? `<ul class="planetas">${Array.from({ length: v.visitados }, (_, k) => {
    const p = v.planeta(v.indice - v.visitados + 1 + k);
    return `<li><i style="background:${p.color}"></i><div><b>${esc(p.nombre)}</b><p>${esc(p.frase)}</p></div></li>`;
  }).reverse().join('')}</ul>` : '';
  return `<section class="tarjeta-mundo galaxia"><h2 class="gorda">Viaje por la galaxia</h2>
    <p class="mundo-dato">${miles(d.toneladas)} toneladas levantadas${v.vuelta > 1 ? `. Vuelta ${v.vuelta} a la galaxia` : ''}. Grogu va de copiloto.</p>
    <svg viewBox="0 0 360 112" role="img" aria-label="De ${esc(v.actual.nombre)} a ${esc(v.siguiente.nombre)}: ${Math.round(v.avance * 100)} por ciento del camino">
      <path d="M62 56 H298" stroke="#D9C3DE" stroke-width="2" stroke-dasharray="3 7"/>
      <circle cx="42" cy="56" r="24" fill="${v.actual.color}"/><circle cx="318" cy="56" r="24" fill="${v.siguiente.color}"/>
      <text x="42" y="100" text-anchor="middle">${esc(v.actual.nombre)}</text><text x="318" y="100" text-anchor="middle">${esc(v.siguiente.nombre)}</text>
      <g class="nave" transform="translate(${x} 56)"><text y="9" x="-13" style="font-size:26px">🚀</text><g transform="translate(0 -22)">${SVG_GROGU}</g></g>
    </svg>
    <p class="mundo-frase">${esc(v.actual.frase)}</p>
    <p class="mundo-dato">Faltan ${miles(Math.max(1, v.falta))} toneladas para ${esc(v.siguiente.nombre)}, como ${miles(Math.max(1, v.falta / 5))} elefantes.</p>
    <button type="button" class="ver-mas" data-accion="ver-planetas">${estado.verPlanetas ? 'Ocultar planetas' : `Ver los ${v.visitados} planetas de esta vuelta`}</button>${lista}</section>`;
}

// ---------- El bosque ----------
const ANIMALES = ['🐕', '🐘', '🦋', '🐿️', '🦔', '🐇', '🦌', '🦉', '🐝', '🦊'];
const LUGARES = ['🏡', '⛲', '🌈', '🏰', '🎡', '🗼', '🛸'];
const ESTACION = (mes) => (mes < 2 || mes === 11 ? 'invierno' : mes < 5 ? 'primavera' : mes < 8 ? 'verano' : 'otono');
const TAMANO = [0, 0.72, 0.86, 1, 1.14, 1.28];
const SIMBOLOS = `<defs>
  <linearGradient id="suelo"><stop offset="0" stop-color="#46577A"/><stop offset=".2" stop-color="#3F7D5A"/><stop offset=".5" stop-color="#2F8F4E"/><stop offset=".8" stop-color="#A8662F"/><stop offset="1" stop-color="#46577A"/></linearGradient>
  <linearGradient id="cielo" x2="0" y2="1"><stop offset="0" stop-color="#1F0C2B"/><stop offset="1" stop-color="#5A2B6B"/></linearGradient>
  <symbol id="a-primavera" viewBox="0 0 40 56"><rect x="17" y="34" width="6" height="22" rx="2" fill="#6E3B1A"/><circle cx="20" cy="18" r="15" fill="#FF9DC4"/><circle cx="9" cy="28" r="9" fill="#FFB7D3"/><circle cx="31" cy="28" r="9" fill="#FF7DB0"/></symbol>
  <symbol id="a-verano" viewBox="0 0 40 56"><rect x="17" y="34" width="6" height="22" rx="2" fill="#6E3B1A"/><circle cx="20" cy="18" r="15" fill="#2FA85C"/><circle cx="9" cy="28" r="9" fill="#3DBF6E"/><circle cx="31" cy="28" r="9" fill="#238A4A"/></symbol>
  <symbol id="a-otono" viewBox="0 0 40 56"><rect x="17" y="34" width="6" height="22" rx="2" fill="#6E3B1A"/><circle cx="20" cy="18" r="15" fill="#F08A24"/><circle cx="9" cy="28" r="9" fill="#FFC531"/><circle cx="31" cy="28" r="9" fill="#D9531E"/></symbol>
  <symbol id="a-invierno" viewBox="0 0 40 56"><rect x="17" y="44" width="6" height="12" rx="2" fill="#6E3B1A"/><path d="M20 2 L34 26 H6 Z" fill="#E8F1F8"/><path d="M20 14 L37 38 H3 Z" fill="#2C6E5A"/><path d="M20 26 L39 48 H1 Z" fill="#23594A"/></symbol>
</defs>`;

function hitosDelBosque(fechas) {
  const hitos = [];
  fechas.forEach((f, i) => {
    const k = i + 1;
    if (k % 500 === 0) hitos.push({ fecha: f, emoji: LUGARES[(k / 500 - 1) % LUGARES.length], k });
    else if (k % 100 === 0) hitos.push({ fecha: f, emoji: ANIMALES[(k / 100 - 1) % ANIMALES.length], k });
  });
  return hitos;
}

function pintarAnioBosque(anio, semanas, hitos, objetivo, hoy) {
  const inicio = Date.UTC(+anio, 0, 1);
  const X = (iso) => 14 + Math.min(52, Math.floor((new Date(`${iso}T12:00:00Z`).getTime() - inicio) / 6048e5)) * (332 / 52);
  const esta = lunesDe(hoy);
  // Los de atrás se pintan antes para que los de delante los tapen; la posición depende solo de la fecha, así que no bailan.
  const arboles = [...semanas].filter(([l]) => l.slice(0, 4) === anio).map(([l, n]) => {
    const h = entero(l), fila = h % 3, s = [0.62, 0.8, 1][fila] * TAMANO[Math.min(n, 5)];
    return { l, n, x: X(l) + (h % 7) - 3, y: [84, 106, 130][fila] + (h % 5), s, tipo: ESTACION(+l.slice(5, 7) - 1) };
  }).sort((a, b) => a.y - b.y);
  const dibujo = arboles.map((a) => {
    const flor = a.n >= objetivo ? `<text x="${a.x + 8}" y="${a.y + 1}" style="font-size:9px">🌻</text>` : '';
    return `<g data-semana="${a.l}" data-n="${a.n}"${a.l === esta ? ' class="crece"' : ''}><use href="#a-${a.tipo}" x="${a.x - 20 * a.s}" y="${a.y - 56 * a.s}" width="${40 * a.s}" height="${56 * a.s}"/>${flor}</g>`;
  }).join('');
  const marcas = hitos.filter((m) => m.fecha.slice(0, 4) === anio).map((m) => `<text x="${X(m.fecha)}" y="${150 + (m.k / 100) % 2 * 8}" text-anchor="middle" style="font-size:${m.k % 500 ? 14 : 22}px"><title>Entreno número ${m.k}</title>${m.emoji}</text>`).join('');
  const luna = entero(anio) % 280 + 40;
  return `<svg class="bosque" viewBox="0 0 360 170" role="img" aria-label="Bosque de ${anio}: ${arboles.length} árboles">
    <rect width="360" height="170" fill="url(#cielo)"/><circle cx="${luna}" cy="24" r="10" fill="#FFF3C4"/>
    <path d="M0 62 Q90 44 180 60 T360 56 V170 H0 Z" fill="url(#suelo)"/>${dibujo}${marcas}</svg>`;
}

function pintarBosque(objetivo) {
  const d = datosMundo(estado.filas), hoy = hoyIso(), anios = [...new Set(d.fechas.map((f) => f.slice(0, 4)))].sort().reverse();
  const hitos = hitosDelBosque(d.fechas);
  const actual = hoy.slice(0, 4);
  if (!anios.includes(actual)) anios.unshift(actual);
  const siguiente = 100 - (d.entrenos % 100);
  const proximo = (d.entrenos + siguiente) % 500 === 0 ? LUGARES[((d.entrenos + siguiente) / 500 - 1) % LUGARES.length] : ANIMALES[((d.entrenos + siguiente) / 100 - 1) % ANIMALES.length];
  const bloques = anios.map((a) => {
    const abierto = a === actual || estado.aniosAbiertos.has(a);
    const n = d.fechas.filter((f) => f.slice(0, 4) === a).length;
    const arboles = [...d.semanas.keys()].filter((l) => l.slice(0, 4) === a).length;
    return `<div class="anio"><button type="button" class="anio-cab" data-anio="${a}" aria-expanded="${abierto}"><b>${a}</b><span>${arboles} árboles, ${n} entrenos</span></button>${abierto ? pintarAnioBosque(a, d.semanas, hitos, objetivo, hoy) : ''}</div>`;
  }).join('');
  return `<section class="tarjeta-mundo"><h2 class="gorda">Tu bosque</h2>
    <p class="mundo-dato">Cada semana planta un árbol: cuanto más entrenas, más grande. Con una semana completa nace un girasol, y las semanas sin entrenar simplemente esperan. A ${siguiente} ${siguiente === 1 ? 'entreno' : 'entrenos'} llega ${proximo}.</p>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">${SIMBOLOS}</svg>${bloques}</section>`;
}

// ---------- La oruga en su tarjeta ----------
function pintarOruga() {
  const d = datosMundo(estado.filas), v = nivelDe(d.entrenos);
  const hechos = ACCESORIOS.filter((a) => v.nivel >= a.n), sig = ACCESORIOS.find((a) => v.nivel < a.n);
  return `<section class="tarjeta-mundo oruga"><div class="oruga-cab"><button class="bicho grande" type="button" aria-label="Saludar a Marialópoda" data-accion="bicho">${svgBicho}</button>
    <div><h2 class="gorda">${esc(tituloNivel(v.nivel))}</h2><p class="mundo-dato">Nivel ${v.nivel}, ${miles(d.entrenos)} entrenos</p></div></div>
    <div class="barra-nivel" role="progressbar" aria-valuemin="0" aria-valuemax="${ENTRENOS_POR_NIVEL}" aria-valuenow="${v.dentro}"><i style="width:${v.dentro / ENTRENOS_POR_NIVEL * 100}%"></i></div>
    <p class="mundo-dato">${v.falta} ${v.falta === 1 ? 'entreno' : 'entrenos'} para el nivel ${v.nivel + 1}${sig ? `. En el nivel ${sig.n} consigues: ${esc(sig.nombre)}` : ''}.${v.nivel >= NIVEL_MARIPOSA ? ' Cada 10 niveles, tus alas cambian de color.' : ` En el nivel ${NIVEL_MARIPOSA}, por fin, mariposa.`}</p>
    ${hechos.length ? `<p class="mundo-dato">Lleva puesto: ${hechos.map((a) => esc(a.nombre.toLowerCase())).join(', ')}.</p>` : ''}</section>`;
}

function pintarMundo(objetivo) {
  $('#pantalla').innerHTML = `<h1 class="gorda titulo-mundo">Tu mundo</h1>${pintarOruga()}${pintarGalaxia()}${pintarBosque(objetivo)}`;
}

// ---------- Mapa del cuerpo ----------
// Marcas de 1RM de Strength Level para mujeres de 60 y 70 kg: principiante, novata, intermedia, avanzada y élite.
// Equivalen a ser más fuerte que el 5, 20, 50, 80 y 95 % de las mujeres que registran sus marcas allí, no de la población general.
const ESTANDARES = {
  hip: [[35, 63, 100, 147, 199], [39, 69, 108, 155, 209]], sentadilla: [[32, 49, 72, 99, 129], [37, 56, 80, 109, 140]],
  pesoMuerto: [[40, 60, 86, 116, 149], [46, 68, 95, 126, 160]], banca: [[19, 31, 47, 66, 88], [22, 36, 53, 74, 96]],
  militar: [[12, 20, 31, 43, 57], [15, 23, 34, 47, 62]], jalon: [[23, 33, 46, 60, 76], [25, 36, 49, 64, 81]],
  remo: [[21, 32, 45, 62, 79], [24, 35, 50, 66, 85]], curl: [[4, 7, 12, 18, 24], [4, 8, 13, 19, 26]],
  triceps: [[9, 17, 28, 42, 59], [11, 19, 31, 46, 63]], extension: [[22, 38, 59, 86, 115], [24, 41, 64, 91, 121]],
  curlFemoral: [[19, 31, 47, 67, 88], [21, 34, 51, 70, 93]], abductor: [[26, 45, 69, 99, 132], [29, 48, 73, 103, 137]],
  gemelo: [[21, 47, 84, 133, 190], [25, 53, 93, 144, 203]]
};
const MUSCULOS_MAPA = [
  ['Glúteos', [['Hip thrust', 'hip']]],
  ['Cuádriceps', [['Sentadilla', 'sentadilla'], ['Extensión de cuádriceps', 'extension']]],
  ['Femoral', [['Peso muerto rumano', 'pesoMuerto'], ['Peso muerto con mancuernas', 'pesoMuerto'], ['Curl femoral de pie', 'curlFemoral']]],
  ['Abductores', [['Abductores', 'abductor']]],
  ['Gemelos', [['Gemelos', 'gemelo']]],
  ['Espalda', [['Jalón al pecho', 'jalon'], ['Remo en máquina', 'remo']]],
  ['Pecho', [['Press banca', 'banca']]],
  ['Hombros', [['Press militar', 'militar'], ['Press militar con barra', 'militar']]],
  ['Bíceps', [['Bíceps en banco inclinado', 'curl']]],
  ['Tríceps', [['Tríceps en polea', 'triceps']]]
];
const NOMBRE_NIVEL = ['Principiante', 'Novata', 'Intermedia', 'Avanzada', 'Élite'];
const TRAMOS = [5, 20, 50, 80, 95];
const e1rmDe = (kg, reps) => (kg > 0 && reps >= 1 && reps <= 15 ? (reps === 1 ? kg : kg * (1 + reps / 30)) : 0);

function estandarPara(tipo, peso) {
  const [a, b] = ESTANDARES[tipo], t = (peso - 60) / 10;
  return a.map((v, i) => v + (b[i] - v) * t);
}
// Reparte el 1RM entre tramos: da el nivel alcanzado y el porcentaje aproximado de mujeres que supera.
function posicionFuerza(rm, marcas) {
  if (rm < marcas[0]) return { nivel: -1, por: Math.max(1, Math.round(rm / marcas[0] * TRAMOS[0])) };
  let i = 0;
  while (i < 4 && rm >= marcas[i + 1]) i++;
  if (i === 4) return { nivel: 4, por: Math.min(99, Math.round(95 + (rm - marcas[4]) / marcas[4] * 20)) };
  return { nivel: i, por: Math.round(TRAMOS[i] + (rm - marcas[i]) / (marcas[i + 1] - marcas[i]) * (TRAMOS[i + 1] - TRAMOS[i])) };
}
function fuerzaPorMusculo(peso, hoy) {
  const desde = new Date(new Date(`${hoy}T12:00:00Z`).getTime() - 365 * 864e5).toISOString().slice(0, 10);
  return MUSCULOS_MAPA.map(([musculo, lista]) => {
    const pruebas = lista.map(([ej, tipo]) => {
      const rm = Math.max(0, ...valoresPorFecha(ej, (f) => e1rmDe(+f[F.KG], +f[F.REPS])).filter((p) => p[0] >= desde).map((p) => p[1]));
      return rm ? { ej, rm, ...posicionFuerza(rm, estandarPara(tipo, peso)) } : null;
    }).filter(Boolean).sort((a, b) => b.por - a.por);
    if (!pruebas.length) return { musculo, mejor: null };
    // Se promedian sus ejercicios: una sola máquina generosa no debe decidir todo el músculo.
    const por = Math.round(pruebas.reduce((s, p) => s + p.por, 0) / pruebas.length);
    const nivel = por < TRAMOS[0] ? -1 : TRAMOS.reduce((n, t, i) => (por >= t ? i : n), 0);
    return { musculo, mejor: { por, nivel, pruebas } };
  });
}
const ZONAS_FRENTE = {
  Hombros: ['<ellipse cx="-31" cy="58" rx="12" ry="10"/>', '<ellipse cx="31" cy="58" rx="12" ry="10"/>'],
  Pecho: ['<ellipse cx="-13" cy="68" rx="13" ry="10"/>', '<ellipse cx="13" cy="68" rx="13" ry="10"/>'],
  Bíceps: ['<ellipse cx="-38" cy="88" rx="7" ry="17"/>', '<ellipse cx="38" cy="88" rx="7" ry="17"/>'],
  Abductores: ['<ellipse cx="-27" cy="140" rx="7" ry="13"/>', '<ellipse cx="27" cy="140" rx="7" ry="13"/>'],
  Cuádriceps: ['<ellipse cx="-13" cy="182" rx="12" ry="33"/>', '<ellipse cx="13" cy="182" rx="12" ry="33"/>']
};
const ZONAS_ESPALDA = {
  Hombros: ZONAS_FRENTE.Hombros,
  Espalda: ['<path d="M-24 62 H24 L15 122 H-15 Z"/>'],
  Tríceps: ['<ellipse cx="-38" cy="88" rx="7" ry="17"/>', '<ellipse cx="38" cy="88" rx="7" ry="17"/>'],
  Glúteos: ['<circle cx="-13" cy="141" r="14"/>', '<circle cx="13" cy="141" r="14"/>'],
  Femoral: ['<ellipse cx="-13" cy="190" rx="11" ry="30"/>', '<ellipse cx="13" cy="190" rx="11" ry="30"/>'],
  Gemelos: ['<ellipse cx="-13" cy="250" rx="9" ry="26"/>', '<ellipse cx="13" cy="250" rx="9" ry="26"/>']
};
function figuraCuerpo(cx, zonas, datos, etiqueta) {
  const clase = (m) => { const d = datos.find((x) => x.musculo === m); return d && d.mejor ? `n${d.mejor.nivel + 1}` : 'n-sin'; };
  return `<g transform="translate(${cx} 6)"><circle cy="22" r="14" class="base"/><rect x="-6" y="32" width="12" height="14" class="base"/>
    <path class="base" d="M-30 48 Q0 40 30 48 L33 118 Q28 130 35 158 L25 214 L24 276 H4 L2 172 H-2 L-4 276 H-24 L-25 214 L-35 158 Q-28 130 -33 118 Z"/>
    <ellipse cx="-39" cy="102" rx="8" ry="44" class="base"/><ellipse cx="39" cy="102" rx="8" ry="44" class="base"/>
    ${Object.entries(zonas).map(([m, formas]) => `<g class="zona ${clase(m)}" data-mapa="${m}">${formas.join('')}</g>`).join('')}
    <text y="292" text-anchor="middle">${etiqueta}</text></g>`;
}
function pintarCuerpo(peso, conPeso) {
  const datos = fuerzaPorMusculo(peso, hoyIso());
  const ordenados = datos.filter((d) => d.mejor).sort((a, b) => b.mejor.por - a.mejor.por);
  const sin = datos.filter((d) => !d.mejor).map((d) => d.musculo.toLowerCase());
  return `<div class="cuerpo"><svg viewBox="0 0 320 300" role="img" aria-label="Mapa de fuerza por músculo, detallado en la lista de abajo">${figuraCuerpo(82, ZONAS_FRENTE, datos, 'Delante')}${figuraCuerpo(238, ZONAS_ESPALDA, datos, 'Detrás')}</svg>
    <div class="leyenda">${NOMBRE_NIVEL.map((n, i) => `<span><i class="n${i + 1}"></i>${n}</span>`).join('')}</div></div>
    <ul class="fuerzas">${ordenados.map((d) => `<li><div><b>${esc(d.musculo)}</b><small>${d.mejor.pruebas.map((p) => `${esc(p.ej)}: unos ${miles(p.rm)} kg`).join('. ')}</small></div><div class="fuerza-dato"><b>Supera al ${d.mejor.por} %</b><small>${d.mejor.nivel < 0 ? 'Empezando' : NOMBRE_NIVEL[d.mejor.nivel]}</small></div></li>`).join('')}</ul>
    ${sin.length ? `<p class="pie">Sin datos del último año: ${esc(sin.join(', '))}.</p>` : ''}
    <p class="pie">Es una estimación del 1RM con tu mejor sesión del último año, promediando los ejercicios de cada músculo. Compara con mujeres que entrenan y registran sus marcas en Strength Level, no con toda la población, que en general entrena mucho menos. Las máquinas y las mancuernas no equivalen exactamente a la barra, así que tómalo como orientación. ${conPeso ? '' : 'Calculado suponiendo 60 kg de peso. '}</p>
    <button type="button" class="ver-mas" data-accion="peso-corporal">${conPeso ? `Tu peso: ${num(peso)} kg. Cambiar` : 'Poner mi peso para afinarlo'}</button>`;
}

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
    <p class="cesar">${esc(azar(FRASES.cumpleCesar))}<br>César</p>
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
  const hoy = hoyIso(), n = nivelDe(d.entrenos).nivel, v = viaje(d.toneladas, FRASES.planetas);
  const visto = leer('logros', null);
  if (!visto) {
    mostrarCarta(cartaLogro('Tu mundo ha crecido', '🌳 🚀 🐛', azar(FRASES.novedades)));
  } else {
    if (n > visto.nivel) mostrarCarta(cartaLogro(`¡Nivel ${n}!`, tituloNivel(n), `${azar(FRASES.nivel)}${ACCESORIOS.some((a) => a.n === n) ? ` Nuevo: ${ACCESORIOS.find((a) => a.n === n).nombre.toLowerCase()}.` : ''}`));
    if (v.indice > visto.planeta) mostrarCarta(cartaLogro('¡Nuevo planeta!', v.actual.nombre, v.actual.frase));
  }
  if (ES_CUMPLE(hoy) && leer('cumple', '') !== hoy.slice(0, 4)) {
    guardar('cumple', hoy.slice(0, 4));
    mostrarCarta(cartaCumple(hoy.slice(0, 4)));
    lluvia(['🎂', '🎈', '🌻', '🐘', '💗', '🌸'], 60);
    pasearSalchicha();
  }
  guardar('logros', { nivel: n, planeta: v.indice });
}
