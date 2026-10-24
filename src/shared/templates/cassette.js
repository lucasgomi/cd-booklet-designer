// «Casete» — una cinta dibujada con su etiqueta escrita a mano, bobinas y
// ventana, y la lista en Cara A / Cara B como en la carátula (J-card).
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'cassette',
  category: 'Objetos',
  name: 'Casete',
  description: 'Una cinta con etiqueta escrita a mano y la lista por caras.',

  defaults: {
    bgColor: '#F3EBDD',
    shellColor: '#2E3A4B',
    labelColor: '#FFF9EE',
    stripeColor1: '#E85D3F',
    stripeColor2: '#F2B33D',
    inkColor: '#1E3A8A',
    textColor: '#2A2A2A',
    dimColor: '#8C8478',
    accentColor: '#E85D3F',
    titleFont: 'Caveat', titleWeight: 700, titleSize: 17,
    listFont: 'Caveat', listWeight: 500, listSize: 9,
    smallFont: 'Space Mono', smallWeight: 700, smallSize: 5.6,
    labelTitle: '{titulo}',
    labelSub: '{artista}',
    sideA: 'A',
    sideB: 'B',
    infoText: 'C-90 · {pistas} canciones · {total}',
    useShortTitles: true,
    durationFormat: 'm:ss',
    showDurations: true,
    totalFormat: 'h-min-lower',
    margin: 6,
    tapeWidth: 84,
    autoRowHeight: true,
    rowHeight: 3.2,
  },

  presets: [
    { name: 'Mixtape', style: {} },
    { name: 'Transparente', style: { shellColor: '#B9C7D6', bgColor: '#EAF0F5', stripeColor1: '#7FA6D6', stripeColor2: '#B9D7F5', inkColor: '#22364F' } },
    { name: 'Rosa chicle', style: { bgColor: '#FFE6EF', shellColor: '#FF7AA8', stripeColor1: '#FFFFFF', stripeColor2: '#FFD23F', inkColor: '#B0124A', accentColor: '#E8336E' } },
    { name: 'Cromo', style: { bgColor: '#1A1A1D', shellColor: '#C9CDD3', labelColor: '#F4F4F4', stripeColor1: '#111111', stripeColor2: '#E10600', inkColor: '#111111', textColor: '#ECECEC', dimColor: '#8D8D93', accentColor: '#E10600' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'shellColor', label: 'Carcasa de la cinta', type: 'color' },
      { key: 'labelColor', label: 'Etiqueta', type: 'color' },
      { key: 'stripeColor1', label: 'Franja 1', type: 'color' },
      { key: 'stripeColor2', label: 'Franja 2', type: 'color' },
      { key: 'inkColor', label: 'Tinta de la etiqueta', type: 'color' },
      { key: 'textColor', label: 'Lista', type: 'color' },
      { key: 'dimColor', label: 'Duraciones', type: 'color' },
      { key: 'accentColor', label: 'Caras y números', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título de la etiqueta', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Detalles', family: 'smallFont', weight: 'smallWeight', size: 'smallSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'labelTitle', label: 'Título de la etiqueta', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'labelSub', label: 'Segunda línea de la etiqueta', type: 'text' },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'sideA', label: 'Cara A', type: 'text', half: true },
      { key: 'sideB', label: 'Cara B', type: 'text', half: true },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 15, step: 0.5, unit: 'mm' },
      { key: 'tapeWidth', label: 'Ancho de la cinta', type: 'number', min: 50, max: 110, step: 1, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const M = s.margin;
    const W = Math.min(120 - 2 * M, s.tapeWidth);
    const H = W * 0.56; // proporción de una cinta real (~100 × 63 mm)
    const X = (120 - W) / 2;
    const small = { fontFamily: fontStack(s.smallFont), fontWeight: s.smallWeight, fontSize: `${s.smallSize}pt`, letterSpacing: '0.12em', textTransform: 'uppercase' };
    const reel = (left) => h('div', {
      style: {
        position: 'absolute', left, top: '50%', width: `${H * 0.2}mm`, height: `${H * 0.2}mm`, transform: 'translate(-50%, -50%)', borderRadius: '50%',
        background: `radial-gradient(circle, ${rgba('#000000', 0)} 0 ${H * 0.035}mm, #FFFFFF ${H * 0.036}mm ${H * 0.06}mm, transparent ${H * 0.061}mm),
          repeating-conic-gradient(#FFFFFF 0 12deg, ${rgba('#FFFFFF', 0)} 12deg 60deg), radial-gradient(circle, #FFFFFF 0 ${H * 0.1}mm, transparent 0)`,
        border: `0.5mm solid ${rgba('#FFFFFF', 0.95)}`, boxSizing: 'border-box',
      },
    });

    const label = h('div', {
      style: {
        position: 'absolute', left: '6%', right: '6%', top: '8%', height: '60%', background: s.labelColor, borderRadius: '1.4mm',
        overflow: 'hidden', boxShadow: `inset 0 0 0 0.25mm ${rgba('#000000', 0.08)}`,
      },
    },
    // Franjas de color de la etiqueta.
    h('div', { style: { position: 'absolute', left: 0, right: 0, bottom: '30%', height: '7%', background: s.stripeColor1 } }),
    h('div', { style: { position: 'absolute', left: 0, right: 0, bottom: '23%', height: '7%', background: s.stripeColor2 } }),
    // Líneas para escribir.
    h('div', { style: { position: 'absolute', left: '11%', right: '4%', top: '12%', height: '32%', background: `repeating-linear-gradient(to bottom, transparent 0 ${H * 0.098}mm, ${rgba(s.inkColor, 0.18)} ${H * 0.098}mm ${H * 0.104}mm)` } }),
    h('div', { text: fillTemplate(s.sideA, values), style: { ...small, position: 'absolute', left: '3%', top: '9%', fontSize: `${s.smallSize * 2.2}pt`, color: s.stripeColor1, letterSpacing: 0 } }),
    h('div', {
      style: { position: 'absolute', left: '12%', right: '5%', top: '6%', display: 'flex', flexDirection: 'column', transform: 'rotate(-1.5deg)', transformOrigin: 'left' },
    },
    h('div', { text: fillTemplate(s.labelTitle, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.inkColor, lineHeight: 1, whiteSpace: 'nowrap', overflow: 'hidden' } }),
    h('div', { text: fillTemplate(s.labelSub, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize * 0.55}pt`, color: s.inkColor, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden' } })),
    // Ventana con las bobinas.
    h('div', {
      style: { position: 'absolute', left: '22%', right: '22%', bottom: '4%', height: '22%', background: rgba('#1B1B1B', 0.85), borderRadius: `${H * 0.11}mm`, overflow: 'hidden' },
    },
    h('div', { style: { position: 'absolute', left: '18%', right: '18%', top: '30%', bottom: '30%', background: rgba('#5B3A21', 0.9), borderRadius: '0.6mm' } }),
    reel('16%'), reel('84%')));

    const shell = h('div', {
      style: {
        position: 'absolute', left: `${X}mm`, top: `${M}mm`, width: `${W}mm`, height: `${H}mm`, background: s.shellColor, borderRadius: '3mm',
        boxShadow: `0 1.2mm 3mm ${rgba('#000000', 0.3)}, inset 0 0 0 0.4mm ${rgba('#FFFFFF', 0.12)}`,
      },
    },
    label,
    // Pieza trapezoidal inferior con agujeros.
    h('div', {
      style: {
        position: 'absolute', left: '20%', right: '20%', bottom: 0, height: '22%', background: rgba('#000000', 0.18),
        clipPath: 'polygon(8% 0, 92% 0, 100% 100%, 0 100%)',
      },
    }),
    ...[0.08, 0.92].map((x) => h('div', { style: { position: 'absolute', left: `${x * 100}%`, top: `${H * 0.06}mm`, width: '1.8mm', height: '1.8mm', marginLeft: '-0.9mm', borderRadius: '50%', background: rgba('#000000', 0.35) } })),
    ...[0.33, 0.67].map((x) => h('div', { style: { position: 'absolute', left: `${x * 100}%`, bottom: '6%', width: '1.6mm', height: '1.6mm', marginLeft: '-0.8mm', borderRadius: '50%', background: rgba('#000000', 0.45) } })));

    const half = Math.ceil(tracks.length / 2);
    const maxAuto = `${(s.listSize * 0.3528 * 1.6).toFixed(2)}mm`;
    const column = (title, list) => h('div', { style: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column' } },
      h('div', { text: title, style: { ...small, color: s.accentColor, marginBottom: '0.6mm', flex: 'none' } }),
      h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
        ...list.map((t) => h('div', {
          style: {
            display: 'flex', alignItems: 'baseline', gap: '1.4mm', fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor,
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528 * 0.95).toFixed(2)}mm`,
            borderBottom: `0.15mm solid ${rgba(s.textColor, 0.15)}`,
          },
        },
        h('span', { text: `${t.number}.`, style: { color: t.numberColor || s.accentColor, flex: 'none', minWidth: '1.4em' } }),
        h('span', { class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle, style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.15 } }),
        s.showDurations ? h('span', { text: t.duration, style: { ...small, letterSpacing: 0, color: s.dimColor, flex: 'none' } }) : null))));

    const info = fillTemplate(s.infoText, values);
    const lists = h('div', {
      style: { position: 'absolute', left: `${M}mm`, right: `${M}mm`, top: `${M + H + 3}mm`, bottom: `${M}mm`, display: 'flex', flexDirection: 'column' },
    },
    h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '5mm' } },
      column(`${fillTemplate(s.sideA, values)} ▸`, tracks.slice(0, half)), column(`${fillTemplate(s.sideB, values)} ▸`, tracks.slice(half))),
    info ? h('div', { text: info, style: { ...small, color: s.dimColor, textAlign: 'right', marginTop: '1.4mm', flex: 'none' } }) : null);

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } }, shell, lists);
  },
};
