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
const Y_PUENTE = 236;
const CASA = { x: 88, y: 208, puerta: { x: 88, y: 212 }, chimenea: { x: 113, y: 128 } };
// Los árboles no crecen sobre la casa ni tapan su fachada, ni sobre la fuente, el templete o el tiovivo.
const CLAROS = [[24, 170, 192, 224], [68, 222, 118, 322], [120, 258, 170, 300], [272, 150, 332, 190], [258, 276, 330, 322]];
const PRADERA = { y: 226, a: 40, b: 320 };
function posicionEn(i) {
  const y = HORIZONTE + 6 + Math.pow(reparto(i, 0.7548776662), 1.7) * (FONDO - HORIZONTE - 6);
  let x = 6 + reparto(i, 0.5698402910) * (ANCHO - 12);
  if (y > PRADERA.y && x > PRADERA.a && x < PRADERA.b) {
    const k = (x - PRADERA.a) / (PRADERA.b - PRADERA.a);
    x = k < 0.5 ? 2 + k * 2 * (PRADERA.a - 4) : PRADERA.b + 2 + (k - 0.5) * 2 * (ANCHO - PRADERA.b - 4);
  }
  for (const [a, arriba, b, abajo] of CLAROS) if (x > a && x < b && y > arriba && y < abajo) x = x - a < b - x ? a - 2 : b + 2;
  const c = centroRio(y), w = anchoRio(y) + 7;
  if (Math.abs(x - c) < w) x = x < c ? c - w : c + w;
  return { x, y };
}
const perspectiva = (y) => 0.34 + ((y - HORIZONTE) / (FONDO - HORIZONTE)) * 0.82;
// Un árbol sigue creciendo varios años; luego llega a su tamaño de árbol viejo.
const porEdad = (anios) => Math.min(1.34, 0.52 + anios * 0.3);
const bandaDe = (y) => Math.floor((y - HORIZONTE) / 6);
const BANDAS = Math.ceil((ALTO - HORIZONTE + 40) / 6);

