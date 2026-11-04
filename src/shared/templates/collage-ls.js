// «Collage Los Santos» — portada de videojuego en viñetas: rejilla de
// paneles con bordes negros, trama de cómic, el título con contorno grueso
// y la lista en el panel grande.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';
import { palmSvg } from './radio-pop.js';

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export default {
  id: 'collage-ls',
  category: 'Radio de Los Santos',
  name: 'Collage Los Santos',
  description: 'Viñetas de portada de videojuego con trama de cómic.',

  defaults: {
    gutterColor: '#0A0A0A',
    tile1: '#FF5E8A',
    tile1b: '#FFB067',
    tile2: '#17B6C2',
    tile3: '#FFD23F',
    tile4: '#8B5CFF',
    listBg: '#FFFFFF',
    listInk: '#111111',
    accentColor: '#FF3EA5',
    iconColor: '#111111',
    titleFont: 'Anton', titleWeight: 400, titleSize: 44,
    artistFont: 'Montserrat', artistWeight: 900, artistSize: 8,
    listFont: 'Montserrat', listWeight: 700, listSize: 5.8,
    titleText: '{titulo}',
    artistText: '{artista}',
    infoTop: '{pistas} temas',
    infoBottom: '{total}',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoSkyline', label: 'Silueta de la ciudad' },
    { key: 'decoPalm', label: 'Palmera' },
    { key: 'decoSun', label: 'Sol a rayas' },
    { key: 'decoNote', label: 'Nota musical ♪' },
    { key: 'decoHalftone', label: 'Trama de cómic' },
  ],

  presets: [
    { name: 'Vinewood', style: {} },
    { name: 'Vice', style: { tile1: '#00C2C7', tile1b: '#FF6EC7', tile2: '#FF6EC7', tile3: '#F8F3E6', tile4: '#00C2C7', accentColor: '#FF2E9A' } },
    { name: 'Noche', style: { gutterColor: '#000000', tile1: '#1B1446', tile1b: '#7A2D8C', tile2: '#2A2F7A', tile3: '#FF3EA5', tile4: '#0F8B8D', listBg: '#14121C', listInk: '#F2EEF8', accentColor: '#FF3EA5', iconColor: '#FFFFFF' } },
    { name: 'Desierto', style: { tile1: '#C1502E', tile1b: '#F2B263', tile2: '#6B8F71', tile3: '#E8D5A3', tile4: '#8C5A3C', listBg: '#FBF3E2', listInk: '#2A1D12', accentColor: '#C1502E' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'gutterColor', label: 'Bordes entre viñetas', type: 'color' },
      { key: 'tile1', label: 'Viñeta del título (arriba)', type: 'color' },
      { key: 'tile1b', label: 'Viñeta del título (abajo)', type: 'color' },
      { key: 'tile2', label: 'Viñeta 2', type: 'color' },
      { key: 'tile3', label: 'Viñeta 3', type: 'color' },
      { key: 'tile4', label: 'Viñeta 4', type: 'color' },
      { key: 'listBg', label: 'Fondo de la lista', type: 'color' },
      { key: 'listInk', label: 'Texto de la lista', type: 'color' },
      { key: 'accentColor', label: 'Números', type: 'color' },
      { key: 'iconColor', label: 'Dibujos', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Artista', family: 'artistFont', weight: 'artistWeight', size: 'artistSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'artistText', label: 'Artista', type: 'text' },
      { key: 'infoTop', label: 'Viñeta de datos (arriba)', type: 'text' },
      { key: 'infoBottom', label: 'Viñeta de datos (abajo)', type: 'text' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const G = s.gutterColor;
    const dots = s.decoHalftone !== false ? `radial-gradient(circle, ${rgba('#000000', 0.18)} 0.25mm, transparent 0.32mm) 0 0 / 1.3mm 1.3mm, ` : '';
    const tile = (area, bg, ...children) => h('div', { style: { gridArea: area, position: 'relative', overflow: 'hidden', minWidth: 0, minHeight: 0, background: `${dots}${bg}` } }, ...children);
    const icon = (key, svg, size = '78%') => deco(s, key, () => h('div', { style: { position: 'absolute', inset: 0, background: `${svgUrl(svg)} center / ${size} no-repeat` } }));
    // Contorno grueso de cómic con sombras en 8 direcciones.
    const outline = (w, c) => [[1, 0], [-1, 0], [0, 1], [0, -1], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7], [-0.7, -0.7]].map(([x, y]) => `${(x * w).toFixed(2)}mm ${(y * w).toFixed(2)}mm 0 ${c}`).join(', ');

    const title = fillTemplate(s.titleText, values).toUpperCase();
    const artist = fillTemplate(s.artistText, values);
    // Silueta de rascacielos al fondo de la viñeta del título.
    let towers = '';
    [[0, 9], [6, 14], [11, 7], [15, 19], [21, 12], [26, 24], [31, 15], [37, 10], [42, 21], [48, 13], [53, 28], [58, 17], [64, 9], [69, 22], [75, 14], [80, 18], [86, 11], [91, 25], [97, 15]]
      .forEach(([x, hh], i) => { towers += `<rect x="${x}" y="${30 - hh}" width="${i % 3 ? 5 : 4}" height="${hh}"/>`; });
    const skyline = deco(s, 'decoSkyline', () => h('div', { style: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', opacity: 0.28, background: `${svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 102 30" width="102" height="30" preserveAspectRatio="none" fill="${G}">${towers}</svg>`)} 0 100% / 100% 100% no-repeat` } }));
    const titleTile = tile('title', `linear-gradient(${s.tile1}, ${s.tile1b})`, skyline,
      h('div', { style: { position: 'absolute', inset: '2.5mm 3mm', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'flex-start' } },
        artist ? h('div', { text: artist.toUpperCase(), style: { fontFamily: fontStack(s.artistFont), fontWeight: s.artistWeight, fontSize: `${s.artistSize}pt`, fontStyle: 'italic', color: '#FFFFFF', textShadow: outline(0.35, G), letterSpacing: '0.04em', marginBottom: '0.6mm' } }) : null,
        h('div', { text: title, style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: '#FFFFFF', lineHeight: 0.95, textShadow: `${outline(0.6, G)}, 1.2mm 1.2mm 0 ${G}`, textWrap: 'balance', transform: 'rotate(-2deg)', transformOrigin: '0 100%' } })));

    const sun = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20"><defs><mask id="m"><rect width="20" height="20" fill="#fff"/><rect y="11" width="20" height="1" fill="#000"/><rect y="13.5" width="20" height="1.2" fill="#000"/><rect y="16" width="20" height="1.4" fill="#000"/></mask></defs><circle cx="10" cy="10" r="8" fill="${s.iconColor}" mask="url(#m)"/></svg>`;
    const note = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" width="20" height="20" fill="${s.iconColor}"><path d="M7 3 L17 1 V13.5 A2.6 2.1 0 1 1 15 11.5 V5 L9 6.2 V15.5 A2.6 2.1 0 1 1 7 13.5 Z"/></svg>`;

    const info = (text, size) => (text ? h('div', { text: text.toUpperCase(), style: { fontFamily: fontStack(s.titleFont), fontSize: `${size}pt`, color: '#FFFFFF', textShadow: outline(0.35, G), lineHeight: 1, textAlign: 'center' } }) : null);
    const infoTile = tile('info', s.tile4, h('div', { style: { position: 'absolute', inset: '1.5mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1mm' } },
      info(fillTemplate(s.infoTop, values), 10), info(fillTemplate(s.infoBottom, values), 8)));

    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.listInk, fontVariantNumeric: 'tabular-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...row, ...rowSizing(s, { minFactor: 1.1, maxFactor: 2.6 }), display: 'flex', alignItems: 'center', gap: '1.2mm' },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { flex: 'none', color: t.numberColor || s.accentColor, fontWeight: 900, fontStyle: 'italic' } }),
    fitTitle(t, {}, (x) => x.toUpperCase()),
    h('span', { text: t.duration, style: { flex: 'none', fontWeight: 500, opacity: 0.7 } })))));
    const listTile = h('div', { style: { gridArea: 'list', minWidth: 0, minHeight: 0, background: s.listBg, padding: '2.4mm 2.6mm', display: 'flex', gap: '3mm', overflow: 'hidden' } }, ...cols);

    return h('div', {
      style: {
        position: 'absolute', inset: 0, background: G, padding: '3mm', boxSizing: 'border-box', display: 'grid', gap: '1.6mm',
        gridTemplateColumns: '1fr 1fr 19mm', gridTemplateRows: '19mm 19mm 1fr 1fr 1fr',
        gridTemplateAreas: '"title title palm" "title title sun" "list list note" "list list star" "list list info"',
      },
    },
    titleTile,
    tile('palm', `linear-gradient(${s.tile2}, ${rgba(s.tile2, 0.7)})`, icon('decoPalm', palmSvg(s.iconColor), 'auto 90%')),
    tile('sun', s.tile3, icon('decoSun', sun)),
    listTile,
    tile('note', s.tile1, icon('decoNote', note, '62%')),
    tile('star', s.tile2, h('div', { text: '★', style: { position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: '24pt', color: s.tile3, textShadow: outline(0.4, G), lineHeight: 1 } })),
    infoTile);
  },
};
