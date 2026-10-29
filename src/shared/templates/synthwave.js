// «Synthwave» — atardecer retro de los 80: sol a rayas, cuadrícula en
// perspectiva, título de neón y lista en un panel oscuro.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';

export default {
  id: 'synthwave',
  category: 'Estéticas',
  name: 'Synthwave',
  description: 'Sol a rayas, cuadrícula de neón y letras luminosas de los 80.',

  defaults: {
    skyTop: '#140A2E',
    skyBottom: '#4B1564',
    sunTop: '#FFD34E',
    sunBottom: '#FF3D8B',
    gridColor: '#FF3DF2',
    floorColor: '#0B0420',
    neonColor: '#3DF2FF',
    textColor: '#F4ECFF',
    numberColor: '#FF3DF2',
    titleFont: 'Monoton', titleWeight: 400, titleSize: 20,
    listFont: 'Space Mono', listWeight: 400, listSize: 5.4,
    titleText: '{titulo}',
    subText: '{artista}[ · vol. {disco}]',
    uppercase: true,
    useShortTitles: true,
    durationFormat: 'mm:ss',
    totalFormat: '',
    autoRowHeight: true,
    rowHeight: 2.6,
  },

  decorations: [
    { key: 'decoSun', label: 'Sol a rayas' },
    { key: 'decoGrid', label: 'Cuadrícula del suelo' },
  ],

  presets: [
    { name: 'Outrun', style: {} },
    { name: 'Vaporwave', style: { skyTop: '#FFB3E6', skyBottom: '#B5E8FF', sunTop: '#FFF3A8', sunBottom: '#FF7BC5', gridColor: '#6A5BFF', floorColor: '#2B2160', neonColor: '#FFFFFF', numberColor: '#FFB3E6', titleFont: 'Archivo Black' } },
    { name: 'Miami', style: { skyTop: '#1B1145', skyBottom: '#FF5E8A', sunTop: '#FFE36E', sunBottom: '#FF8A3D', gridColor: '#36F1CD', floorColor: '#140A2E', neonColor: '#36F1CD', numberColor: '#FF5E8A' } },
    { name: 'Matrix', style: { skyTop: '#000000', skyBottom: '#06210F', sunTop: '#B6FF9E', sunBottom: '#1E8F3A', gridColor: '#3CFF6B', floorColor: '#000000', neonColor: '#3CFF6B', textColor: '#CFFFD8', numberColor: '#3CFF6B' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'skyTop', label: 'Cielo arriba', type: 'color' },
      { key: 'skyBottom', label: 'Cielo abajo', type: 'color' },
      { key: 'sunTop', label: 'Sol arriba', type: 'color' },
      { key: 'sunBottom', label: 'Sol abajo', type: 'color' },
      { key: 'gridColor', label: 'Cuadrícula', type: 'color' },
      { key: 'floorColor', label: 'Suelo', type: 'color' },
      { key: 'neonColor', label: 'Neón del título', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'numberColor', label: 'Números', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'subText', label: 'Subtítulo', type: 'text' },
      { key: 'uppercase', label: 'Título en mayúsculas', type: 'toggle' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const horizon = 46; // mm
    const sun = h('div', {
      style: {
        position: 'absolute', left: '50%', top: `${horizon - 30}mm`, width: '44mm', height: '44mm', transform: 'translateX(-50%)', borderRadius: '50%',
        background: `linear-gradient(${s.sunTop}, ${s.sunBottom})`, boxShadow: `0 0 8mm ${rgba(s.sunBottom, 0.55)}`,
        WebkitMask: 'linear-gradient(#000 0 45%, transparent 45% 49%, #000 49% 58%, transparent 58% 62%, #000 62% 69%, transparent 69% 74%, #000 74% 79%, transparent 79% 85%, #000 85% 88%, transparent 88%)',
        mask: 'linear-gradient(#000 0 45%, transparent 45% 49%, #000 49% 58%, transparent 58% 62%, #000 62% 69%, transparent 69% 74%, #000 74% 79%, transparent 79% 85%, #000 85% 88%, transparent 88%)',
      },
    });
    const floor = h('div', { style: { position: 'absolute', left: 0, right: 0, top: `${horizon}mm`, bottom: 0, background: s.floorColor, overflow: 'hidden', perspective: '30mm' } },
      deco(s, 'decoGrid', () => h('div', {
        style: {
          position: 'absolute', left: '-60mm', right: '-60mm', top: '-4mm', height: '160mm', transformOrigin: '50% 0', transform: 'rotateX(62deg)',
          backgroundImage: `linear-gradient(${s.gridColor} 0.35mm, transparent 0.35mm), linear-gradient(90deg, ${s.gridColor} 0.35mm, transparent 0.35mm)`,
          backgroundSize: '8mm 8mm', opacity: 0.9,
        },
      })),
      h('div', { style: { position: 'absolute', inset: 0, background: `linear-gradient(${rgba(s.gridColor, 0.35)}, transparent 20%)` } }));

    const titleText = fillTemplate(s.titleText, values);
    const glow = (c) => `0 0 0.6mm ${c}, 0 0 1.8mm ${c}, 0 0 4mm ${rgba(c, 0.7)}`;
    const title = h('div', {
      text: s.uppercase ? titleText.toUpperCase() : titleText,
      style: { position: 'absolute', left: '4mm', right: '4mm', top: '6mm', textAlign: 'center', fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: '#FFFFFF', textShadow: glow(s.neonColor), lineHeight: 1.05 },
    });
    const sub = fillTemplate(s.subText, values);

    const mono = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, fontVariantNumeric: 'tabular-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...mono, ...rowSizing(s, { minFactor: 1.05, maxFactor: 2 }), display: 'flex', alignItems: 'center', gap: '1.4mm' },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { color: t.numberColor || s.numberColor, textShadow: `0 0 1mm ${rgba(s.numberColor, 0.8)}`, flex: 'none' } }),
    fitTitle(t, {}, (x) => x.toUpperCase()),
    h('span', { text: t.duration, style: { opacity: 0.7, flex: 'none' } })))));

    const panel = h('div', {
      style: {
        position: 'absolute', left: '6mm', right: '6mm', top: `${horizon + 3}mm`, bottom: '6mm', background: rgba('#05010F', 0.72), border: `0.3mm solid ${rgba(s.gridColor, 0.8)}`,
        boxShadow: `0 0 3mm ${rgba(s.gridColor, 0.45)}`, borderRadius: '1.5mm', padding: '2.5mm 3mm', display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      },
    },
    sub ? h('div', { text: sub.toUpperCase(), style: { ...mono, color: s.neonColor, textAlign: 'center', letterSpacing: '0.25em', marginBottom: '1.6mm', flex: 'none', textShadow: `0 0 1mm ${rgba(s.neonColor, 0.8)}` } }) : null,
    h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '4mm' } }, ...cols));

    return h('div', { style: { position: 'absolute', inset: 0, background: `linear-gradient(${s.skyTop}, ${s.skyBottom} ${horizon}mm)`, overflow: 'hidden' } },
      deco(s, 'decoSun', sun), floor, title, panel);
  },
};
