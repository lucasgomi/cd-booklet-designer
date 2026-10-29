// «Fanzine» — fotocopia punk: título con letras recortadas de revista,
// máquina de escribir, cinta adhesiva y tachones.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, seeded, hashSeed, deco } from './common.js';

const CUT_FONTS = ['Anton', 'Abril Fatface', 'Special Elite', 'Archivo Black', 'Courier Prime', 'Bebas Neue', 'Playfair Display', 'Fraunces'];

export default {
  id: 'fanzine',
  category: 'Estéticas',
  name: 'Fanzine',
  description: 'Fotocopia punk con letras recortadas y máquina de escribir.',

  defaults: {
    paperColor: '#E9E6DF',
    inkColor: '#141414',
    accentColor: '#E3262E',
    cutColors: '#141414,#FFFFFF,#E3262E,#F7D43A,#FFFFFF',
    tapeColor: '#F2E7B5',
    grain: 0.22,
    titleText: '{artista}',
    infoText: '{titulo}[ — nº {disco}][ — {fecha}] — {pistas} temas — {total}',
    listFont: 'Special Elite', listWeight: 400, listSize: 7.8,
    titleSize: 13,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoTapeTop', label: 'Cinta adhesiva (arriba)' },
    { key: 'decoTapeBottom', label: 'Cinta adhesiva (abajo)' },
    { key: 'decoX', label: 'Tachón rojo ✕' },
    { key: 'decoStar', label: 'Estrella ★' },
    { key: 'decoInfoBar', label: 'Línea de datos (banda negra)' },
  ],

  presets: [
    { name: 'Fotocopia', style: {} },
    { name: 'Rosa punk', style: { paperColor: '#F7C6D9', accentColor: '#141414', cutColors: '#141414,#FFFFFF,#F7D43A,#FF3FA4' } },
    { name: 'Amarillo', style: { paperColor: '#F7D43A', accentColor: '#141414', cutColors: '#141414,#FFFFFF,#E3262E' } },
    { name: 'Negativo', style: { paperColor: '#161616', inkColor: '#EDEDED', accentColor: '#E3262E', cutColors: '#EDEDED,#E3262E,#161616,#F7D43A', tapeColor: '#8A8A8A' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'paperColor', label: 'Papel', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'accentColor', label: 'Rotulador', type: 'color' },
      { key: 'tapeColor', label: 'Cinta adhesiva', type: 'color' },
      { key: 'cutColors', label: 'Colores de los recortes (hex separados por comas)', type: 'text' },
      { key: 'grain', label: 'Suciedad de fotocopia', type: 'opacity' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Máquina de escribir (lista)', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { key: 'titleSize', label: 'Tamaño de los recortes', type: 'number', min: 8, max: 30, step: 0.5, unit: 'pt' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título recortado', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const rand = seeded(hashSeed(s.titleText + values.artista));
    const colors = String(s.cutColors).split(',').map((c) => c.trim()).filter(Boolean);
    const lum = (hex) => { const n = parseInt(hex.replace('#', ''), 16); return ((n >> 16) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255; };

    // Letras recortadas, cada una con su papel, letra y giro.
    const title = h('div', { style: { display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '0.6mm 0.4mm', flex: 'none' } });
    for (const ch of fillTemplate(s.titleText, values)) {
      if (ch === ' ') { title.appendChild(h('span', { style: { width: '2.5mm' } })); continue; }
      const bg = colors[Math.floor(rand() * colors.length)] || '#FFFFFF';
      title.appendChild(h('span', {
        text: rand() > 0.5 ? ch.toUpperCase() : ch,
        style: {
          fontFamily: fontStack(CUT_FONTS[Math.floor(rand() * CUT_FONTS.length)]), fontSize: `${s.titleSize * (0.85 + rand() * 0.35)}pt`,
          background: bg, color: lum(bg) > 0.55 ? '#141414' : '#FFFFFF', padding: '0.3mm 0.9mm', lineHeight: 1.1,
          transform: `rotate(${(rand() - 0.5) * 12}deg) translateY(${(rand() - 0.5) * 1.2}mm)`, boxShadow: `0.3mm 0.4mm 0 ${rgba('#000000', 0.25)}`,
        },
      }));
    }

    const mono = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor };
    const cols = splitColumns(tracks, 2).map((list) => fitList(list.map((t) => h('div', {
      style: { ...mono, ...rowSizing(s, { minFactor: 1, maxFactor: 2.6 }), display: 'flex', alignItems: 'center', gap: '1.4mm' },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { background: t.numberColor || s.inkColor, color: s.paperColor, padding: '0 0.6mm', flex: 'none', fontSize: '0.85em', lineHeight: 1.2 } }),
    fitTitle(t, { lineHeight: 1.25 }),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.75 } })))));

    const info = fillTemplate(s.infoText, values);
    const tape = (pos, rot) => h('div', { style: { position: 'absolute', width: '22mm', height: '6mm', background: rgba(s.tapeColor, 0.75), transform: `rotate(${rot}deg)`, ...pos } });
    const layers = [
      h('div', { style: { position: 'absolute', inset: '7mm 6mm 6mm', display: 'flex', flexDirection: 'column' } },
        title,
        info ? deco(s, 'decoInfoBar', () => h('div', { text: info.toUpperCase(), style: { ...mono, fontSize: `${s.listSize * 0.9}pt`, textAlign: 'center', margin: '3mm 0 2.5mm', background: s.inkColor, color: s.paperColor, padding: '0.6mm 2mm', alignSelf: 'center', transform: 'rotate(-1deg)', flex: 'none' } })) : null,
        h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '5mm' } }, ...cols)),
      deco(s, 'decoTapeTop', () => tape({ left: '-4mm', top: '4mm' }, -35)),
      deco(s, 'decoTapeBottom', () => tape({ right: '-5mm', bottom: '6mm' }, -30)),
      // (proyectos antiguos: «scribbles: false» quitaba el ✕ y la estrella a la vez)
      s.scribbles === false ? null : deco(s, 'decoX', () => h('div', { text: '✕', style: { position: 'absolute', right: '6mm', bottom: '2mm', fontFamily: fontStack('Caveat'), fontSize: '24pt', color: s.accentColor, transform: 'rotate(8deg)', lineHeight: 1 } })),
      s.scribbles === false ? null : deco(s, 'decoStar', () => h('div', { text: '★', style: { position: 'absolute', left: '5mm', bottom: '3mm', fontSize: '14pt', color: s.accentColor, transform: 'rotate(-12deg)' } })),
    ].filter(Boolean);
    // Suciedad de fotocopia: una sola imagen SVG con puntos (muchas capas de
    // degradado dejan el PNG en blanco al exportar).
    const r2 = seeded(7);
    let dots = '';
    for (let i = 0; i < 60; i += 1) dots += `<circle cx="${(r2() * 120).toFixed(1)}" cy="${(r2() * 120).toFixed(1)}" r="${(0.1 + r2() * 0.3).toFixed(2)}"/>`;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" fill="${s.inkColor}">${dots}</svg>`;
    layers.push(h('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: s.grain,
        background: `url("data:image/svg+xml,${encodeURIComponent(svg)}") 0 0 / 100% 100%, linear-gradient(90deg, ${rgba(s.inkColor, 0.25)}, transparent 4%, transparent 96%, ${rgba(s.inkColor, 0.25)})`,
      },
    }));
    return h('div', { style: { position: 'absolute', inset: 0, background: s.paperColor, overflow: 'hidden' } }, ...layers);
  },
};
