// Plantilla 3 — «Dos columnas».
// Cabecera tipográfica con filete, la lista repartida en dos columnas y una
// línea de pie con el total. Pensada para listas largas.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'two-columns',
  name: 'Dos columnas',
  description: 'Cabecera tipográfica y lista en dos columnas.',

  defaults: {
    bgColor: '#F4EFE6',
    bgOverlay: 0.85,
    useBgImage: false,
    titleColor: '#1C1B19',
    infoColor: '#8A5A3B',
    trackTitleColor: '#2A2826',
    numberColor: '#B4572E',
    durationColor: '#8C857C',
    ruleColor: '#1C1B19',
    showDivider: true,
    titleFont: 'Playfair Display', titleWeight: 800, titleSize: 19,
    infoFont: 'Inter', infoWeight: 600, infoSize: 6.6,
    listFont: 'Inter', listWeight: 400, listSize: 6.6,
    numberWeight: 600,
    titleText: '{artista}',
    infoText: '{titulo}[ · Disco {disco}][ · {fecha}]',
    footerText: '{pistas} pistas · {total}',
    infoUppercase: true,
    align: 'left',
    padNumbers: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    margin: 7,
    headerGap: 4,
    columnGap: 5,
    autoRowHeight: true,
    rowHeight: 4,
  },

  presets: [
    { name: 'Papel crema', style: {} },
    { name: 'Noche', style: { bgColor: '#14161B', titleColor: '#F2EDE4', infoColor: '#E8B54A', trackTitleColor: '#E4E1DA', numberColor: '#E8B54A', durationColor: '#8D8A84', ruleColor: '#E8B54A' } },
    { name: 'Suizo', style: {
      bgColor: '#FFFFFF', titleColor: '#E2231A', infoColor: '#111111', trackTitleColor: '#111111', numberColor: '#E2231A', durationColor: '#111111',
      ruleColor: '#111111', titleFont: 'Inter', titleWeight: 900, titleSize: 20, listFont: 'Inter', infoFont: 'Inter', align: 'left' } },
    { name: 'Menta', style: { bgColor: '#DCEFE6', titleColor: '#123B33', infoColor: '#2E7D67', trackTitleColor: '#123B33', numberColor: '#2E7D67', durationColor: '#5E8A7E', ruleColor: '#123B33', titleFont: 'DM Serif Display', titleWeight: 400 } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'useBgImage', label: 'Usar la imagen de fondo (pestaña «Imágenes»)', type: 'toggle' },
      { key: 'bgOverlay', label: 'Velo de color sobre la imagen', type: 'opacity', when: (s) => s.useBgImage },
      { key: 'titleColor', label: 'Título', type: 'color' },
      { key: 'infoColor', label: 'Línea de datos', type: 'color' },
      { key: 'trackTitleColor', label: 'Títulos de canciones', type: 'color' },
      { key: 'numberColor', label: 'Números', type: 'color' },
      { key: 'durationColor', label: 'Duraciones', type: 'color' },
      { key: 'ruleColor', label: 'Filetes', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Línea de datos y pie', family: 'infoFont', weight: 'infoWeight', size: 'infoSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { key: 'numberWeight', label: 'Grosor de los números', type: 'select', options: [300, 400, 500, 600, 700, 800, 900].map((v) => ({ value: v, label: String(v) })) },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'infoUppercase', label: 'Línea de datos en mayúsculas', type: 'toggle' },
      { key: 'align', label: 'Alineación de la cabecera', type: 'select', options: [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centrada' }] },
      { key: 'padNumbers', label: 'Números con cero (01, 02…)', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 20, step: 0.5, unit: 'mm' },
      { key: 'headerGap', label: 'Separación cabecera–lista', type: 'number', min: 0, max: 20, step: 0.5, unit: 'mm' },
      { key: 'columnGap', label: 'Separación entre columnas', type: 'number', min: 2, max: 20, step: 0.5, unit: 'mm' },
      { key: 'showDivider', label: 'Línea entre columnas', type: 'toggle' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 10, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const bgUrl = s.useBgImage ? asset(state.images.background) : null;
    let info = fillTemplate(s.infoText, values);
    if (s.infoUppercase) info = info.toUpperCase();
    const footer = fillTemplate(s.footerText, values);
    const small = { fontFamily: fontStack(s.infoFont), fontWeight: s.infoWeight, fontSize: `${s.infoSize}pt`, letterSpacing: '0.08em' };
    const digits = Math.max(s.padNumbers ? 2 : 1, String(tracks.length).length);

    const header = h('div', { style: { textAlign: s.align, flex: 'none' } },
      info ? h('div', { text: info, style: { ...small, color: s.infoColor, marginBottom: '1.4mm' } }) : null,
      h('div', {
        text: fillTemplate(s.titleText, values),
        style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.titleColor, lineHeight: 1.02, letterSpacing: '-0.01em', textWrap: 'balance' },
      }),
      h('div', { style: { height: '0.5mm', background: s.ruleColor, marginTop: '3mm' } }));

    const half = Math.ceil(tracks.length / 2);
    const maxAuto = `${(s.listSize * 0.3528 * 2.1).toFixed(2)}mm`;
    const column = (list) => h('div', {
      class: 'fit-v',
      style: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
    }, ...list.map((t) => h('div', {
      style: {
        display: 'flex', alignItems: 'baseline', gap: '1.6mm',
        flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none',
        minHeight: `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`,
        fontFamily: fontStack(s.listFont), fontSize: `${s.listSize}pt`, fontVariantNumeric: 'tabular-nums', lineHeight: 1.35,
        borderBottom: `0.15mm solid ${rgba(s.ruleColor, 0.15)}`, alignContent: 'center', flexWrap: 'nowrap',
        paddingTop: '0.3mm',
      },
    },
    h('span', { text: String(t.number).padStart(digits, '0'), style: { color: t.numberColor || s.numberColor, fontWeight: s.numberWeight, flex: 'none' } }),
    h('span', {
      class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
      style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', color: s.trackTitleColor, fontWeight: s.listWeight },
    }),
    h('span', { text: t.duration, style: { color: s.durationColor, flex: 'none' } }))));

    const columns = h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: `${s.columnGap}mm`, marginTop: `${s.headerGap}mm` } },
      column(tracks.slice(0, half)),
      s.showDivider ? h('div', { style: { width: '0.2mm', background: rgba(s.ruleColor, 0.35), flex: 'none' } }) : null,
      column(tracks.slice(half)));

    const foot = footer ? h('div', {
      style: { flex: 'none', marginTop: '2.5mm', paddingTop: '1.6mm', borderTop: `0.5mm solid ${s.ruleColor}`, ...small, color: s.infoColor, textAlign: s.align, textTransform: s.infoUppercase ? 'uppercase' : 'none' },
      text: footer,
    }) : null;

    return h('div', {
      style: {
        position: 'absolute', inset: 0, background: s.bgColor,
        backgroundImage: bgUrl ? `linear-gradient(${rgba(s.bgColor, s.bgOverlay)}, ${rgba(s.bgColor, s.bgOverlay)}), url("${bgUrl}")` : 'none',
        backgroundSize: 'cover', backgroundPosition: 'center',
      },
    }, h('div', {
      style: { position: 'absolute', inset: `${s.margin}mm`, display: 'flex', flexDirection: 'column' },
    }, header, columns, foot));
  },
};
