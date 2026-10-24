// «Verde ácido» — fondo de un solo color chillón, letra tipo Arial en
// minúsculas, estirada y un poco borrosa. Cero adornos.
import { h, fontStack } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'acid',
  category: 'White girl music',
  name: 'Verde ácido',
  description: 'Un color chillón, minúsculas estiradas y nada más.',

  defaults: {
    bgColor: '#8ACE00',
    textColor: '#000000',
    dimColor: '#000000',
    titleFont: 'Arimo', titleWeight: 400, titleSize: 40,
    listFont: 'Arimo', listWeight: 400, listSize: 7.2,
    titleText: '{titulo}',
    footerText: '{artista}',
    lowercase: true,
    stretch: 88,
    blur: 0.12,
    titlePosition: 'center',
    columns: 2,
    showNumbers: true,
    showDurations: false,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: '',
    margin: 8,
    autoRowHeight: true,
    rowHeight: 3,
  },

  presets: [
    { name: 'Verde ácido', style: {} },
    { name: 'Remix blanco', style: { bgColor: '#FFFFFF', textColor: '#000000', dimColor: '#000000' } },
    { name: 'Negro y lima', style: { bgColor: '#000000', textColor: '#8ACE00', dimColor: '#8ACE00' } },
    { name: 'Rosa chicle', style: { bgColor: '#FF8FC8', textColor: '#000000', dimColor: '#000000' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'textColor', label: 'Título y canciones', type: 'color' },
      { key: 'dimColor', label: 'Números y pie', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { key: 'stretch', label: 'Estrechar la letra', type: 'number', min: 60, max: 120, step: 1, unit: '%' },
      { key: 'blur', label: 'Desenfoque', type: 'number', min: 0, max: 0.6, step: 0.01, unit: 'mm' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'lowercase', label: 'Todo en minúsculas', type: 'toggle' },
      { key: 'titlePosition', label: 'Posición del título', type: 'select', options: [{ value: 'center', label: 'Centrado arriba' }, { value: 'left', label: 'Arriba a la izquierda' }] },
      { key: 'columns', label: 'Columnas de la lista', type: 'select', options: [{ value: 1, label: 'Una' }, { value: 2, label: 'Dos' }] },
      { key: 'showNumbers', label: 'Mostrar números', type: 'toggle' },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }], when: (s) => s.showDurations },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 20, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 10, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const tx = (str) => (s.lowercase ? (str || '').toLowerCase() : str || '');
    const sx = s.stretch / 100;
    const maxAuto = `${(s.listSize * 0.3528 * 1.8).toFixed(2)}mm`;
    const cols = Number(s.columns) === 2 ? 2 : 1;
    const per = Math.ceil(tracks.length / cols);

    // El estrechamiento se aplica a toda la capa: se maqueta más ancha y se
    // comprime en horizontal, así los «no cabe» se siguen midiendo bien.
    const column = (list) => h('div', { class: 'fit-v', style: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...list.map((t) => {
        const title = h('span', {
          class: 'fit', text: tx(t.title), 'data-track-index': t.index, 'data-full-title': t.fullTitle,
          style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.25 },
        });
        title._fitTransform = tx;
        return h('div', {
          style: {
            display: 'flex', alignItems: 'center', gap: '1.4mm', color: s.textColor,
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528).toFixed(2)}mm`,
            fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, letterSpacing: '-0.02em',
          },
        },
        s.showNumbers ? h('span', { text: String(t.number), style: { color: t.numberColor || s.dimColor, flex: 'none', minWidth: '1.3em' } }) : null,
        title,
        s.showDurations ? h('span', { text: t.duration, style: { color: s.dimColor, flex: 'none' } }) : null);
      }));

    const columns = [];
    for (let c = 0; c < cols; c += 1) columns.push(column(tracks.slice(c * per, (c + 1) * per)));
    const footer = tx(fillTemplate(s.footerText, values));

    const layer = h('div', {
      style: {
        position: 'absolute', top: `${s.margin}mm`, bottom: `${s.margin}mm`, left: `${s.margin}mm`,
        width: `${(120 - 2 * s.margin) / sx}mm`, transform: `scaleX(${sx})`, transformOrigin: '0 0',
        display: 'flex', flexDirection: 'column', filter: s.blur > 0 ? `blur(${s.blur}mm)` : 'none',
      },
    },
    h('div', {
      text: tx(fillTemplate(s.titleText, values)),
      style: {
        fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.textColor,
        lineHeight: 0.95, letterSpacing: '-0.035em', textAlign: s.titlePosition === 'center' ? 'center' : 'left', flex: 'none', margin: '0 0 6mm',
      },
    }),
    h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '6mm' } }, ...columns),
    footer ? h('div', { text: footer, style: { fontFamily: fontStack(s.listFont), fontSize: `${s.listSize}pt`, color: s.dimColor, marginTop: '3mm', flex: 'none', letterSpacing: '-0.02em' } }) : null);

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } }, layer);
  },
};
