// «Índice» — la lista como el índice de una novela: capítulos en números
// romanos, puntos hasta la «página» (la duración), papel con grano.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, toRoman, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

// Grano de papel: ruido SVG como imagen de fondo.
const GRAIN = `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0"/></filter><rect width="100%" height="100%" filter="url(#n)"/></svg>')}")`;

export default {
  id: 'book-index',
  category: 'White girl music',
  name: 'Índice',
  description: 'Como el índice de una novela: capítulos, puntos y páginas.',

  defaults: {
    paperColor: '#F3ECDF',
    textColor: '#2C2723',
    dimColor: '#8A7F72',
    accentColor: '#7A2E2E',
    grain: true,
    grainOpacity: 0.18,
    useBgImage: false,
    imageHeight: 22,
    grayscale: true,
    titleFont: 'Cormorant Garamond', titleWeight: 500, titleSize: 20,
    listFont: 'Cormorant Garamond', listWeight: 500, listSize: 7.4,
    italicTitle: true,
    headingText: 'Índice',
    titleText: '{titulo}',
    infoText: '{artista}',
    footerText: 'fin',
    numberStyle: 'roman',
    chapterWord: '',
    leaderChar: '.',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: '',
    margin: 9,
    autoRowHeight: true,
    rowHeight: 2.8,
  },

  presets: [
    { name: 'Primera edición', style: {} },
    { name: 'Bosque en blanco y negro', style: { paperColor: '#E9E7E2', textColor: '#1E1E1E', dimColor: '#7B7B78', accentColor: '#1E1E1E', grainOpacity: 0.28, useBgImage: true, grayscale: true, imageHeight: 18, titleSize: 16, listSize: 6.2 } },
    { name: 'Tinta azul', style: { paperColor: '#F6F3EC', textColor: '#1D2B4F', dimColor: '#6D7898', accentColor: '#2F4B9A' } },
    { name: 'Libro de bolsillo', style: { paperColor: '#EFD9B4', textColor: '#3A2618', dimColor: '#8B6A4A', accentColor: '#A3401F', titleFont: 'Playfair Display', titleWeight: 700, italicTitle: false, listFont: 'Lora', listWeight: 400, listSize: 6.6 } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'paperColor', label: 'Papel', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'dimColor', label: 'Puntos y páginas', type: 'color' },
      { key: 'accentColor', label: 'Capítulos y adornos', type: 'color' },
      { key: 'grain', label: 'Grano de papel', type: 'toggle' },
      { key: 'grainOpacity', label: 'Intensidad del grano', type: 'opacity', when: (s) => s.grain },
    ] },
    { section: 'Imagen', items: [
      { key: 'useBgImage', label: 'Foto arriba (imagen de fondo de «Imágenes»)', type: 'toggle' },
      { key: 'grayscale', label: 'En blanco y negro', type: 'toggle', when: (s) => s.useBgImage },
      { key: 'imageHeight', label: 'Alto de la foto', type: 'number', min: 10, max: 60, step: 0.5, unit: 'mm', when: (s) => s.useBgImage },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { key: 'italicTitle', label: 'Título en cursiva', type: 'toggle' },
    ] },
    { section: 'Textos', items: [
      { key: 'headingText', label: 'Encabezado', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleText', label: 'Título', type: 'text' },
      { key: 'infoText', label: 'Autor (línea de datos)', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'numberStyle', label: 'Capítulos', type: 'select', options: [{ value: 'roman', label: 'I, II, III…' }, { value: 'arabic', label: '1, 2, 3…' }] },
      { key: 'chapterWord', label: 'Palabra delante (p. ej. «Capítulo»)', type: 'text', half: true },
      { key: 'leaderChar', label: 'Relleno', type: 'text', half: true, maxLength: 3 },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 4, max: 20, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const imgUrl = s.useBgImage ? asset(state.images.background) : null;
    const serif = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, fontVariantNumeric: 'oldstyle-nums proportional-nums' };
    const maxAuto = `${(s.listSize * 0.3528 * 1.9).toFixed(2)}mm`;
    const chap = (n) => {
      const v = s.numberStyle === 'roman' ? toRoman(n) : String(n);
      return s.chapterWord ? `${s.chapterWord} ${v}` : v;
    };
    const chapW = `${Math.max(...tracks.map((t) => chap(t.number).length), 1) * 0.62 + 0.6}em`;
    const leader = (s.leaderChar || '.').repeat(240);

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...tracks.map((t) => h('div', {
        style: {
          ...serif, display: 'flex', alignItems: 'baseline',
          flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`,
        },
      },
      h('span', { text: chap(t.number), style: { width: chapW, flex: 'none', color: t.numberColor || s.accentColor, fontSize: '0.82em', letterSpacing: '0.06em' } }),
      h('div', { style: { flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'baseline' } },
        h('span', {
          class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
          style: { flex: '0 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.3 },
        }),
        h('span', { text: leader, style: { flex: '1 1 0', minWidth: '2ch', overflow: 'hidden', whiteSpace: 'pre', direction: 'rtl', color: s.dimColor, margin: '0 1ch', letterSpacing: '0.18em' } })),
      h('span', { text: t.duration, style: { flex: 'none', color: s.dimColor } }))));

    const heading = fillTemplate(s.headingText, values);
    const info = fillTemplate(s.infoText, values);
    const footer = fillTemplate(s.footerText, values);
    const small = { ...serif, fontSize: `${s.listSize * 0.82}pt`, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center', flex: 'none' };

    const content = h('div', {
      style: { position: 'absolute', top: `${imgUrl ? s.imageHeight + 5 : s.margin}mm`, bottom: `${s.margin * 0.8}mm`, left: `${s.margin}mm`, right: `${s.margin}mm`, display: 'flex', flexDirection: 'column' },
    },
    heading ? h('div', { text: heading, style: { ...small, color: s.accentColor } }) : null,
    h('div', {
      text: fillTemplate(s.titleText, values),
      style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontStyle: s.italicTitle ? 'italic' : 'normal', fontSize: `${s.titleSize}pt`, color: s.textColor, textAlign: 'center', lineHeight: 1.05, margin: '1.5mm 0 1mm', flex: 'none', textWrap: 'balance' },
    }),
    info ? h('div', { text: info, style: small }) : null,
    h('div', { text: '— ❦ —', style: { ...serif, color: s.accentColor, textAlign: 'center', margin: '1.8mm 0 2.4mm', flex: 'none' } }),
    list,
    footer ? h('div', { text: footer, style: { ...serif, fontStyle: 'italic', textAlign: 'center', marginTop: '2mm', color: s.dimColor, flex: 'none' } }) : null);

    const layers = [];
    if (imgUrl) {
      layers.push(h('div', {
        style: {
          position: 'absolute', left: 0, right: 0, top: 0, height: `${s.imageHeight}mm`,
          backgroundImage: `url("${imgUrl}")`, backgroundSize: 'cover', backgroundPosition: 'center',
          filter: s.grayscale ? 'grayscale(1) contrast(1.05)' : 'none',
          WebkitMask: 'linear-gradient(#000 70%, transparent)', mask: 'linear-gradient(#000 70%, transparent)',
        },
      }));
    }
    layers.push(content);
    if (s.grain) {
      layers.push(h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', backgroundImage: GRAIN, backgroundSize: '42mm 42mm', opacity: s.grainOpacity, mixBlendMode: 'multiply' } }));
    }
    return h('div', { style: { position: 'absolute', inset: 0, background: s.paperColor, boxShadow: `inset 0 0 12mm ${rgba('#6B4E2E', 0.12)}` } }, ...layers);
  },
};
