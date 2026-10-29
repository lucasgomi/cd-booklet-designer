// «Vinilo» — la funda del disco con el vinilo asomando (surcos, brillo y
// etiqueta) y la lista repartida en Cara A y Cara B.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL, deco } from './common.js';

export default {
  id: 'vinyl',
  category: 'Objetos',
  name: 'Vinilo',
  description: 'La funda con el vinilo asomando y la lista en Cara A / Cara B.',

  defaults: {
    bgColor: '#EFE6D8',
    textColor: '#2A211B',
    dimColor: '#8C7B6B',
    accentColor: '#D9502F',
    sleeveColor1: '#D9502F',
    sleeveColor2: '#F2A541',
    sleeveTextColor: '#FFF6E8',
    vinylColor: '#141414',
    labelColor: '#F2A541',
    labelTextColor: '#2A211B',
    useBgImage: true,
    titleFont: 'Fraunces', titleWeight: 900, titleSize: 14,
    listFont: 'Inter', listWeight: 500, listSize: 6.3,
    sideFont: 'Space Mono', sideWeight: 700, sideSize: 6,
    sleeveText: '{titulo}',
    titleText: '{artista}',
    infoText: '[Nº {disco} · ]{pistas} canciones · {total}',
    labelText: '{titulo}',
    sideA: 'Cara A',
    sideB: 'Cara B',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    discOffset: 30,
    margin: 6,
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoDisc', label: 'Disco de vinilo' },
  ],

  presets: [
    { name: 'Setentas', style: {} },
    { name: 'Jazz azul', style: { bgColor: '#E9EEF2', textColor: '#14213D', dimColor: '#6B7A90', accentColor: '#1F5FBF', sleeveColor1: '#14213D', sleeveColor2: '#1F5FBF', labelColor: '#E9EEF2', labelTextColor: '#14213D', titleFont: 'Playfair Display' } },
    { name: 'Vinilo rosa', style: { bgColor: '#FFF0F3', textColor: '#4A1F2E', dimColor: '#B07A8C', accentColor: '#E8487A', sleeveColor1: '#F7B2C8', sleeveColor2: '#E8487A', vinylColor: '#F58FB0', labelColor: '#FFFFFF', labelTextColor: '#E8487A', titleFont: 'Poppins', titleWeight: 800 } },
    { name: 'Noche', style: { bgColor: '#121212', textColor: '#F2EDE4', dimColor: '#8A857C', accentColor: '#E8B54A', sleeveColor1: '#2B2B2B', sleeveColor2: '#E8B54A', labelColor: '#E8B54A', labelTextColor: '#121212', vinylColor: '#050505' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'dimColor', label: 'Duraciones', type: 'color' },
      { key: 'accentColor', label: 'Números y caras', type: 'color' },
      { key: 'useBgImage', label: 'Funda con la imagen de fondo («Imágenes»)', type: 'toggle' },
      { key: 'sleeveColor1', label: 'Funda: color 1', type: 'color' },
      { key: 'sleeveColor2', label: 'Funda: color 2', type: 'color' },
      { key: 'sleeveTextColor', label: 'Texto de la funda', type: 'color' },
      { key: 'vinylColor', label: 'Vinilo', type: 'color' },
      { key: 'labelColor', label: 'Etiqueta del vinilo', type: 'color' },
      { key: 'labelTextColor', label: 'Texto de la etiqueta', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Caras y datos', family: 'sideFont', weight: 'sideWeight', size: 'sideSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'sleeveText', label: 'Texto de la funda (sin imagen)', type: 'text' },
      { key: 'labelText', label: 'Texto de la etiqueta', type: 'text' },
      { key: 'sideA', label: 'Cara A', type: 'text', half: true },
      { key: 'sideB', label: 'Cara B', type: 'text', half: true },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'discOffset', label: 'Cuánto asoma el vinilo', type: 'number', min: 0, max: 45, step: 0.5, unit: 'mm' },
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 15, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const imgUrl = s.useBgImage ? asset(state.images.background) : null;
    const M = s.margin;
    const sleeve = 50;
    const disc = sleeve - 2;
    const label = disc * 0.36;
    const side = { fontFamily: fontStack(s.sideFont), fontWeight: s.sideWeight, fontSize: `${s.sideSize}pt`, letterSpacing: '0.14em', textTransform: 'uppercase' };

    // Vinilo: surcos con un degradado radial repetido y brillo cónico.
    const vinyl = h('div', {
      style: {
        position: 'absolute', left: `${M + 1 + s.discOffset}mm`, top: `${M + 1}mm`, width: `${disc}mm`, height: `${disc}mm`, borderRadius: '50%',
        background: `radial-gradient(circle, transparent 0 ${label / 2 + 0.6}mm, ${rgba('#FFFFFF', 0.06)} ${label / 2 + 0.7}mm, transparent ${label / 2 + 1.4}mm),
          repeating-radial-gradient(circle, ${s.vinylColor} 0 0.35mm, ${rgba('#FFFFFF', 0.07)} 0.4mm, ${s.vinylColor} 0.55mm),
          ${s.vinylColor}`,
        boxShadow: `0 1.2mm 3mm ${rgba('#000000', 0.35)}`,
      },
    },
    h('div', { style: { position: 'absolute', inset: 0, borderRadius: '50%', background: `conic-gradient(from 20deg, transparent 0 10%, ${rgba('#FFFFFF', 0.16)} 15%, transparent 22% 55%, ${rgba('#FFFFFF', 0.12)} 62%, transparent 70%)` } }),
    h('div', {
      style: {
        position: 'absolute', left: '50%', top: '50%', width: `${label}mm`, height: `${label}mm`, transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: s.labelColor, display: 'grid', placeItems: 'center', textAlign: 'center',
      },
    },
    h('div', { text: fillTemplate(s.labelText, values), style: { ...side, fontSize: `${s.sideSize * 0.85}pt`, color: s.labelTextColor, maxWidth: `${label * 0.7}mm`, lineHeight: 1.2, letterSpacing: '0.06em', marginTop: '-4.5mm' } }),
    h('div', { style: { position: 'absolute', left: '50%', top: '50%', width: '1.6mm', height: '1.6mm', margin: '-0.8mm 0 0 -0.8mm', borderRadius: '50%', background: s.bgColor } })));

    const sleeveEl = h('div', {
      style: {
        position: 'absolute', left: `${M}mm`, top: `${M}mm`, width: `${sleeve}mm`, height: `${sleeve}mm`,
        background: imgUrl ? `url("${imgUrl}") center / cover` : `linear-gradient(145deg, ${s.sleeveColor1}, ${s.sleeveColor2})`,
        boxShadow: `0.6mm 1mm 3mm ${rgba('#000000', 0.35)}`, overflow: 'hidden', display: 'flex', alignItems: 'flex-end', padding: '3mm', boxSizing: 'border-box',
      },
    },
    imgUrl ? null : h('div', { text: fillTemplate(s.sleeveText, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize * 1.5}pt`, color: s.sleeveTextColor, lineHeight: 0.9, letterSpacing: '-0.02em', textWrap: 'balance' } }),
    h('div', { style: { position: 'absolute', inset: 0, background: `linear-gradient(115deg, ${rgba('#FFFFFF', 0.18)}, transparent 40%)` } }));

    // Título y datos bajo la funda.
    const titleBlock = h('div', { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '3mm', flex: 'none', marginBottom: '2.5mm' } },
      h('div', { text: fillTemplate(s.titleText, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.textColor, lineHeight: 1, letterSpacing: '-0.015em', textWrap: 'balance', minWidth: 0 } }),
      h('div', { text: fillTemplate(s.infoText, values), style: { ...side, color: s.dimColor, letterSpacing: '0.06em', whiteSpace: 'nowrap', textTransform: 'none', flex: 'none', paddingBottom: '0.4mm' } }));

    const half = Math.ceil(tracks.length / 2);
    const maxAuto = `${(s.listSize * 0.3528 * 2).toFixed(2)}mm`;
    const column = (title, list) => h('div', { style: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' } },
      h('div', { text: title, style: { ...side, color: s.accentColor, paddingBottom: '1mm', borderBottom: `0.3mm solid ${s.textColor}`, marginBottom: '0.8mm', flex: 'none' } }),
      h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
        ...list.map((t) => h('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: '1.4mm', fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, fontVariantNumeric: 'tabular-nums',
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`,
          },
        },
        h('span', { text: String(t.number).padStart(2, '0'), style: { color: t.numberColor || s.accentColor, flex: 'none', fontWeight: 700 } }),
        h('span', { class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle, style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.35 } }),
        h('span', { text: t.duration, style: { color: s.dimColor, flex: 'none' } })))));

    const lists = h('div', {
      style: { position: 'absolute', left: `${M}mm`, right: `${M}mm`, top: `${M + sleeve + 3}mm`, bottom: `${M}mm`, display: 'flex', flexDirection: 'column' },
    }, titleBlock, h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '5mm' } },
      column(fillTemplate(s.sideA, values), tracks.slice(0, half)), column(fillTemplate(s.sideB, values), tracks.slice(half))));

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } }, deco(s, 'decoDisc', vinyl), sleeveEl, lists);
  },
};
