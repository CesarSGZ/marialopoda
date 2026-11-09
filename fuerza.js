'use strict';
// ---------- Tu fuerza, músculo a músculo ----------
// Marcas de Strength Level para mujeres de 60 y 70 kg: principiante, novata, intermedia, avanzada y élite
// (más fuerte que el 5, 20, 50, 80 y 95 % de las mujeres que registran allí sus marcas, no de toda la población).
// En kg de 1RM; con mancuernas, por mancuerna; en dominadas y fondos, repes seguidas.
const BAREMOS = {
  hip: [[35, 63, 100, 147, 199], [39, 69, 108, 155, 209]],
  kickback: [[6, 14, 27, 45, 65], [7, 16, 30, 48, 70]],
  abduccion: [[26, 45, 69, 99, 132], [29, 48, 73, 103, 137]],
  aduccion: [[22, 40, 64, 94, 127], [25, 43, 68, 99, 134]],
  sentadilla: [[32, 49, 72, 99, 129], [37, 56, 80, 109, 140]],
  prensa: [[49, 87, 140, 204, 277], [58, 100, 155, 223, 299]],
  bulgara: [[7, 12, 20, 30, 41], [8, 14, 22, 32, 43]],
  extension: [[22, 38, 59, 86, 115], [24, 41, 64, 91, 121]],
  gemelo: [[21, 47, 84, 133, 190], [25, 53, 93, 144, 203]],
  curlFemoral: [[19, 31, 47, 67, 88], [21, 34, 51, 70, 93]],
  rumano: [[31, 47, 67, 90, 116], [34, 51, 71, 96, 122]],
  rumanoMancuerna: [[10, 17, 27, 39, 52], [11, 19, 29, 41, 54]],
  jalon: [[23, 33, 46, 60, 76], [25, 36, 49, 64, 81]],
  remoT: [[15, 26, 42, 62, 84], [17, 30, 46, 67, 89]],
  remoMaquina: [[21, 34, 51, 72, 96], [23, 37, 55, 77, 101]],
  remoBajo: [[21, 32, 45, 62, 79], [24, 35, 50, 66, 85]],
  dominadas: [[0.3, 0.6, 6, 12, 20], [0.3, 0.6, 5, 11, 18]],
  fondos: [[0.3, 1, 9, 19, 29], [0.3, 2, 9, 18, 27]],
  pressMancuerna: [[6, 10, 15, 20, 27], [7, 11, 16, 22, 29]],
  militar: [[15, 22, 31, 42, 54], [17, 25, 35, 46, 59]],
  lateral: [[3, 6, 9, 13, 17], [3, 6, 9, 14, 18]],
  lateralPolea: [[2, 5, 10, 17, 25], [2, 6, 11, 18, 26]],
  facePull: [[10, 19, 32, 47, 65], [12, 22, 35, 51, 69]],
  remoMenton: [[11, 19, 30, 42, 57], [13, 21, 32, 46, 61]],
  frontal: [[3, 5, 9, 14, 19], [3, 6, 10, 15, 20]],
  banca: [[19, 31, 47, 66, 88], [22, 36, 53, 74, 96]],
  pechoMaquina: [[11, 21, 36, 54, 75], [12, 23, 38, 57, 79]],
  curlInclinado: [[5, 8, 11, 15, 19], [6, 8, 12, 16, 20]],
  scott: [[8, 15, 23, 34, 46], [10, 17, 26, 37, 50]],
  curlPolea: [[7, 15, 24, 37, 51], [9, 16, 27, 40, 55]],
  pushdown: [[9, 17, 28, 42, 59], [11, 19, 31, 46, 63]],
  extTriceps: [[3, 7, 11, 17, 24], [4, 7, 12, 18, 25]],
  tricepsMaquina: [[14, 24, 39, 56, 76], [16, 27, 42, 60, 81]]
};
const DE_REPES = new Set(['dominadas', 'fondos']);
// [ejercicio, baremo, factor]. El factor pasa lo apuntado a lo que mide el baremo: 0,5 cuando se apunta el total de las dos mancuernas.
const MUSCULOS = [
  { id: 'deltAnt', nombre: 'Hombro frontal', ej: [['Press militar con mancuernas', 'pressMancuerna'], ['Press militar con barra', 'militar'], ['Hombro frontal con disco', 'frontal'], ['Hombro frontal en polea', 'frontal']] },
  { id: 'deltLat', nombre: 'Hombro lateral', ej: [['Elevaciones laterales', 'lateral'], ['Elevaciones laterales en polea', 'lateralPolea'], ['Remo al mentón', 'remoMenton']] },
  { id: 'deltPost', nombre: 'Hombro posterior', ej: [['Face pull', 'facePull']] },
  { id: 'pecho', nombre: 'Pecho', ej: [['Press banca', 'banca'], ['Press de pecho en máquina', 'pechoMaquina']] },
  { id: 'biceps', nombre: 'Bíceps', ej: [['Bíceps en banco inclinado', 'curlInclinado'], ['Bíceps en polea', 'curlPolea'], ['Bíceps Scott', 'scott']] },
  { id: 'triceps', nombre: 'Tríceps', ej: [['Tríceps en polea alta con barra', 'pushdown'], ['Tríceps en máquina', 'tricepsMaquina'], ['Extensión de tríceps con mancuerna a dos manos', 'extTriceps'], ['Fondos de tríceps', 'fondos']] },
  { id: 'dorsal', nombre: 'Dorsal', ej: [['Jalón al pecho', 'jalon'], ['Dominadas', 'dominadas']] },
  { id: 'espalda', nombre: 'Espalda media', ej: [['Remo T', 'remoT'], ['Remo en máquina', 'remoMaquina'], ['Remo bajo', 'remoBajo']] },
  { id: 'gluteo', nombre: 'Glúteo', ej: [['Hip thrust', 'hip'], ['Patada de glúteo en polea', 'kickback']] },
  { id: 'gluteoMedio', nombre: 'Glúteo medio', ej: [['Abductores sentada en polea', 'abduccion'], ['Abductores Technogym con discos', 'abduccion']] },
  { id: 'aductor', nombre: 'Aductores', ej: [['Aductores', 'aduccion']] },
  { id: 'cuadriceps', nombre: 'Cuádriceps', ej: [['Sentadilla', 'sentadilla'], ['Búlgaras', 'bulgara', 0.5], ['Extensión de cuádriceps', 'extension'], ['Prensa', 'prensa']] },
  { id: 'femoral', nombre: 'Femoral', ej: [['Curl femoral de pie', 'curlFemoral'], ['Peso muerto con mancuernas', 'rumanoMancuerna', 0.5], ['Peso muerto rumano', 'rumano']] },
  { id: 'gemelo', nombre: 'Gemelos', ej: [['Gemelos', 'gemelo']] },
  { id: 'abdomen', nombre: 'Abdomen', ej: [] }
];
const NOMBRE_NIVEL = ['Principiante', 'Novata', 'Intermedia', 'Avanzada', 'Élite'];
const TRAMOS = [5, 20, 50, 80, 95];

