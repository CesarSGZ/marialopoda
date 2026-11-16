'use strict';
// Carlitos, the dachshund César and María look after together. The same file runs in Mission Control (training) and in
// Marialópoda (app/carlitos.js is a copy): the server works out how he is, this file draws him and sends what you do.
// Carlitos.montar(nodo, { estado, viewer: 'cesar' | 'maria', enviar(accion) → Promise<estado> }) paints his page;
// Carlitos.tira(estado, viewer) is the one-line strip for the main screen, or '' when there is nothing to tell.
(function () {
  const NOMBRE = { cesar: 'Cesarlópodo', maria: 'Marialópoda' };
  const otro = (v) => (v === 'cesar' ? 'maria' : 'cesar');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const leer = (k, d) => { try { const v = localStorage.getItem('cx.' + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } };
  const guardar = (k, v) => { try { localStorage.setItem('cx.' + k, JSON.stringify(v)); } catch (e) { /* sin espacio */ } };
  const quieto = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const azar = (l) => l[Math.floor(Math.random() * l.length)];
  const fecha = (iso) => { const [, m, d] = iso.split('-'); return `${+d} ${['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][m - 1]}`; };
  const hora = () => new Date().getHours() + new Date().getMinutes() / 60;
  const durmiendo = () => hora() >= 23.5 || hora() < 7;

  // ---------- The drawing ----------
  const C = { pelo: '#2A1F1B', pelo2: '#3A2B25', lejos: '#1C1411', fuego: '#C9793A', fuego2: '#E09A57', nariz: '#120C0A', rosa: '#FF8FB8', lengua: '#FF6F96' };
  const LARGO = { cachorro: 92, joven: 116, adulto: 132, leyenda: 136 };
  function accesorio(id, L) {
    const xb = 78 + L;
    switch (id) {
      case 'collar': return '<path d="M80 86 Q91 97 103 84" stroke="#E5344B" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="92" cy="98" r="4.5" fill="#FFC531" stroke="#B8860B" stroke-width="1"/>';
      case 'panuelo': return '<path d="M77 86 L106 84 L93 112 Z" fill="#FF7DB0"/><circle cx="88" cy="94" r="2" fill="#fff" opacity=".8"/><circle cx="97" cy="97" r="2" fill="#fff" opacity=".8"/><circle cx="92" cy="104" r="2" fill="#fff" opacity=".8"/>';
      case 'corazones': return '<path d="M77 86 L106 84 L93 112 Z" fill="#E5344B"/><text x="84" y="98" font-size="8" fill="#fff">♥</text><text x="93" y="101" font-size="7" fill="#fff">♥</text><text x="89" y="108" font-size="6" fill="#fff">♥</text>';
      case 'pajarita': return '<path d="M80 92 L92 98 L80 104 Z M104 92 L92 98 L104 104 Z" fill="#2F6BFF"/><circle cx="92" cy="98" r="3.5" fill="#1E4FCC"/>';
      case 'medalla': return '<path d="M84 86 L92 102 L100 86" stroke="#2F6BFF" stroke-width="5" fill="none"/><circle cx="92" cy="106" r="7" fill="#FFC531" stroke="#B8860B"/><text x="88.2" y="109.5" font-size="9" fill="#B8860B">★</text>';
      case 'gorro': return '<path d="M44 46 Q70 6 98 44 Z" fill="#E5344B"/><rect x="42" y="40" width="58" height="10" rx="5" fill="#FFF4F8"/><circle cx="72" cy="14" r="7" fill="#FFF4F8"/>';
      case 'corona': return '<path d="M50 42 L54 20 L64 34 L72 16 L80 34 L90 20 L92 42 Z" fill="#FFC531" stroke="#B8860B" stroke-width="1.5"/><circle cx="72" cy="30" r="3" fill="#E5344B"/><circle cx="59" cy="34" r="2" fill="#2F6BFF"/><circle cx="85" cy="34" r="2" fill="#22B573"/>';
      case 'mago': return '<path d="M46 46 L76 -6 L98 44 Z" fill="#552566"/><ellipse cx="72" cy="45" rx="34" ry="6" fill="#40194C"/><text x="66" y="28" font-size="10" fill="#FFC531">★</text><text x="78" y="14" font-size="7" fill="#FFC531">✦</text>';
      case 'reno': return '<path d="M58 40 L52 20 M53 25 L45 18 M55 30 L48 30 M84 40 L90 20 M89 25 L97 18 M87 30 L94 30" stroke="#8B5A2B" stroke-width="4" stroke-linecap="round" fill="none"/><circle cx="22" cy="78" r="7" fill="#E5344B"/>';
      case 'fiesta': return '<path d="M54 42 L72 4 L88 42 Z" fill="#2F6BFF"/><path d="M60 30 L84 30 M64 20 L80 20" stroke="#FFC531" stroke-width="4"/><circle cx="72" cy="4" r="5" fill="#FF7DB0"/>';
      case 'cinta': return '<path d="M44 54 Q70 38 98 52" stroke="#22B573" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M44 54 Q70 38 98 52" stroke="#FFF4F8" stroke-width="2" fill="none" stroke-dasharray="3 5"/>';
      case 'gafas': return '<path d="M46 63 L30 66 M70 62 L84 58" stroke="#FF4F8E" stroke-width="3"/><rect x="45" y="56" width="26" height="17" rx="8" fill="#0B0B12" stroke="#FF4F8E" stroke-width="3"/><rect x="49" y="59" width="9" height="4" rx="2" fill="#fff" opacity=".45"/>';
      case 'gafitas': return '<circle cx="58" cy="66" r="11.5" fill="#fff" fill-opacity=".14" stroke="#FFC531" stroke-width="3"/><path d="M46.5 66 L32 68 M69.5 64 L84 60" stroke="#FFC531" stroke-width="3"/>';
      case 'capa': return `<path class="cx-capa" d="M86 80 Q${78 + L / 2} 66 ${xb + 14} 106 L${xb - 4} 112 Q${78 + L / 2} 96 94 104 Z" fill="#E5344B"/><path d="M86 80 Q${78 + L / 2} 66 ${xb + 14} 106" stroke="#FF6B7D" stroke-width="2" fill="none"/><text x="${78 + L / 2 - 6}" y="96" font-size="12" fill="#FFC531">★</text>`;
      case 'jersey': return `<rect x="84" y="78" width="${L - 26}" height="44" rx="20" fill="#C62E40"/><path d="M90 92 ${Array.from({ length: Math.floor((L - 40) / 10) }, (_, i) => `L${95 + i * 10} ${i % 2 ? 92 : 100}`).join(' ')}" stroke="#FFF4F8" stroke-width="3" fill="none"/><text x="${78 + L / 2 - 6}" y="116" font-size="11" fill="#22B573">❄</text>`;
      case 'chubasquero': return `<rect x="84" y="78" width="${L - 22}" height="42" rx="20" fill="#FFC531"/><path d="M${78 + L / 2} 80 L${78 + L / 2} 118" stroke="#E0A800" stroke-width="2"/><circle cx="${78 + L / 2 - 8}" cy="94" r="2" fill="#E0A800"/><circle cx="${78 + L / 2 - 8}" cy="106" r="2" fill="#E0A800"/>`;
      case 'flotador': return `<ellipse cx="${78 + L / 2 + 6}" cy="104" rx="${L / 2 - 6}" ry="25" fill="none" stroke="#FFC531" stroke-width="11"/><path d="M${78 + L / 2 - 20} 78 q4 -10 10 0" stroke="#FF8A00" stroke-width="4" fill="none"/><circle cx="${78 + L / 2 - 16}" cy="72" r="6" fill="#FFC531"/><circle cx="${78 + L / 2 - 18}" cy="71" r="1.3" fill="#111"/>`;
      default: return '';
    }
  }
  const ORDEN = ['jersey', 'chubasquero', 'flotador', 'capa'];
  function dibujo(e, op = {}) {
    const L = LARGO[e?.stage] || LARGO.cachorro, puesto = (e?.worn || ['collar']);
    const cabeza = e?.stage === 'cachorro' ? 1.14 : e?.stage === 'joven' ? 1.06 : 1;
    const xb = 78 + L, ancho = xb + 46, dormido = op.dormido, feliz = e?.mood === 'feliz' || e?.mood === 'contento';
    const pata = (x, lejos, clase) => `<g class="cx-pata ${clase || ''}" style="transform-origin:${x + 6}px 114px"><rect x="${x}" y="110" width="13" height="32" rx="6.5" fill="${lejos ? C.lejos : C.pelo}"/><ellipse cx="${x + 5}" cy="143" rx="9" ry="5" fill="${lejos ? '#A86330' : C.fuego}"/></g>`;
    const cuerpo = puesto.filter((id) => ORDEN.includes(id)).map((id) => accesorio(id, L)).join('');
    const resto = puesto.filter((id) => !ORDEN.includes(id)).map((id) => accesorio(id, L)).join('');
    const ojo = dormido
      ? '<path d="M51 67 Q58 72 65 67" stroke="#120C0A" stroke-width="3" fill="none" stroke-linecap="round"/>'
      : `<g class="cx-ojo" style="transform-origin:58px 66px"><circle cx="58" cy="66" r="8.5" fill="#120C0A"/><circle cx="61" cy="62.5" r="3" fill="#fff"/><circle cx="55.5" cy="69" r="1.4" fill="#fff" opacity=".8"/></g>`;
    return `<svg class="cx-perro${op.clase ? ' ' + op.clase : ''}" viewBox="0 0 ${ancho} 160" role="img" aria-label="Carlitos, un perro salchicha negro y fuego">
      <ellipse cx="${(xb + 70) / 2}" cy="148" rx="${L / 2 + 34}" ry="7" fill="#000" opacity=".18"/>
      <g class="cx-todo">
        <g class="cx-cola" style="transform-origin:${xb - 6}px 92px"><path d="M${xb - 6} 92 Q${xb + 20} 86 ${xb + 28} 60" stroke="${C.pelo}" stroke-width="9" fill="none" stroke-linecap="round"/></g>
        ${pata(98, true)}${pata(xb - 20, true, 'tras')}
        <g class="cx-cuerpo"><rect x="78" y="77" width="${L}" height="46" rx="23" fill="${C.pelo}"/>
          <path d="M92 80 Q${78 + L / 2} 72 ${xb - 12} 80" stroke="${C.pelo2}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
          <ellipse cx="${78 + L / 2 + 4}" cy="120" rx="${L / 2 - 14}" ry="4" fill="${C.fuego}" opacity=".55"/>
          <ellipse cx="88" cy="106" rx="14" ry="15" fill="${C.fuego}"/></g>
        ${cuerpo}
        ${pata(84, false, 'delante')}${pata(xb - 34, false, 'tras')}
        <g class="cx-cabeza" style="transform:scale(${cabeza});transform-origin:84px 92px">
          <path d="M70 70 Q86 74 94 92 L80 96 Z" fill="${C.pelo}"/>
          <circle cx="70" cy="68" r="30" fill="${C.pelo}"/>
          <ellipse cx="44" cy="79" rx="25" ry="14" fill="${C.pelo}"/>
          <ellipse cx="44" cy="86" rx="22" ry="8.5" fill="${C.fuego}"/>
          <ellipse cx="58" cy="83" rx="9" ry="7" fill="${C.fuego}" opacity=".8"/>
          <ellipse cx="22" cy="77" rx="7.5" ry="6.5" fill="${C.nariz}"/><ellipse cx="20" cy="74.5" rx="2.6" ry="1.6" fill="#fff" opacity=".5"/>
          <path d="M29 90 Q36 96 44 90" stroke="${C.nariz}" stroke-width="2.2" fill="none" stroke-linecap="round"/>
          ${feliz && !dormido ? `<path class="cx-lengua" d="M34 93 Q37 104 42 93 Z" fill="${C.lengua}"/>` : ''}
          <ellipse cx="61" cy="52" rx="5.5" ry="3.8" fill="${C.fuego}"/>
          ${ojo}
          <ellipse cx="49" cy="80" rx="6" ry="3.4" fill="${C.rosa}" opacity=".45"/>
          <g class="cx-oreja" style="transform-origin:78px 50px"><path d="M74 46 C99 44 106 72 101 98 C98 112 82 111 80 99 C76 82 69 62 74 46 Z" fill="${C.lejos}"/><path d="M80 54 C94 56 98 76 95 94" stroke="${C.pelo2}" stroke-width="3" fill="none" opacity=".6"/></g>
          ${resto}
        </g>
      </g>
      ${op.pesa ? '<g class="cx-pesa"><rect x="8" y="58" width="44" height="5" rx="2" fill="#777"/><rect x="2" y="48" width="9" height="25" rx="3" fill="#444"/><rect x="49" y="48" width="9" height="25" rx="3" fill="#444"/></g>' : ''}
    </svg>`;
  }
  const mini = (e) => `<span class="cx-mini">${dibujo(e, { dormido: durmiendo() })}</span>`;

  // ---------- What he says ----------
  function frase(e, v) {
    const o = otro(v), sem = e.week || {}, dia = (new Date().getDay() + 6) % 7;
    if (durmiendo()) return azar(['Zzz… Carlitos sueña con croquetas.', 'Carlitos duerme hecho una rosquilla.', 'Shhh. Carlitos está soñando que levanta pesas.']);
    const l = [];
    if (e.season?.id === 'navidad') l.push('Carlitos quiere que le pongáis el jersey. Bueno, y croquetas.', '¡Guau! Huele a turrón.');
    if (e.season?.id === 'halloween') l.push('Carlitos se ha disfrazado de perro salchicha. Da mucho miedo.');
    if (e.season?.id === 'sanvalentin') l.push('Carlitos dice que vosotros dos sois su pareja favorita.');
    if (e.season?.id === 'verano') l.push('Carlitos quiere ir a la playa. Con flotador, que tiene las patas cortas.');
    if (e.season?.id === 'cumple') l.push('¡Hoy es el cumpleaños de Carlitos! Quiere tarta de croquetas.');
    if (e.season?.id === 'cumpleMaria') l.push(v === 'maria' ? '¡Feliz cumpleaños, Marialópoda! Carlitos te ha guardado su mejor hueso.' : 'Hoy es el cumpleaños de Marialópoda. Carlitos ya le ha cantado. Te toca.');
    if (e.golden) l.push('Hoy Carlitos brilla. Es un día dorado: un entreno vale huesitos extra.');
    if (!sem[v] && dia >= 2) l.push(`Carlitos te mira con ojos de cachorro: esta semana aún no has entrenado.`);
    if (!sem[o] && sem[v] && dia >= 2) l.push(`Carlitos mira la puerta. ${NOMBRE[o]} aún no ha entrenado esta semana.`);
    if (sem.cesar && sem.maria) l.push('Esta semana ya habéis entrenado los dos. Carlitos está orgullosísimo.');
    if (e.hunger < 35) l.push('A Carlitos le suenan las tripas. Un entreno le da croquetas.');
    if (e.love < 30) l.push('Carlitos se ha tumbado panza arriba. Pide mimos.');
    if (e.event && !e.event.done) l.push(`${e.event.title}: ${e.event.text}`);
    if (e.event?.done) l.push(`¡${e.event.title} superada! Carlitos no para de mover la cola.`);
    l.push(...(e.mood === 'triste' ? ['Carlitos os echa de menos. Un entreno y unos mimos lo arreglan todo.'] : [
      'Guau. Eso significa “sois los mejores”.', 'Carlitos ha decidido que hoy es buen día para un récord.',
      'Carlitos ha escondido un calcetín. No dirá dónde.', 'Carlitos mueve la cola en tu dirección. Es oficial: te quiere.',
      `Carlitos dice que ${NOMBRE[o]} te echa de menos.`, 'Patas cortas, corazón enorme.', 'Carlitos está listo para entrenar. Bueno, para mirar.',
      'Carlitos ha olido algo raro. Era tu fuerza.', 'Carlitos pide que le rasques detrás de la oreja.', 'Si tú entrenas, Carlitos crece. Así funciona.'
    ]));
    return azar(l);
  }

  // ---------- The page ----------
  const barra = (v, color) => `<span class="cx-barra"><i style="width:${Math.round(Math.max(0.04, Math.min(1, v)) * 100)}%;background:${color}"></i></span>`;
  const ANIMO = { feliz: 'Feliz como una perdiz salchicha', contento: 'Contento', echa: 'Os echa un poco de menos', triste: 'Tristón: necesita entreno y mimos' };
  const REGALO = { navidad: 'Llega en Navidad si entrenáis', halloween: 'Llega en Halloween si entrenáis', sanvalentin: 'Llega en San Valentín si entrenáis', verano: 'Llega en verano si entrenáis', cumple: 'Llega en su cumpleaños', racha: 'Con 8 semanas seguidas bien cuidado' };
  const EMOJI = { hueso: '🦴', pelota: '🎾', oruga: '🐛', mancuerna: '🏋️', calcetin: '🧦' };
  const unidad = (ev) => (ev.unit === 'kg' ? `${ev.left.toLocaleString('de-DE')} kg` : ev.unit === 'km' ? `${ev.left} km` : `${ev.left} ${ev.left === 1 ? ev.unit.replace(/s(\b| )/, '$1').replace('entrenos', 'entreno') : ev.unit}`);

  function pagina(e, v) {
    const o = otro(v), notas = (e.messages || []).filter((m) => m.from === o && !m.read);
    const misVales = (e.vales || []).filter((x) => x.who === 'maria');
    const noche = durmiendo(), h = hora(), cielo = noche ? 'noche' : h < 9 || h > 20 ? 'tarde' : 'dia';
    const ev = e.event || {};
    return `<div class="cx-pagina">
      ${notas.map((m) => `<div class="cx-nota" role="status"><b>Carlitos trae una nota de ${NOMBRE[o]} en el collar</b><p>${esc(m.text)}</p><small>${fecha(m.d)}</small></div>`).join('')}
      ${notas.length ? '<button type="button" class="cx-boton cx-ancho" data-cx="leido">Guardar la nota 💌</button>' : ''}
      <div class="cx-escena cx-${cielo}${e.golden ? ' cx-oro' : ''}${e.season ? ` cx-${e.season.id}` : ''}">
        <p class="cx-bocadillo" aria-live="polite">${esc(frase(e, v))}</p>
        <button type="button" class="cx-carlitos cx-${e.mood}" data-cx="mimo" aria-label="Dar mimos a Carlitos">${dibujo(e, { dormido: noche })}</button>
        <div class="cx-suelo">${(e.toys || []).map((t) => `<span title="${esc(t.name)}">${EMOJI[t.id] || '🧸'}</span>`).join('')}${noche ? '<span class="cx-zzz">z z Z</span>' : ''}</div>
      </div>
      <div class="cx-cab"><h2>Carlitos</h2><span class="cx-huesos" title="Huesitos para gastar">🦴 ${e.bones}</span></div>
      <p class="cx-nivel">${esc(e.stageName)} · nivel ${e.level}</p>${barra(e.progress, '#FFC531')}
      <div class="cx-medidores">
        <div><span>🍖 Croquetas</span>${barra(e.hunger / 100, e.hunger < 35 ? '#E5344B' : '#22B573')}</div>
        <div><span>💗 Cariño</span>${barra(e.love / 100, e.love < 30 ? '#E5344B' : '#FF7DB0')}</div>
      </div>
      <p class="cx-animo">${esc(ANIMO[e.mood] || '')}</p>
      <div class="cx-acciones">
        <button type="button" class="cx-boton" data-cx="mimo"${e.left?.[v]?.mimo ? '' : ' data-agotado'}>💗 Mimos</button>
        <button type="button" class="cx-boton" data-cx="golosina"${e.bones >= 4 && e.left?.[v]?.golosina ? '' : ' data-agotado'}>🍪 Golosina <small>🦴 4</small></button>
        <button type="button" class="cx-boton" data-cx="jugar"${e.left?.[v]?.jugar ? '' : ' data-agotado'}>🎾 Jugar</button>
      </div>
      <section class="cx-tarjeta"><h3>Esta semana</h3>
        <p class="cx-dos">${['cesar', 'maria'].map((w) => `<span class="${e.week?.[w] ? 'si' : ''}">${e.week?.[w] ? '✅' : '⏳'} ${w === v ? 'Tú' : NOMBRE[w]}</span>`).join('')}</p>
        <p>${e.week?.cesar && e.week?.maria ? 'Carlitos está bien cuidado esta semana: habéis entrenado los dos.' : 'Para cuidar bien a Carlitos, cada uno tiene que entrenar al menos una vez por semana. Da igual cuántas.'}</p>
        ${e.streak ? `<p class="cx-suave">Lleva ${e.streak === 1 ? 'una semana' : `${e.streak} semanas`} seguidas bien cuidado.${e.streak < 8 && !e.wardrobe?.find((x) => x.id === 'medalla')?.owned ? ' A las ocho, medalla.' : ''}</p>` : ''}
      </section>
      <section class="cx-tarjeta cx-evento${ev.done ? ' hecho' : ''}"><h3>${esc(ev.title || '')}</h3><p>${esc(ev.text || '')}</p>${barra(ev.progress || 0, ev.done ? '#22B573' : '#2F6BFF')}
        <p class="cx-suave">${ev.done ? '¡Conseguido! El premio llega el lunes.' : `Faltan ${unidad(ev)} entre los dos.`}${ev.toy ? ` Premio: ${EMOJI[ev.toy] || ''}` : ' Premio: huesitos.'}</p></section>
      <details class="cx-tarjeta"><summary>🎩 Trucos</summary><div class="cx-rejilla">
        ${(e.tricks || []).map((t) => (t.learned ? `<button type="button" class="cx-boton" data-cx="truco" data-truco="${t.id}">${esc(t.name)}</button>` : `<span class="cx-bloq">${esc(t.name)}<small>nivel ${t.level}</small></span>`)).join('')}
      </div></details>
      <details class="cx-tarjeta"><summary>👕 Armario</summary><div class="cx-rejilla">
        ${(e.wardrobe || []).filter((x) => x.owned || x.buyable || x.gift || x.season).map((x) => (x.owned
          ? `<button type="button" class="cx-boton${x.worn ? ' puesto' : ''}" data-cx="vestir" data-item="${x.id}"${x.worn ? ' data-quitar="1"' : ''}>${esc(x.name)}<small>${x.worn ? 'Puesto · quitar' : 'Ponérselo'}</small></button>`
          : x.buyable ? `<button type="button" class="cx-boton" data-cx="comprar" data-item="${x.id}"${e.bones >= x.price ? '' : ' data-agotado'}>${esc(x.name)}<small>🦴 ${x.price}</small></button>`
            : `<span class="cx-bloq">${esc(x.name)}<small>${esc(x.season ? 'Solo en Navidad' : REGALO[x.gift] || '')}</small></span>`)).join('')}
      </div></details>
      ${v === 'maria' && misVales.length ? `<details class="cx-tarjeta"><summary>🎟️ Tus vales</summary>${misVales.slice().reverse().map((x) => `<p class="cx-vale${x.used ? ' usado' : ''}">${esc(x.text)}<small>${x.used ? `Canjeado el ${fecha(x.used)}` : `Desde el ${fecha(x.d)} · enséñaselo a Cesarlópodo`}</small></p>`).join('')}</details>` : ''}
      ${v === 'cesar' && misVales.some((x) => !x.used) ? `<section class="cx-tarjeta"><h3>🎟️ Vales de Marialópoda</h3>${misVales.filter((x) => !x.used).map((x) => `<p class="cx-vale">${esc(x.text)}<small>Ganado el ${fecha(x.d)}</small><button type="button" class="cx-boton" data-cx="canjear" data-id="${esc(x.id)}">Canjeado</button></p>`).join('')}</section>` : ''}
      <details class="cx-tarjeta"><summary>💌 Mandar una nota con Carlitos</summary>
        <p class="cx-suave">Carlitos se la lleva a ${NOMBRE[o]} en el collar. Le saldrá al abrir su app.</p>
        <textarea class="cx-texto" id="cx-nota" maxlength="240" placeholder="Algo bonito…"></textarea>
        <button type="button" class="cx-boton cx-ancho" data-cx="mensaje">Enviar con Carlitos</button>
      </details>
      <details class="cx-tarjeta"${leer('diarioAbierto', true) ? ' open' : ''} data-cx-diario><summary>📔 Diario de Carlitos</summary>
        <ul class="cx-diario">${(e.diary || []).slice(0, 30).map((d) => `<li><span>${d.icon}</span><p>${esc(d.text)}<small>${fecha(d.fecha)}</small></p></li>`).join('')}</ul>
      </details>
      ${(e.messages || []).length ? `<details class="cx-tarjeta"><summary>✉️ Notas de los dos</summary><ul class="cx-diario">${e.messages.slice().reverse().map((m) => `<li><span>${m.from === v ? '📤' : '📥'}</span><p>${esc(m.text)}<small>${m.from === v ? `Para ${NOMBRE[o]}` : `De ${NOMBRE[m.from]}`} · ${fecha(m.d)}</small></p></li>`).join('')}</ul></details>` : ''}
    </div>`;
  }

  // ---------- The strip on the main screen ----------
  function tira(e, v) {
    if (!e) return '';
    const o = otro(v), visto = leer('visto.' + v, ''), dia = (new Date().getDay() + 6) % 7;
    const nota = (e.messages || []).find((m) => m.from === o && !m.read);
    let texto = '';
    if (nota) texto = `Carlitos trae una nota de ${NOMBRE[o]} en el collar. 💌`;
    else if (e.season?.id === 'cumple') texto = '¡Hoy es el cumpleaños de Carlitos! 🎂';
    else if (!e.week?.[v] && dia >= 3) texto = 'Carlitos te espera: esta semana aún no has entrenado.';
    else if (e.diary?.[0] && e.diary[0].fecha + e.diary[0].text !== visto && e.diary[0].fecha >= shiftIso(e.today, -2)) texto = e.diary[0].text;
    else if (e.golden) texto = 'Hoy Carlitos brilla: día dorado. Un entreno vale huesitos extra. ✨';
    else if (e.hunger < 30) texto = 'A Carlitos le suenan las tripas. Un entreno le da croquetas.';
    else if (e.love < 20) texto = 'Carlitos pide mimos.';
    if (!texto) return '';
    return `<button type="button" class="cx-tira" data-cx-abrir aria-label="Ver a Carlitos">${mini(e)}<span><small>CARLITOS</small>${esc(texto)}</span></button>`;
  }
  const shiftIso = (iso, d) => new Date(Date.parse(`${iso}T12:00:00Z`) + d * 864e5).toISOString().slice(0, 10);
  const marcarVisto = (e, v) => { if (e?.diary?.[0]) guardar('visto.' + v, e.diary[0].fecha + e.diary[0].text); };

  // ---------- What you do with him ----------
  function flotar(nodo, emoji) {
    if (quieto()) return;
    const r = nodo.getBoundingClientRect(), s = document.createElement('span');
    s.className = 'cx-flota'; s.textContent = emoji;
    s.style.left = `${r.left + r.width * (0.2 + Math.random() * 0.3)}px`; s.style.top = `${r.top + r.height * 0.2}px`;
    document.body.appendChild(s);
    s.addEventListener('animationend', () => s.remove());
  }
  function animar(raiz, clase, ms) {
    const c = raiz.querySelector('.cx-carlitos');
    if (!c) return;
    c.classList.remove(...[...c.classList].filter((x) => x.startsWith('cx-t-')));
    void c.offsetWidth;
    c.classList.add('cx-t-' + clase);
    setTimeout(() => c.classList.remove('cx-t-' + clase), ms || 1700);
  }
  function decir(raiz, texto) { const b = raiz.querySelector('.cx-bocadillo'); if (b) { b.textContent = texto; b.classList.remove('cx-salta'); void b.offsetWidth; b.classList.add('cx-salta'); } }
  const TRUCO_DICE = { sentarse: 'Sentado. Muy formal.', pata: 'Aquí tienes la patita.', rodar: '¡Una vuelta entera!', muerto: '¡Pum! Carlitos se hace el muerto… y resucita por una croqueta.', bailar: 'Carlitos baila. Mal, pero con mucho arte.', saltar: '¡Hop! Ha llegado altísimo para sus patas.', choca: '¡Choca esos cinco!', pesa: 'Carlitos levanta su mancuerna. Igualito que vosotros.', aullar: 'Auuuuu 🎵 Está cantando vuestra canción.', pino: 'Carlitos hace el pino. Nadie sabe cómo.' };

  // The node keeps the dog and the options, so painting it again with fresh data never adds a second listener.
  function montar(nodo, op) {
    nodo.cx = { e: op.estado, v: op.viewer, op };
    nodo.cxPintar = () => { nodo.innerHTML = `<div class="cx-raiz">${pagina(nodo.cx.e, nodo.cx.v)}</div>`; marcarVisto(nodo.cx.e, nodo.cx.v); };
    nodo.cxPintar();
    if (nodo.cxMontado) return;
    nodo.cxMontado = true;
    const raiz = nodo;
    const enviar = async (accion, despues) => {
      try { const nuevo = await raiz.cx.op.enviar(accion); if (nuevo) raiz.cx.e = nuevo; }
      catch (err) { decir(raiz, err && err.message === 'bones' ? 'No quedan huesitos. Entrenad y Carlitos encontrará más.' : 'Sin conexión: Carlitos no se ha enterado. Prueba en un rato.'); return false; }
      setTimeout(() => { if (raiz.isConnected) { raiz.cxPintar(); if (despues) despues(); } }, quieto() ? 0 : 1300);
      return true;
    };
    raiz.addEventListener('toggle', (ev) => { if (ev.target.matches('[data-cx-diario]')) guardar('diarioAbierto', ev.target.open); }, true);
    raiz.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-cx]');
      if (!b || !raiz.contains(b)) return;
      const tipo = b.dataset.cx, carlitos = raiz.querySelector('.cx-carlitos'), e = raiz.cx.e, v = raiz.cx.v;
      if (b.hasAttribute('data-agotado')) {
        decir(raiz, tipo === 'mimo' ? 'Carlitos ya está lleno de mimos hoy. Mañana más.' : tipo === 'jugar' ? 'Carlitos está agotado de jugar. Mañana más.' : tipo === 'golosina' ? (e.bones < 4 ? 'No quedan huesitos para golosinas.' : 'Ya ha comido bastantes golosinas hoy.') : 'Faltan huesitos. Cada entreno da unos cuantos.');
        if (tipo === 'mimo') { animar(raiz, 'feliz', 900); flotar(carlitos, '💗'); }
        return;
      }
      if (tipo === 'mimo') {
        if (durmiendo()) { decir(raiz, 'Carlitos abre un ojo, mueve la cola y se vuelve a dormir.'); animar(raiz, 'feliz', 900); return; }
        animar(raiz, 'feliz', 1200); for (let i = 0; i < 4; i++) setTimeout(() => flotar(carlitos, azar(['💗', '💕', '🐾', '💖'])), i * 140);
        decir(raiz, azar(['A Carlitos le encanta. Se ha puesto panza arriba.', 'Carlitos cierra los ojos de gusto.', 'Rasca rasca. Carlitos mueve una pata sin querer.', 'Carlitos te lame la mano. Es su forma de decir gracias.']));
        enviar({ type: 'mimo' });
      } else if (tipo === 'golosina') {
        animar(raiz, 'come', 1400); flotar(carlitos, '🍪'); decir(raiz, 'Ñam. Ha desaparecido en un segundo.');
        enviar({ type: 'golosina' });
      } else if (tipo === 'jugar') {
        const jug = azar(e.toys && e.toys.length ? e.toys : [{ id: 'hueso' }]);
        animar(raiz, 'juega', 1800); flotar(carlitos, EMOJI[jug.id] || '🎾');
        decir(raiz, { pelota: '¡Pelota! Carlitos la ha traído de vuelta. Otra vez.', oruga: 'Carlitos ha zarandeado a la oruga. Se quieren mucho.', mancuerna: 'Carlitos entrena con su mancuerna. Una repe. Suficiente.', calcetin: 'Carlitos no piensa devolver ese calcetín.', hueso: 'Carlitos roe su hueso de goma muy concentrado.' }[jug.id] || 'Carlitos juega encantado.');
        enviar({ type: 'jugar', toy: jug.id });
      } else if (tipo === 'truco') {
        const t = b.dataset.truco;
        if (t === 'pesa') { const svg = raiz.querySelector('.cx-carlitos'); svg.innerHTML = dibujo(e, { pesa: true }); }
        animar(raiz, t, t === 'muerto' || t === 'pino' ? 2600 : 1900); decir(raiz, TRUCO_DICE[t] || '¡Truco!');
        raiz.querySelector('.cx-escena')?.scrollIntoView({ behavior: quieto() ? 'auto' : 'smooth', block: 'center' });
        if (t === 'pesa') setTimeout(() => { const svg = raiz.querySelector('.cx-carlitos'); if (svg) svg.innerHTML = dibujo(e, { dormido: durmiendo() }); }, 2000);
      } else if (tipo === 'vestir') enviar({ type: 'vestir', item: b.dataset.item, quitar: !!b.dataset.quitar });
      else if (tipo === 'comprar') { flotar(b, '🛍️'); enviar({ type: 'comprar', item: b.dataset.item }); }
      else if (tipo === 'leido') enviar({ type: 'leido' });
      else if (tipo === 'canjear') enviar({ type: 'canjear', id: b.dataset.id });
      else if (tipo === 'mensaje') {
        const t = raiz.querySelector('#cx-nota'), texto = t ? t.value.trim() : '';
        if (!texto) { t && t.focus(); return; }
        b.disabled = true; b.textContent = 'Carlitos sale corriendo…';
        enviar({ type: 'mensaje', text: texto }, () => decir(raiz, `Nota enviada. Carlitos ya va hacia ${NOMBRE[otro(v)]} con ella en el collar. 💌`));
      }
    });
  }

  // A small Carlitos that walks across the screen (after a workout, for instance).
  function paseo(e) {
    if (quieto() || document.querySelector('.cx-paseo')) return;
    const d = document.createElement('div');
    d.className = 'cx-paseo'; d.innerHTML = dibujo(e || { stage: 'cachorro', mood: 'feliz', worn: ['collar'] });
    d.addEventListener('animationend', (ev) => { if (ev.target === d) d.remove(); });
    document.body.appendChild(d);
  }

  // ---------- Styles ----------
  const CSS = `
  .cx-raiz{--cx-tarjeta:rgba(255,255,255,.07);--cx-borde:rgba(255,255,255,.12);--cx-suave:rgba(255,255,255,.62)}
  .cx-pagina{display:flex;flex-direction:column;gap:12px;padding-bottom:24px}
  .cx-escena{position:relative;border-radius:22px;overflow:hidden;padding:52px 12px 0;min-height:250px;display:flex;flex-direction:column;justify-content:flex-end;
    background:linear-gradient(#8FD3FF,#CFEFFF 62%,#9BD77A 62%,#7BC35C)}
  .cx-escena.cx-tarde{background:linear-gradient(#FF9A7A,#FFD6A0 62%,#86B866 62%,#6CA352)}
  .cx-escena.cx-noche{background:linear-gradient(#141A3A,#2A2F5E 62%,#2C4A33 62%,#233B29)}
  .cx-escena.cx-noche::before{content:'✦ · ✧ · ✦';position:absolute;top:14px;right:18px;color:#FFF7C2;letter-spacing:10px;font-size:12px;opacity:.8}
  .cx-escena.cx-navidad::after{content:'❄ ❅ ❆ ❄ ❅ ❆';position:absolute;top:12px;left:12px;color:#fff;letter-spacing:14px;opacity:.8;animation:cx-nieve 6s linear infinite}
  .cx-escena.cx-halloween::after{content:'🎃 🦇';position:absolute;top:12px;left:14px;font-size:20px}
  .cx-escena.cx-verano::after{content:'☀️';position:absolute;top:10px;left:14px;font-size:28px}
  .cx-escena.cx-sanvalentin::after,.cx-escena.cx-cumple::after{content:'💕 🎈';position:absolute;top:10px;left:14px;font-size:22px}
  .cx-oro .cx-perro{filter:drop-shadow(0 0 10px #FFD54A) drop-shadow(0 0 3px #FFE88A)}
  .cx-bocadillo{position:absolute;top:10px;left:12px;right:12px;margin:0;padding:8px 12px;border-radius:14px;background:#fff;color:#2B1033;font-size:15px;line-height:1.35;box-shadow:0 3px 0 rgba(0,0,0,.08)}
  .cx-salta{animation:cx-pop .35s ease-out}
  .cx-carlitos{display:block;width:100%;max-width:400px;margin:28px auto 0;border:0;background:none;padding:0;cursor:pointer;touch-action:manipulation}
  .cx-perro{display:block;width:100%;height:auto;overflow:visible}
  .cx-suelo{display:flex;gap:10px;justify-content:center;font-size:22px;min-height:30px;padding:2px 0 8px}
  .cx-zzz{color:#fff;font-weight:800;font-size:16px;animation:cx-zzz 2.4s ease-in-out infinite}
  .cx-cab{display:flex;align-items:center;justify-content:space-between}
  .cx-cab h2{margin:0;font-size:28px}
  .cx-huesos{font-weight:800;padding:4px 12px;border-radius:999px;background:var(--cx-tarjeta);border:1px solid var(--cx-borde)}
  .cx-nivel{margin:-6px 0 0;color:var(--cx-suave)}
  .cx-barra{display:block;height:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden}
  .cx-barra i{display:block;height:100%;border-radius:99px;transition:width .6s ease}
  .cx-medidores{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .cx-medidores span{display:block;font-size:14px;margin-bottom:4px;color:var(--cx-suave)}
  .cx-animo{margin:0;font-weight:700}
  .cx-acciones{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
  .cx-boton{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:48px;padding:8px 10px;border-radius:14px;
    background:var(--cx-tarjeta);border:1px solid var(--cx-borde);color:inherit;font:inherit;font-weight:700;cursor:pointer;text-align:center}
  .cx-boton small{font-weight:500;font-size:12px;color:var(--cx-suave)}
  .cx-boton[data-agotado]{opacity:.45}
  .cx-boton.puesto{border-color:#FFC531;box-shadow:inset 0 0 0 1px #FFC531}
  .cx-boton:active{transform:scale(.97)}
  .cx-ancho{width:100%}
  .cx-tarjeta{padding:14px;border-radius:18px;background:var(--cx-tarjeta);border:1px solid var(--cx-borde)}
  .cx-tarjeta h3{margin:0 0 6px;font-size:17px}
  .cx-tarjeta p{margin:6px 0}
  .cx-tarjeta summary{font-weight:800;cursor:pointer;list-style-position:inside}
  .cx-evento.hecho{border-color:#22B573}
  .cx-suave{color:var(--cx-suave);font-size:14px}
  .cx-dos{display:flex;gap:8px;flex-wrap:wrap}
  .cx-dos span{padding:4px 10px;border-radius:99px;background:rgba(255,255,255,.08);font-weight:700;font-size:14px}
  .cx-dos span.si{background:rgba(34,181,115,.22)}
  .cx-rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;margin-top:10px}
  .cx-bloq{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:48px;padding:8px;border-radius:14px;border:1px dashed var(--cx-borde);opacity:.55;text-align:center;font-size:14px}
  .cx-bloq small{font-size:12px}
  .cx-diario{list-style:none;margin:10px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
  .cx-diario li{display:flex;gap:10px;align-items:flex-start}
  .cx-diario li>span{font-size:20px;line-height:1.2}
  .cx-diario p{margin:0}
  .cx-diario small,.cx-vale small,.cx-nota small{display:block;color:var(--cx-suave);font-size:12px}
  .cx-nota small{color:#8A5A7A}
  .cx-texto{width:100%;min-height:80px;border-radius:12px;padding:10px;background:rgba(255,255,255,.08);border:1px solid var(--cx-borde);color:inherit;font:inherit;margin:6px 0;box-sizing:border-box}
  .cx-nota{padding:14px;border-radius:18px;background:#FFF4F8;color:#2B1033;border:2px dashed #FF7DB0;animation:cx-pop .4s ease-out}
  .cx-nota p{margin:6px 0;font-size:18px;font-weight:600}
  .cx-vale{padding:10px 12px;border-radius:12px;background:rgba(255,197,49,.14);border:1px dashed #FFC531;display:flex;flex-direction:column;gap:6px}
  .cx-vale.usado{opacity:.5;text-decoration:line-through}
  .cx-tira{display:flex;align-items:center;gap:10px;width:100%;padding:8px 12px;border-radius:16px;background:rgba(255,197,49,.12);border:1px solid rgba(255,197,49,.35);color:inherit;font:inherit;text-align:left;cursor:pointer;margin:8px 0}
  .cx-tira small{display:block;font-size:11px;letter-spacing:.08em;font-weight:800;opacity:.7}
  .cx-mini{flex:0 0 64px;width:64px}
  .cx-mini .cx-perro{width:64px}
  .cx-flota{position:fixed;z-index:9999;font-size:26px;pointer-events:none;animation:cx-flota 1.3s ease-out forwards}
  .cx-paseo{position:fixed;z-index:9998;bottom:calc(84px + env(safe-area-inset-bottom,0px));left:100%;width:150px;pointer-events:none;animation:cx-paseo 6s linear forwards}
  .cx-paseo .cx-pata{animation:cx-paso .3s ease-in-out infinite alternate}
  .cx-paseo .cx-pata.tras{animation-delay:.15s}
  /* idle life */
  .cx-cola{animation:cx-cola .45s ease-in-out infinite alternate}
  .cx-feliz .cx-cola{animation-duration:.22s}
  .cx-triste .cx-cola,.cx-echa .cx-cola{animation-duration:1.4s}
  .cx-triste .cx-oreja{transform:rotate(6deg)}
  .cx-todo{animation:cx-respira 3.2s ease-in-out infinite;transform-origin:50% 100%;transform-box:fill-box}
  .cx-ojo{animation:cx-parpadeo 5s infinite}
  .cx-oreja{animation:cx-oreja 4s ease-in-out infinite}
  /* tricks */
  .cx-t-feliz .cx-todo{animation:cx-bote .35s ease-out 2}
  .cx-t-feliz .cx-cola{animation-duration:.14s}
  .cx-t-come .cx-cabeza{animation:cx-come .2s ease-in-out 6 alternate}
  .cx-t-juega .cx-perro{animation:cx-corre 1.8s ease-in-out}
  .cx-t-sentarse .cx-todo{animation:cx-sienta 1.9s ease-in-out;transform-origin:30% 92%}
  .cx-t-pata .cx-pata.delante{animation:cx-pata 1.9s ease-in-out}
  .cx-t-choca .cx-pata.delante{animation:cx-choca 1.9s ease-in-out}
  .cx-t-rodar .cx-todo{animation:cx-rueda 1.6s ease-in-out;transform-origin:50% 70%}
  .cx-t-muerto .cx-todo{animation:cx-muerto 2.6s ease-in-out;transform-origin:50% 70%}
  .cx-t-bailar .cx-todo{animation:cx-baila 1.9s ease-in-out}
  .cx-t-saltar .cx-todo{animation:cx-salto 1.9s ease-in-out}
  .cx-t-pesa .cx-pesa{animation:cx-pesa .5s ease-in-out 4 alternate}
  .cx-t-aullar .cx-cabeza{animation:cx-aulla 1.9s ease-in-out}
  .cx-t-pino .cx-todo{animation:cx-pino 2.6s ease-in-out;transform-origin:22% 90%}
  @keyframes cx-cola{from{transform:rotate(-14deg)}to{transform:rotate(16deg)}}
  @keyframes cx-respira{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.018)}}
  @keyframes cx-parpadeo{0%,95%,100%{transform:scaleY(1)}97%{transform:scaleY(.08)}}
  @keyframes cx-oreja{0%,100%{transform:rotate(0)}50%{transform:rotate(3deg)}}
  @keyframes cx-bote{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
  @keyframes cx-come{from{transform:translateY(0)}to{transform:translateY(5px)}}
  @keyframes cx-corre{0%,100%{transform:translateX(0)}40%{transform:translateX(-26%) scaleX(1)}50%{transform:translateX(-26%) scaleX(-1)}90%{transform:translateX(0) scaleX(-1)}}
  @keyframes cx-sienta{0%,100%{transform:rotate(0)}25%,80%{transform:rotate(-13deg) translateY(4px)}}
  @keyframes cx-pata{0%,100%{transform:rotate(0)}25%,80%{transform:rotate(70deg)}}
  @keyframes cx-choca{0%,100%{transform:rotate(0)}25%,80%{transform:rotate(150deg)}}
  @keyframes cx-rueda{0%{transform:rotate(0)}50%{transform:rotate(180deg) translateY(16px)}100%{transform:rotate(360deg)}}
  @keyframes cx-muerto{0%,100%{transform:rotate(0)}20%,80%{transform:rotate(180deg) translateY(10px)}}
  @keyframes cx-baila{0%,100%{transform:rotate(0)}15%{transform:rotate(-9deg) translateY(-8px)}30%{transform:rotate(9deg)}45%{transform:rotate(-9deg) translateY(-8px)}60%{transform:rotate(9deg)}75%{transform:rotate(-6deg) translateY(-6px)}}
  @keyframes cx-salto{0%,50%,100%{transform:translateY(0)}20%,70%{transform:translateY(-46px) rotate(-6deg)}}
  @keyframes cx-pesa{from{transform:translateY(0)}to{transform:translateY(-22px)}}
  @keyframes cx-aulla{0%,100%{transform:rotate(0)}25%,80%{transform:rotate(22deg)}}
  @keyframes cx-pino{0%,100%{transform:rotate(0)}25%,80%{transform:rotate(-62deg)}}
  @keyframes cx-flota{from{opacity:1;transform:translateY(0) scale(.8)}to{opacity:0;transform:translateY(-90px) scale(1.3)}}
  @keyframes cx-pop{from{transform:scale(.92);opacity:.4}to{transform:scale(1);opacity:1}}
  @keyframes cx-zzz{0%,100%{opacity:.4;transform:translateY(0)}50%{opacity:1;transform:translateY(-6px)}}
  @keyframes cx-nieve{from{transform:translateY(0)}to{transform:translateY(12px)}}
  @keyframes cx-paso{from{transform:rotate(-14deg)}to{transform:rotate(14deg)}}
  @keyframes cx-paseo{from{left:100%}to{left:-170px}}
  @media (prefers-reduced-motion:reduce){.cx-raiz *,.cx-tira *{animation:none!important;transition:none!important}}
  `;
  if (typeof document !== 'undefined' && !document.getElementById('cx-estilos')) {
    const s = document.createElement('style'); s.id = 'cx-estilos'; s.textContent = CSS; document.head.appendChild(s);
  }
  window.Carlitos = { dibujo, mini, tira, montar, paseo, marcarVisto, NOMBRE };
})();
