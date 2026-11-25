// «Cómic» — página de tebeo: trama de puntos, título en un estallido, el
// artista en un bocadillo y la lista en una viñeta.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';

const BURST = 'polygon(0% 22%, 14% 18%, 9% 2%, 27% 12%, 36% 0%, 45% 13%, 60% 1%, 63% 15%, 82% 4%, 79% 20%, 100% 18%, 88% 36%, 99% 50%, 86% 60%, 97% 80%, 76% 77%, 74% 98%, 58% 84%, 44% 100%, 37% 84%, 18% 96%, 20% 76%, 0% 79%, 11% 60%, 1% 46%, 12% 36%)';

export default {
  id: 'comic',
  category: 'Estéticas',
  name: 'Cómic',
  description: 'Trama de puntos, título en un estallido y la lista en una viñeta.',

  defaults: {
    paperColor: '#FFE45C',
    dotColor: '#F2A900',
    burstColor: '#E4002B',
    titleColor: '#FFE45C',
    inkColor: '#111111',
    panelColor: '#FFFFFF',
    titleFont: 'Bangers', titleWeight: 400, titleSize: 30,
    bubbleFont: 'Bangers', bubbleWeight: 400, bubbleSize: 11,
    listFont: 'Luckiest Guy', listWeight: 400, listSize: 6.2,
    titleText: '{titulo}',
    bubbleText: '¡{artista}!',
    powText: '¡POW!',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoDots', label: 'Trama de puntos' },
    { key: 'decoBurst', label: 'Estallido del título' },
    { key: 'decoBubble', label: 'Bocadillo' },
    { key: 'decoPow', label: '«¡POW!»' },
  ],

  presets: [
    { name: 'Clásico', style: {} },
    { name: 'Azul', style: { paperColor: '#7FD3FF', dotColor: '#3DA5E0', burstColor: '#FFE45C', titleColor: '#E4002B' } },
    { name: 'Rosa', style: { paperColor: '#FF9ACB', dotColor: '#F26AAE', burstColor: '#3D5AFE', titleColor: '#FFFFFF' } },
    { name: 'Blanco y negro', style: { paperColor: '#FFFFFF', dotColor: '#BBBBBB', burstColor: '#111111', titleColor: '#FFFFFF' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'paperColor', label: 'Papel', type: 'color' },
      { key: 'dotColor', label: 'Puntos', type: 'color' },
      { key: 'burstColor', label: 'Estallido', type: 'color' },
      { key: 'titleColor', label: 'Título', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'panelColor', label: 'Viñeta y bocadillo', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Bocadillo', family: 'bubbleFont', weight: 'bubbleWeight', size: 'bubbleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'bubbleText', label: 'Bocadillo', type: 'text' },
      { key: 'powText', label: 'Onomatopeya', type: 'text' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const ink = s.inkColor;
    const outline = (w, c) => [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].map(([x, y]) => `${(x * w).toFixed(2)}mm ${(y * w).toFixed(2)}mm 0 ${c}`).join(', ');
    const titleText = fillTemplate(s.titleText, values).toUpperCase();
    const title = h('div', {
      text: titleText,
      style: {
        fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.titleColor, lineHeight: 0.95, textAlign: 'center',
        textShadow: `${outline(0.5, ink)}, 1.2mm 1.2mm 0 ${ink}`, letterSpacing: '0.03em', textWrap: 'balance', position: 'relative',
      },
    });
    const head = h('div', { style: { position: 'relative', flex: 'none', display: 'grid', placeItems: 'center', padding: '6mm 8mm 5mm', transform: 'rotate(-4deg)' } },
      deco(s, 'decoBurst', () => h('div', { style: { position: 'absolute', inset: 0, background: s.burstColor, clipPath: BURST, filter: `drop-shadow(0.8mm 0.8mm 0 ${ink})` } })),
      title);

    const bubble = fillTemplate(s.bubbleText, values);
    const bubbleEl = bubble ? deco(s, 'decoBubble', () => h('div', {
      style: { alignSelf: 'flex-start', position: 'relative', marginTop: '1mm', marginLeft: '3mm', background: s.panelColor, border: `0.5mm solid ${ink}`, borderRadius: '50%', padding: '1.6mm 5mm', flex: 'none' },
    },
    h('div', { text: bubble.toUpperCase(), style: { fontFamily: fontStack(s.bubbleFont), fontWeight: s.bubbleWeight, fontSize: `${s.bubbleSize}pt`, color: ink, whiteSpace: 'nowrap', letterSpacing: '0.04em' } }),
    h('div', { style: { position: 'absolute', left: '7mm', bottom: '-2.6mm', width: '4mm', height: '3mm', background: s.panelColor, borderRight: `0.5mm solid ${ink}`, borderBottom: `0.5mm solid ${ink}`, transform: 'skewX(-30deg)' } }))) : null;

    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: ink, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.02em' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...row, ...rowSizing(s, { minFactor: 1.2, maxFactor: 2.5 }), display: 'flex', alignItems: 'center', gap: '1.2mm' },
    },
    h('span', { text: `${t.number}.`, style: { flex: 'none', color: t.numberColor || s.burstColor, textShadow: outline(0.12, ink) } }),
    fitTitle(t, { lineHeight: 1.25 }, (x) => x.toUpperCase()),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.7 } })))));
    const panel = h('div', {
      style: { flex: '1 1 auto', minHeight: 0, marginTop: '3mm', background: s.panelColor, border: `0.7mm solid ${ink}`, boxShadow: `1.2mm 1.2mm 0 ${ink}`, padding: '2.4mm 3mm', display: 'flex', gap: '3.5mm', transform: 'rotate(0.6deg)' },
    }, ...cols);

    const pow = fillTemplate(s.powText, values);
    return h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: s.paperColor } },
      deco(s, 'decoDots', () => h('div', { style: { position: 'absolute', inset: 0, background: `radial-gradient(circle, ${s.dotColor} 0.42mm, transparent 0.5mm) 0 0 / 1.8mm 1.8mm` } })),
      h('div', { style: { position: 'absolute', inset: '4mm 6mm 6mm', display: 'flex', flexDirection: 'column' } }, head, bubbleEl, panel),
      pow ? deco(s, 'decoPow', () => h('div', {
        text: pow.toUpperCase(),
        style: { position: 'absolute', right: '4mm', top: '29mm', fontFamily: fontStack(s.titleFont), fontSize: '12pt', color: s.panelColor, textShadow: `${outline(0.35, ink)}, 0.8mm 0.8mm 0 ${ink}`, transform: 'rotate(14deg)', lineHeight: 1 },
      })) : null);
  },
};