function baremoPara(tipo, peso) {
  const [a, b] = BAREMOS[tipo], t = (peso - 60) / 10;
  return a.map((v, i) => v + (b[i] - v) * t);
}
// Reparte la marca entre tramos: da el nivel alcanzado y el porcentaje aproximado de mujeres que supera.
function posicionFuerza(rm, marcas) {
  if (rm < marcas[0]) return { nivel: -1, por: Math.max(1, Math.round(rm / marcas[0] * TRAMOS[0])) };
  let i = 0;
  while (i < 4 && rm >= marcas[i + 1]) i++;
  if (i === 4) return { nivel: 4, por: Math.min(99, Math.round(95 + (rm - marcas[4]) / marcas[4] * 20)) };
  return { nivel: i, por: Math.round(TRAMOS[i] + (rm - marcas[i]) / (marcas[i + 1] - marcas[i]) * (TRAMOS[i + 1] - TRAMOS[i])) };
}
// Mejor marca del último año. En lo importado del Excel, la mediana del día, por las erratas.
function marcaDelAno(ej, tipo, factor, desde) {
  const repes = DE_REPES.has(tipo);
  const medir = (f) => (repes ? (+f[F.REPS] <= 40 ? +f[F.REPS] || 0 : 0) : e1rmDe(+f[F.KG] * factor, +f[F.REPS]));
  return Math.max(0, ...valoresPorFecha(ej, medir).filter((p) => p[0] >= desde).map((p) => p[1]));
}
function fuerzaPorMusculo(peso, hoy) {
  const desde = new Date(new Date(`${hoy}T12:00:00Z`).getTime() - 365 * 864e5).toISOString().slice(0, 10);
  return MUSCULOS.map((m) => {
    const pruebas = m.ej.map(([ej, tipo, factor = 1]) => {
      const rm = marcaDelAno(ej, tipo, factor, desde);
      return rm ? { ej, rm, repes: DE_REPES.has(tipo), mancuerna: factor !== 1, ...posicionFuerza(rm, baremoPara(tipo, peso)) } : null;
    }).filter(Boolean).sort((a, b) => b.por - a.por);
    if (!pruebas.length) return { ...m, mejor: null };
    // Se promedian sus ejercicios: una sola máquina generosa no debe decidir todo el músculo.
    const por = Math.round(pruebas.reduce((s, p) => s + p.por, 0) / pruebas.length);
    const nivel = por < TRAMOS[0] ? -1 : TRAMOS.reduce((n, t, i) => (por >= t ? i : n), 0);
    return { ...m, mejor: { por, nivel, pruebas } };
  });
}

