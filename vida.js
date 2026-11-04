// La vida del bosque: animales dibujados a mano que caminan y hacen cosas por su cuenta.
// Cada animal tiene un dibujo con patas, cabeza y cola sueltas, y una lista de tareas. Las patas las mueve el CSS según su clase;
// aquí solo se decide adónde va cada uno y qué le apetece hacer. Se reparten por profundidad para pasar por delante y detrás de los árboles.

const gr = (cl, x, y, d) => `<g class="${cl}" style="transform-origin:${x}px ${y}px">${d}</g>`;
const pt = (cl, x, y, l, w, c, pie) => gr(cl, x, y, `<rect x="${x - w / 2}" y="${y}" width="${w}" height="${l}" rx="${w / 2.2}" fill="${c}"/>${pie ? `<rect x="${x - w / 2}" y="${y + l - 2.2}" width="${w + 0.8}" height="2.2" rx="1.1" fill="${pie}"/>` : ''}`);
const ojo = (x, y, r = 1.2) => gr('oj', x, y, `<circle cx="${x}" cy="${y}" r="${r}" fill="#241318"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.35}" r="${r * 0.36}" fill="#fff"/>`);
const CORAZON = (x, y, s, c) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 3 C-5 -1 -3 -5 0 -2.5 C3 -5 5 -1 0 3Z" fill="${c}"/>`;
const puas = (() => {
  let d = 'M-14 -2';
  for (let i = 0, a = 188; a > 8; a -= 10, i++) {
    const r = i % 2 ? 12.5 : 16;
    d += `L${(-1 + r * Math.cos(a * Math.PI / 180)).toFixed(1)} ${(-3 - r * 0.92 * Math.sin(a * Math.PI / 180)).toFixed(1)}`;
  }
  return `${d}L12 -2Z`;
})();

