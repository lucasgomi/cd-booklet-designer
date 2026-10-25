// «Periódico» — portada de diario: cabecera, fecha entre filetes, titular,
// entradilla, foto con pie y la lista en tres columnas.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns } from './common.js';

export default {
  id: 'newspaper',
  category: 'Estéticas',
  name: 'Periódico',
  description: 'Portada de diario: cabecera, titular, foto y columnas.',

  defaults: {
    paperColor: '#F4F1EA',
    inkColor: '#151515',
    accentColor: '#151515',
    useBgImage: true,
    grayscale: true,
    mastheadFont: 'Playfair Display', mastheadWeight: 900, mastheadSize: 22,
    headlineFont: 'Playfair Display', headlineWeight: 700, headlineSize: 11,
    listFont: 'Lora', listWeight: 400, listSize: 5.3,
    mastheadText: 'El Diario del Disco',
    dateText: '[{fecha} · ]Edición nº {disco} · {pistas} canciones',
    headlineText: '«{titulo}»: {artista} lo vuelve a hacer',
    standfirst: 'Una selección de {pistas} temas y {total} de música, recopilados para escuchar de principio a fin.',
    caption: '{artista}, en una imagen de archivo.',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 2.6,
  },

  presets: [
    { name: 'Clásico', style: {} },
    { name: 'Salmón financiero', style: { paperColor: '#F7DCC6', inkColor: '#1B1B1B', accentColor: '#9A2B1E' } },
    { name: 'Sepia', style: { paperColor: '#E8D9B8', inkColor: '#3A2A18', accentColor: '#3A2A18' } },
    { name: 'Tabloide', style: { paperColor: '#FFFFFF', accentColor: '#E10600', mastheadFont: 'Anton', mastheadWeight: 400, headlineFont: 'Archivo Black', headlineWeight: 400, grayscale: false } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'paperColor', label: 'Papel', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'accentColor', label: 'Cabecera y números', type: 'color' },
      { key: 'useBgImage', label: 'Foto = imagen de fondo («Imágenes»)', type: 'toggle' },
      { key: 'grayscale', label: 'Foto en blanco y negro', type: 'toggle', when: (s) => s.useBgImage },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Cabecera', family: 'mastheadFont', weight: 'mastheadWeight', size: 'mastheadSize' },
      { type: 'font', label: 'Titular', family: 'headlineFont', weight: 'headlineWeight', size: 'headlineSize' },
      { type: 'font', label: 'Columnas', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'mastheadText', label: 'Nombre del periódico', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'dateText', label: 'Línea de fecha', type: 'text' },
      { key: 'headlineText', label: 'Titular', type: 'text' },
      { key: 'standfirst', label: 'Entradilla', type: 'textarea' },
      { key: 'caption', label: 'Pie de foto', type: 'text', when: (s) => s.useBgImage },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const img = s.useBgImage ? asset(state.images.background) : null;
    const serif = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor };
    const rule = (w = 0.2) => h('div', { style: { height: `${w}mm`, background: s.inkColor, flex: 'none' } });

    const masthead = h('div', { text: fillTemplate(s.mastheadText, values), style: { fontFamily: fontStack(s.mastheadFont), fontWeight: s.mastheadWeight, fontSize: `${s.mastheadSize}pt`, color: s.accentColor, textAlign: 'center', lineHeight: 1, letterSpacing: '-0.01em', flex: 'none' } });
    const date = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.5mm', margin: '1.2mm 0 1.8mm', flex: 'none' } },
      rule(0.5), h('div', { text: fillTemplate(s.dateText, values).toUpperCase(), style: { ...serif, fontSize: `${s.listSize * 0.85}pt`, textAlign: 'center', letterSpacing: '0.12em' } }), rule(0.2));
    const headline = h('div', { text: fillTemplate(s.headlineText, values), style: { fontFamily: fontStack(s.headlineFont), fontWeight: s.headlineWeight, fontSize: `${s.headlineSize}pt`, color: s.inkColor, lineHeight: 1.05, textWrap: 'balance' } });
    const standfirst = h('div', { text: fillTemplate(s.standfirst, values), style: { ...serif, fontStyle: 'italic', fontSize: `${s.listSize * 1.05}pt`, lineHeight: 1.3, marginTop: '1.2mm' } });

    const lead = h('div', { style: { display: 'flex', gap: '3mm', flex: 'none', marginBottom: '2mm' } },
      h('div', { style: { flex: '1 1 0' } }, headline, standfirst),
      img ? h('div', { style: { width: '40mm', flex: 'none' } },
        h('div', { style: { height: '26mm', background: `url("${img}") center / cover`, filter: s.grayscale ? 'grayscale(1) contrast(1.1)' : 'none' } }),
        h('div', { text: fillTemplate(s.caption, values), style: { ...serif, fontSize: `${s.listSize * 0.8}pt`, fontStyle: 'italic', marginTop: '0.6mm', opacity: 0.8 } })) : null);

    const cols = splitColumns(tracks, 3).map((part, ci) => fitList(part.map((t) => h('div', {
      style: { ...serif, ...rowSizing(s, { minFactor: 1.05, maxFactor: 3 }), display: 'flex', alignItems: 'baseline', gap: '1mm' },
    },
    h('span', { text: `${t.number}.`, style: { fontWeight: 700, color: t.numberColor || s.accentColor, flex: 'none', minWidth: '1.4em' } }),
    fitTitle(t, { lineHeight: 1.25 }),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.7 } }))), { borderLeft: ci ? `0.15mm solid ${rgba(s.inkColor, 0.6)}` : 'none', paddingLeft: ci ? '1.6mm' : 0 }));

    return h('div', { style: { position: 'absolute', inset: 0, background: s.paperColor } },
      h('div', { style: { position: 'absolute', inset: '6mm', display: 'flex', flexDirection: 'column' } },
        masthead, date, lead, rule(0.3),
        h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '1.6mm', marginTop: '1.6mm' } }, ...cols)));
  },
};