// ---------- María en pixel art ----------
// Dos figuras chibi de 60 × 112 píxeles, de frente y de espaldas, con su ropa de siempre.
// Los músculos no se pintan sobre el cuerpo: cada uno lleva encima un punto del color de su nivel.
const PX_W = 60, PX_H = 112, PX_HUECO = 4;
const PALETA = {
  piel: ['#FCDCC6', '#F5CBAE', '#E3A887'], pelo: ['#4E3240', '#2A1820', '#1A0E14'], peloB: ['#5E3E4E', '#4E3240', '#2A1820'],
  camiseta: ['#3A2840', '#26182B', '#170D1B'], malla: ['#9A96A8', '#7E7A8C', '#625E70'], zapa: ['#FFFFFF', '#F4EEF6', '#D9CFE0'],
  suela: ['#D9CFE0', '#D9CFE0', '#B9ABC2'], rosa: ['#FF9CC4', '#FF7DB0', '#E0588F'], ojo: ['#4A2618', '#4A2618', '#4A2618'],
  pestana: ['#1A0E14', '#1A0E14', '#1A0E14'], iris: ['#8A4B2E', '#8A4B2E', '#8A4B2E'], brillo: ['#FFFFFF', '#FFFFFF', '#FFFFFF'],
  rubor: ['#FFA3B5', '#FFA3B5', '#FFA3B5'], boca: ['#D9506E', '#D9506E', '#D9506E'], nariz: ['#E3A887', '#E3A887', '#E3A887'],
  flor: ['#FF5A6E', '#E5344B', '#B81F3A'], florC: ['#FFE08A', '#FFC531', '#FFC531'], oro: ['#FFE08A', '#FFC531', '#C99410'],
  arana: ['#FF4F5E', '#E5344B', '#E5344B'], liga: ['#E5344B', '#E5344B', '#B81F3A']
};
// Del nivel más bajo al más alto: lavanda, azul, menta, coral y oro para élite.
const COLOR_NIVEL = ['#9B87F0', '#3FA0E8', '#2FC98A', '#FF7A45', '#FFC531'];
const COLOR_EMPEZANDO = '#C9A3DB';
// Dónde va el corazón de cada músculo: uno por músculo, repartidos a ambos lados para que no se amontonen.
const PUNTOS = [
  { deltAnt: [21.6, 45.4], deltLat: [44.2, 44.8], pecho: [34.6, 49.6], biceps: [12.8, 49.2], abdomen: [30, 61], cuadriceps: [24.4, 76.5], aductor: [32.8, 83.5] },
  { deltPost: [21.8, 45.4], triceps: [47.6, 52.2], espalda: [34.8, 48.8], dorsal: [24.2, 56.4], gluteoMedio: [38.8, 66.2], gluteo: [25.2, 70.6], femoral: [35, 80.6], gemelo: [25, 90.4] }
];
const PIXEL_CORAZON = ['.X.X.', 'XXXXX', 'XXXXX', '.XXX.', '..X..'];
function lienzoFigura() {
  const c = new Array(PX_W * PX_H).fill(null);
  const pon = (x, y, t) => { if (x >= 0 && y >= 0 && x < PX_W && y < PX_H) c[y * PX_W + x] = t; };
  const cada = (prueba, t) => { for (let y = 0; y < PX_H; y++) for (let x = 0; x < PX_W; x++) if (prueba(x + 0.5, y + 0.5)) pon(x, y, t); };
  const elipse = (cx, cy, rx, ry, t) => cada((x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1, t);
  const caja = (x0, y0, x1, y1, t) => cada((x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1, t);
  // Un tramo redondeado entre dos puntos: brazos y piernas.
  const capsula = (x1, y1, x2, y2, r, t) => cada((x, y) => {
    const dx = x2 - x1, dy = y2 - y1, k = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1)));
    return (x - x1 - k * dx) ** 2 + (y - y1 - k * dy) ** 2 <= r * r;
  }, t);
  const poli = (p, t) => cada((x, y) => {
    let dentro = false;
    for (let i = 0, j = p.length - 1; i < p.length; j = i++) {
      if ((p[i][1] > y) !== (p[j][1] > y) && x < (p[j][0] - p[i][0]) * (y - p[i][1]) / (p[j][1] - p[i][1]) + p[i][0]) dentro = !dentro;
    }
    return dentro;
  }, t);
  return { c, pon, cada, elipse, caja, capsula, poli };
}