const DIBUJOS = {
  perro: () => { const c = '#9A5426', o = '#6E3715'; return `${pt('pb', -13, -7, 7, 3.4, o)}${pt('pa', 8, -7, 7, 3.4, o)}
    ${gr('cola', -18, -13, `<path d="M-18 -13 Q-24 -15 -26 -23" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/>`)}
    <rect x="-20" y="-18" width="37" height="12" rx="6" fill="${c}"/><path d="M-16 -7 H12 Q16 -7 17 -11 Q6 -7.5 -16 -8.5Z" fill="#D9A066"/><path d="M-16 -17 Q-2 -15 12 -17" fill="none" stroke="#B5703A" stroke-width="1.6" stroke-linecap="round"/>
    ${pt('pa', -16, -7, 7, 3.8, c, o)}${pt('pb', 11, -7, 7, 3.8, c, o)}
    ${gr('cab', 13, -15, `<path d="M11 -20 L15 -9" stroke="#E5344B" stroke-width="2.6" stroke-linecap="round"/><circle cx="14.8" cy="-9" r="1.5" fill="#FFC531"/><circle cx="20" cy="-20" r="6.8" fill="${c}"/><ellipse cx="27" cy="-17.6" rx="6.4" ry="3.5" fill="#B5703A"/><circle cx="33" cy="-18.6" r="1.6" fill="#241318"/><path d="M28 -15.4 Q30 -14.8 32 -15.8" fill="none" stroke="#241318" stroke-width=".8" stroke-linecap="round"/>${ojo(21.8, -22.2, 1.3)}${gr('ore', 16, -25, `<path d="M16.5 -26 Q10 -25 10.5 -13 Q15.8 -11.8 18.4 -20Z" fill="${o}"/>`)}`)}`; },
  elefante: () => { const c = '#8E9DB8', o = '#6F7E9A'; return `${pt('pb', -13, -16, 16, 7, o)}${pt('pa', 8, -16, 16, 7, o)}
    ${gr('cola', -23, -30, `<path d="M-23 -31 Q-28 -24 -27 -17" fill="none" stroke="${o}" stroke-width="2.2" stroke-linecap="round"/><circle cx="-27" cy="-15.5" r="2" fill="#4F5B73"/>`)}
    <ellipse cx="-3" cy="-27" rx="22.5" ry="17" fill="${c}"/><ellipse cx="-5" cy="-37" rx="14" ry="5" fill="#A8B5CC" opacity=".6"/>
    <path d="M-15 -43.4 Q-3 -47 9 -43.4 L12 -24 Q-3 -19 -18 -24Z" fill="#FF7DB0"/><path d="M-18 -24 Q-3 -19 12 -24" fill="none" stroke="#FFC531" stroke-width="2" stroke-dasharray="2 1.6"/>${CORAZON(-3, -33, 1.5, '#fff')}
    ${pt('pa', -14, -16, 16, 8, c, '#D6DDEA')}${pt('pb', 9, -16, 16, 8, c, '#D6DDEA')}
    ${gr('cab', 14, -33, `${gr('trompa', 29, -29, `<path d="M29 -31 Q38 -26 36 -15 Q35 -9 40 -8" fill="none" stroke="${c}" stroke-width="6" stroke-linecap="round"/><path d="M33 -24l4 -1M35.6 -19l4 .4M35 -14l4 1" stroke="${o}" stroke-width=".9" stroke-linecap="round"/>`)}<circle cx="20" cy="-33" r="13" fill="${c}"/><path d="M28 -25 q3 3 6.4 2" fill="none" stroke="#FFF8EE" stroke-width="2.2" stroke-linecap="round"/>${ojo(24, -36, 1.6)}<circle cx="26" cy="-31" r="2.2" fill="#F4B6C8" opacity=".7"/>${gr('ore', 12, -38, `<ellipse cx="10.5" cy="-33" rx="9.5" ry="13.5" fill="${o}"/><ellipse cx="10.5" cy="-32" rx="6" ry="9.5" fill="#F4B6C8"/>`)}`)}`; },
  ardilla: () => { const c = '#C4682B', l = '#F4D8B0'; return `${gr('cola', -6, -6, `<path d="M-6 -4 C-22 -3 -24 -24 -13 -28 C-6 -30 -3 -23 -8 -20 C-12 -16 -9 -10 -3 -9Z" fill="${c}"/><path d="M-9 -8 C-17 -9 -19 -21 -13 -25" fill="none" stroke="#E08E4F" stroke-width="2.2" stroke-linecap="round"/>`)}
    ${pt('pb', -1, -4, 4, 2.8, '#9C4F1E')}${pt('pa', 5, -4, 4, 2.8, '#9C4F1E')}<ellipse cx="1" cy="-9" rx="8" ry="7.6" fill="${c}"/><ellipse cx="4" cy="-8" rx="4" ry="5.6" fill="${l}"/>
    ${gr('bellota', 10, -11, '<ellipse cx="10.5" cy="-10" rx="2.4" ry="3" fill="#A86B2C"/><path d="M8 -12 Q10.5 -14.6 13 -12Z" fill="#6B4120"/>')}
    ${gr('cab', 4, -14, `<circle cx="7" cy="-18" r="6.4" fill="${c}"/><ellipse cx="10" cy="-15.8" rx="3.4" ry="2.9" fill="${l}"/><circle cx="13" cy="-17" r="1" fill="#241318"/>${ojo(9.2, -19.8, 1.15)}${gr('ore', 4, -23, '<path d="M2.4 -22.4 L3 -28 L7 -23.6Z" fill="#9C4F1E"/>')}`)}${pt('pa', 7, -11, 5, 2.2, c)}`; },
  erizo: () => `${pt('pb', -6, -3, 3, 2.8, '#6B4A32')}${pt('pa', 3, -3, 3, 2.8, '#6B4A32')}${gr('lomo', 0, -6, `<path d="${puas}" fill="#6B4A32"/><path d="M-9 -6l-2 -5M-5 -9l-1 -6M0 -10l0 -6M5 -9l1 -6" stroke="#C9A97F" stroke-width="1.2" stroke-linecap="round"/>`)}${gr('cab', 7, -5, `<path d="M4 -10 Q13 -9 19 -4 Q14 -1 4 -1.5Z" fill="#F0D6B0"/><circle cx="19" cy="-4.2" r="1.5" fill="#241318"/>${ojo(11.4, -6.4, 1.1)}${gr('ore', 6, -9, '<circle cx="6" cy="-9.4" r="2" fill="#D9B98C"/>')}`)}`,
  conejo: () => { const c = '#F3EBDD', o = '#D9CDBB'; return `${gr('cola', -11, -10, '<circle cx="-12" cy="-10" r="3.8" fill="#fff"/>')}${pt('pb', 4, -6, 6, 2.8, o)}<ellipse cx="-2" cy="-10.5" rx="10.5" ry="8.8" fill="${c}"/>${gr('pa', -6, -6, `<ellipse cx="-6" cy="-3.6" rx="6.4" ry="3.8" fill="${o}"/>`)}${pt('pa', 6, -7, 7, 2.8, c, o)}${gr('cab', 7, -14, `${gr('ore', 8, -22, `<ellipse cx="11" cy="-30" rx="2.6" ry="8.6" fill="${o}"/><ellipse cx="6.4" cy="-30.4" rx="2.8" ry="9" fill="${c}"/><ellipse cx="6.4" cy="-30" rx="1.3" ry="6.4" fill="#F7BFD0"/>`)}<circle cx="9" cy="-17.6" r="6.2" fill="${c}"/><circle cx="15" cy="-16.8" r="1.05" fill="#F28FB0"/><circle cx="11" cy="-15" r="1.6" fill="#F7BFD0" opacity=".7"/>${ojo(11, -19, 1.2)}`)}`; },
  ciervo: () => { const c = '#B9814C', o = '#8E5F33'; return `${pt('pb', -12, -19, 19, 3.2, o)}${pt('pa', 9, -19, 19, 3.2, o)}${gr('cola', -19, -28, '<ellipse cx="-20" cy="-26" rx="2.4" ry="4" fill="#fff"/>')}<ellipse cx="-3" cy="-25" rx="17.5" ry="9" fill="${c}"/><path d="M-15 -20 Q-3 -15 10 -20 Q-2 -22 -15 -20Z" fill="#F4E3C9"/><path d="M-11 -29h0M-5 -31h0M1 -29h0M-8 -24h0M-1 -25h0M6 -27h0" stroke="#F8EBD4" stroke-width="2.2" stroke-linecap="round"/>${pt('pa', -14, -19, 19, 3.6, c, '#3A2415')}${pt('pb', 11, -19, 19, 3.6, c, '#3A2415')}
    ${gr('cab', 12, -30, `<path d="M9 -30 L13 -44 L20 -42 L17 -24Z" fill="${c}"/><ellipse cx="19" cy="-47" rx="6" ry="4.8" fill="${c}"/><ellipse cx="24" cy="-45.6" rx="4" ry="2.6" fill="#D9A878"/><circle cx="27.4" cy="-46" r="1.2" fill="#241318"/>${ojo(20.4, -48, 1.2)}<path d="M16 -51 Q13 -58 8 -60 M14 -55 L10 -55 M19 -52 Q19 -59 15 -63 M18 -57 L15 -58" fill="none" stroke="#7A5230" stroke-width="1.5" stroke-linecap="round"/>${gr('ore', 14, -49, '<ellipse cx="11.4" cy="-49" rx="3.8" ry="1.9" fill="#D9A878" transform="rotate(20 11.4 -49)"/>')}`)}`; },
  buho: () => `${pt('pb', -3, -2, 2, 3, '#E0A030')}${pt('pa', 3, -2, 2, 3, '#E0A030')}<ellipse cx="0" cy="-11" rx="8.8" ry="11" fill="#8A6238"/><ellipse cx="0" cy="-9.6" rx="5.6" ry="7.6" fill="#E6CFA8"/><path d="M-3 -12l1.4 1.6 1.4 -1.6M.6 -12l1.4 1.6 1.4 -1.6M-1.6 -8l1.4 1.6 1.4 -1.6" fill="none" stroke="#8A6238" stroke-width=".8"/>${gr('ala', -8, -16, '<ellipse cx="-9" cy="-10" rx="3.2" ry="8" fill="#6E4D2B"/>')}${gr('ala otra', 8, -16, '<ellipse cx="9" cy="-10" rx="3.2" ry="8" fill="#6E4D2B"/>')}${gr('cab', 0, -18, '<circle cx="0" cy="-22" r="8.4" fill="#8A6238"/><path d="M-7 -27 L-7.6 -33 L-2.4 -29Z M7 -27 L7.6 -33 L2.4 -29Z" fill="#6E4D2B"/><circle cx="-3.2" cy="-23" r="3.5" fill="#FFF3C4"/><circle cx="3.2" cy="-23" r="3.5" fill="#FFF3C4"/><path d="M0 -21.6 L-1.4 -19.6 H1.4Z" fill="#E0A030"/>' + ojo(-3, -23, 1.7) + ojo(3.4, -23, 1.7))}`,
  mariquita: () => `<path d="M-6 -1v1M0 -1v1M6 -1v1" stroke="#241318" stroke-width="1.2"/><circle cx="8.6" cy="-4" r="3.6" fill="#241318"/><path d="M10 -7 Q12 -11 14 -10 M8 -7.4 Q9 -11 11 -11.6" fill="none" stroke="#241318" stroke-width=".8"/><circle cx="10" cy="-4.8" r=".9" fill="#fff"/>${gr('ala', 0, -6, '<path d="M-9 -1 Q-9 -11 0 -11 Q8 -11 8 -1Z" fill="#E5344B"/><path d="M0 -11V-1" stroke="#241318" stroke-width=".8"/><circle cx="-4.2" cy="-6.6" r="1.7" fill="#241318"/><circle cx="3.4" cy="-7.2" r="1.7" fill="#241318"/><circle cx="-1" cy="-3.2" r="1.2" fill="#241318"/><circle cx="5" cy="-3.2" r="1.1" fill="#241318"/>')}`,
  zorro: () => { const c = '#E8792B', o = '#B75A1C'; return `${pt('pb', -11, -9, 9, 3, '#3A2415')}${pt('pa', 8, -9, 9, 3, '#3A2415')}${gr('cola', -15, -15, `<path d="M-15 -15 C-26 -19 -34 -11 -33 -5 C-27 -3 -19 -6 -14 -11Z" fill="${c}"/><path d="M-33 -5 C-33 -8 -32 -10 -29.4 -11.6 C-28.6 -8.4 -27.6 -5.6 -26 -4.2 C-28.8 -3.4 -31 -3.8 -33 -5Z" fill="#fff"/>`)}<ellipse cx="-2" cy="-14" rx="15" ry="7.2" fill="${c}"/><path d="M4 -8 Q11 -8 13 -16 Q8 -13 3 -13Z" fill="#fff"/>${pt('pa', -12, -9, 9, 3.4, c, '#241318')}${pt('pb', 9, -9, 9, 3.4, c, '#241318')}${gr('cab', 11, -18, `<path d="M9 -24 L6.6 -33 L14 -28Z M16 -27 L18 -34 L21 -26Z" fill="${o}"/><circle cx="14.6" cy="-22" r="7" fill="${c}"/><path d="M15 -22 L28 -18.6 Q22 -14.6 13 -15.6Z" fill="#fff"/><circle cx="28" cy="-18.8" r="1.5" fill="#241318"/>${ojo(17, -24, 1.2)}`)}`; },
  cisne: () => `<path d="M-19 -9 Q-14 -3 -3 -1 H9 Q17 -3 15 -11 Q0 -6 -19 -14Z" fill="#fff"/><path d="M-20 -14 L-12 -9 L-16 -6Z" fill="#fff"/>${gr('ala', 2, -9, '<path d="M-13 -9 Q-5 -18 8 -11 Q2 -3 -10 -5Z" fill="#E6EDF4"/>')}${gr('cab', 12, -8, '<path d="M12 -8 C20 -14 8 -22 15 -30" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/><circle cx="17" cy="-31" r="3.8" fill="#fff"/><path d="M20 -33 L27 -30 L20 -29Z" fill="#F28C28"/><path d="M19 -33 l2 1v3l-2 1Z" fill="#241318"/>' + ojo(17.4, -32, .9))}`,
  tortuga: () => `${gr('pata', -7, -3, '<ellipse cx="-7" cy="-2" rx="3.2" ry="2.2" fill="#9CC47B"/>')}${gr('pata otra', 7, -3, '<ellipse cx="7" cy="-2" rx="3.2" ry="2.2" fill="#9CC47B"/>')}${gr('cab', 11, -4, '<ellipse cx="15" cy="-5.6" rx="4.4" ry="3.4" fill="#9CC47B"/>' + ojo(16.4, -6.6, .9))}<path d="M-12 -2 Q-12 -14 0 -14 Q12 -14 12 -2Z" fill="#4E8F5A"/><path d="M-6 -2 L-4 -8 L4 -8 L6 -2 M-4 -8 L-7 -12 M4 -8 L7 -12" fill="none" stroke="#2F6B40" stroke-width="1.1"/><path d="M-13 -2 H13" stroke="#E4D69F" stroke-width="1.8" stroke-linecap="round"/>`,
  loro: () => `${pt('pb', -2, -3, 3, 1.6, '#555')}${pt('pa', 2, -3, 3, 1.6, '#555')}<path d="M-6 -11 L-20 3 L-14 3 L-3 -6Z" fill="#2F6BFF"/><ellipse cx="0" cy="-11" rx="6.6" ry="9" fill="#E5344B"/>${gr('ala', -2, -16, '<path d="M-3 -17 Q-10 -12 -8 -3 Q-2 -5 1 -13Z" fill="#2F6BFF"/><path d="M-3 -15 Q-6 -12 -5.6 -8 Q-2 -9 -1 -13Z" fill="#FFC531"/>')}${gr('cab', 1, -17, '<circle cx="2" cy="-20" r="5.8" fill="#E5344B"/><circle cx="3.6" cy="-20.6" r="2.5" fill="#fff"/><path d="M6.6 -22.6 Q11.6 -21 8 -15.6 Q6.6 -18 6 -19Z" fill="#F2C531"/>' + ojo(3.8, -20.8, 1))}`,
  oveja: () => `${pt('pb', -9, -8, 8, 2.6, '#3A2B2B')}${pt('pa', 7, -8, 8, 2.6, '#3A2B2B')}<g fill="#FBF7F0"><circle cx="-10" cy="-15" r="6"/><circle cx="-3" cy="-19" r="6.4"/><circle cx="5" cy="-18" r="6"/><circle cx="10" cy="-13" r="5"/><circle cx="-1" cy="-11" r="7"/><circle cx="-9" cy="-10" r="4.6"/><circle cx="6" cy="-9" r="4.6"/></g>${pt('pa', -7, -7, 7, 2.8, '#241B1B')}${pt('pb', 9, -7, 7, 2.8, '#241B1B')}${gr('cola', -14, -13, '<circle cx="-16" cy="-13" r="2.6" fill="#FBF7F0"/>')}${gr('cab', 11, -16, `${gr('ore', 11, -19, '<ellipse cx="10" cy="-18" rx="3.2" ry="1.7" fill="#241B1B"/>')}<ellipse cx="16" cy="-16" rx="4.6" ry="5.8" fill="#3A2B2B"/><circle cx="14" cy="-22" r="3.6" fill="#FBF7F0"/>${ojo(17.4, -17.6, 1)}`)}`,
  pavo: () => `${pt('pb', -2, -7, 7, 1.8, '#9C8560')}${pt('pa', 4, -7, 7, 1.8, '#9C8560')}${gr('abanico', -8, -8, [-70, -46, -22, 2, 26, 50, 74].map((a) => `<g transform="rotate(${a - 22} -8 -8)"><path d="M-8 -8 Q-13 -24 -8 -36 Q-3 -24 -8 -8Z" fill="#1F9A72"/><circle cx="-8" cy="-31" r="3" fill="#FFC531"/><circle cx="-8" cy="-31" r="1.7" fill="#1B3FA8"/></g>`).join(''))}<ellipse cx="0" cy="-12" rx="8" ry="6.4" fill="#1B5FBF"/>${gr('cab', 4, -14, '<path d="M3 -13 Q9 -20 6 -26 L10 -26 Q13 -18 7 -9Z" fill="#1B5FBF"/><circle cx="8" cy="-28" r="3" fill="#1B5FBF"/><path d="M10.6 -28.6 L14.6 -27.4 L10.6 -26.6Z" fill="#E0A030"/><path d="M6 -31l-1 -3.6M8 -31v-4M10 -31l1 -3.6" stroke="#1B5FBF" stroke-width=".7"/><circle cx="6" cy="-34.8" r=".8" fill="#FFC531"/><circle cx="8" cy="-35.4" r=".8" fill="#FFC531"/><circle cx="11" cy="-34.8" r=".8" fill="#FFC531"/>' + ojo(8.6, -28.6, .8))}`,
  oso: () => { const c = '#7A5032', o = '#5C3A22'; return `${pt('pb', -13, -13, 13, 7, o)}${pt('pa', 9, -13, 13, 7, o)}${gr('cola', -21, -22, `<circle cx="-22" cy="-22" r="3.2" fill="${o}"/>`)}<ellipse cx="-3" cy="-21" rx="20" ry="14.5" fill="${c}"/><ellipse cx="-5" cy="-29" rx="12" ry="4.6" fill="#94663F" opacity=".7"/>${pt('pa', -15, -13, 13, 7.6, c, '#3F2615')}${pt('pb', 10, -13, 13, 7.6, c, '#3F2615')}${gr('cab', 14, -26, `${gr('ore', 12, -35, `<circle cx="11" cy="-35" r="3.8" fill="${c}"/><circle cx="11" cy="-35" r="2" fill="${o}"/><circle cx="21" cy="-36" r="3.4" fill="${o}"/>`)}<circle cx="17" cy="-27" r="10" fill="${c}"/><ellipse cx="24" cy="-24" rx="5.4" ry="4.2" fill="#D9B98C"/><ellipse cx="27" cy="-25.6" rx="1.9" ry="1.4" fill="#241318"/>${ojo(20, -30, 1.3)}`)}`; },
  flamenco: () => { const c = '#F58FB2'; return `${pt('pb', 0, -23, 23, 1.7, '#D9668E')}${pt('pa', -3, -23, 23, 1.7, '#E37BA0')}${gr('cola', -11, -27, `<path d="M-10 -28 L-18 -27 L-10 -23Z" fill="#D9668E"/>`)}<ellipse cx="-2" cy="-28" rx="10.6" ry="7" fill="${c}"/>${gr('ala', -2, -30, '<path d="M-9 -29 Q-1 -33 6 -28 Q0 -24 -8 -25Z" fill="#FFB7CF"/>')}${gr('cab', 7, -28, `<path d="M7 -28 C17 -34 5 -42 12 -52" fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round"/><circle cx="14" cy="-53" r="3.8" fill="${c}"/><path d="M17 -55 Q23 -53 20 -46 Q18 -50 16 -51Z" fill="#fff"/><path d="M20.6 -49.6 Q20.6 -47 20 -46 Q18.8 -47.4 19 -48.4Z" fill="#241318"/>${ojo(15, -54, .95)}`)}`; },
  oruga: () => `<path d="M-13 -1v1M-6 -1v1M1 -1v1M8 -1v1" stroke="#D9417F" stroke-width="2.2" stroke-linecap="round"/>${[[-16, 4.6], [-9, 5.6], [-2, 6.2], [5, 6.6]].map(([x, r], i) => `<g class="se" style="animation-delay:-${i * 0.14}s"><circle cx="${x}" cy="${-r - 1}" r="${r}" fill="#FF7DB0" stroke="#D9417F" stroke-width=".8"/></g>`).join('')}
    ${gr('cab', 9, -12, `<path d="M9 -22l-1.6 -6M16 -22l1.6 -6" stroke="#D9417F" stroke-width="1.4" stroke-linecap="round"/><circle cx="7.4" cy="-28.4" r="1.2" fill="#FFC531"/><circle cx="17.6" cy="-28.4" r="1.2" fill="#FFC531"/><circle cx="12.5" cy="-14.6" r="8" fill="#FF7DB0"/><circle cx="8" cy="-12" r="1.5" fill="#FF4F8E"/><circle cx="17" cy="-12" r="1.5" fill="#FF4F8E"/><path d="M10.4 -12.4 Q12.5 -10 14.6 -12.4" fill="none" stroke="#2B1033" stroke-width=".9" stroke-linecap="round"/>${ojo(9.6, -15.6, 1.2)}${ojo(15.4, -15.6, 1.2)}`)}
    ${gr('barra', 12.5, -26, '<path d="M-3 -24 H28" stroke="#F5EFF7" stroke-width="1.8" stroke-linecap="round"/><rect x="-1" y="-28" width="1.8" height="8" rx=".6" fill="#2F6BFF"/><rect x="1.2" y="-30" width="2.2" height="12" rx=".6" fill="#E5344B"/><rect x="21.6" y="-30" width="2.2" height="12" rx=".6" fill="#E5344B"/><rect x="24.2" y="-28" width="1.8" height="8" rx=".6" fill="#2F6BFF"/>')}`
};

// Tamaño, velocidad y si vive en el agua o en el aire. El orden es el de ANIMALES en bosque.js.
const FICHAS = {
  perro: { tam: 0.72, vel: 25, nombre: 'Perro salchicha' }, elefante: { tam: 0.92, vel: 12, nombre: 'Elefante' }, ardilla: { tam: 0.72, vel: 34, nombre: 'Ardilla' },
  erizo: { tam: 0.8, vel: 10, nombre: 'Erizo' }, conejo: { tam: 0.82, vel: 24, salta: 7, nombre: 'Conejo' }, ciervo: { tam: 0.82, vel: 18, nombre: 'Ciervo' },
  buho: { tam: 0.78, vel: 28, aire: true, nombre: 'Búho' }, mariquita: { tam: 0.6, vel: 7, nombre: 'Mariquita' }, zorro: { tam: 0.78, vel: 22, nombre: 'Zorro' },
  cisne: { tam: 0.8, vel: 8, agua: true, nombre: 'Cisne' }, tortuga: { tam: 0.82, vel: 5, nombre: 'Tortuga' }, loro: { tam: 0.72, vel: 34, aire: true, nombre: 'Loro' },
  oveja: { tam: 0.82, vel: 11, nombre: 'Oveja' }, pavo: { tam: 0.85, vel: 11, nombre: 'Pavo real' }, oso: { tam: 0.95, vel: 13, nombre: 'Oso' },
  flamenco: { tam: 0.8, vel: 10, agua: true, nombre: 'Flamenco' }, oruga: { tam: 0.72, vel: 7, nombre: 'Oruga' }
};
const TIPOS = ['perro', 'elefante', 'ardilla', 'erizo', 'conejo', 'ciervo', 'buho', 'mariquita', 'zorro', 'cisne', 'tortuga', 'loro', 'oveja', 'pavo', 'oso', 'flamenco'];
const MAX_BICHOS = 16;

function censoBosque(entrenos) {
  const lista = [{ tipo: 'oruga', k: 0 }], vistos = {};
  habitantesHasta(entrenos).filter((h) => !h.lugar).forEach((h) => {
    const tipo = TIPOS[ANIMALES.indexOf(h.emoji)];
    vistos[tipo] = (vistos[tipo] || 0) + 1;
    if (vistos[tipo] === 1 && lista.length < MAX_BICHOS) lista.push({ tipo, k: h.k });
  });
  return lista;
}

let vida = null;
const POS_BICHOS = {}; // Cada animal sigue donde estaba aunque se repinte la pantalla.
const dado = (n) => Math.floor(Math.random() * n);
const entre = (a, b) => a + Math.random() * (b - a);
const elige = (l) => l[dado(l.length)];

// ---------- Geografía ----------
function aOrilla(x, y) {
  if (!vida.rio) return { x, y };
  const c = centroRio(y), w = anchoRio(y) + 5;
  return Math.abs(x - c) < w ? { x: x < c ? c - w : c + w, y } : { x, y };
}
function sitioLibre() {
  for (let i = 0; i < 12; i++) {
    const p = aOrilla(entre(14, ANCHO - 14), Math.random() < 0.75 ? entre(PRADERA.y, FONDO + 8) : entre(HORIZONTE + 44, PRADERA.y));
    if (!(vida.casa && p.x > 42 && p.x < 136 && p.y > 170 && p.y < 208)) return p;
  }
  return { x: 100, y: 260 };
}
const ladoRio = (x, y) => (x < centroRio(y) ? -1 : 1);
function puenteDesde(lado) {
  const c = centroRio(Y_PUENTE), w = anchoRio(Y_PUENTE) + 9;
  return { x: c + lado * w, y: Y_PUENTE };
}
const alturaPuente = (x, y) => {
  if (!vida.puente || Math.abs(y - Y_PUENTE) > 4) return 0;
  const c = centroRio(Y_PUENTE), w = anchoRio(Y_PUENTE) + 9, d = Math.abs(x - c);
  return d < w ? 5 * Math.cos((d / w) * Math.PI / 2) : 0;
};
function arbolCerca(a, lejos = 110) {
  const cerca = vida.arboles.filter((t) => t.s > 0.55 && Math.hypot(t.x - a.x, t.y - a.y) < lejos && (!vida.rio || ladoRio(t.x, t.y) === ladoRio(a.x, a.y)));
  return cerca.length ? elige(cerca) : null;
}
const otro = (tipo) => vida.bichos.find((b) => b.tipo === tipo);

// ---------- Pasos que encadena cada animal ----------
function ir(a, x, y, extra = {}) {
  const pasos = [], f = FICHAS[a.tipo];
  if (vida.rio && !f.agua && !f.aire && ladoRio(a.x, a.y) !== ladoRio(x, y)) {
    if (!vida.puente) return pasos;
    const lado = ladoRio(a.x, a.y);
    const antes = puenteDesde(lado), despues = puenteDesde(-lado);
    pasos.push({ t: 'ir', ...antes, ...extra }, { t: 'ir', ...despues, ...extra });
  }
  pasos.push({ t: 'ir', x, y, ...extra });
  return pasos;
}
const pose = (clase, ms, fx, cada) => ({ t: 'pose', clase, ms, fx, cada });
const hacer = (fn) => ({ t: 'fx', fn });

// Se puede beber, si hay río. Devuelve a la orilla más cercana mirando al agua.
function aBeber(a) {
  if (!vida.rio) return [];
  const y = Math.min(FONDO, Math.max(HORIZONTE + 40, a.y + entre(-40, 40))), lado = ladoRio(a.x, a.y);
  const s = perspectiva(y) * FICHAS[a.tipo].tam;
  const x = centroRio(y) + lado * (anchoRio(y) + 18 * s);
  return [...ir(a, x, y), hacer(() => { a.dir = -lado; }), pose('bebe', entre(2200, 3400), (b) => onda(b.x - lado * (20 * s), b.y + 1), 700)];
}
function posarseEnArbol(a) {
  const t = arbolCerca(a, 400);
  if (!t) return [];
  return [{ t: 'vuelo', x: t.x, y: t.y + 0.5, z: 56 * t.s * 0.72 }, pose('quieto', entre(4000, 8000))];
}
function siesta(a) {
  const t = arbolCerca(a), base = t ? ir(a, t.x + entre(-14, 14), t.y + 6) : [];
  return [...base, pose('duerme', entre(6000, 11000), (b) => zeta(b.x + 8 * b.dir, b.y - 18 * b.s), 1500), pose('huele', 600)];
}
const pasear = (a) => { const p = sitioLibre(); return ir(a, p.x, p.y); };
const oler = (a) => { const p = sitioLibre(), m = { x: a.x + (p.x - a.x) * 0.3, y: a.y + (p.y - a.y) * 0.3 }, q = aOrilla(m.x, m.y); return [...ir(a, q.x, q.y), pose('huele', entre(1400, 2800))]; };

const TAREAS = {
  perro: [pasear, oler, oler, aBeber, siesta,
    (a) => { const p = sitioLibre(); return [...ir(a, p.x, p.y, { rapido: true }), pose('cava', 2600, (b) => { for (let i = 0; i < 2; i++) chispa(b.x - 8 * b.dir * b.s, b.y - 1, -b.dir * entre(6, 22), entre(6, 15), '#7A5230', 1.2, 600); }, 170), pose('contento', 900), hacer(() => brote(a.x, a.y))]; },
    (a) => { const v = otro('ardilla'); if (!v || v.ocupado) return pasear(a); const p = v; v.pasos = trepar(v, true); return [...ir(a, p.x, p.y, { rapido: true }), pose('ladra', 2400, (b) => { chispaTexto(b.x + 22 * b.dir * b.s, b.y - 26 * b.s, '¡guau!'); }, 800), pose('sienta', 1600)]; },
    (a) => { const v = otro('elefante'); if (!v) return pasear(a); return [...ir(a, v.x - 26 * v.dir, v.y + 2, { rapido: true }), hacer(() => { a.dir = v.x > a.x ? 1 : -1; }), pose('contento', 2200, (b) => corazon(b.x + 8 * b.dir, b.y - 22 * b.s), 500)]; },
    (a) => { const v = otro('erizo'); if (!v) return oler(a); return [...ir(a, v.x - 24, v.y + 1), hacer(() => { a.dir = 1; v.pasos = [pose('bola', 3400)]; v.fin = 0; }), pose('huele', 1500), pose('salta', 500), pose('ladra', 900, (b) => chispaTexto(b.x + 16 * b.dir * b.s, b.y - 24 * b.s, '¿eh?'))]; },
    (a) => (vida.casa ? entrarEnCasa(a) : oler(a))
  ],
  elefante: [pasear, aBeber, siesta,
    (a) => [...aBeber(a), hacer(() => { a.lleno = true; }), ...regar(a)],
    (a) => [pose('trompeta', 2200, (b) => { chispaTexto(b.x + 28 * b.dir * b.s, b.y - 48 * b.s, elige(['♪', '♫', '¡prrrr!'])); }, 550)],
    (a) => { const t = arbolCerca(a); if (!t) return pasear(a); return [...ir(a, t.x - 16, t.y + 3), hacer(() => { a.dir = 1; }), pose('rocia', 1800, () => sacudir(t), 600)]; },
    (a) => [pose('orejea', 1800)]
  ],
  ardilla: [(a) => trepar(a), (a) => trepar(a), oler, (a) => [pose('come', 2800)], pasear],
  erizo: [pasear, oler, oler, (a) => [pose('bola', 3000)], siesta],
  conejo: [pasear, pasear, (a) => { const q = sitioLibre(); return [...ir(a, q.x, q.y), pose('come', 3000), hacer(() => brote(a.x + 8 * a.dir, a.y))]; }, (a) => [pose('alerta', 2200)], aBeber],
  ciervo: [pasear, (a) => [pose('come', 3600), pose('alerta', 1800)], aBeber, siesta, (a) => { const p = sitioLibre(); return ir(a, p.x, p.y, { rapido: true }); }],
  buho: [posarseEnArbol, (a) => [pose('otea', 3600)], (a) => [pose('duerme', 5000)]],
  mariquita: [pasear, (a) => { const p = sitioLibre(); return [{ t: 'vuelo', x: p.x, y: p.y, z: 18 }, { t: 'vuelo', x: p.x, y: p.y, z: 0 }]; }, (a) => [pose('quieto', 3000)]],
  zorro: [pasear, aBeber, siesta, (a) => [pose('sienta', 3400)],
    (a) => { const p = sitioLibre(); return [...ir(a, p.x, p.y), pose('acecha', 1500), { t: 'salto', dx: 26 * a.dir, ms: 520 }, pose('cava', 700, (b) => chispa(b.x, b.y, entre(-10, 10), 10, '#7A5230', 1.2, 500), 130), pose('contento', 900)]; }
  ],
  cisne: [(a) => nadar(a), (a) => nadar(a), (a) => [pose('bebe', 2200, (b) => onda(b.x + 14 * b.dir * b.s, b.y), 600)]],
  tortuga: [pasear, (a) => [pose('escondida', 3400)], aBeber],
  loro: [posarseEnArbol, posarseEnArbol, (a) => [pose('canta', 2000, (b) => chispaTexto(b.x + 10 * b.dir, b.y - b.z - 28 * b.s, elige(['♪', '♫', '¡hola, María!'])), 900)]],
  oveja: [pasear, (a) => [pose('come', 4200)], (a) => [pose('come', 2400), pose('bala', 1000, (b) => chispaTexto(b.x + 22 * b.dir * b.s, b.y - 22 * b.s, '¡beee!'))], siesta],
  pavo: [pasear, (a) => [pose('luce', 4400, (b) => corazon(b.x, b.y - 36 * b.s), 1400)], oler],
  oso: [pasear, siesta, (a) => { const t = arbolCerca(a); if (!t) return pasear(a); return [...ir(a, t.x - 14, t.y + 2), hacer(() => { a.dir = 1; }), pose('rasca', 3000, () => sacudir(t), 750)]; },
    (a) => { if (!vida.rio) return pasear(a); const b = aBeber(a); return [...b.slice(0, -1), pose('pesca', 3200, (o) => { onda(o.x + o.dir * 18 * o.s, o.y + 1); if (Math.random() < 0.45) pez(o.x + o.dir * 22 * o.s, o.y); }, 800), pose('contento', 900)]; }
  ],
  flamenco: [(a) => nadar(a), (a) => [pose('reposo', 4400)], (a) => [pose('bebe', 2400, (b) => onda(b.x + 14 * b.dir * b.s, b.y), 700)]],
  oruga: [pasear, oler,
    (a) => { let reps = 0; return [pose('pesas', 4800, (b) => { reps++; chispaTexto(b.x, b.y - 42 * b.s, String(reps)); chispa(b.x + 4, b.y - 26 * b.s, entre(-8, 8), 6, '#9BE3FF', 1, 500); }, 1200), pose('contento', 900, (b) => corazon(b.x, b.y - 30 * b.s))]; },
    (a) => [pose('come', 2800), hacer(() => brote(a.x + 12 * a.dir, a.y))],
    (a) => (vida.casa ? entrarEnCasa(a) : pasear(a))
  ]
};

function trepar(a, huyendo) {
  const t = arbolCerca(a, huyendo ? 400 : 140);
  if (!t) return pasear(a);
  const z = 56 * t.s * 0.62, mover = huyendo ? { rapido: true } : {};
  return [...ir(a, t.x, t.y + 0.5, mover), { t: 'sube', z, clase: 'trepa', vel: 26 }, hacer(() => sacudir(t)), pose('come', huyendo ? 4200 : 3000), hacer(() => { a.dir = -a.dir; }), pose('alerta', 1100), { t: 'sube', z: 0, clase: 'baja', vel: 30 }];
}
function regar(a) {
  const destino = sitioLibre(), s = perspectiva(destino.y) * FICHAS.elefante.tam;
  return [...ir(a, destino.x, destino.y), pose('rocia', 2600, (b) => {
    for (let i = 0; i < 4; i++) chispa(b.x + 34 * b.dir * b.s, b.y - 52 * b.s, b.dir * entre(12, 32), entre(5, 14), '#9BE3FF', 1.3, 760, 52 * b.s);
  }, 160), hacer(() => { brote(a.x + 56 * a.dir * s, a.y); a.lleno = false; }), pose('contento', 1100, (b) => corazon(b.x + 16 * b.dir, b.y - 48 * b.s))];
}
function nadar(a) {
  if (!vida.rio) return [pose('quieto', 3000)];
  const y = entre(HORIZONTE + 70, FONDO), x = centroRio(y) + entre(-0.5, 0.5) * anchoRio(y);
  return [{ t: 'ir', x, y, estela: true }];
}
function entrarEnCasa(a) {
  const f = CASA.puerta;
  return [...ir(a, f.x, f.y), hacer(() => { abrirPuerta(); a.dir = 1; }), { t: 'pose', clase: 'quieto', ms: 300 }, hacer(() => { a.el.style.opacity = 0; humo(); }), pose('quieto', entre(3500, 7000)), hacer(() => { abrirPuerta(); a.el.style.opacity = ''; }), pose('contento', 900, (b) => corazon(b.x, b.y - 24 * b.s))];
}

// ---------- Efectos ----------
function efecto(html, ms) {
  if (!vida || !vida.capaFx || vida.capaFx.childElementCount > 45) return;
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.innerHTML = html;
  vida.capaFx.appendChild(g);
  setTimeout(() => g.remove(), ms);
}
function chispa(x, y, dx, alto, color, r = 1.2, ms = 700, caida = 12) {
  efecto(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="fx-x" style="--dx:${dx.toFixed(1)}px;animation-duration:${ms}ms"><circle class="fx-y" style="--alto:${-alto.toFixed(1)}px;--caida:${caida.toFixed(1)}px;animation-duration:${ms}ms" r="${r}" fill="${color}"/></g></g>`, ms);
}
const sube = (x, y, dentro, ms = 1500) => efecto(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="fx-sube" style="animation-duration:${ms}ms">${dentro}</g></g>`, ms);
const corazon = (x, y) => sube(x + entre(-3, 3), y, CORAZON(0, 0, 1.1, elige(['#FF4F8E', '#FF7DB0', '#E5344B'])));
const zeta = (x, y) => sube(x, y, '<text font-size="9" font-weight="700" fill="#fff">z</text>', 1800);
const chispaTexto = (x, y, t) => sube(x, y, `<text text-anchor="middle" font-size="8" font-weight="700" fill="#fff" stroke="#2B1033" stroke-width="2" paint-order="stroke">${esc(t)}</text>`, 1200);
const onda = (x, y) => efecto(`<ellipse class="fx-onda" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="5" ry="1.8" fill="none" stroke="#fff" stroke-width=".9"/>`, 1100);
const pez = (x, y) => { efecto(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><g class="fx-pez"><path d="M-5 0 Q0 -4 5 0 L8 -3 V3 L5 0 Q0 4 -5 0Z" fill="#FF9B6B"/></g></g>`, 900); onda(x, y); };
function sacudir(t) {
  const el = t.el;
  if (!el) return;
  el.classList.remove('sacude'); void el.getBBox(); el.classList.add('sacude');
  const color = elige(['#3DBF6E', '#FFC531', '#FF9DC4']);
  for (let i = 0; i < 3; i++) chispa(t.x + entre(-14, 14) * t.s, t.y - 44 * t.s, entre(-8, 8), 2, color, 1.3, 1200, 38 * t.s);
}
function brote(x, y) {
  if (!vida || !vida.capaBrotes || vida.capaBrotes.childElementCount > 18 || x < 6 || x > ANCHO - 6) return;
  const p = aOrilla(x, y), s = perspectiva(p.y);
  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) scale(${s.toFixed(2)})`);
  g.innerHTML = `<g class="brota-b"><path d="M0 0V-7" stroke="#2F7D4F" stroke-width="1.2"/><circle cy="-8" r="2.8" fill="${elige(['#FFC531', '#FF7DB0', '#fff', '#C69CFF'])}"/><circle cy="-8" r="1.1" fill="#E5344B"/></g>`;
  vida.capaBrotes.appendChild(g);
}
function abrirPuerta() {
  const p = vida && vida.svg.querySelector('.puerta');
  if (!p) return;
  p.classList.add('abre');
  setTimeout(() => p.classList.remove('abre'), 1500);
}
function humo() { /* La chimenea ya humea sola; aquí suelta una bocanada de más. */
  if (vida && vida.casa) for (let i = 0; i < 2; i++) sube(CASA.chimenea.x + entre(-2, 2), CASA.chimenea.y - i * 4, '<circle r="3" fill="#fff" opacity=".65"/>', 1700);
}

// ---------- Motor ----------
function ponClase(a, clase) {
  if (a.clase === clase) return;
  a.clase = clase;
  a.el.setAttribute('class', `b-animal b-${a.tipo} ${clase}`);
}
function colocar(a) {
  a.s = perspectiva(a.y) * FICHAS[a.tipo].tam * 1.2;
  const puente = alturaPuente(a.x, a.y), z = a.z + puente + (a.salto || 0);
  a.el.setAttribute('transform', `translate(${a.x.toFixed(1)} ${a.y.toFixed(1)}) scale(${(a.dir * a.s).toFixed(3)} ${a.s.toFixed(3)})`);
  a.dentro.setAttribute('transform', `translate(0 ${(-z / a.s).toFixed(1)})`);
  const b = Math.max(0, Math.min(vida.huecos.length - 1, bandaDe(a.y)));
  if (b !== a.banda) { a.banda = b; vida.huecos[b].appendChild(a.el); }
}
function proximaTarea(a) {
  const dormilon = vida.noche && Math.random() < 0.25 && !FICHAS[a.tipo].agua;
  const lista = TAREAS[a.tipo];
  a.pasos = dormilon ? siesta(a) : elige(lista)(a);
  if (!a.pasos.length) a.pasos = [pose('quieto', entre(800, 2000))];
  a.pasos.push(pose(elige(['quieto', 'quieto', 'mira']), entre(700, 2400)));
}
function avanzar(a, dt) {
  if (!a.pasos.length) proximaTarea(a);
  const p = a.pasos[0], f = FICHAS[a.tipo];
  if (p.t === 'fx') { a.pasos.shift(); p.fn(); return; }
  if (p.t === 'pose') {
    if (p.resta === undefined) { p.resta = p.ms; p.prox = 0; ponClase(a, p.clase); }
    p.resta -= dt * 1000;
    if (p.fx && p.resta <= (p.prox === 0 ? p.ms : p.prox)) { p.fx(a); p.prox = p.resta - (p.cada || 1e9); }
    if (p.resta <= 0) a.pasos.shift();
    return;
  }
  if (p.t === 'sube') {
    ponClase(a, p.clase);
    const d = p.z - a.z, m = p.vel * dt;
    if (Math.abs(d) <= m) { a.z = p.z; a.pasos.shift(); } else a.z += Math.sign(d) * m;
    colocar(a);
    return;
  }
  if (p.t === 'salto') {
    if (p.pasado === undefined) { p.pasado = 0; p.x0 = a.x; ponClase(a, 'brinca'); }
    p.pasado += dt * 1000;
    const k = Math.min(1, p.pasado / p.ms);
    a.x = p.x0 + p.dx * k;
    a.salto = Math.sin(k * Math.PI) * 16 * a.s;
    if (k >= 1) { a.salto = 0; a.pasos.shift(); }
    colocar(a);
    return;
  }
  // Andar o volar hasta un punto.
  const vel = f.vel * (p.rapido ? 1.8 : 1) * (p.t === 'vuelo' ? 1 : perspectiva(a.y)), dx = p.x - a.x, dy = p.y - a.y, dist = Math.hypot(dx, dy);
  const clase = p.t === 'vuelo' ? 'volando' : f.agua ? 'nada' : f.salta ? 'brinca' : p.rapido ? 'trota' : 'anda';
  ponClase(a, clase);
  if (Math.abs(dx) > 0.5) a.dir = dx > 0 ? 1 : -1;
  if (p.t === 'vuelo') {
    const dz = p.z - a.z, restante = Math.max(dist, Math.abs(dz), 1);
    if (dist < 1 && Math.abs(dz) < 1) { a.x = p.x; a.y = p.y; a.z = p.z; a.pasos.shift(); } else {
      const paso = Math.min(1, (vel * dt) / restante);
      a.x += dx * paso; a.y += dy * paso; a.z += dz * paso;
    }
    colocar(a);
    return;
  }
  if (dist <= vel * dt) { a.x = p.x; a.y = p.y; a.salto = 0; a.pasos.shift(); colocar(a); return; }
  a.x += (dx / dist) * vel * dt;
  a.y += (dy / dist) * vel * dt;
  if (vida.rio && !f.agua && !alturaPuente(a.x, a.y)) {
    const c = centroRio(a.y), w = anchoRio(a.y) + 1;
    if (Math.abs(a.x - c) < w) a.x = c + (a.lado || 1) * w; else a.lado = a.x < c ? -1 : 1;
  }
  if (f.salta) { a.fase = (a.fase || 0) + vel * dt; a.salto = Math.abs(Math.sin(a.fase / 9)) * f.salta * a.s; }
  if (p.estela && Math.random() < 0.05) onda(a.x - 14 * a.dir * a.s, a.y);
  colocar(a);
}
function latido(ahora) {
  if (!vida) return;
  vida.raf = requestAnimationFrame(latido);
  if (!vida.svg.isConnected) { pararVida(); return; }
  if (!vida.visible || ahora - vida.ultimo < 32) return;
  const dt = Math.min(0.12, (ahora - vida.ultimo) / 1000);
  vida.ultimo = ahora;
  vida.bichos.forEach((a) => avanzar(a, dt));
}

function pararVida() {
  if (!vida) return;
  cancelAnimationFrame(vida.raf);
  if (vida.io) vida.io.disconnect();
  vida.bichos.forEach((a) => { POS_BICHOS[a.tipo] = { x: a.x, y: a.y, dir: a.dir }; });
  vida = null;
}
// Coloca a los animales en la escena. quietos: se ven, pero no echan a andar (mientras pasa la historia o sin animaciones).
function iniciarVida(entrenos, quietos) {
  pararVida();
  const caja = document.getElementById('escena-bosque'), svg = caja && caja.querySelector('svg');
  if (!svg) return;
  const hueco = svg.querySelectorAll('.hueco');
  vida = { svg, huecos: [...hueco], capaFx: svg.querySelector('.capa-fx'), capaBrotes: svg.querySelector('.capa-brotes'), rio: entrenos >= 300, puente: entrenos >= 500, casa: entrenos >= 500, noche: svg.dataset.momento === 'noche', bichos: [], visible: true, ultimo: performance.now(),
    arboles: [...svg.querySelectorAll('[data-semana]')].map((el) => ({ el, x: +el.dataset.x, y: +el.dataset.y, s: +el.dataset.s })) };
  vida.bichos = censoBosque(entrenos).map(({ tipo, k }, i) => {
    const f = FICHAS[tipo];
    let p = POS_BICHOS[tipo];
    if (!p) {
      if (f.agua && vida.rio) { const y = HORIZONTE + 80 + reparto(i, 0.6180339887) * 120; p = { x: centroRio(y), y, dir: 1 }; } else {
        const y = PRADERA.y + 4 + reparto(i, 0.6180339887) * (FONDO - PRADERA.y);
        const q = aOrilla(PRADERA.a + reparto(i, 0.4142135624) * (PRADERA.b - PRADERA.a), y);
        p = { x: q.x, y: q.y, dir: i % 2 ? 1 : -1 };
      }
    }
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    el.innerHTML = `<ellipse class="sombra-b" cx="0" cy="0" rx="${tipo === 'elefante' || tipo === 'oso' ? 24 : 14}" ry="3" fill="#0F3D28" opacity=".35"/><g class="alt"><g class="cuerpo">${DIBUJOS[tipo]()}</g></g>`;
    const a = { tipo, k, x: p.x, y: p.y, z: 0, dir: p.dir, s: 1, pasos: [], el, dentro: el.querySelector('.alt'), banda: -1, clase: '' };
    ponClase(a, 'quieto');
    colocar(a);
    return a;
  });
  if (quietos || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('IntersectionObserver' in window) {
    vida.io = new IntersectionObserver((es) => { if (vida) { vida.visible = es[0].isIntersecting; vida.ultimo = performance.now(); } });
    vida.io.observe(svg);
  }
  vida.raf = requestAnimationFrame(latido);
}

// ---------- Tocar el bosque ----------
function tocarBosque(ev, svg) {
  const r = svg.getBoundingClientRect(), k = ANCHO / r.width;
  const x = (ev.clientX - r.left) * k, y = (ev.clientY - r.top) * k;
  if (!vida) return false;
  const puntos = vida.bichos.map((a) => ({ a, d: Math.hypot(a.x - x, a.y - a.z - 12 * a.s - y) })).sort((p, q) => p.d - q.d);
  if (puntos[0] && puntos[0].d < 28) {
    const a = puntos[0].a, lista = FRASES.bichos.filter((f) => f.startsWith(`${a.tipo}|`));
    a.z === 0 && !a.el.style.opacity ? (a.pasos = [{ t: 'salto', dx: 0, ms: 460 }, pose('contento', 1200, (b) => corazon(b.x, b.y - b.z - 24 * b.s), 400)]) : corazon(a.x, a.y - a.z - 24 * a.s);
    decir(lista.length ? elige(lista).split('|')[1] : FICHAS[a.tipo].nombre);
    return true;
  }
  const arbol = ev.target.closest('[data-semana]');
  if (arbol) {
    sacudir(vida.arboles.find((t) => t.el === arbol) || { el: arbol, x, y, s: 1 });
    return false;
  }
  if (y > HORIZONTE + 18) {
    // Tocar el suelo: quien esté más cerca viene a ver qué pasa.
    const libre = puntos.map((p) => p.a).filter((a) => !FICHAS[a.tipo].agua && !FICHAS[a.tipo].aire && a.z === 0 && !a.el.style.opacity);
    if (libre.length) {
      const a = libre[0], q = aOrilla(x, Math.min(FONDO + 8, y));
      sube(q.x, q.y, CORAZON(0, -3, 1, '#FFC531'), 900);
      a.pasos = [...ir(a, q.x, q.y, { rapido: true }), pose('contento', 1300, (b) => corazon(b.x, b.y - 22 * b.s), 500)];
    }
  }
  return true;
}
