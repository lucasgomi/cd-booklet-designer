// «Brutalista» — retícula con bordes gruesos, tipografía enorme, números
// grandes y un bloque de color.
import { h, fontStack } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns } from './common.js';

export default {
  id: 'brutalist',
  category: 'Estéticas',
  name: 'Brutalista',
  description: 'Retícula de bordes gruesos, letra enorme y un bloque de color.',

  defaults: {
    bgColor: '#F2F2EE',
    inkColor: '#0A0A0A',
    blockColor: '#FF4D00',
    blockTextColor: '#0A0A0A',
    titleFont: 'Archivo Black', titleWeight: 400, titleSize: 30,
    listFont: 'Inter', listWeight: 600, listSize: 7,
    numberFont: 'Archivo Black', numberWeight: 400,
    titleText: '{titulo}',
    blockText: '{pistas}',
    blockLabel: 'tracks',
    infoText: '{artista}[ / nº {disco}][ / {fecha}] / {total}',
    border: 0.8,
    uppercase: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'mmss',
    autoRowHeight: true,
    rowHeight: 3,
  },

  presets: [
    { name: 'Naranja', style: {} },
    { name: 'Hormigón', style: { bgColor: '#C9C7C1', blockColor: '#0A0A0A', blockTextColor: '#C9C7C1' } },
    { name: 'Azul Klein', style: { bgColor: '#FFFFFF', blockColor: '#1F2EFF', blockTextColor: '#FFFFFF' } },
    { name: 'Ácido', style: { bgColor: '#0A0A0A', inkColor: '#D7FF3D', blockColor: '#D7FF3D', blockTextColor: '#0A0A0A' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'inkColor', label: 'Tinta y bordes', type: 'color' },
      { key: 'blockColor', label: 'Bloque de color', type: 'color' },
      { key: 'blockTextColor', label: 'Texto del bloque', type: 'color' },
      { key: 'border', label: 'Grosor de los bordes', type: 'number', min: 0.2, max: 2, step: 0.1, unit: 'mm' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'blockText', label: 'Cifra del bloque', type: 'text', half: true },
      { key: 'blockLabel', label: 'Rótulo del bloque', type: 'text', half: true },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'uppercase', label: 'Título en mayúsculas', type: 'toggle' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const B = `${s.border}mm solid ${s.inkColor}`;
    const title = fillTemplate(s.titleText, values);
    const list = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor, fontVariantNumeric: 'tabular-nums' };

    const head = h('div', { style: { display: 'flex', borderBottom: B, flex: 'none' } },
      h('div', {
        text: s.uppercase ? title.toUpperCase() : title,
        style: { flex: '1 1 auto', padding: '2mm 3mm', fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, lineHeight: 0.88, color: s.inkColor, letterSpacing: '-0.04em', wordBreak: 'break-word' },
      }),
      h('div', { style: { width: '30mm', flex: 'none', background: s.blockColor, borderLeft: B, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '2mm 2.5mm', boxSizing: 'border-box' } },
        h('div', { text: fillTemplate(s.blockText, values), style: { fontFamily: fontStack(s.titleFont), fontSize: '34pt', lineHeight: 0.85, color: s.blockTextColor } }),
        h('div', { text: fillTemplate(s.blockLabel, values), style: { ...list, color: s.blockTextColor, textTransform: 'uppercase', letterSpacing: '0.1em' } })));

    const info = h('div', { text: fillTemplate(s.infoText, values).toUpperCase(), style: { ...list, borderBottom: B, padding: '1.2mm 3mm', letterSpacing: '0.08em', flex: 'none' } });

    const cols = splitColumns(tracks, 2).map((part, ci) => fitList(part.map((t) => h('div', {
      style: { ...list, ...rowSizing(s, { minFactor: 1.2, maxFactor: 2.8 }), display: 'flex', alignItems: 'center', gap: '2mm', borderBottom: `${s.border * 0.4}mm solid ${s.inkColor}`, padding: '0 2.5mm' },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { fontFamily: fontStack(s.numberFont), fontWeight: s.numberWeight, color: t.numberColor || s.inkColor, flex: 'none', fontSize: '1.15em' } }),
    fitTitle(t),
    h('span', { text: t.duration, style: { flex: 'none' } }))), { borderLeft: ci ? B : 'none' }));

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor } },
      h('div', { style: { position: 'absolute', inset: '5mm', border: B, display: 'flex', flexDirection: 'column' } },
        head, info, h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex' } }, ...cols)));
  },
};