function dibujarFigura(espalda) {
  const { c, pon, cada, elipse, caja, capsula, poli } = lienzoFigura();
  // De espaldas todo va en espejo: el brazo que saca bíceps queda al otro lado.
  const X = (x) => (espalda ? PX_W - x : x);
  // Melena suelta por detrás (de frente).
  if (!espalda) poli([[14, 22], [46, 22], [47, 48], [46.5, 68], [43, 71], [40, 67], [20, 67], [17, 71], [13.5, 68], [13, 48]], 'pelo');
  // Piernas con mallas y zapatillas.
  for (const lx of [25.2, 34.8]) {
    const s = lx < 30 ? -1 : 1;
    capsula(lx, 68, lx + s * 0.2, 84, 4.6, 'malla');
    capsula(lx + s * 0.2, 84, lx, 99, 3.5, 'malla');
    elipse(lx + s * 0.5, 89, 3.9, 4.6, 'malla');
    elipse(lx + s * 0.8, 102.4, 5, 2.7, 'zapa');
    caja(lx - 5.6 + s * 0.8, 104.2, lx + 4.4 + s * 0.8, 104.8, 'suela');
    caja(lx - 2 + s * 0.8, 101.2, lx + 1 + s * 0.8, 101.8, 'rosa');
  }
  poli([[20.4, 62], [39.6, 62], [40.6, 72], [30.6, 73], [30, 70], [29.4, 73], [19.4, 72]], 'malla');
  if (espalda) {
    // Pliegue del glúteo y costura central, discretos.
    for (const x0 of [21, 31.6]) for (let x = x0; x < x0 + 7.4; x++) pon(Math.floor(x), 73, 'pliegue');
    caja(29.6, 64, 30.4, 71, 'pliegue');
  }
  // Camiseta.
  poli([[20, 42.6], [40, 42.6], [41.6, 50], [39.6, 57.5], [40.4, 66], [19.6, 66], [20.4, 57.5], [18.4, 50]], 'camiseta');
  caja(19.6, 65, 40.4, 66, 'dobladillo');
  // Brazos: uno saca bíceps y el otro va a la cadera.
  capsula(X(18.6), 46.4, X(11), 53, 3.2, 'piel');
  elipse(X(12.8), 49.6, 3.1, 2.5, 'piel');
  capsula(X(11), 53, X(10.2), 41.5, 2.5, 'piel');
  elipse(X(10.2), 38.8, 3.1, 3.3, 'piel');
  capsula(X(19.6), 45.6, X(16), 48.8, 3.9, 'camiseta');
  capsula(X(43.6), 48.6, X(47), 57, 2.9, 'piel');
  capsula(X(47), 57, X(41.4), 63.6, 2.4, 'piel');
  elipse(X(40.6), 64, 2.4, 2.2, 'piel');
  capsula(X(40.4), 45.6, X(44.2), 49.6, 3.9, 'camiseta');
  // Cuello y escote redondo.
  caja(26.8, 36, 33.2, 43, 'piel');
  if (!espalda) elipse(30, 43.2, 3.6, 2, 'piel');
  // La araña roja de su camiseta.
  if (!espalda) {
    elipse(30, 52.2, 1.2, 1.4, 'arana'); elipse(30, 55, 1.7, 2.1, 'arana');
    for (const s of [-1, 1]) for (const [dx, dy] of [[2, 51], [3, 50], [2, 53], [3, 53], [4, 52], [2, 55], [3, 56], [4, 57], [2, 57], [3, 58]]) pon(30 + s * dx - (s < 0 ? 1 : 0), dy, 'arana');
  }
  // Cabeza.
  elipse(30, 26, 12.4, 13.4, 'piel');
  if (!espalda) {
    // Raya al medio y melena que enmarca la cara.
    cada((x, y) => ((x - 30) / 15.6) ** 2 + ((y - 23) / 15.2) ** 2 <= 1 && y < 14.6 + Math.abs(x - 30) * 0.42, 'pelo');
    cada((x, y) => Math.abs(x - 30) > 10.6 && Math.abs(x - 30) < 16 && y > 14 && y < 47 - (Math.abs(x - 30) - 10.6) * 0.6, 'pelo');
    caja(29.6, 9, 30.4, 13, 'peloB');
    for (const [x, y] of [[21, 13], [22, 12], [23, 11], [24, 11], [36, 11], [37, 11], [38, 12], [39, 13], [16, 22], [16, 23], [44, 22], [44, 23]]) pon(x, y, 'peloB');
    // Ojos grandes con brillo, cejas, mejillas y sonrisa.
    for (const [x0, lado] of [[22, -1], [35, 1]]) {
      caja(x0, 25, x0 + 3, 25.9, 'pestana');
      pon(lado < 0 ? x0 - 1 : x0 + 4, 25, 'pestana'); pon(lado < 0 ? x0 - 1 : x0 + 4, 24, 'pestana');
      caja(x0, 26, x0 + 3, 29.9, 'ojo');
      caja(x0, 30, x0 + 3, 30.9, 'iris');
      pon(x0 + 1, 30, 'iris'); pon(x0 + 2, 30, 'iris');
      caja(x0 + 1, 27, x0 + 1.9, 28.9, 'brillo'); pon(x0 + 2, 29, 'brillo');
      caja(x0, 22, x0 + 3, 22.9, 'pelo');
    }
    for (const x0 of [19.5, 37.5]) caja(x0, 32, x0 + 2.9, 32.9, 'rubor');
    caja(19.5, 33, 20.9, 33.9, 'rubor'); caja(39.5, 33, 40.9, 33.9, 'rubor');
    pon(30, 31, 'nariz');
    for (const [x, y] of [[28, 34], [29, 35], [30, 35], [31, 35], [32, 34]]) pon(x, y, 'boca');
    for (const x of [17, 42]) { pon(x, 35, 'oro'); pon(x, 37, 'oro'); pon(x + (x < 30 ? -1 : 1), 36, 'oro'); }
  } else {
    elipse(30, 23.4, 14.6, 14.6, 'pelo');
    cada((x, y) => y > 30 && y < 39 && Math.abs(x - 30) < 12.5 - (y - 30) * 1.1, 'pelo');
    // Mechones recogidos hacia la trenza.
    for (const k of [-8, -3, 3, 8]) for (let y = 12; y < 36; y++) pon(Math.round(30 + k * (1 - (y - 12) / 28)), y, 'peloB');
    // Trenza hasta media espalda.
    for (let k = 0; k < 9; k++) elipse(30 + (k % 2 ? 0.7 : -0.7), 39.5 + k * 3.2, 2.9 - k * 0.12, 2.1, k % 2 ? 'peloB' : 'pelo');
    caja(28.6, 67.6, 31.4, 68.6, 'liga');
    elipse(30, 70.5, 1.7, 1.8, 'pelo');
  }
  // La flor de hibisco en el pelo, como en las fotos.
  const fx = X(17.4);
  for (const [dx, dy] of [[0, -2.6], [2.5, -0.8], [1.6, 2.2], [-1.6, 2.2], [-2.5, -0.8]]) elipse(fx + dx, 16 + dy, 2.2, 2.2, 'flor');
  pon(Math.floor(fx), 16, 'florC'); pon(Math.floor(fx), 15, 'florC');
  return c;
}