const tronco = (ancho = 7, c = '#6B3E20', o = '#4F2D16') => `<path d="M${20 - ancho / 2} 30 Q${20 - ancho / 2 + 1} 47 ${20 - ancho} 56 H${20 + ancho} Q${20 + ancho / 2 - 1} 47 ${20 + ancho / 2} 30Z" fill="${c}"/><path d="M${20 + ancho / 6} 32 Q${20 + ancho / 4} 46 ${20 + ancho / 2 + 1} 55 H${20 + ancho} Q${20 + ancho / 2 - 1} 47 ${20 + ancho / 2} 32Z" fill="${o}"/><path d="M20 33 L13 25 M20 36 L27 27" stroke="${c}" stroke-width="2.2" stroke-linecap="round"/>`;
const copa = (c1, c2, c3, luz) => `${tronco()}<g fill="${c3}"><circle cx="9" cy="28" r="10"/><circle cx="31" cy="28" r="10"/><circle cx="20" cy="33" r="11"/></g><g fill="${c1}"><circle cx="20" cy="15" r="15"/><circle cx="8" cy="23" r="9.5"/><circle cx="32" cy="23" r="9.5"/><circle cx="20" cy="25" r="12"/></g><g fill="${c2}"><circle cx="15" cy="12" r="8.5"/><circle cx="7" cy="21" r="5"/><circle cx="24" cy="19" r="5.5"/></g><g fill="${luz}" opacity=".85"><circle cx="13" cy="9" r="3"/><circle cx="6" cy="19" r="1.7"/><circle cx="23" cy="16" r="1.8"/></g>`;
const conifera = (c1, c2, c3, nieve) => `<path d="M16.5 44 Q17 52 15 56 H25 Q23 52 23.5 44Z" fill="#5C3519"/><path d="M20 22 L39 48 Q20 53 1 48Z" fill="${c2}"/><path d="M20 22 L39 48 Q30 51 20 51Z" fill="${c3}"/><path d="M20 11 L35 35 Q20 40 5 35Z" fill="${c1}"/><path d="M20 11 L35 35 Q28 38 20 38Z" fill="${c2}"/><path d="M20 1 L31 22 Q20 26 9 22Z" fill="${nieve || c1}"/>${nieve ? '<path d="M20 12 L28 28 Q20 24 12 28Z" fill="#F2F7FB"/><path d="M11 43 Q20 40 29 43 L33 45 Q20 42 7 45Z" fill="#F2F7FB"/>' : `<path d="M20 1 L31 22 Q26 25 20 25Z" fill="${c2}"/>`}`;
const simbolo = (id, dentro) => `<symbol id="a-${id}" viewBox="-4 -2 48 60" overflow="visible">${dentro}</symbol>`;
const DEFINICIONES = `<defs>
  <linearGradient id="b-suelo" x2="0" y2="1"><stop offset="0" stop-color="#8CC47C"/><stop offset=".4" stop-color="#55A85F"/><stop offset="1" stop-color="#2A7A49"/></linearGradient>
  <linearGradient id="b-rio" x2="0" y2="1"><stop offset="0" stop-color="#C9EEF6"/><stop offset=".6" stop-color="#6CC2DD"/><stop offset="1" stop-color="#3A97BD"/></linearGradient>
  <linearGradient id="b-monte" x2="0" y2="1"><stop offset="0" stop-color="#7E6BB0"/><stop offset="1" stop-color="#9DA0C4"/></linearGradient>
  <linearGradient id="b-pared" x2="0" y2="1"><stop offset="0" stop-color="#FFF3D9"/><stop offset="1" stop-color="#F0D9AE"/></linearGradient>
  <linearGradient id="b-teja" x2="1" y2="0"><stop offset="0" stop-color="#E5688A"/><stop offset=".55" stop-color="#CF4C74"/><stop offset="1" stop-color="#A9385D"/></linearGradient>
  ${simbolo('cerezo', copa('#FF9DC4', '#FFC4DB', '#E36F9F', '#FFF0F6'))}${simbolo('magnolio', copa('#F7D6E8', '#FFFFFF', '#DFA8C8', '#FFFFFF'))}
  ${simbolo('roble', copa('#37AE62', '#58C97C', '#217E48', '#A7E8B4'))}${simbolo('abedul', `<path d="M18 22 H22 L23 56 H17Z" fill="#EDEFF2"/><path d="M18 33h3M20 40h3M18 47h3" stroke="#444" stroke-width="1.2"/><g fill="#6FA94A"><circle cx="9" cy="26" r="9"/><circle cx="31" cy="26" r="9"/></g><g fill="#8CCF5F"><circle cx="20" cy="15" r="14"/><circle cx="10" cy="22" r="8"/><circle cx="30" cy="22" r="8"/></g><g fill="#B7E58A"><circle cx="15" cy="11" r="6.5"/><circle cx="25" cy="17" r="3.5"/></g>`)}
  ${simbolo('arce', copa('#F08A24', '#FFC531', '#C2491A', '#FFE699'))}${simbolo('haya', copa('#C9602B', '#E98F45', '#963B1A', '#F7C08A'))}
  ${simbolo('pino', conifera('#2C6E5A', '#23594A', '#194238', '#E8F1F8'))}${simbolo('abeto', conifera('#2A8362', '#1F6B50', '#154C39'))}
  ${simbolo('gigante', `${tronco(10)}<g fill="#C78F14"><circle cx="8" cy="29" r="10"/><circle cx="32" cy="29" r="10"/><circle cx="20" cy="33" r="11"/></g><g fill="#F2C531"><circle cx="20" cy="15" r="15"/><circle cx="7" cy="24" r="10"/><circle cx="33" cy="24" r="10"/><circle cx="20" cy="25" r="12"/></g><g fill="#FFE27A"><circle cx="14" cy="11" r="8"/><circle cx="6" cy="22" r="5"/><circle cx="26" cy="19" r="5"/></g><circle cx="12" cy="8" r="3" fill="#FFF8D6"/>`)}
  <symbol id="a-girasol" viewBox="-7 -20 14 21" overflow="visible"><path d="M0 0 V-11" stroke="#3E8B47" stroke-width="1.5"/><path d="M0 -5 Q3 -7 5 -5 Q3 -3.6 0 -5Z" fill="#4FA65A"/><g fill="#FFC531"><circle cy="-17" r="2"/><circle cy="-11" r="2"/><circle cx="-3" cy="-14" r="2"/><circle cx="3" cy="-14" r="2"/><circle cx="-2.2" cy="-16.2" r="1.8"/><circle cx="2.2" cy="-16.2" r="1.8"/><circle cx="-2.2" cy="-11.8" r="1.8"/><circle cx="2.2" cy="-11.8" r="1.8"/></g><circle cy="-14" r="2.4" fill="#7A4A1C"/></symbol>
</defs>`;

// La hora real de quien mira cambia la luz del bosque.
const MOMENTOS = {
  amanecer: { cielo: ['#7A8BE0', '#F4A9B8', '#FFE3AE'], astro: '#FFF2C4', y: 62, velo: '#FFB98A', opaco: 0.06, nube: '#FFE9EC' },
  dia: { cielo: ['#3E9BE6', '#8ED2F4', '#DDF3F1'], astro: '#FFE98C', y: 30, velo: '#fff', opaco: 0, nube: '#fff' },
  tarde: { cielo: ['#3B2A6E', '#C7669A', '#FFC59A'], astro: '#FFF0B8', y: 52, velo: '#FF8A4A', opaco: 0.09, nube: '#FFD7DE' },
  noche: { cielo: ['#0C0A2C', '#241A5C', '#4F3C80'], astro: '#F4F1D8', y: 30, velo: '#160E48', opaco: 0.42, nube: '#7E78A8' }
};
const momentoDe = (h) => (h >= 21 || h < 6 ? 'noche' : h < 9 ? 'amanecer' : h < 18 ? 'dia' : 'tarde');

// Puntos de color dibujados de un trazo: cientos de flores cuestan lo mismo que una.
function floresDe(cuantas, conCamino) {
  const colores = ['#FFF4F8', '#FFC531', '#FF7DB0', '#C69CFF', '#FF6B6B'];
  const trazos = colores.map(() => []);
  for (let i = 0; i < cuantas; i++) {
    const y = HORIZONTE + 3 + reparto(i, 0.3819660113) * (ALTO - HORIZONTE - 5), x = reparto(i, 0.8191725134) * ANCHO;
    if (Math.abs(x - centroRio(y)) < anchoRio(y) + 2 || (conCamino && Math.abs(y - (212 + (x - 88) * 0.2)) < 7 && x > 80)) continue;
    trazos[i % colores.length].push(`M${x.toFixed(1)} ${y.toFixed(1)}h0`);
  }
  return colores.map((c, i) => `<path d="${trazos[i].join('')}" stroke="${c}" stroke-width="${1.8 + (i % 2) * 0.6}" stroke-linecap="round" fill="none"/>`).join('');
}
function repetir(n, hacer) { return Array.from({ length: Math.max(0, Math.floor(n)) }, (_, i) => hacer(i)).join(''); }

