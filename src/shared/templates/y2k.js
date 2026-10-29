// «Y2K holográfico» — fondo iridiscente, destellos, título cromado y la
// lista en un panel de cristal con números en burbujas.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL, deco } from './common.js';

const SPARKLES = [[8, 9, 9], [104, 14, 12], [92, 4, 6], [14, 40, 6], [110, 52, 7], [6, 104, 10], [112, 108, 8], [60, 3, 5]];

export default {
  id: 'y2k',
  category: 'White girl music',
  name: 'Y2K holográfico',
  description: 'Fondo iridiscente, título cromado y burbujas de cristal.',

  defaults: {
    holo1: '#C9B8FF',
    holo2: '#A8F0FF',
    holo3: '#FFC2E8',
    holo4: '#C8FFD9',
    chrome1: '#FFFFFF',
    chrome2: '#56608F',
    outlineColor: '#2B2A5C',
    glassColor: '#FFFFFF',
    glassOpacity: 0.42,
    textColor: '#2B2A5C',
    bubbleColor: '#FF5FC1',
    bubbleTextColor: '#FFFFFF',
    sparkleColor: '#FFFFFF',
    sparkles: true,
    titleFont: 'Archivo Black', titleWeight: 400, titleSize: 34,
    listFont: 'Poppins', listWeight: 600, listSize: 6.3,
    pillFont: 'Poppins', pillWeight: 700, pillSize: 6,
    titleText: '{titulo}',
    pillText: '★ {artista}[ · nº {disco}] ★',
    footerText: '{pistas} tracks · {total}',
    uppercaseTitle: true,
    showDurations: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    margin: 6,
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'sparkles', label: 'Destellos ✦' },
  ],

  presets: [
    { name: 'Holográfico', style: {} },
    { name: 'Chicle', style: { holo1: '#FF9ACB', holo2: '#FFD1EC', holo3: '#FF6FB5', holo4: '#FFE6F4', chrome2: '#D0479B', outlineColor: '#6B0F45', textColor: '#6B0F45', bubbleColor: '#6B0F45' } },
    { name: 'Hielo', style: { holo1: '#BFE8FF', holo2: '#E8F7FF', holo3: '#9FD4FF', holo4: '#DDE7FF', chrome2: '#4F7BB8', outlineColor: '#123A6B', textColor: '#123A6B', bubbleColor: '#3D8BFF' } },
    { name: 'Mariposa noche', style: { holo1: '#2A1458', holo2: '#4B1E7A', holo3: '#0E3A5A', holo4: '#5B1449', chrome1: '#FFFFFF', chrome2: '#B79CFF', outlineColor: '#FF7AE0', glassColor: '#120826', glassOpacity: 0.45, textColor: '#F4EDFF', bubbleColor: '#FF7AE0', bubbleTextColor: '#120826' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'holo1', label: 'Holográfico 1', type: 'color' },
      { key: 'holo2', label: 'Holográfico 2', type: 'color' },
      { key: 'holo3', label: 'Holográfico 3', type: 'color' },
      { key: 'holo4', label: 'Holográfico 4', type: 'color' },
      { key: 'chrome1', label: 'Cromado: brillo', type: 'color' },
      { key: 'chrome2', label: 'Cromado: sombra', type: 'color' },
      { key: 'outlineColor', label: 'Contorno del título', type: 'color' },
      { key: 'glassColor', label: 'Panel de cristal', type: 'color' },
      { key: 'glassOpacity', label: 'Opacidad del panel', type: 'opacity' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'bubbleColor', label: 'Burbujas de los números', type: 'color' },
      { key: 'bubbleTextColor', label: 'Números', type: 'color' },
      { key: 'sparkleColor', label: 'Color de los destellos', type: 'color', when: (s) => s.sparkles },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Pastilla y pie', family: 'pillFont', weight: 'pillWeight', size: 'pillSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'pillText', label: 'Pastilla', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'uppercaseTitle', label: 'Título en mayúsculas', type: 'toggle' },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 15, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const M = s.margin;
    const pill = { fontFamily: fontStack(s.pillFont), fontWeight: s.pillWeight, fontSize: `${s.pillSize}pt`, color: s.textColor, letterSpacing: '0.08em' };
    const bg = [
      `radial-gradient(circle at 15% 20%, ${rgba(s.holo3, 0.9)} 0, transparent 35%)`,
      `radial-gradient(circle at 85% 30%, ${rgba(s.holo2, 0.9)} 0, transparent 40%)`,
      `radial-gradient(circle at 70% 90%, ${rgba(s.holo4, 0.9)} 0, transparent 40%)`,
      `conic-gradient(from 210deg at 40% 60%, ${s.holo1}, ${s.holo2}, ${s.holo3}, ${s.holo4}, ${s.holo1})`,
    ].join(', ');

    const titleText = fillTemplate(s.titleText, values);
    const title = h('div', {
      text: s.uppercaseTitle ? titleText.toUpperCase() : titleText,
      style: {
        fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, lineHeight: 0.95, textAlign: 'center',
        backgroundImage: `linear-gradient(180deg, ${s.chrome1} 0%, ${s.chrome2} 48%, ${s.chrome1} 52%, ${s.chrome2} 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
        WebkitTextStroke: `0.4mm ${s.outlineColor}`, filter: `drop-shadow(0 0.6mm 0 ${rgba(s.outlineColor, 0.35)})`,
        flex: 'none', textWrap: 'balance', letterSpacing: '0.01em',
      },
    });
    const pillText = fillTemplate(s.pillText, values);

    const half = Math.ceil(tracks.length / 2);
    const box = s.listSize * 0.3528 * 1.35;
    const maxAuto = `${(s.listSize * 0.3528 * 2.3).toFixed(2)}mm`;
    const column = (list) => h('div', { class: 'fit-v', style: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...list.map((t) => h('div', {
        style: {
          display: 'flex', alignItems: 'center', gap: '1.3mm', fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor,
          flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(box + 0.2).toFixed(2)}mm`, fontVariantNumeric: 'tabular-nums',
        },
      },
      h('span', {
        text: String(t.number),
        style: {
          flex: 'none', width: `${box * 1.25}mm`, height: `${box}mm`, borderRadius: `${box}mm`, display: 'grid', placeItems: 'center',
          background: t.numberColor || s.bubbleColor, boxShadow: `inset 0 -0.3mm 0.5mm ${rgba('#000000', 0.18)}, inset 0 0.35mm 0.3mm ${rgba('#FFFFFF', 0.55)}`,
          color: s.bubbleTextColor, fontSize: '0.8em', fontWeight: 700, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
        },
      }),
      h('span', { class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle, style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.35 } }),
      s.showDurations ? h('span', { text: t.duration, style: { flex: 'none', opacity: 0.7, fontWeight: 500 } }) : null)));

    const glass = h('div', {
      style: {
        flex: '1 1 auto', minHeight: 0, marginTop: '3mm', padding: '3mm 3.5mm', borderRadius: '4mm', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(160deg, ${rgba(s.glassColor, s.glassOpacity + 0.15)}, ${rgba(s.glassColor, s.glassOpacity)})`,
        border: `0.35mm solid ${rgba('#FFFFFF', 0.85)}`, boxShadow: `0 1mm 4mm ${rgba(s.outlineColor, 0.18)}, inset 0 0.4mm 0 ${rgba('#FFFFFF', 0.7)}`,
      },
    },
    h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '4mm' } }, column(tracks.slice(0, half)), column(tracks.slice(half))),
    s.footerText ? h('div', { text: fillTemplate(s.footerText, values), style: { ...pill, textAlign: 'center', marginTop: '1.6mm', opacity: 0.8, flex: 'none', textTransform: 'uppercase' } }) : null);

    const content = h('div', { style: { position: 'absolute', inset: `${M}mm`, display: 'flex', flexDirection: 'column', alignItems: 'stretch' } },
      title,
      pillText ? h('div', {
        text: pillText,
        style: {
          ...pill, alignSelf: 'center', marginTop: '2mm', padding: '0.9mm 3.5mm', borderRadius: '5mm', flex: 'none',
          background: rgba('#FFFFFF', 0.55), border: `0.3mm solid ${rgba('#FFFFFF', 0.9)}`, textTransform: 'uppercase', whiteSpace: 'nowrap',
        },
      }) : null,
      glass);

    const layers = [content];
    if (s.sparkles) {
      for (const [x, y, size] of SPARKLES) {
        layers.unshift(deco(s, 'sparkles', h('div', { text: '✦', style: { position: 'absolute', left: `${x}mm`, top: `${y}mm`, fontSize: `${size}pt`, color: s.sparkleColor, textShadow: `0 0 1.5mm ${rgba(s.sparkleColor, 0.9)}`, lineHeight: 1 } })));
      }
    }
    return h('div', { style: { position: 'absolute', inset: 0, background: bg, overflow: 'hidden' } }, ...layers);
  },
};