const OTRAS = { pliegue: 'malla', dobladillo: 'camiseta' };
let figuras = null;
let musculoElegido = null;
let datosFuerza = [];
const colorNivel = (d) => (d.mejor.nivel < 0 ? COLOR_EMPEZANDO : COLOR_NIVEL[d.mejor.nivel]);
function colorPixel(c, x, y) {
  const t = c[y * PX_W + x];
  const base = OTRAS[t] || t;
  if (OTRAS[t]) return PALETA[base][2];
  const igual = (xx, yy) => { const q = xx >= 0 && yy >= 0 && xx < PX_W && yy < PX_H ? c[yy * PX_W + xx] : null; return q && (OTRAS[q] || q) === base; };
  // Luz arriba y a la izquierda, sombra abajo y a la derecha: volumen sencillo de pixel art.
  if (!igual(x, y - 1) || !igual(x - 1, y)) return PALETA[base][0];
  if (!igual(x, y + 1) || !igual(x + 1, y)) return PALETA[base][2];
  return PALETA[base][1];
}
function dibujarMaria() {
  const lienzo = document.getElementById('maria');
  if (!lienzo) return;
  figuras = figuras || [dibujarFigura(false), dibujarFigura(true)];
  const W = PX_W * 2 + PX_HUECO;
  lienzo.width = W; lienzo.height = PX_H;
  const g = lienzo.getContext('2d');
  g.clearRect(0, 0, W, PX_H);
  figuras.forEach((c, n) => {
    const ox = n * (PX_W + PX_HUECO);
    g.fillStyle = 'rgba(0,0,0,.3)';
    for (let x = 16; x < 45; x++) g.fillRect(ox + x, 106, 1, 1);
    for (let x = 19; x < 42; x++) g.fillRect(ox + x, 107, 1, 1);
    for (let y = 0; y < PX_H; y++) for (let x = 0; x < PX_W; x++) {
      const t = c[y * PX_W + x];
      if (!t) {
        const v = (dx, dy) => { const xx = x + dx, yy = y + dy; return xx >= 0 && yy >= 0 && xx < PX_W && yy < PX_H && c[yy * PX_W + xx]; };
        if (v(1, 0) || v(-1, 0) || v(0, 1) || v(0, -1)) { g.fillStyle = '#1A0820'; g.fillRect(ox + x, y, 1, 1); }
        continue;
      }
      g.fillStyle = colorPixel(c, x, y);
      g.fillRect(ox + x, y, 1, 1);
    }
    // Un corazón por músculo, del color de su nivel y con borde blanco (amarillo si está elegido).
    for (const [id, [cx, cy]] of Object.entries(PUNTOS[n])) {
      const d = datosFuerza.find((m) => m.id === id);
      if (!d || !d.mejor) continue;
      const x0 = ox + Math.round(cx) - 2, y0 = Math.round(cy) - 2;
      const lleno = (i, j) => j >= 0 && j < 5 && i >= 0 && i < 5 && PIXEL_CORAZON[j][i] === 'X';
      g.fillStyle = id === musculoElegido ? '#FFE27A' : '#FFFFFF';
      for (let j = -1; j <= 5; j++) for (let i = -1; i <= 5; i++) {
        if (!lleno(i, j) && (lleno(i - 1, j) || lleno(i + 1, j) || lleno(i, j - 1) || lleno(i, j + 1))) g.fillRect(x0 + i, y0 + j, 1, 1);
      }
      g.fillStyle = colorNivel(d);
      for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) if (lleno(i, j)) g.fillRect(x0 + i, y0 + j, 1, 1);
      g.fillStyle = 'rgba(255,255,255,.8)';
      g.fillRect(x0 + 1, y0 + 1, 1, 1);
    }
  });
}
// Qué punto hay bajo el dedo (el más cercano, con margen para dedos gordos).
function musculoEn(ev, lienzo) {
  const r = lienzo.getBoundingClientRect();
  const px = (ev.clientX - r.left) / r.width * lienzo.width, py = (ev.clientY - r.top) / r.height * lienzo.height;
  const n = px >= PX_W + PX_HUECO / 2 ? 1 : 0;
  const x = px - n * (PX_W + PX_HUECO);
  let mejor = null, dist = 6;
  for (const [id, [cx, cy]] of Object.entries(PUNTOS[n])) {
    const d = datosFuerza.find((m) => m.id === id);
    if (!d || !d.mejor) continue;
    const dd = Math.hypot(x - cx, py - cy);
    if (dd < dist) { dist = dd; mejor = id; }
  }
  return mejor;
}

