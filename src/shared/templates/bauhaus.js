// «Bauhaus» — composición geométrica en colores primarios, sans en
// minúsculas y viñetas de círculo, cuadrado y triángulo.
import { h, fontStack } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';

export default {
  id: 'bauhaus',
  category: 'Estéticas',
  name: 'Bauhaus',
  description: 'Círculos, triángulos y colores primarios; sans en minúsculas.',

  defaults: {
    bgColor: '#F1E9DA',
    inkColor: '#111111',
    red: '#D7261E',
    blue: '#1E4FA3',
    yellow: '#F2B705',
    titleFont: 'Montserrat', titleWeight: 800, titleSize: 22,
    listFont: 'Montserrat', listWeight: 500, listSize: 6.2,
    titleText: '{titulo}',
    subText: '{artista}[ · {disco}][ · {fecha}]',
    lowercase: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: '',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoCircle', label: 'Círculo rojo' },
    { key: 'decoTriangle', label: 'Triángulo azul' },
    { key: 'decoQuarter', label: 'Cuarto de círculo amarillo' },
    { key: 'decoBarH', label: 'Barra horizontal' },
    { key: 'decoBarV', label: 'Barra vertical' },
  ],

  presets: [
    { name: 'Clásico', style: {} },
    { name: 'Pastel', style: { bgColor: '#FBF6EF', red: '#F28B82', blue: '#8AB4F8', yellow: '#FDD663', inkColor: '#2B2B2B' } },
    { name: 'Monocromo', style: { bgColor: '#EDEDED', red: '#111111', blue: '#7A7A7A', yellow: '#BDBDBD' } },
    { name: 'Noche', style: { bgColor: '#141414', inkColor: '#F1E9DA', red: '#E2452F', blue: '#3D7BE0', yellow: '#F2C230' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'red', label: 'Rojo', type: 'color' },
      { key: 'blue', label: 'Azul', type: 'color' },
      { key: 'yellow', label: 'Amarillo', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'subText', label: 'Subtítulo', type: 'text' },
      { key: 'lowercase', label: 'Todo en minúsculas', type: 'toggle' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const tx = (x) => (s.lowercase ? String(x).toLowerCase() : x);
    const shapes = [
      deco(s, 'decoCircle', () => h('div', { style: { position: 'absolute', left: '62mm', top: '-10mm', width: '52mm', height: '52mm', borderRadius: '50%', background: s.red } })),
      deco(s, 'decoTriangle', () => h('div', { style: { position: 'absolute', left: '86mm', top: '12mm', width: '28mm', height: '28mm', background: s.blue, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)' } })),
      deco(s, 'decoQuarter', () => h('div', { style: { position: 'absolute', left: '60mm', top: '17mm', width: '22mm', height: '22mm', background: s.yellow, borderRadius: '0 0 0 24mm' } })),
      deco(s, 'decoBarH', () => h('div', { style: { position: 'absolute', left: '6mm', top: '41mm', width: '78mm', height: '2.2mm', background: s.inkColor } })),
      deco(s, 'decoBarV', () => h('div', { style: { position: 'absolute', left: '104mm', top: '4mm', width: '1.5mm', height: '36mm', background: s.inkColor } })),
    ].filter(Boolean);
    const marks = [
      (c) => h('span', { style: { width: '2mm', height: '2mm', borderRadius: '50%', background: c, flex: 'none' } }),
      (c) => h('span', { style: { width: '2mm', height: '2mm', background: c, flex: 'none' } }),
      (c) => h('span', { style: { width: '2.2mm', height: '2mm', background: c, clipPath: 'polygon(50% 0, 100% 100%, 0 100%)', flex: 'none' } }),
    ];
    const palette = [s.red, s.blue, s.yellow];
    const font = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor, fontVariantNumeric: 'tabular-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...font, ...rowSizing(s, { minFactor: 1.15, maxFactor: 2.1 }), display: 'flex', alignItems: 'center', gap: '1.6mm' },
    },
    marks[(t.number - 1) % 3](t.numberColor || palette[(t.number - 1) % 3]),
    h('span', { text: String(t.number), style: { fontWeight: 800, flex: 'none', minWidth: '1.4em' } }),
    fitTitle(t, {}, tx),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.7 } })))));

    const sub = tx(fillTemplate(s.subText, values));
    const content = h('div', { style: { position: 'absolute', inset: '7mm 7mm 7mm', display: 'flex', flexDirection: 'column' } },
      h('div', { style: { height: '30mm', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 'none', maxWidth: '58mm' } },
        h('div', { text: tx(fillTemplate(s.titleText, values)), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.inkColor, lineHeight: 0.9, letterSpacing: '-0.03em', textWrap: 'balance' } }),
        sub ? h('div', { text: sub, style: { ...font, marginTop: '1.5mm' } }) : null),
      h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '5mm', marginTop: '10mm' } }, ...cols));

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } }, ...shapes, content);
  },
};
