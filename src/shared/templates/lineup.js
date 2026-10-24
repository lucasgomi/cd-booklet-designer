// Plantilla 5 — «Cartel».
// Como el cartel de un festival: degradado de fondo, título enorme y las
// canciones seguidas en párrafo centrado, separadas por un símbolo.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'lineup',
  name: 'Cartel',
  description: 'Canciones en párrafo, como el cartel de un festival.',

  defaults: {
    bgColor1: '#FF6B3D',
    bgColor2: '#7B2FF7',
    gradientAngle: 160,
    useBgImage: false,
    bgOverlay: 0.55,
    titleColor: '#FFF8EC',
    infoColor: '#FFE3A3',
    trackTitleColor: '#FFF8EC',
    numberColor: '#FFE3A3',
    separatorColor: '#FFE3A3',
    titleFont: 'Archivo Black', titleWeight: 400, titleSize: 22,
    infoFont: 'Space Mono', infoWeight: 700, infoSize: 6.5,
    listFont: 'Oswald', listWeight: 500, listSize: 9.5,
    titleText: '{artista}',
    infoText: '{titulo}[ · Vol. {disco}][ · {fecha}]',
    footerText: '{pistas} canciones · {total}',
    uppercase: true,
    showNumbers: true,
    showDurations: false,
    separator: '★',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: '',
    margin: 8,
    lineHeight: 1.45,
    verticalAlign: 'center',
  },

  presets: [
    { name: 'Atardecer', style: {} },
    { name: 'Océano', style: { bgColor1: '#00C2A8', bgColor2: '#0A2A6B', titleColor: '#FFFFFF', infoColor: '#B6FFF2', trackTitleColor: '#FFFFFF', numberColor: '#B6FFF2', separatorColor: '#B6FFF2', separator: '●' } },
    { name: 'Blanco y negro', style: { bgColor1: '#F2F0EB', bgColor2: '#F2F0EB', titleColor: '#111111', infoColor: '#111111', trackTitleColor: '#111111', numberColor: '#E2231A', separatorColor: '#E2231A', separator: '/', titleFont: 'Bebas Neue', titleSize: 30, listFont: 'Bebas Neue', listSize: 11 } },
    { name: 'Ácido', style: { bgColor1: '#D7FF3D', bgColor2: '#2BFF88', titleColor: '#101010', infoColor: '#101010', trackTitleColor: '#101010', numberColor: '#6A00FF', separatorColor: '#6A00FF', separator: '✦' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor1', label: 'Degradado: color 1', type: 'color' },
      { key: 'bgColor2', label: 'Degradado: color 2', type: 'color' },
      { key: 'gradientAngle', label: 'Ángulo del degradado', type: 'number', min: 0, max: 360, step: 5, unit: '°' },
      { key: 'useBgImage', label: 'Usar la imagen de fondo (pestaña «Imágenes»)', type: 'toggle' },
      { key: 'bgOverlay', label: 'Degradado sobre la imagen', type: 'opacity', when: (s) => s.useBgImage },
      { key: 'titleColor', label: 'Título', type: 'color' },
      { key: 'infoColor', label: 'Línea de datos y pie', type: 'color' },
      { key: 'trackTitleColor', label: 'Canciones', type: 'color' },
      { key: 'numberColor', label: 'Números', type: 'color', when: (s) => s.showNumbers },
      { key: 'separatorColor', label: 'Separador', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Canciones', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Datos y pie', family: 'infoFont', weight: 'infoWeight', size: 'infoSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'separator', label: 'Separador entre canciones', type: 'text', half: true, maxLength: 3 },
      { key: 'uppercase', label: 'Canciones en mayúsculas', type: 'toggle' },
      { key: 'showNumbers', label: 'Mostrar números', type: 'toggle' },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }], when: (s) => s.showDurations },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 20, step: 0.5, unit: 'mm' },
      { key: 'lineHeight', label: 'Interlineado', type: 'number', min: 1, max: 2.5, step: 0.05 },
      { key: 'verticalAlign', label: 'Posición vertical de la lista', type: 'select', options: [
        { value: 'flex-start', label: 'Arriba' }, { value: 'center', label: 'Centro' }, { value: 'flex-end', label: 'Abajo' }] },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const bgUrl = s.useBgImage ? asset(state.images.background) : null;
    const tx = (str) => (s.uppercase ? (str || '').toUpperCase() : str || '');
    const small = { fontFamily: fontStack(s.infoFont), fontWeight: s.infoWeight, fontSize: `${s.infoSize}pt`, color: s.infoColor, letterSpacing: '0.12em', textTransform: 'uppercase', textAlign: 'center', flex: 'none' };
    const gradient = (a) => `linear-gradient(${s.gradientAngle}deg, ${rgba(s.bgColor1, a)}, ${rgba(s.bgColor2, a)})`;

    const items = [];
    tracks.forEach((t, i) => {
      const title = h('span', {
        class: 'fit', text: tx(t.title), 'data-track-index': t.index, 'data-full-title': t.fullTitle,
        style: { display: 'inline-block', maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre', verticalAlign: 'bottom' },
      });
      title._fitTransform = tx;
      items.push(h('span', { style: { whiteSpace: 'nowrap' } },
        s.showNumbers ? h('span', { text: `${t.number} `, style: { color: t.numberColor || s.numberColor, fontSize: '0.62em', verticalAlign: '0.35em' } }) : null,
        title,
        s.showDurations && t.duration ? h('span', { text: ` ${t.duration}`, style: { color: s.numberColor, fontSize: '0.62em' } }) : null));
      if (i < tracks.length - 1) items.push(h('span', { text: ` ${s.separator} `, style: { color: s.separatorColor, fontSize: '0.7em' } }));
    });

    const info = fillTemplate(s.infoText, values);
    const footer = fillTemplate(s.footerText, values);
    const list = h('div', {
      class: 'fit-v',
      style: { flex: '1 1 auto', minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: s.verticalAlign, margin: '3mm 0' },
    }, h('div', {
      style: {
        textAlign: 'center', fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`,
        lineHeight: s.lineHeight, color: s.trackTitleColor, textWrap: 'pretty',
      },
    }, ...items));

    return h('div', {
      style: {
        position: 'absolute', inset: 0,
        background: bgUrl ? `${gradient(s.bgOverlay)}, url("${bgUrl}") center / cover` : gradient(1),
      },
    }, h('div', {
      style: { position: 'absolute', inset: `${s.margin}mm`, display: 'flex', flexDirection: 'column' },
    },
    info ? h('div', { text: info, style: { ...small, marginBottom: '1.5mm' } }) : null,
    h('div', {
      text: fillTemplate(s.titleText, values),
      style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.titleColor, lineHeight: 0.95, textAlign: 'center', textTransform: 'uppercase', textWrap: 'balance', flex: 'none' },
    }),
    list,
    footer ? h('div', { text: footer, style: small }) : null));
  },
};