function hierba() {
  let d = '';
  for (let i = 0; i < 90; i++) {
    const y = HORIZONTE + 8 + reparto(i, 0.2360679775) * (ALTO - HORIZONTE - 8), x = reparto(i, 0.6502) * ANCHO, s = perspectiva(y) * 3.4;
    if (Math.abs(x - centroRio(y)) < anchoRio(y) + 3) continue;
    d += `M${x.toFixed(1)} ${y.toFixed(1)}l${(-s * 0.5).toFixed(1)} ${(-s).toFixed(1)}M${x.toFixed(1)} ${y.toFixed(1)}l0 ${(-s * 1.3).toFixed(1)}M${x.toFixed(1)} ${y.toFixed(1)}l${(s * 0.5).toFixed(1)} ${(-s).toFixed(1)}`;
  }
  return `<path d="${d}" fill="none" stroke="#2F8450" stroke-width=".9" stroke-linecap="round" opacity=".7"/>`;
}

// La casita de Marialópoda: de cuento, con su barra en la puerta y sus girasoles.
function dibujoCasa(noche) {
  const cristal = noche ? '#FFD977' : '#A9DDF0', { x, y } = CASA;
  const ventana = (vx) => `<rect x="${vx - 8}" y="172" width="3.6" height="14" fill="#4E9A7A"/><rect x="${vx + 4.4}" y="172" width="3.6" height="14" fill="#4E9A7A"/><rect x="${vx - 5}" y="171" width="10" height="15" rx="1.4" fill="#6B3E20"/><rect x="${vx - 3.8}" y="172.2" width="7.6" height="12.6" rx=".7" fill="${cristal}"/><path d="M${vx} 172.2v12.6M${vx - 3.8} 178.5h7.6" stroke="#6B3E20" stroke-width=".9"/><rect x="${vx - 6.5}" y="185.6" width="13" height="3.2" rx=".9" fill="#7A4A25"/><circle cx="${vx - 4}" cy="185" r="1.5" fill="#FF7DB0"/><circle cx="${vx}" cy="184.6" r="1.6" fill="#FFC531"/><circle cx="${vx + 4}" cy="185" r="1.5" fill="#FF6B6B"/>`;
  return `<g class="casa">
    <ellipse cx="${x}" cy="${y + 1}" rx="50" ry="6" fill="#0F3D28" opacity=".3"/>
    <rect x="107" y="136" width="10" height="24" fill="#A05A44"/><rect x="105.4" y="133" width="13.2" height="4" rx="1" fill="#7E4433"/><path d="M107 142h10M107 148h10M112 136v6M109 142v6M115 148v6" stroke="#7E4433" stroke-width=".7"/>
    <g class="humo"><circle cx="112" cy="130" r="2.8"/><circle cx="112" cy="130" r="3.6"/><circle cx="112" cy="130" r="4.4"/></g>
    <path d="M50 168 H126 V198 H50Z" fill="url(#b-pared)"/><path d="M50 168 V198 H56 V168Z M120 168 V198 H126 V168Z" fill="#E2C795" opacity=".7"/>
    <path d="M50 168 H126 M50 189 H66 M110 189 H126 M72 168 V198 M104 168 V198 M50 168 V198 M126 168 V198 M56 168 L66 189 M120 168 L110 189" fill="none" stroke="#7A4A25" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M47 198 H129 V208 H47Z" fill="#A79F92"/><path d="M47 203h82M58 198v5M72 203v5M88 198v5M104 203v5M118 198v5" stroke="#857C70" stroke-width=".9"/>
    <path d="M56 170 L88 138 L120 170 Z" fill="url(#b-pared)"/>
    <path d="M38 171 Q50 165 62 150 L84 122 Q88 118 92 122 L114 150 Q126 165 138 171 Q131 176 124 170 L88 138 L52 170 Q45 176 38 171Z" fill="url(#b-teja)"/>
    <path d="M47 164 Q55 160 61 151M61 165 Q68 157 73 146M73 149 Q79 141 84 130M129 164 Q121 160 115 151M115 165 Q108 157 103 146M103 149 Q97 141 92 130" fill="none" stroke="#A9385D" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M56 170 L88 138 L120 170" fill="none" stroke="#7A4A25" stroke-width="2.4"/>
    <circle cx="88" cy="157" r="6.8" fill="#7A4A25"/><circle cx="88" cy="157" r="5.4" fill="${cristal}"/><path transform="translate(88 157.4)" d="M0 3 C-5 -1 -3 -5 0 -2.5 C3 -5 5 -1 0 3Z" fill="#E5344B"/>
    ${ventana(62)}${ventana(114)}
    <path d="M76 208 V187 Q76 174 88 174 Q100 174 100 187 V208Z" fill="#7A4A25"/><path d="M79 208 V187 Q79 177 88 177 Q97 177 97 187 V208Z" fill="#3A2415"/>
    <g class="puerta" style="transform-origin:79px 190px"><path d="M79 208 V187 Q79 177 88 177 Q97 177 97 187 V208Z" fill="#C4562C"/><path d="M84 178V208M92 178V208" stroke="#9A3F1E" stroke-width="1"/><path d="M79 190 h18" stroke="#9A3F1E" stroke-width="1.3"/><circle cx="94" cy="194" r="1.5" fill="#FFC531"/></g>
    <rect x="72" y="208" width="32" height="3.4" rx="1.2" fill="#BDB4A5"/>
    <path d="M100 181 h2.4 v1.6" fill="none" stroke="#3A2415" stroke-width=".8"/><rect x="101" y="182.6" width="2.8" height="4" rx=".8" fill="${noche ? '#FFD977' : '#E9C46A'}" stroke="#3A2415" stroke-width=".6"/>
    <path d="M26 212 H43 M133 212 H150 M26 206 H43 M133 206 H150" stroke="#E9D9B8" stroke-width="1.4"/><path d="M28 215 V203 M35 215 V203 M42 215 V203 M134 215 V203 M141 215 V203 M148 215 V203" stroke="#F4E8CE" stroke-width="2.2" stroke-linecap="round"/>
    <use href="#a-girasol" x="46" y="186" width="14" height="24"/><use href="#a-girasol" x="35" y="191" width="12" height="20"/><use href="#a-girasol" x="120" y="186" width="14" height="24"/><use href="#a-girasol" x="131" y="191" width="12" height="20"/>
    <g transform="translate(112 213)"><path d="M0 -1.6 H17" stroke="#D8D8E2" stroke-width="1.1"/><rect x="1.6" y="-5" width="1.6" height="7" rx=".5" fill="#2F6BFF"/><rect x="3.6" y="-6" width="2" height="9" rx=".5" fill="#E5344B"/><rect x="11.6" y="-6" width="2" height="9" rx=".5" fill="#E5344B"/><rect x="14" y="-5" width="1.6" height="7" rx=".5" fill="#2F6BFF"/></g>
    ${noche ? '<ellipse cx="88" cy="196" rx="44" ry="20" fill="#FFD977" opacity=".13"/><circle cx="102.4" cy="184.6" r="6" fill="#FFD977" opacity=".3"/>' : ''}
  </g>`;
}
const dibujoFuente = () => `<g class="fuente" transform="translate(145 282)"><ellipse cy="2" rx="22" ry="6" fill="#0F3D28" opacity=".28"/><ellipse rx="20" ry="6.5" fill="#BDB4A5"/><ellipse cy="-1" rx="16" ry="4.6" fill="#7FCDE3"/><rect x="-2" y="-16" width="4" height="15" fill="#BDB4A5"/><ellipse cy="-16" rx="8" ry="2.2" fill="#A79F92"/><path class="chorro" d="M0 -17 Q-7 -30 -11 -5M0 -17 Q7 -30 11 -5M0 -17 V-30" fill="none" stroke="#DFF6FC" stroke-width="1.4" stroke-dasharray="3 3"/></g>`;
const dibujoCastillo = () => `<g transform="translate(246 101)" fill="#C9C2E0"><rect x="-22" y="-20" width="44" height="20"/><rect x="-28" y="-30" width="11" height="30"/><rect x="17" y="-30" width="11" height="30"/><rect x="-6" y="-36" width="12" height="36"/><path d="M-31 -30 L-22.5 -44 L-14 -30Z M14 -30 L22.5 -44 L31 -30Z M-9 -36 L0 -54 L9 -36Z" fill="#CF4C74"/><path d="M0 -54V-62" stroke="#3A2415"/><path d="M0 -62 L8 -59 L0 -56Z" fill="#FFC531"/><path d="M-5 0 V-9 Q0 -14 5 -9 V0Z" fill="#5A4A86"/></g>`;
const dibujoNoria = () => `<g transform="translate(330 72)"><path d="M0 0 L-12 42 M0 0 L12 42" stroke="#8E7BB8" stroke-width="2"/><g class="noria"><circle r="26" fill="none" stroke="#FF7DB0" stroke-width="2"/><circle r="17" fill="none" stroke="#FFC531" stroke-width="1"/>${repetir(8, (i) => { const a = i * Math.PI / 4; return `<path d="M0 0 L${(26 * Math.cos(a)).toFixed(1)} ${(26 * Math.sin(a)).toFixed(1)}" stroke="#E9D9F2" stroke-width="1"/><circle cx="${(26 * Math.cos(a)).toFixed(1)}" cy="${(26 * Math.sin(a)).toFixed(1)}" r="3.2" fill="${['#FF6B6B', '#FFC531', '#6FE08A', '#6BB7FF'][i % 4]}"/>`; })}</g></g>`;
const dibujoFaro = () => `<g transform="translate(34 96)"><path d="M-7 0 L-4 -36 H4 L7 0Z" fill="#FFF3D9"/><path d="M-6 -9 H6 L5.4 -18 H-5.4Z M-4.8 -27 H4.8 L4.2 -34 H-4.2Z" fill="#E5344B"/><rect x="-5" y="-42" width="10" height="6" fill="#FFD977"/><path d="M-6 -42 L0 -49 L6 -42Z" fill="#3A2415"/></g>`;
const dibujoTemplete = () => `<g transform="translate(302 188)"><ellipse cy="1" rx="26" ry="5" fill="#0F3D28" opacity=".28"/><rect x="-24" y="-4" width="48" height="5" fill="#E4DCC8"/><path d="M-19 -4V-28M-7 -4V-28M7 -4V-28M19 -4V-28" stroke="#F4EEDD" stroke-width="3.4"/><path d="M-26 -28 Q0 -52 26 -28Z" fill="#5EA88A"/><circle cy="-44" r="2.4" fill="#FFC531"/></g>`;
const dibujoTiovivo = () => `<g transform="translate(294 318)"><ellipse cy="1" rx="30" ry="6" fill="#0F3D28" opacity=".3"/><ellipse rx="27" ry="6" fill="#FFF3D9"/><path d="M-20 0V-28M0 2V-28M20 0V-28" stroke="#FFC531" stroke-width="1.6"/><path d="M-30 -28 Q0 -58 30 -28 Q0 -22 -30 -28Z" fill="#FF7DB0"/><path d="M-10 -24 Q-6 -46 0 -46 Q6 -46 10 -24" fill="#FFC531"/><g class="sube-baja"><ellipse cx="-20" cy="-11" rx="6" ry="3.4" fill="#fff"/><circle cx="-14" cy="-14" r="2.4" fill="#fff"/></g><g class="sube-baja otra"><ellipse cx="20" cy="-11" rx="6" ry="3.4" fill="#C69CFF"/><circle cx="14" cy="-14" r="2.4" fill="#C69CFF"/></g></g>`;

