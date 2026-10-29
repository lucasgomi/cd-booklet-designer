// «Coquette» — tarjeta rosa con borde festoneado, perlas, un lazo arriba,
// título caligráfico y la lista centrada en cursiva.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, toRoman, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL, COLUMNS_CONTROL, listColumns, columnize, deco } from './common.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Lazo dibujado en SVG (dos lazadas, nudo y dos cintas). */
function bow(color, shade, widthMm) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 120 80');
  el.style.cssText = `width:${widthMm}mm;height:${widthMm * 0.66}mm;display:block;overflow:visible`;
  const add = (d, fill, extra = {}) => {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', d);
    p.setAttribute('fill', fill);
    for (const [k, v] of Object.entries(extra)) p.setAttribute(k, v);
    el.appendChild(p);
  };
  // Cintas
  add('M54 34 C48 50 40 64 30 78 L42 76 L46 84 C54 68 58 52 60 38 Z', shade);
  add('M66 34 C72 50 80 64 90 78 L78 76 L74 84 C66 68 62 52 60 38 Z', shade);
  // Lazadas
  add('M58 30 C40 6 10 4 8 24 C6 42 34 44 58 34 Z', color);
  add('M62 30 C80 6 110 4 112 24 C114 42 86 44 62 34 Z', color);
  // Pliegues
  add('M56 31 C42 22 26 18 18 22', 'none', { stroke: shade, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
  add('M64 31 C78 22 94 18 102 22', 'none', { stroke: shade, 'stroke-width': 2.2, 'stroke-linecap': 'round' });
  // Nudo
  add('M52 26 Q60 20 68 26 Q71 32 68 38 Q60 44 52 38 Q49 32 52 26 Z', shade);
  return el;
}

/** Las letras caligráficas en mayúsculas no se leen: «HITS» -> «Hits». */
function titleCase(text, mode) {
  if (mode === 'lower') return text.toLowerCase();
  if (mode !== 'capitalize') return text;
  return text.toLowerCase().replace(/(^|[\s(«"'-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
}

/** Cuatro hileras de perlas siguiendo el borde interior de la tarjeta. */
function pearls(color) {
  const pearl = `radial-gradient(circle at 40% 40%, #FFFFFF 0 0.15mm, ${rgba(color, 0.6)} 0.42mm, transparent 0.48mm)`;
  const strip = (pos) => h('div', { style: { position: 'absolute', ...pos, background: `${pearl} 0 0 / 1.5mm 1.5mm`, pointerEvents: 'none' } });
  return [
    strip({ left: '2.6mm', right: '2.6mm', top: '1.2mm', height: '1.5mm' }),
    strip({ left: '2.6mm', right: '2.6mm', bottom: '1.2mm', height: '1.5mm' }),
    strip({ top: '2.7mm', bottom: '2.7mm', left: '1.2mm', width: '1.5mm' }),
    strip({ top: '2.7mm', bottom: '2.7mm', right: '1.2mm', width: '1.5mm' }),
  ];
}

export default {
  id: 'coquette',
  category: 'White girl music',
  name: 'Coquette',
  description: 'Tarjeta rosa con lazo, perlas y letra caligráfica.',

  defaults: {
    bgColor: '#F6CCD8',
    cardColor: '#FFF8F5',
    textColor: '#6B3A4B',
    titleColor: '#C2577A',
    accentColor: '#E58FAB',
    bowColor: '#F08DAE',
    bowShade: '#D9668D',
    showBow: true,
    showPearls: true,
    scallops: true,
    titleFont: 'Great Vibes', titleWeight: 400, titleSize: 30,
    infoFont: 'Cormorant Garamond', infoWeight: 600, infoSize: 6.6,
    listFont: 'Cormorant Garamond', listWeight: 500, listSize: 7,
    titleCase: 'capitalize',
    italicList: true,
    titleText: '{titulo}',
    infoText: '{artista}[ · nº {disco}][ · {fecha}]',
    footerText: '♡ {pistas} canciones · {total} ♡',
    numberStyle: 'roman',
    separator: '♡',
    showDurations: false,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    cardInset: 6,
    autoRowHeight: true,
    rowHeight: 2.8,
    columns: 'auto',
  },

  decorations: [
    { key: 'showBow', label: 'Lazo' },
    { key: 'showPearls', label: 'Perlas del borde' },
    { key: 'scallops', label: 'Borde festoneado' },
    { key: 'decoHearts', label: 'Corazones ♡ ♡ ♡ bajo el título' },
  ],

  presets: [
    { name: 'Rosa ballet', style: {} },
    { name: 'Lazo negro', style: { bgColor: '#F4EDE8', cardColor: '#FFFFFF', textColor: '#2B2B2B', titleColor: '#111111', accentColor: '#9A9A9A', bowColor: '#1E1E1E', bowShade: '#000000' } },
    { name: 'Azul cielo', style: { bgColor: '#CFE3F5', cardColor: '#FBFDFF', textColor: '#3D5878', titleColor: '#5D86B5', accentColor: '#9DBFE3', bowColor: '#A9CBEF', bowShade: '#7FA9D6' } },
    { name: 'Cereza', style: { bgColor: '#8E1B2E', cardColor: '#FFF4F0', textColor: '#6E1424', titleColor: '#B0213B', accentColor: '#D9506A', bowColor: '#C42641', bowShade: '#8E1B2E' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'cardColor', label: 'Tarjeta', type: 'color' },
      { key: 'titleColor', label: 'Título', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'accentColor', label: 'Detalles (números, ♡, perlas)', type: 'color' },
      { key: 'bowColor', label: 'Lazo', type: 'color', when: (s) => s.showBow },
      { key: 'bowShade', label: 'Sombra del lazo', type: 'color', when: (s) => s.showBow },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Datos y pie', family: 'infoFont', weight: 'infoWeight', size: 'infoSize' },
      { key: 'italicList', label: 'Lista en cursiva', type: 'toggle' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleCase', label: 'Mayúsculas del título', type: 'select', options: [
        { value: 'capitalize', label: 'Primera letra (queda mejor en caligrafía)' }, { value: 'as-is', label: 'Tal cual' }, { value: 'lower', label: 'minúsculas' }] },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'numberStyle', label: 'Números', type: 'select', options: [
        { value: 'roman', label: 'Romanos (i, ii, iii…)' }, { value: 'arabic', label: '1, 2, 3…' }, { value: 'heart', label: '♡' }, { value: 'none', label: 'Sin números' }] },
      { key: 'separator', label: 'Adorno', type: 'text', half: true, maxLength: 3 },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }], when: (s) => s.showDurations },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Adornos y espaciado', items: [
      { key: 'cardInset', label: 'Margen de la tarjeta', type: 'number', min: 2, max: 20, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
      COLUMNS_CONTROL,
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const small = { fontFamily: fontStack(s.infoFont), fontWeight: s.infoWeight, fontSize: `${s.infoSize}pt`, color: s.textColor, letterSpacing: '0.22em', textTransform: 'uppercase', textAlign: 'center', flex: 'none' };
    const maxAuto = `${(s.listSize * 0.3528 * 1.9).toFixed(2)}mm`;
    const num = (n) => (s.numberStyle === 'roman' ? `${toRoman(n, true)}.` : s.numberStyle === 'arabic' ? `${n}.` : s.numberStyle === 'heart' ? '♡' : '');

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '1.4mm 0' } },
      ...tracks.map((t) => h('div', {
        style: {
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.4mm',
          flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528).toFixed(2)}mm`,
          fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, fontStyle: s.italicList ? 'italic' : 'normal', color: s.textColor,
        },
      },
      s.numberStyle !== 'none' ? h('span', { text: num(t.number), style: { color: t.numberColor || s.accentColor, flex: 'none', fontStyle: 'normal', fontSize: '0.85em' } }) : null,
      h('span', {
        class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
        style: { minWidth: 0, maxWidth: '100%', overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.3, flex: '0 1 auto' },
      }),
      s.showDurations ? h('span', { text: t.duration, style: { color: s.accentColor, flex: 'none', fontSize: '0.8em' } }) : null)));

    const info = fillTemplate(s.infoText, values);
    const footer = fillTemplate(s.footerText, values);
    const ornament = (s.separator || '♡');
    const content = h('div', {
      style: { position: 'absolute', inset: `${s.showBow !== false ? 11.5 : 5}mm 6mm 5mm`, display: 'flex', flexDirection: 'column' },
    },
    h('div', {
      text: titleCase(fillTemplate(s.titleText, values), s.titleCase),
      style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.titleColor, lineHeight: 0.95, textAlign: 'center', flex: 'none', textWrap: 'balance', textTransform: 'none' },
    }),
    info ? h('div', { text: info, style: { ...small, marginTop: '0.6mm' } }) : null,
    deco(s, 'decoHearts', () => h('div', { text: `${ornament}  ${ornament}  ${ornament}`, style: { ...small, letterSpacing: '0.1em', color: s.accentColor, marginTop: '0.8mm' } })),
    columnize(list, listColumns(s)),
    footer ? h('div', { text: footer, style: { ...small, letterSpacing: '0.12em', textTransform: 'none', fontStyle: 'italic', fontSize: `${s.infoSize * 1.1}pt` } }) : null);

    // Tarjeta con borde festoneado (máscara de círculos) y perlas.
    const r = 2; // radio de las ondas en mm
    const scallopMask = `radial-gradient(circle at ${r}mm ${r}mm, #000 ${r}mm, transparent ${r + 0.05}mm) -${r}mm -${r}mm / ${2 * r}mm ${2 * r}mm, linear-gradient(#000, #000) ${r}mm ${r}mm / calc(100% - ${2 * r}mm) calc(100% - ${2 * r}mm) no-repeat`;
    const card = h('div', {
      style: {
        position: 'absolute', inset: `${s.cardInset}mm`, background: s.cardColor,
        ...(s.scallops ? { WebkitMask: scallopMask, mask: scallopMask } : { borderRadius: '3mm' }),
      },
    },
    h('div', { style: { position: 'absolute', inset: '3.2mm', border: `0.25mm solid ${rgba(s.accentColor, 0.7)}`, borderRadius: '2mm' } }),
    ...(s.showPearls === false ? [] : pearls(s.accentColor).map((p) => deco(s, 'showPearls', p))),
    content);

    const root = h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor } }, card);
    if (s.showBow !== false) {
      root.appendChild(deco(s, 'showBow', h('div', { style: { position: 'absolute', left: '50%', top: `${s.cardInset - 3.5}mm`, transform: 'translateX(-50%)', filter: `drop-shadow(0 0.4mm 0.6mm ${rgba('#000000', 0.18)})` } },
        bow(s.bowColor, s.bowShade, 22))));
    }
    return root;
  },
};
