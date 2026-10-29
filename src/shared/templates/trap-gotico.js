// «Trap gótico» — trap underground de los 2010: fondo negro, título en
// letra gótica cromada, alambre de espino, cadenas, cruces y destellos.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, seeded, deco } from './common.js';

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Alambre de espino de `w` mm de ancho y 4 mm de alto. */
function barbedWire(w, color) {
  let a = 'M0 2';
  let b = 'M0 2';
  for (let x = 0; x < w; x += 4) {
    a += ` Q${x + 1} 0.9 ${x + 2} 2 T${x + 4} 2`;
    b += ` Q${x + 1} 3.1 ${x + 2} 2 T${x + 4} 2`;
  }
  let barbs = '';
  for (let x = 6; x < w - 2; x += 10) barbs += `M${x - 1.1} 0.4 L${x + 1.1} 3.6 M${x + 1.1} 0.4 L${x - 1.1} 3.6 `;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} 4" width="${w}" height="4" fill="none" stroke="${color}" stroke-linecap="round">`
    + `<path d="${a}" stroke-width="0.35"/><path d="${b}" stroke-width="0.35"/><path d="${barbs}" stroke-width="0.4"/></svg>`;
}

/** Tira de cadena (eslabón de frente + eslabón de canto), en horizontal o vertical. */
function chainStrip(color, vertical) {
  const link = vertical
    ? `<ellipse cx="1" cy="1.8" rx="0.65" ry="1.5"/><line x1="1" y1="3.6" x2="1" y2="6"/>`
    : `<ellipse cx="1.8" cy="1" rx="1.5" ry="0.65"/><line x1="3.6" y1="1" x2="6" y2="1"/>`;
  const [w, hh] = vertical ? [2, 6] : [6, 2];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${hh}" width="${w}" height="${hh}" fill="none" stroke="${color}" stroke-width="0.35">${link}</svg>`;
}

