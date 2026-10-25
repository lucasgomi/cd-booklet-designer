// «8 bits» — pantalla de consola portátil: paleta de cuatro verdes, marco
// pixelado, letra de píxeles y la lista como menú con cursor.
import { h, fontStack } from '../dom.js';
import { fillTemplate, stripAccents, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns } from './common.js';

export default {
  id: 'gameboy',
  category: 'Estéticas',
  name: '8 bits',
  description: 'Pantalla de consola portátil con letra de píxeles y menú.',

  defaults: {
    c0: '#0F380F',
    c1: '#306230',
    c2: '#8BAC0F',
    c3: '#9BBC0F',
    pixelGrid: true,
    titleFont: 'Press Start 2P', titleWeight: 400, titleSize: 11,
    listFont: 'VT323', listWeight: 400, listSize: 8.4,
    titleText: '{titulo}',
    subText: '{artista}',
    footerText: '► PRESS START',
    hearts: 3,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: '',
    autoRowHeight: true,
    rowHeight: 3,
  },

  presets: [
    { name: 'Clásica verde', style: {} },
    { name: 'Pocket gris', style: { c0: '#1E1E1E', c1: '#4A4A4A', c2: '#9C9C9C', c3: '#C6C6C6' } },
    { name: 'Arcade', style: { c0: '#FFFFFF', c1: '#FF3DA5', c2: '#1A1033', c3: '#0B0618', pixelGrid: false } },
    { name: 'Rosa chicle', style: { c0: '#4A1035', c1: '#B03A7A', c2: '#F6A6CF', c3: '#FFD6EA' } },
  ],

  controls: [
    { section: 'Colores (paleta de 4)', items: [
      { key: 'c0', label: 'Más oscuro (texto)', type: 'color' },
      { key: 'c1', label: 'Oscuro', type: 'color' },
      { key: 'c2', label: 'Claro (marco)', type: 'color' },
      { key: 'c3', label: 'Más claro (pantalla)', type: 'color' },
      { key: 'pixelGrid', label: 'Rejilla de píxeles', type: 'toggle' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'subText', label: 'Subtítulo', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'hearts', label: 'Corazones', type: 'number', min: 0, max: 8, step: 1 },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const tx = (x) => stripAccents(String(x)).toUpperCase();
    const px = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.c0, lineHeight: 1 };
    // Marco pixelado: bordes en escalera con sombras duras.
    const frame = (inset, color, step = 1.2) => h('div', {
      style: {
        position: 'absolute', inset, background: color,
        clipPath: `polygon(${step}mm 0, calc(100% - ${step}mm) 0, calc(100% - ${step}mm) ${step}mm, 100% ${step}mm, 100% calc(100% - ${step}mm), calc(100% - ${step}mm) calc(100% - ${step}mm), calc(100% - ${step}mm) 100%, ${step}mm 100%, ${step}mm calc(100% - ${step}mm), 0 calc(100% - ${step}mm), 0 ${step}mm, ${step}mm ${step}mm)`,
      },
    });

    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...px, ...rowSizing(s, { minFactor: 0.95, maxFactor: 1.8 }), display: 'flex', alignItems: 'center', gap: '1.2mm' },
    },
    h('span', { text: t.number === 1 ? '►' : ' ', style: { width: '1em', flex: 'none' } }),
    h('span', { text: String(t.number).padStart(2, '0'), style: { color: t.numberColor || s.c1, flex: 'none' } }),
    fitTitle(t, { lineHeight: 1.05 }, tx),
    h('span', { text: t.duration, style: { color: s.c1, flex: 'none' } })))));

    const sub = tx(fillTemplate(s.subText, values));
    const hearts = '♥'.repeat(Math.max(0, Math.round(s.hearts)));
    const screen = h('div', { style: { position: 'absolute', inset: '12mm', display: 'flex', flexDirection: 'column' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 'none', marginBottom: '2mm' } },
        h('span', { text: hearts, style: { ...px, color: s.c1, letterSpacing: '0.1em' } }),
        h('span', { text: `${values.pistas} TRK · ${tx(values.total)}`, style: { ...px, color: s.c1 } })),
      h('div', { text: tx(fillTemplate(s.titleText, values)), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.c0, lineHeight: 1.3, textAlign: 'center', flex: 'none', textShadow: `0.5mm 0.5mm 0 ${s.c2}` } }),
      sub ? h('div', { text: sub, style: { ...px, textAlign: 'center', color: s.c1, margin: '1.4mm 0 2.4mm', flex: 'none' } }) : null,
      h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '3mm' } }, ...cols),
      s.footerText ? h('div', { text: tx(fillTemplate(s.footerText, values)), style: { ...px, textAlign: 'center', marginTop: '2mm', flex: 'none', letterSpacing: '0.1em' } }) : null);

    const layers = [frame('3mm', s.c1, 2), frame('5mm', s.c2, 1.6), frame('9mm', s.c0, 1.2), frame('10mm', s.c3, 1), screen];
    if (s.pixelGrid) {
      layers.push(h('div', {
        style: {
          position: 'absolute', inset: '10mm', pointerEvents: 'none', opacity: 0.18,
          backgroundImage: `linear-gradient(${s.c2} 0.12mm, transparent 0.12mm), linear-gradient(90deg, ${s.c2} 0.12mm, transparent 0.12mm)`, backgroundSize: '0.7mm 0.7mm',
        },
      }));
    }
    return h('div', { style: { position: 'absolute', inset: 0, background: s.c0 } }, ...layers);
  },
};
