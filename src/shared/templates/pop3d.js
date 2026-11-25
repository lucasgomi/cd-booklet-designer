// «Pop 3D» — rayos de sol, título enorme con relieve 3D y la lista en una
// tarjeta blanca con borde grueso y sombra dura (estilo neobrutalista).
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';

/** Relieve 3D con text-shadow: muchas capas pegadas hacia abajo a la derecha. */
const extrude = (color, depthMm, steps = 14) => Array.from({ length: steps }, (_, i) => {
  const d = ((i + 1) * depthMm) / steps;
  return `${d.toFixed(2)}mm ${d.toFixed(2)}mm 0 ${color}`;
}).join(', ');

export default {
  id: 'pop3d',
  category: 'Estéticas',
  name: 'Pop 3D',
  description: 'Rayos de sol, título con relieve 3D y tarjeta con sombra dura.',

  defaults: {
    rays1: '#FFD23F',
    rays2: '#FFC21A',
    faceColor: '#FFFFFF',
    depthColor: '#E4002B',
    inkColor: '#111111',
    cardColor: '#FFFFFF',
    accentColor: '#3D5AFE',
    titleFont: 'Bungee', titleWeight: 400, titleSize: 22,
    listFont: 'Montserrat', listWeight: 700, listSize: 6.4,
    titleText: '{titulo}',
    subText: '{artista}',
    burstText: '{pistas} temas',
    depth: 2.2,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoRays', label: 'Rayos de sol' },
    { key: 'decoBurst', label: 'Estrella con el nº de temas' },
    { key: 'decoSparkles', label: 'Destellos ✦' },
  ],

  presets: [
    { name: 'Amarillo', style: {} },
    { name: 'Chicle', style: { rays1: '#FF8AC8', rays2: '#FF73BC', depthColor: '#5B2BFF', accentColor: '#FF2E88' } },
    { name: 'Menta', style: { rays1: '#8FF0C8', rays2: '#7BE5BA', depthColor: '#0E7C66', accentColor: '#0E7C66', faceColor: '#FFFDF0' } },
    { name: 'Noche', style: { rays1: '#1B1446', rays2: '#231A5A', faceColor: '#FFE45C', depthColor: '#FF3EA5', inkColor: '#111111', cardColor: '#FFF7E0', accentColor: '#FF3EA5' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'rays1', label: 'Rayos 1', type: 'color' },
      { key: 'rays2', label: 'Rayos 2', type: 'color' },
      { key: 'faceColor', label: 'Cara del título', type: 'color' },
      { key: 'depthColor', label: 'Relieve del título', type: 'color' },
      { key: 'inkColor', label: 'Tinta (bordes y texto)', type: 'color' },
      { key: 'cardColor', label: 'Tarjeta de la lista', type: 'color' },
      { key: 'accentColor', label: 'Números y estrella', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { key: 'depth', label: 'Profundidad del relieve', type: 'number', min: 0, max: 5, step: 0.1, unit: 'mm' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'subText', label: 'Subtítulo', type: 'text' },
      { key: 'burstText', label: 'Texto de la estrella', type: 'text' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const ink = s.inkColor;
    const burst = fillTemplate(s.burstText, values);
    const hasBurst = !!burst && s.decoBurst !== false;
    const title = h('div', {
      text: fillTemplate(s.titleText, values).toUpperCase(),
      style: {
        fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, lineHeight: 0.95, color: s.faceColor, textAlign: 'center',
        WebkitTextStroke: `0.35mm ${ink}`, paintOrder: 'stroke fill', textShadow: s.depth > 0 ? extrude(s.depthColor, s.depth) : 'none',
        transform: 'rotate(-3deg)', flex: 'none', textWrap: 'balance', margin: `0 ${hasBurst ? 15 : 2}mm 0 2mm`,
      },
    });
    const sub = fillTemplate(s.subText, values);
    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: ink, fontVariantNumeric: 'tabular-nums' };
    const num = s.listSize * 0.3528 * 1.4;
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...row, ...rowSizing(s, { minFactor: 1.5, maxFactor: 2.6 }), display: 'flex', alignItems: 'center', gap: '1.2mm' },
    },
    h('span', { text: String(t.number), style: { flex: 'none', width: `${num}mm`, height: `${num}mm`, borderRadius: '50%', display: 'grid', placeItems: 'center', background: t.numberColor || s.accentColor, color: '#FFFFFF', fontSize: '0.72em', lineHeight: 1 } }),
    fitTitle(t, {}),
    h('span', { text: t.duration, style: { flex: 'none', fontWeight: 500, opacity: 0.7 } })))));
    const card = h('div', {
      style: {
        flex: '1 1 auto', minHeight: 0, marginTop: '3.5mm', background: s.cardColor, border: `0.7mm solid ${ink}`, borderRadius: '3mm',
        boxShadow: `1.6mm 1.6mm 0 ${ink}`, padding: '2.4mm 3mm', display: 'flex', gap: '3.5mm', marginRight: '1.6mm',
      },
    }, ...cols);
    const star = 'polygon(50% 0%, 61% 18%, 82% 10%, 79% 32%, 100% 40%, 84% 55%, 96% 75%, 73% 76%, 68% 98%, 50% 85%, 32% 98%, 27% 76%, 4% 75%, 16% 55%, 0% 40%, 21% 32%, 18% 10%, 39% 18%)';
    return h('div', {
      style: { position: 'absolute', inset: 0, overflow: 'hidden', background: s.rays1 },
    },
    deco(s, 'decoRays', () => h('div', { style: { position: 'absolute', inset: '-20%', background: `repeating-conic-gradient(from 0deg at 50% 30%, ${s.rays1} 0 8deg, ${s.rays2} 8deg 16deg)` } })),
    deco(s, 'decoSparkles', () => h('div', { style: { position: 'absolute', inset: 0 } },
      ...[[6, 6, 11], [108, 30, 8], [9, 34, 7]].map(([x, y, z]) => h('div', { text: '✦', style: { position: 'absolute', left: `${x}mm`, top: `${y}mm`, fontSize: `${z}pt`, color: s.faceColor, textShadow: `0.3mm 0.3mm 0 ${ink}`, lineHeight: 1 } })))),
    h('div', { style: { position: 'absolute', inset: '6mm 6mm 6.5mm', display: 'flex', flexDirection: 'column' } },
      title,
      sub ? h('div', { text: sub.toUpperCase(), style: { alignSelf: 'center', marginRight: hasBurst ? '13mm' : 0, marginTop: '2.4mm', background: ink, color: s.faceColor, padding: '0.6mm 2.6mm', borderRadius: '5mm', fontFamily: fontStack(s.listFont), fontWeight: 800, fontSize: `${s.listSize * 1.05}pt`, letterSpacing: '0.1em', flex: 'none' } }) : null,
      card),
    burst ? deco(s, 'decoBurst', () => h('div', {
      style: { position: 'absolute', right: '2.5mm', top: '3mm', width: '18mm', height: '18mm', background: s.accentColor, clipPath: star, display: 'grid', placeItems: 'center', transform: 'rotate(12deg)' },
    }, h('div', { text: burst.toUpperCase(), style: { fontFamily: fontStack(s.titleFont), fontSize: '6pt', color: '#FFFFFF', textAlign: 'center', lineHeight: 1, width: '12mm' } }))) : null);
  },
};