export default {
  id: 'trap-gotico',
  category: 'Rap / trap',
  name: 'Trap gótico',
  description: 'Negro, letra gótica cromada, alambre de espino y cadenas.',

  defaults: {
    bgColor: '#050505',
    glowColor: '#2A2A2A',
    chrome1: '#FFFFFF',
    chrome2: '#8A8F98',
    chrome3: '#2B2E33',
    accentColor: '#C9CED6',
    textColor: '#E9E9E9',
    numberColor: '#8A8F98',
    metalColor: '#9BA0A8',
    titleFont: 'UnifrakturMaguntia', titleWeight: 400, titleSize: 36,
    artistFont: 'Rubik Mono One', artistWeight: 400, artistSize: 6,
    listFont: 'Arimo', listWeight: 700, listSize: 6,
    artistText: '{artista}',
    titleText: '{titulo}',
    footerText: '{pistas} temas · {total}[ · {fecha}]',
    labelText: 'Contenido explícito',
    uppercaseList: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoWire', label: 'Alambre de espino' },
    { key: 'decoChain', label: 'Marco de cadena' },
    { key: 'decoCrosses', label: 'Cruces ✝' },
    { key: 'decoSparkles', label: 'Destellos ✦' },
    { key: 'decoLabel', label: 'Etiqueta «explícito»' },
    { key: 'decoGrain', label: 'Grano' },
  ],

  presets: [
    { name: 'Cromo', style: {} },
    { name: 'Sangre', style: { glowColor: '#3A0006', chrome1: '#FFD9D9', chrome2: '#C1121F', chrome3: '#3A0006', accentColor: '#E5383B', numberColor: '#C1121F', metalColor: '#7A7A7A' } },
    { name: 'Oro', style: { bgColor: '#070604', glowColor: '#2B2108', chrome1: '#FFF4C2', chrome2: '#C9A227', chrome3: '#4A3A0A', accentColor: '#E8C766', numberColor: '#C9A227', metalColor: '#C9A227', textColor: '#F3EBD3' } },
    { name: 'Hielo', style: { bgColor: '#03060C', glowColor: '#0D2A4A', chrome1: '#FFFFFF', chrome2: '#7FD3FF', chrome3: '#123A6B', accentColor: '#9BE3FF', numberColor: '#7FD3FF', metalColor: '#7FA7C9' } },
    { name: 'Rosa', style: { bgColor: '#0A0508', glowColor: '#4A0F33', chrome1: '#FFFFFF', chrome2: '#FF7AC8', chrome3: '#5A1440', accentColor: '#FFB3E0', numberColor: '#FF7AC8', metalColor: '#C7A2B8', textColor: '#FBE9F4' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'glowColor', label: 'Resplandor del fondo', type: 'color' },
      { key: 'chrome1', label: 'Cromado: brillo', type: 'color' },
      { key: 'chrome2', label: 'Cromado: medio', type: 'color' },
      { key: 'chrome3', label: 'Cromado: sombra', type: 'color' },
      { key: 'accentColor', label: 'Artista y detalles', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'numberColor', label: 'Números', type: 'color' },
      { key: 'metalColor', label: 'Alambre y cadena', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Artista', family: 'artistFont', weight: 'artistWeight', size: 'artistSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'artistText', label: 'Artista', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleText', label: 'Título', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'labelText', label: 'Etiqueta', type: 'text', when: (s) => s.decoLabel !== false },
      { key: 'uppercaseList', label: 'Lista en mayúsculas', type: 'toggle' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const W = 104; // ancho útil (mm)
    const up = (x) => (s.uppercaseList ? x.toUpperCase() : x);

    const artist = fillTemplate(s.artistText, values);
    const title = h('div', {
      text: fillTemplate(s.titleText, values),
      style: {
        fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, lineHeight: 1.02, textAlign: 'center', flex: 'none', textWrap: 'balance',
        backgroundImage: `linear-gradient(180deg, ${s.chrome1} 0%, ${s.chrome2} 42%, ${s.chrome3} 50%, ${s.chrome1} 58%, ${s.chrome2} 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        WebkitTextStroke: `0.15mm ${rgba(s.chrome1, 0.6)}`, filter: `drop-shadow(0 0 1.2mm ${rgba(s.chrome2, 0.45)})`, padding: '0 2mm',
      },
    });

    const wire = deco(s, 'decoWire', () => h('div', { style: { flex: 'none', height: '4mm', margin: '1.6mm 0 2.2mm', background: `${svgUrl(barbedWire(W, s.metalColor))} center / 100% 100% no-repeat` } }));

    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, letterSpacing: '0.04em', fontVariantNumeric: 'tabular-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...row, ...rowSizing(s, { minFactor: 1.05, maxFactor: 2.8 }), display: 'flex', alignItems: 'center', gap: '1.3mm', borderBottom: `0.12mm solid ${rgba(s.metalColor, 0.18)}` },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { color: t.numberColor || s.numberColor, flex: 'none', fontSize: '0.9em' } }),
    fitTitle(t, {}, up),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.6, fontWeight: 400 } })))));

    const footer = fillTemplate(s.footerText, values);
    const label = deco(s, 'decoLabel', () => (s.labelText ? h('div', {
      style: { flex: 'none', border: `0.35mm solid ${s.textColor}`, background: s.bgColor, display: 'flex', flexDirection: 'column', alignItems: 'stretch', fontFamily: fontStack('Arimo'), fontWeight: 700, lineHeight: 1 },
    },
    h('div', { text: 'PARENTAL', style: { fontSize: '3.4pt', color: s.textColor, textAlign: 'center', padding: '0.4mm 1mm 0.2mm', letterSpacing: '0.12em' } }),
    h('div', { text: String(s.labelText).toUpperCase(), style: { fontSize: '4.2pt', background: s.textColor, color: s.bgColor, textAlign: 'center', padding: '0.5mm 1.2mm' } })) : null));

    const content = h('div', { style: { position: 'absolute', inset: '7mm 8mm 6.5mm', display: 'flex', flexDirection: 'column' } },
      artist ? h('div', { text: artist.toUpperCase(), style: { fontFamily: fontStack(s.artistFont), fontWeight: s.artistWeight, fontSize: `${s.artistSize}pt`, color: s.accentColor, textAlign: 'center', letterSpacing: '0.35em', marginBottom: '1.2mm', flex: 'none' } }) : null,
      title,
      wire || h('div', { style: { height: '3mm', flex: 'none' } }),
      h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '5mm' } }, ...cols),
      (footer || label) ? h('div', { style: { flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3mm', marginTop: '2mm' } },
        label || h('span'),
        h('div', { text: footer.toUpperCase(), style: { ...row, fontWeight: 400, fontSize: `${s.listSize * 0.82}pt`, color: s.accentColor, letterSpacing: '0.2em', textAlign: 'right' } })) : null);

    const layers = [content];
    if (s.decoChain !== false) {
      const strip = (pos, vertical) => h('div', { style: { position: 'absolute', ...pos, background: `${svgUrl(chainStrip(s.metalColor, vertical))} 0 0 / ${vertical ? '2mm 6mm' : '6mm 2mm'} ${vertical ? 'repeat-y' : 'repeat-x'}` } });
      layers.unshift(deco(s, 'decoChain', () => h('div', { style: { position: 'absolute', inset: 0 } },
        strip({ left: '3mm', right: '3mm', top: '2.5mm', height: '2mm' }, false),
        strip({ left: '3mm', right: '3mm', bottom: '2.5mm', height: '2mm' }, false),
        strip({ top: '3mm', bottom: '3mm', left: '2.5mm', width: '2mm' }, true),
        strip({ top: '3mm', bottom: '3mm', right: '2.5mm', width: '2mm' }, true))));
    }
    const cross = (pos) => h('div', { text: '✝', style: { position: 'absolute', ...pos, fontSize: '13pt', color: s.accentColor, lineHeight: 1, textShadow: `0 0 1.2mm ${rgba(s.accentColor, 0.6)}` } });
    layers.push(deco(s, 'decoCrosses', () => h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }, cross({ left: '8mm', top: '7mm' }), cross({ right: '8mm', top: '7mm' }))));
    const rand = seeded(11);
    const sparkles = [[14, 26], [102, 22], [24, 6], [94, 9]].map(([x, y]) => h('div', {
      text: '✦', style: { position: 'absolute', left: `${x}mm`, top: `${y}mm`, fontSize: `${5 + rand() * 5}pt`, color: s.chrome1, lineHeight: 1, textShadow: `0 0 1.5mm ${rgba(s.chrome1, 0.9)}` },
    }));
    layers.push(deco(s, 'decoSparkles', () => h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none' } }, ...sparkles)));

    // Grano: una sola imagen SVG (muchas capas de degradado dejan el PNG en blanco).
    const r2 = seeded(23);
    let dots = '';
    for (let i = 0; i < 90; i += 1) dots += `<circle cx="${(r2() * 120).toFixed(1)}" cy="${(r2() * 120).toFixed(1)}" r="${(0.08 + r2() * 0.18).toFixed(2)}"/>`;
    layers.push(deco(s, 'decoGrain', () => h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.35, background: `${svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" fill="#FFFFFF">${dots}</svg>`)} 0 0 / 100% 100%` } })));

    return h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: `radial-gradient(ellipse 70% 45% at 50% 24%, ${s.glowColor}, ${s.bgColor} 100%)` } }, ...layers);
  },
};