function mostrarMusculo(id) {
  musculoElegido = musculoElegido === id ? null : id;
  dibujarMaria();
  document.querySelectorAll('.fuerzas li').forEach((li) => li.classList.toggle('elegido', li.dataset.id === musculoElegido));
  const d = datosFuerza.find((m) => m.id === id);
  if (!musculoElegido || !d) return;
  decir(d.mejor ? `${d.nombre}: superas al ${d.mejor.por} % de las mujeres que entrenan` : `${d.nombre}: ${d.ej.length ? 'sin datos del último año' : 'todavía sin un ejercicio con el que compararlo'}`);
  const li = document.querySelector(`.fuerzas li[data-id="${id}"]`);
  if (li) li.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function pintarCuerpo(peso) {
  datosFuerza = fuerzaPorMusculo(peso, hoyIso());
  musculoElegido = null;
  const con = datosFuerza.filter((d) => d.mejor).sort((a, b) => b.mejor.por - a.mejor.por);
  const sin = datosFuerza.filter((d) => !d.mejor);
  const estrella = con[0];
  const textoPrueba = (p) => `${esc(p.ej)}: ${p.repes ? `${miles(p.rm)} repes seguidas` : `1RM de unos ${miles(p.rm)} kg${p.mancuerna ? ' por mancuerna' : ''}`}`;
  return `<button type="button" class="otra test-boton" data-accion="tests">💪 Hacer un test de fuerza</button>
    <div class="cuerpo">
      ${estrella ? `<p class="estrella">Tu músculo estrella: <b>${esc(estrella.nombre.toLowerCase())}</b>, por encima del ${estrella.mejor.por} %.</p>` : ''}
      <div class="maria-marco"><canvas id="maria" width="${PX_W * 2 + PX_HUECO}" height="${PX_H}" role="img" aria-label="María de frente y de espaldas, con un punto de color en cada músculo según su nivel. Toca uno para ver su dato; el detalle está en la lista de abajo."></canvas>
        <div class="maria-pies"><span>Delante</span><span>Detrás</span></div></div>
      <div class="leyenda">${NOMBRE_NIVEL.map((n, i) => `<span><i class="n${i + 1}"></i>${n}</span>`).join('')}</div>
    </div>
    <ul class="fuerzas">${con.map((d) => `<li data-id="${d.id}"><button type="button" data-musculo-mapa="${d.id}">
      <span class="fz-cab"><b>${esc(d.nombre)}</b><span class="fz-dato">Supera al <b>${d.mejor.por} %</b> · ${d.mejor.nivel < 0 ? 'Empezando' : NOMBRE_NIVEL[d.mejor.nivel]}</span></span>
      <span class="fz-barra"><i class="n${d.mejor.nivel + 1}" style="width:${Math.max(3, d.mejor.por)}%"></i>${TRAMOS.slice(1, 4).map((t) => `<em style="left:${t}%"></em>`).join('')}</span>
      <small>${d.mejor.pruebas.map(textoPrueba).join('. ')}</small></button></li>`).join('')}</ul>
    ${sin.length ? `<p class="pie">Sin datos del último año: ${esc(sin.map((d) => d.nombre.toLowerCase()).join(', '))}.</p>` : ''}
    <p class="pie">Cada músculo usa tu mejor sesión del último año en sus ejercicios (1RM estimado) y promedia la posición de todos ellos. Compara con mujeres de 60 kg que entrenan y registran sus marcas en Strength Level, no con toda la población, que entrena mucho menos. Las máquinas no son iguales en todos los gimnasios: tómalo como orientación. En búlgaras y peso muerto con mancuernas se cuenta que apuntas el total de las dos.</p>`;
}

document.addEventListener('click', (ev) => {
  const lienzo = ev.target.closest && ev.target.closest('#maria');
  if (!lienzo) return;
  const id = musculoEn(ev, lienzo);
  if (id) mostrarMusculo(id);
});

// ---------- Cada músculo frente a otras mujeres, a lo largo del tiempo ----------
// Las máquinas cambian; la comparación con otras mujeres no: así la línea sigue aunque cambie el ejercicio.
const desplazar = (iso, dias) => new Date(new Date(`${iso}T12:00:00Z`).getTime() + dias * 864e5).toISOString().slice(0, 10);
const COLOR_LINEA = ['#FF7DB0', '#FFC531', '#7FD1FF', '#9BE38B'];

// Lo mejor de cada ejercicio del músculo entre dos fechas, y la posición media, como en el mapa de fuerza.
function posicionEntre(m, peso, desde, hasta, soloEstos) {
  const pruebas = m.ej.filter(([ej]) => !soloEstos || soloEstos.has(ej)).map(([ej, tipo, factor = 1]) => {
    const repes = DE_REPES.has(tipo);
    const medir = (f) => (repes ? (+f[F.REPS] <= 40 ? +f[F.REPS] || 0 : 0) : e1rmDe(+f[F.KG] * factor, +f[F.REPS]));
    const rm = Math.max(0, ...valoresPorFecha(ej, medir).filter((p) => p[0] >= desde && p[0] <= hasta).map((p) => p[1]));
    return rm ? { ej, ...posicionFuerza(rm, baremoPara(tipo, peso)) } : null;
  }).filter(Boolean);
  return pruebas.length ? { por: Math.round(pruebas.reduce((s, p) => s + p.por, 0) / pruebas.length), pruebas } : null;
}

// El grupo de la pantalla de progreso (Glúteos, Hombros...) en el que se apuntan sus ejercicios.
function grupoDeMusculo(m) {
  const cuenta = new Map();
  for (const f of estado.filas) if (m.ej.some(([ej]) => ej === f[F.EJ])) cuenta.set(f[F.MUSC], (cuenta.get(f[F.MUSC]) || 0) + 1);
  return [...cuenta.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

// Un punto por trimestre con datos: la posición con lo mejor de esos tres meses.
function historiaMusculo(m, peso) {
  const trimestres = new Set();
  for (const f of estado.filas) {
    if (!m.ej.some(([ej]) => ej === f[F.EJ])) continue;
    const [a, mes] = f[F.FECHA].split('-');
    trimestres.add(`${a}-${String(Math.floor((mes - 1) / 3) * 3 + 2).padStart(2, '0')}-15`);
  }
  return [...trimestres].sort().map((t) => { const p = posicionEntre(m, peso, desplazar(t, -46), desplazar(t, 46)); return p ? [t, p.por, p] : null; }).filter(Boolean);
}
const nombreTrimestre = (iso) => `${Math.ceil(+iso.slice(5, 7) / 3)}.º trimestre de ${iso.slice(0, 4)}`;

function musculosDelGrupo(grupo, peso) {
  return MUSCULOS.filter((m) => m.ej.length && grupoDeMusculo(m) === grupo).map((m) => ({ ...m, puntos: historiaMusculo(m, peso) })).filter((m) => m.puntos.length);
}

function pintarGraficaMusculos(grupo) {
  const caja = $('#caja');
  const lineas = musculosDelGrupo(grupo, PESO_REFERENCIA).slice(0, COLOR_LINEA.length);
  if (!lineas.length) { caja.innerHTML = `<h3 class="gorda">${esc(grupo)}</h3><p class="res">Todavía no hay ejercicios de este grupo con los que compararte.</p>`; return; }
  const todos = lineas.flatMap((l) => l.puntos);
  const W = 340, H = 210, pi = 34, pd = 12, ps = 10, pa = 24;
  const t = (iso) => new Date(iso).getTime();
  const fechas = todos.map((p) => t(p[0])), x0 = Math.min(...fechas), x1 = Math.max(Math.max(...fechas), x0 + 864e5);
  const X = (iso) => (x1 === x0 ? (pi + W - pd) / 2 : pi + (t(iso) - x0) / (x1 - x0) * (W - pi - pd));
  const Y = (v) => H - pa - v / 100 * (H - pa - ps);
  const rejilla = [0, 20, 50, 80, 100].map((v) => `<line x1="${pi}" x2="${W - pd}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--ciruela-2)" stroke-width="1"/><text x="${pi - 6}" y="${Y(v) + 4}" text-anchor="end">${v}</text>`).join('');
  const a0 = new Date(x0).getUTCFullYear(), a1 = new Date(x1).getUTCFullYear(), anios = [];
  for (let a = a0 + 1; a <= a1; a++) { const px = X(`${a}-01-01`); if (px > pi + 16 && px < W - pd - 16) anios.push(`<text x="${px}" y="${H - 6}" text-anchor="middle">${a}</text>`); }
  const resumen = () => lineas.map((l, i) => { const p = l.puntos; return `<span class="linea-dato"><i style="background:${COLOR_LINEA[i]}"></i>${esc(l.nombre)}: <b>${p[p.length - 1][1]} %</b>${p.length > 1 ? ` (empezó en ${p[0][1]} %)` : ''}</span>`; }).join('');
  caja.innerHTML = `<h3 class="gorda">${esc(grupo)} frente a otras mujeres</h3>
    <p class="res lineas" id="res">${resumen()}</p>
    <div class="grafica" id="graf"><svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(grupo)}: porcentaje de mujeres que superas en cada músculo, trimestre a trimestre">
      ${rejilla}${anios.join('')}
      ${lineas.map((l, i) => `<path d="${l.puntos.map((p, k) => `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join('')}" fill="none" stroke="${COLOR_LINEA[i]}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${l.puntos.map((p) => `<circle cx="${X(p[0]).toFixed(1)}" cy="${Y(p[1]).toFixed(1)}" r="2.6" fill="${COLOR_LINEA[i]}"/>`).join('')}`).join('')}
      <line id="guia" y1="${ps}" y2="${H - pa}" stroke="var(--tinta-2)" stroke-width="1" visibility="hidden"/>
    </svg></div>
    <p class="pie medida-pie">Porcentaje de mujeres de 60 kg que superas, trimestre a trimestre, con lo mejor de esos tres meses (las mismas cuentas que el mapa de fuerza). Sirve para seguir cada músculo aunque cambies de máquina o de ejercicio.</p>`;
  const graf = $('#graf'), guia = $('#guia'), res = $('#res');
  const mover = (ev) => {
    const r = graf.getBoundingClientRect(), px = (ev.clientX - r.left) / r.width * W;
    let cerca = todos[0];
    for (const p of todos) if (Math.abs(X(p[0]) - px) < Math.abs(X(cerca[0]) - px)) cerca = p;
    guia.setAttribute('x1', X(cerca[0])); guia.setAttribute('x2', X(cerca[0])); guia.setAttribute('visibility', 'visible');
    res.innerHTML = `<b>${nombreTrimestre(cerca[0])}</b>${lineas.map((l, i) => { const p = l.puntos.find((q) => q[0] === cerca[0]); return p ? `<span class="linea-dato"><i style="background:${COLOR_LINEA[i]}"></i>${esc(l.nombre)}: <b>${p[1]} %</b></span>` : ''; }).join('')}`;
  };
  const salir = () => { guia.setAttribute('visibility', 'hidden'); res.innerHTML = resumen(); };
  graf.addEventListener('pointerdown', mover);
  graf.addEventListener('pointermove', mover);
  graf.addEventListener('pointerleave', salir);
  graf.addEventListener('pointerup', (ev) => { if (ev.pointerType !== 'mouse') salir(); });
  graf.addEventListener('pointercancel', salir);
}

// Cada músculo hoy frente a hace un año, solo con los ejercicios que hizo en los dos años: una máquina nueva no es progreso.
function ultimoAnoMusculos(peso) {
  const hoy = hoyIso(), hace = desplazar(hoy, -365);
  return MUSCULOS.map((m) => {
    const antes = posicionEntre(m, peso, desplazar(hace, -365), hace), ahora = posicionEntre(m, peso, desplazar(hoy, -365), hoy);
    if (!antes || !ahora) return null;
    const comunes = new Set(antes.pruebas.map((p) => p.ej).filter((ej) => ahora.pruebas.some((p) => p.ej === ej)));
    if (!comunes.size) return null;
    const a = posicionEntre(m, peso, desplazar(hace, -365), hace, comunes), b = posicionEntre(m, peso, desplazar(hoy, -365), hoy, comunes);
    return { nombre: m.nombre, antes: a.por, ahora: b.por };
  }).filter((x) => x && x.antes !== x.ahora).sort((x, y) => (y.ahora - y.antes) - (x.ahora - x.antes));
}

function pintarUltimoAno() {
  const l = ultimoAnoMusculos(PESO_REFERENCIA);
  if (!l.length) return '';
  return `<h2 class="gorda seccion">Tu último año frente a otras mujeres</h2>
    <ul class="ano-musculos">${l.map((m) => `<li class="${m.ahora > m.antes ? 'sube' : 'baja'}"><b>${m.ahora > m.antes ? '+' : '−'}${Math.abs(m.ahora - m.antes)}</b><span>${esc(m.nombre)}<small>Superas al ${m.ahora} %; hace un año, al ${m.antes} %</small></span></li>`).join('')}</ul>
    <p class="pie">En puntos: cuántas mujeres más superas que hace un año. Solo compara los ejercicios que hiciste en los dos años.</p>`;
}
