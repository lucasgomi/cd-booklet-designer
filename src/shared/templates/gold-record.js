// «Disco de oro» — el certificado enmarcado de un disco de oro: el disco
// dorado, la placa con la dedicatoria y la lista grabada en dos columnas.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';

export default {
  id: 'gold-record',
  category: 'Objetos',
  name: 'Disco de oro',
  description: 'Certificado enmarcado con el disco dorado y una placa grabada.',

  defaults: {
    bgColor: '#151515',
    bgColor2: '#2A2420',
    gold1: '#FFF1B8',
    gold2: '#C9A227',
    gold3: '#7A5A12',
    plateColor: '#D9B65A',
    engraveColor: '#2E2208',
    titleFont: 'Cinzel', titleWeight: 700, titleSize: 13,
    listFont: 'Cormorant Garamond', listWeight: 600, listSize: 6.6,
    awardText: 'Disco de Oro',
    dedication: 'Presentado a {artista}',
    titleText: '«{titulo}»',
    footerText: '{pistas} temas · {total}[ · {fecha}]',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoFrame', label: 'Marco dorado' },
    { key: 'decoDisc', label: 'Disco de oro' },
    { key: 'decoScrews', label: 'Tornillos de la placa' },
  ],

  presets: [
    { name: 'Oro', style: {} },
    { name: 'Platino', style: { gold1: '#FFFFFF', gold2: '#B8C0CB', gold3: '#5D6670', plateColor: '#C9CED6', engraveColor: '#1E242B', bgColor: '#0F1216', bgColor2: '#22282F' } },
    { name: 'Diamante', style: { gold1: '#E9FBFF', gold2: '#8FD8F0', gold3: '#2D6F8A', plateColor: '#BFE9F7', engraveColor: '#0E2E3B', bgColor: '#0A1018', bgColor2: '#13243A', awardText: 'Disco de Diamante' } },
    { name: 'Terciopelo rojo', style: { bgColor: '#3A0A10', bgColor2: '#5C1420' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'bgColor2', label: 'Fondo (brillo)', type: 'color' },
      { key: 'gold1', label: 'Metal: brillo', type: 'color' },
      { key: 'gold2', label: 'Metal: medio', type: 'color' },
      { key: 'gold3', label: 'Metal: sombra', type: 'color' },
      { key: 'plateColor', label: 'Placa', type: 'color' },
      { key: 'engraveColor', label: 'Grabado', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Títulos', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'awardText', label: 'Premio', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'dedication', label: 'Dedicatoria', type: 'text' },
      { key: 'titleText', label: 'Título', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const metal = `linear-gradient(135deg, ${s.gold3}, ${s.gold2} 25%, ${s.gold1} 45%, ${s.gold2} 60%, ${s.gold3} 100%)`;
    const serif = (size, extra = {}) => ({ fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${size}pt`, color: s.engraveColor, textAlign: 'center', ...extra });

    const disc = deco(s, 'decoDisc', () => h('div', {
      style: {
        width: '40mm', height: '40mm', flex: 'none', borderRadius: '50%', position: 'relative', boxShadow: `0 1mm 3mm ${rgba('#000000', 0.6)}`,
        background: `radial-gradient(circle, ${s.bgColor} 0 6%, ${s.gold1} 6% 7%, ${s.gold2} 7% 30%, ${s.gold3} 30% 31%, transparent 31%), `
          + `conic-gradient(from 20deg, ${s.gold2}, ${s.gold1}, ${s.gold2}, ${s.gold3}, ${s.gold2}, ${s.gold1}, ${s.gold2}, ${s.gold3}, ${s.gold2})`,
      },
    }, h('div', { style: { position: 'absolute', inset: '9%', borderRadius: '50%', background: `repeating-radial-gradient(circle, transparent 0 0.35mm, ${rgba(s.gold3, 0.35)} 0.35mm 0.5mm)`, WebkitMask: 'radial-gradient(circle, transparent 36%, #000 37%)', mask: 'radial-gradient(circle, transparent 36%, #000 37%)' } })));

    const award = fillTemplate(s.awardText, values);
    const head = h('div', { style: { display: 'flex', alignItems: 'center', gap: '4mm', flex: 'none' } },
      disc,
      h('div', { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.2mm', alignItems: 'center' } },
        award ? h('div', { text: award.toUpperCase(), style: { ...serif(s.titleSize), backgroundImage: metal, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', letterSpacing: '0.08em', lineHeight: 1.05 } }) : null,
        h('div', { style: { width: '70%', height: '0.3mm', background: metal } }),
        h('div', { text: fillTemplate(s.dedication, values), style: { fontFamily: fontStack(s.listFont), fontStyle: 'italic', fontSize: `${s.listSize * 1.15}pt`, color: s.gold1, textAlign: 'center' } }),
        h('div', { text: fillTemplate(s.titleText, values), style: { ...serif(s.titleSize * 0.8), color: s.gold1, textWrap: 'balance', lineHeight: 1.1 } })));

    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.engraveColor, fontVariantNumeric: 'tabular-nums lining-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...row, ...rowSizing(s, { minFactor: 1.1, maxFactor: 2.2 }), display: 'flex', alignItems: 'baseline', gap: '1.2mm', textShadow: `0 0.15mm 0 ${rgba('#FFFFFF', 0.35)}` },
    },
    h('span', { text: `${t.number}.`, style: { flex: 'none', width: '1.6em', textAlign: 'right', color: t.numberColor || s.engraveColor } }),
    fitTitle(t, {}),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.75 } })))));
    const footer = fillTemplate(s.footerText, values);
    const screw = (pos) => h('div', { style: { position: 'absolute', width: '1.8mm', height: '1.8mm', borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${s.gold1}, ${s.gold3})`, ...pos } });
    const plate = h('div', {
      style: {
        flex: '1 1 auto', minHeight: 0, marginTop: '4mm', position: 'relative', padding: '3mm 5mm 2.4mm', borderRadius: '1mm', display: 'flex', flexDirection: 'column',
        background: `linear-gradient(160deg, ${rgba('#FFFFFF', 0.25)}, transparent 40%), ${s.plateColor}`, boxShadow: `inset 0 0 0 0.35mm ${rgba(s.engraveColor, 0.35)}, 0 0.8mm 2mm ${rgba('#000000', 0.5)}`,
      },
    },
    h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '4mm' } }, ...cols),
    footer ? h('div', { text: footer.toUpperCase(), style: { ...serif(s.listSize * 0.8, { fontWeight: 600, letterSpacing: '0.15em', marginTop: '1.4mm', flex: 'none' }) } }) : null,
    deco(s, 'decoScrews', () => h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none' } },
      screw({ left: '1.2mm', top: '1.2mm' }), screw({ right: '1.2mm', top: '1.2mm' }), screw({ left: '1.2mm', bottom: '1.2mm' }), screw({ right: '1.2mm', bottom: '1.2mm' }))));

    return h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: `radial-gradient(ellipse at 50% 20%, ${s.bgColor2}, ${s.bgColor} 75%)` } },
      deco(s, 'decoFrame', () => h('div', { style: { position: 'absolute', inset: '2.5mm', border: '1.2mm solid transparent', borderImage: `${metal} 1`, boxShadow: `inset 0 0 0 0.3mm ${rgba('#000000', 0.5)}` } })),
      h('div', { style: { position: 'absolute', inset: '7mm 7.5mm 7mm', display: 'flex', flexDirection: 'column' } }, head, plate));
  },
};