function dibujoPuente() {
  const c = centroRio(Y_PUENTE), w = anchoRio(Y_PUENTE) + 9, a = c - w, b = c + w, y = Y_PUENTE;
  const tablas = repetir(11, (i) => { const k = (i + 0.5) / 11, px = a + (b - a) * k, alto = 5 * Math.sin(k * Math.PI); return `<path d="M${px.toFixed(1)} ${(y - alto - 3).toFixed(1)}v6.4" stroke="#7A4A25" stroke-width=".7"/>`; });
  const arco = (dy) => `M${a.toFixed(1)} ${y + dy} Q${c.toFixed(1)} ${y + dy - 10} ${b.toFixed(1)} ${y + dy}`;
  return `<g><path d="M${(a + 5).toFixed(1)} ${y + 3} Q${c.toFixed(1)} ${y - 5} ${(b - 5).toFixed(1)} ${y + 3}" fill="none" stroke="#5A3A20" stroke-width="3"/><path d="${arco(0)}" fill="none" stroke="#A9743F" stroke-width="7"/>${tablas}<path d="${arco(-9)}" fill="none" stroke="#7A4A25" stroke-width="1.5"/>${repetir(5, (i) => { const k = i / 4, px = a + (b - a) * k, alto = 5 * Math.sin(k * Math.PI); return `<path d="M${px.toFixed(1)} ${(y - alto).toFixed(1)}v-8" stroke="#7A4A25" stroke-width="1.3"/>`; })}</g>`;
}
function dibujoCamino() {
  const c = centroRio(Y_PUENTE), w = anchoRio(Y_PUENTE) + 9;
  const trazos = `M88 212 C110 224 ${(c - w - 24).toFixed(1)} 232 ${(c - w).toFixed(1)} ${Y_PUENTE} M${(c + w).toFixed(1)} ${Y_PUENTE} C${(c + w + 30).toFixed(1)} 242 330 248 372 244 M88 212 C84 250 98 300 88 348`;
  return `<path d="${trazos}" fill="none" stroke="#B89A66" stroke-width="10" stroke-linecap="round"/><path d="${trazos}" fill="none" stroke="#DCC390" stroke-width="7.4" stroke-linecap="round"/><path d="${trazos}" fill="none" stroke="#C4A974" stroke-width="1.6" stroke-dasharray="1 9" stroke-linecap="round"/>`;
}
function dibujoRio(puntos) {
  const ida = puntos.map(([y, c, w]) => `${(c - w).toFixed(1)} ${y}`).join('L'), vuelta = [...puntos].reverse().map(([y, c, w]) => `${(c + w).toFixed(1)} ${y}`).join('L');
  const linea = (k) => `M${puntos.map(([y, c, w]) => `${(c + w * k).toFixed(1)} ${y}`).join('L')}`;
  const piedras = [[0.8, 170], [-0.9, 205], [1, 268], [-1, 296], [0.5, 310]].map(([k, y]) => `<ellipse cx="${(centroRio(y) + anchoRio(y) * k).toFixed(1)}" cy="${y}" rx="${(perspectiva(y) * 5).toFixed(1)}" ry="${(perspectiva(y) * 2.6).toFixed(1)}" fill="#9A958C"/>`).join('');
  const nenufares = [[-0.45, 288], [0.5, 262], [-0.4, 214]].map(([k, y]) => `<g transform="translate(${(centroRio(y) + anchoRio(y) * k).toFixed(1)} ${y})"><ellipse rx="4.4" ry="1.8" fill="#3E9A5A"/><circle cx="1" cy="-1" r="1.3" fill="#FF9DC4"/></g>`).join('');
  const juncos = [[-1.2, 300], [-1.15, 292], [1.2, 256], [1.15, 180]].map(([k, y]) => { const x = centroRio(y) + anchoRio(y) * k; return `<path d="M${x.toFixed(1)} ${y}q-1 -8 -3 -12M${x.toFixed(1)} ${y}q0 -8 1 -14M${x.toFixed(1)} ${y}q2 -6 4 -9" fill="none" stroke="#2F7D4F" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="${(x + 1).toFixed(1)}" cy="${y - 14}" rx="1" ry="2.6" fill="#6B3E20"/>`; }).join('');
  return `<path d="M${ida}L${vuelta}Z" fill="#C7B185" stroke="#C7B185" stroke-width="4"/><path d="M${ida}L${vuelta}Z" fill="url(#b-rio)"/><path class="fluye" d="${linea(-0.45)}" fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="5 15" stroke-linecap="round" opacity=".7"/><path class="fluye lento" d="${linea(0.1)}" fill="none" stroke="#fff" stroke-width="1.2" stroke-dasharray="8 20" stroke-linecap="round" opacity=".6"/><path class="fluye" d="${linea(0.55)}" fill="none" stroke="#E3F7FC" stroke-width=".9" stroke-dasharray="4 13" stroke-linecap="round" opacity=".8"/>${piedras}${nenufares}${juncos}`;
}
const mariposa = (i, c) => `<g transform="translate(${(reparto(i, 0.4) * ANCHO).toFixed(1)} ${(HORIZONTE + 30 + reparto(i, 0.71) * 170).toFixed(1)})"><g class="revolotea" style="animation-delay:-${i * 1.3}s"><path d="M0 -3V3" stroke="#2B1033" stroke-width="1"/><g class="ala-m" style="animation-delay:-${i * 0.09}s"><path d="M0 -1 Q4 -6 7 -3 Q7 1 0 1Z M0 1 Q5 1 5 4 Q3 6 0 2Z" fill="${c}"/></g><g class="ala-m" style="animation-delay:-${i * 0.09}s"><path d="M0 -1 Q-4 -6 -7 -3 Q-7 1 0 1Z M0 1 Q-5 1 -5 4 Q-3 6 0 2Z" fill="${c}"/></g></g></g>`;
const abeja = (i) => `<g transform="translate(${(reparto(i, 0.27) * ANCHO).toFixed(1)} ${(HORIZONTE + 44 + reparto(i, 0.83) * 170).toFixed(1)})"><g class="zumba" style="animation-delay:-${i * 0.7}s"><ellipse cx="-.6" cy="-2.2" rx="1.5" ry="2.2" fill="#fff" opacity=".85"/><ellipse rx="2.6" ry="1.8" fill="#FFC531"/><path d="M-.8 -1.7v3.4M.9 -1.7v3.4" stroke="#241318" stroke-width=".7"/></g></g>`;

