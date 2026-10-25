// «Art déco» — negro y oro, marco con esquinas escalonadas, abanico de rayos,
// mayúsculas espaciadas y rombos.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, toRoman, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns } from './common.js';

export default {
  id: 'artdeco',
  category: 'Estéticas',
  name: 'Art déco',
  description: 'Negro y oro, abanico de rayos y marco escalonado de los años 20.',

  defaults: {
    bgColor: '#0E0E0F',
    goldColor: '#D4AF6A',
    textColor: '#F1E6CF',
    titleFont: 'Poiret One', titleWeight: 400, titleSize: 18,
    listFont: 'Cormorant Garamond', listWeight: 600, listSize: 7.2,
    titleText: '{artista}',
    subText: '{titulo}[ · nº {disco}]',
    footerText: '{pistas} piezas · {total}',
    romanNumbers: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  presets: [
    { name: 'Gatsby', style: {} },
    { name: 'Esmeralda', style: { bgColor: '#0B2A22', goldColor: '#D9B86C', textColor: '#EFE7D2' } },
    { name: 'Marfil', style: { bgColor: '#F3ECDD', goldColor: '#A07B3A', textColor: '#1E1A14' } },
    { name: 'Burdeos', style: { bgColor: '#3A0D16', goldColor: '#E2B96F', textColor: '#F6E7D0' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'goldColor', label: 'Oro', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'subText', label: 'Subtítulo', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'romanNumbers', label: 'Números romanos', type: 'toggle' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const gold = s.goldColor;
    const caps = { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, color: gold, letterSpacing: '0.3em', textTransform: 'uppercase', textAlign: 'center' };

    // Marco con esquinas escalonadas: dos rectángulos y cuadraditos en las esquinas.
    const frame = [
      h('div', { style: { position: 'absolute', inset: '4mm', border: `0.35mm solid ${gold}` } }),
      h('div', { style: { position: 'absolute', inset: '5.5mm', border: `0.15mm solid ${rgba(gold, 0.7)}` } }),
      ...[['4mm', '4mm'], ['4mm', 'auto'], ['auto', '4mm'], ['auto', 'auto']].map(([top, left]) => h('div', {
        style: {
          position: 'absolute', width: '6mm', height: '6mm', background: s.bgColor, border: `0.35mm solid ${gold}`, boxSizing: 'border-box',
          top: top === 'auto' ? 'auto' : top, bottom: top === 'auto' ? '4mm' : 'auto', left: left === 'auto' ? 'auto' : left, right: left === 'auto' ? '4mm' : 'auto',
          transform: `translate(${left === 'auto' ? '' : '-'}2mm, ${top === 'auto' ? '' : '-'}2mm)`,
        },
      })),
    ];
    // Abanico de rayos.
    const fan = h('div', {
      style: {
        position: 'absolute', left: '50%', top: '8mm', width: '44mm', height: '22mm', transform: 'translateX(-50%)', borderRadius: '22mm 22mm 0 0', overflow: 'hidden',
        background: `repeating-conic-gradient(from -90deg at 50% 100%, ${rgba(gold, 0.55)} 0 2deg, transparent 2deg 9deg)`,
        WebkitMask: 'radial-gradient(circle at 50% 100%, transparent 0 7mm, #000 7.2mm)', mask: 'radial-gradient(circle at 50% 100%, transparent 0 7mm, #000 7.2mm)',
      },
    });

    const listFont = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...listFont, ...rowSizing(s, { minFactor: 1.05, maxFactor: 2 }), display: 'flex', alignItems: 'center', gap: '1.6mm' },
    },
    h('span', { text: s.romanNumbers ? toRoman(t.number) : String(t.number), style: { color: t.numberColor || gold, flex: 'none', width: '6mm', textAlign: 'right', fontSize: '0.8em', letterSpacing: '0.05em' } }),
    h('span', { text: '◆', style: { color: gold, fontSize: '0.45em', flex: 'none' } }),
    fitTitle(t),
    h('span', { text: t.duration, style: { color: rgba(s.textColor, 0.65), flex: 'none', fontSize: '0.9em' } })))));

    const sub = fillTemplate(s.subText, values);
    const footer = fillTemplate(s.footerText, values);
    const content = h('div', { style: { position: 'absolute', inset: '32mm 10mm 9mm', display: 'flex', flexDirection: 'column' } },
      h('div', { text: fillTemplate(s.titleText, values), style: { ...caps, fontSize: `${s.titleSize}pt`, lineHeight: 1.05, flex: 'none', textWrap: 'balance', letterSpacing: '0.18em' } }),
      sub ? h('div', { text: sub, style: { ...caps, fontSize: `${s.listSize * 0.95}pt`, color: s.textColor, margin: '1.5mm 0 0', flex: 'none' } }) : null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '2mm', margin: '2.5mm 0', flex: 'none' } },
        h('div', { style: { flex: 1, height: '0.2mm', background: gold } }), h('div', { text: '◆ ◆ ◆', style: { color: gold, fontSize: '5pt', letterSpacing: '0.4em' } }), h('div', { style: { flex: 1, height: '0.2mm', background: gold } })),
      h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '4mm' } }, ...cols),
      footer ? h('div', { text: footer, style: { ...caps, fontSize: `${s.listSize * 0.85}pt`, marginTop: '2mm', flex: 'none' } }) : null);

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } }, fan, ...frame, content);
  },
};