// semanas: lista [lunes, entrenos] en orden. hasta: última semana que se pinta, para poder viajar en el tiempo.
function escenaBosque(semanas, hasta, esActual, objetivo, hora = new Date().getHours()) {
  const vivas = semanas.slice(0, hasta + 1);
  const entrenos = vivas.reduce((s, x) => s + x[1], 0);
  const hoy = vivas.length ? new Date(`${vivas[vivas.length - 1][0]}T12:00:00Z`).getTime() : 0;
  const tiene = (n) => entrenos >= n, nombreMomento = momentoDe(hora), m = MOMENTOS[nombreMomento], noche = nombreMomento === 'noche';
  const anioVisto = new Set();
  const arboles = vivas.map(([lunes, n], i) => {
    const anio = lunes.slice(0, 4), primero = !anioVisto.has(anio);
    anioVisto.add(anio);
    const { x, y } = posicionEn(i);
    const lista = ESPECIES[ESTACION(+lunes.slice(5, 7) - 1)];
    const edad = (hoy - new Date(`${lunes}T12:00:00Z`).getTime()) / (365.25 * 864e5);
    const empuje = primero ? 1.3 : 0.84 + Math.min(n, 5) * 0.06;
    return { lunes, n, x, y, primero, especie: primero ? 'gigante' : lista[i % 2], s: perspectiva(y) * porEdad(edad) * empuje * 0.74, ultima: esActual && i === vivas.length - 1 };
  });
  // Solo los árboles más cercanos se mecen con el viento: animar cientos gastaría batería sin que se note.
  const delante = new Set([...arboles].sort((a, b) => b.y - a.y).slice(0, 10).map((a) => a.lunes));
  const bandas = Array.from({ length: BANDAS }, () => '');
  const poner = (y, html) => { bandas[Math.max(0, Math.min(BANDAS - 1, bandaDe(y)))] += html; };
  for (const a of [...arboles].sort((p, q) => p.y - q.y)) {
    const w = 48 * a.s, h = 60 * a.s, g = 0.5 + a.s * 0.5;
    const flor = a.n >= objetivo && !a.primero ? `<use href="#a-girasol" x="${(a.x + w * 0.2).toFixed(1)}" y="${(a.y - 18 * g).toFixed(1)}" width="${(13 * g).toFixed(1)}" height="${(20 * g).toFixed(1)}"/>` : '';
    const clases = [a.ultima ? 'crece' : '', delante.has(a.lunes) ? 'mece' : ''].filter(Boolean).join(' ');
    poner(a.y, `<g data-semana="${a.lunes}" data-n="${a.n}" data-x="${a.x.toFixed(1)}" data-y="${a.y.toFixed(1)}" data-s="${a.s.toFixed(2)}"${clases ? ` class="${clases}"` : ''} style="animation-delay:-${(a.x % 5).toFixed(1)}s"><ellipse cx="${(a.x + w * 0.1).toFixed(1)}" cy="${a.y.toFixed(1)}" rx="${(w * 0.36).toFixed(1)}" ry="${(w * 0.1).toFixed(1)}" fill="#0F3D28" opacity=".32"/><use href="#a-${a.especie}" x="${(a.x - w / 2).toFixed(1)}" y="${(a.y - h * 0.97).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}"/>${flor}</g>`);
  }
  const lugares = Math.floor(entrenos / 500);
  if (lugares > 0) poner(CASA.y, dibujoCasa(noche));
  if (lugares > 0) poner(223, '<g transform="translate(170 223)"><rect x="-1.2" y="-13" width="2.4" height="14" fill="#6B3E20"/><rect x="-18" y="-15" width="36" height="9" rx="1.5" fill="#9A6A3B" stroke="#6B3E20" stroke-width=".8"/><text x="0" y="-8.4" text-anchor="middle" font-size="5.6" font-weight="700" fill="#FFF3D9">Marialópoda</text></g>');
  if (lugares > 1) poner(282, dibujoFuente());
  if (lugares > 5) poner(188, dibujoTemplete());
  if (lugares > 6) poner(318, dibujoTiovivo());
  if (tiene(500)) poner(Y_PUENTE, dibujoPuente());
  const puntosRio = [];
  for (let y = HORIZONTE; y <= ALTO; y += 12) puntosRio.push([y, centroRio(y), anchoRio(y)]);
  const brillo = (i) => `<circle class="luz" cx="${(reparto(i, 0.7071) * ANCHO).toFixed(1)}" cy="${(HORIZONTE + 20 + reparto(i, 0.3247) * 200).toFixed(1)}" r="1.8" fill="#FFF7A8" style="animation-delay:-${(i % 7) * 0.6}s"/>`;
  const colores = ['#FF7DB0', '#FFC531', '#7CC8FF', '#C69CFF', '#FF8A5B', '#fff'];
  return `<svg class="bosque" data-momento="${nombreMomento}" viewBox="0 0 ${ANCHO} ${ALTO}" role="img" aria-label="${esc(etapaDe(entrenos).nombre)}: ${vivas.length} árboles y ${censoBosque(entrenos).length} animales">${DEFINICIONES}
    <linearGradient id="b-cielo" x2="0" y2="1"><stop offset="0" stop-color="${m.cielo[0]}"/><stop offset=".6" stop-color="${m.cielo[1]}"/><stop offset="1" stop-color="${m.cielo[2]}"/></linearGradient>
    <rect width="${ANCHO}" height="${HORIZONTE + 6}" fill="url(#b-cielo)"/>
    ${noche ? repetir(34, (i) => `<circle class="${i % 3 ? '' : 'titila-b'}" cx="${(reparto(i, 0.7548) * ANCHO).toFixed(1)}" cy="${(reparto(i, 0.5698) * 84).toFixed(1)}" r="${i % 4 ? 0.8 : 1.3}" fill="#fff" style="animation-delay:-${i % 5}s"/>`) : ''}
    <circle cx="288" cy="${m.y}" r="30" fill="${m.astro}" opacity=".18"/><circle cx="288" cy="${m.y}" r="17" fill="${m.astro}"/>${noche ? `<circle cx="282" cy="${m.y - 3}" r="14" fill="#1A1447" opacity=".9"/>` : ''}
    ${tiene(1600) ? '<path class="aurora" d="M0 34 Q90 4 180 30 T360 18 V62 Q270 40 180 66 T0 56 Z" fill="#7CFFCB" opacity=".26"/>' : ''}
    <g class="nube" fill="${m.nube}" opacity=".78"><ellipse cx="52" cy="30" rx="22" ry="7"/><ellipse cx="66" cy="24" rx="14" ry="8"/><ellipse cx="38" cy="26" rx="10" ry="5"/></g><g class="nube lenta" fill="${m.nube}" opacity=".55"><ellipse cx="176" cy="54" rx="20" ry="5.6"/><ellipse cx="190" cy="50" rx="12" ry="6"/></g>
    ${tiene(400) && !noche ? `<g fill="none" stroke-width="3" opacity=".5">${['#FF6B6B', '#FFC531', '#6FE08A', '#6BB7FF', '#C69CFF'].map((c, i) => `<path d="M${50 + i * 4} 106 A${100 - i * 4} ${84 - i * 4} 0 0 1 ${250 - i * 4} 106" stroke="${c}"/>`).join('')}</g>` : ''}
    ${tiene(200) ? '<path d="M0 108 L46 58 L84 92 L132 42 L186 96 L232 60 L280 94 L322 52 L360 92 V110 H0 Z" fill="url(#b-monte)"/><path d="M132 42 L186 96 H132 L116 60Z M46 58 L84 92 H46Z M232 60 L280 94 H232Z M322 52 L360 92 H322Z" fill="#4E3F7D" opacity=".3"/><path d="M132 42 L118 57 L126 54 L132 60 L138 54 L146 58 Z M46 58 L36 69 L43 66 L48 70 L52 66 L57 68 Z M322 52 L311 64 L318 61 L323 66 L328 61 L334 65 Z M232 60 L224 68 L230 66 L234 70 L238 66 L242 67Z" fill="#F7F3FB"/>' : ''}
    ${lugares > 2 ? dibujoCastillo() : ''}${lugares > 4 ? dibujoFaro() : ''}${lugares > 3 ? dibujoNoria() : ''}
    <path d="M0 98 Q60 86 130 98 T260 96 T360 94 V110 H0 Z" fill="#7DB67C"/>
    ${tiene(600) ? '<path d="M150 110 L164 72 Q168 62 178 62 L194 62 Q204 62 208 72 L224 110 Z" fill="#6A5A98"/><path d="M152 106 L164 76 L170 106Z M220 106 L208 76 L202 106Z" fill="#4E3F7D" opacity=".6"/><path d="M162 72 Q168 60 178 60 L194 60 Q204 60 210 72 Q186 78 162 72Z" fill="#7DB67C"/><path d="M180 67 L192 67 L190 108 L182 108 Z" fill="#CDEFF7"/><path class="caida" d="M183.5 67V106M186 67V106M188.5 67V106" stroke="#fff" stroke-width="1.4" stroke-dasharray="5 7" fill="none"/><g class="espuma"><ellipse cx="186" cy="107" rx="11" ry="3.4" fill="#fff" opacity=".9"/><circle cx="177" cy="105" r="1.8" fill="#fff" opacity=".8"/><circle cx="195" cy="105" r="1.8" fill="#fff" opacity=".8"/></g>' : ''}
    <rect y="${HORIZONTE}" width="${ANCHO}" height="${ALTO - HORIZONTE}" fill="url(#b-suelo)"/>
    <g opacity=".22" fill="#D7EFA8"><ellipse cx="60" cy="146" rx="60" ry="12"/><ellipse cx="300" cy="170" rx="70" ry="14"/><ellipse cx="170" cy="312" rx="90" ry="16"/></g><g opacity=".14" fill="#0F3D28"><ellipse cx="320" cy="262" rx="60" ry="20"/><ellipse cx="30" cy="300" rx="50" ry="22"/></g>
    ${tiene(500) ? dibujoCamino() : ''}${tiene(300) ? dibujoRio(puntosRio) : ''}${hierba()}${floresDe(tiene(25) ? Math.min(520, entrenos / 1.6) : 0, tiene(500))}
    <g class="capa-brotes"></g>
    ${bandas.map((d) => `${d}<g class="hueco"></g>`).join('')}
    ${tiene(150) ? repetir(Math.min(7, (entrenos - 150) / 120 + 1), (i) => `<g class="pajaro" style="animation-delay:-${i * 3.7}s" transform="translate(0 ${16 + (i * 13) % 58})"><path class="aleteo" style="animation-delay:-${i * 0.2}s" d="M0 0 q5 -5 9 0 q4 -5 9 0" stroke="${noche ? '#D8D2F2' : '#2B1033'}" stroke-width="1.6" fill="none" stroke-linecap="round"/></g>`) : ''}
    ${tiene(50) ? repetir(Math.min(12, (entrenos - 50) / 60 + 1), (i) => mariposa(i, colores[i % 6])) : ''}
    ${tiene(100) && !noche ? repetir(Math.min(16, (entrenos - 100) / 45 + 1), abeja) : ''}
    ${tiene(1200) ? repetir(14, (i) => `<circle class="petalo" cx="${(reparto(i, 0.31) * ANCHO).toFixed(1)}" cy="-8" r="2.2" fill="#FFB7D3" style="animation-delay:-${i * 0.9}s"/>`) : ''}
    ${m.opaco ? `<rect class="velo" width="${ANCHO}" height="${ALTO}" fill="${m.velo}" opacity="${m.opaco}"/>` : ''}
    ${noche && lugares > 0 ? '<g class="velo"><circle cx="62" cy="178" r="11" fill="#FFD977" opacity=".3"/><circle cx="114" cy="178" r="11" fill="#FFD977" opacity=".3"/><circle cx="88" cy="157" r="9" fill="#FFD977" opacity=".3"/></g>' : ''}
    ${tiene(800) || noche ? repetir(noche ? Math.max(14, Math.min(30, (entrenos - 800) / 30 + 8)) : Math.min(30, (entrenos - 800) / 30 + 8), brillo) : ''}
    <g class="capa-fx"></g>
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
    <p class="mundo-dato">Toca a los animales, los árboles o el suelo: reaccionan. Cada semana planta un árbol, y crece durante años. El primero de cada año es dorado, y las semanas completas traen un girasol. Las que no entrenas, simplemente esperan.</p></section>`;
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
  iniciarVida(semanas.slice(0, i + 1).reduce((t, x) => t + x[1], 0), !!cronoBosque);
  return true;
}
// Pasa toda la historia en unos 14 segundos, sea cual sea su longitud.
let cronoBosque = null;
function pararBosque() {
  const reproducia = !!cronoBosque;
  clearInterval(cronoBosque); cronoBosque = null;
  const b = document.getElementById('bosque-play');
  if (b) b.textContent = '▶';
  // Terminada la historia, los animales vuelven a echar a andar.
  if (reproducia && b) { const i = +document.getElementById('tiempo-bosque').value; iniciarVida(semanasOrdenadas().slice(0, i + 1).reduce((t, x) => t + x[1], 0)); }
}
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
