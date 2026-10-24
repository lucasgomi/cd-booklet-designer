// «Playlist» — la pantalla de una playlist en una app de música: portada,
// nombre enorme, botón de reproducir y la lista de canciones.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(d, color, sizeMm, fill = true) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', '0 0 24 24');
  el.style.cssText = `width:${sizeMm}mm;height:${sizeMm}mm;display:block;flex:none`;
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', d);
  if (fill) p.setAttribute('fill', color);
  else {
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke', color);
    p.setAttribute('stroke-width', '2');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
  }
  el.appendChild(p);
  return el;
}

export default {
  id: 'playlist',
  category: 'White girl music',
  name: 'Playlist',
  description: 'Pantalla de playlist: portada, botón de play y canciones.',

  defaults: {
    topColor: '#8E5A7E',
    bgColor: '#121212',
    textColor: '#FFFFFF',
    dimColor: '#A7A7A7',
    accentColor: '#1ED760',
    coverColor1: '#F7A8C4',
    coverColor2: '#8E5A7E',
    coverTextColor: '#FFFFFF',
    titleFont: 'Montserrat', titleWeight: 900, titleSize: 17,
    listFont: 'Montserrat', listWeight: 500, listSize: 5.9,
    coverFont: 'Caveat', coverWeight: 700, coverTextSize: 18,
    kickerText: 'Playlist',
    titleText: '{titulo}',
    infoText: '{artista} · {pistas} canciones, {total}',
    coverText: '{titulo}',
    showGroups: true,
    showHeart: true,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    margin: 6,
    coverSize: 27,
    autoRowHeight: true,
    rowHeight: 2.6,
  },

  presets: [
    { name: 'Malva', style: {} },
    { name: 'Lana y cielo', style: { topColor: '#5B7BA6', coverColor1: '#C9DDF2', coverColor2: '#5B7BA6', coverTextColor: '#1B2A44' } },
    { name: 'Chicle', style: { topColor: '#E2457A', coverColor1: '#FFC2D8', coverColor2: '#E2457A', accentColor: '#FF7AB0' } },
    { name: 'Modo claro', style: { topColor: '#D9C6B8', bgColor: '#FFFFFF', textColor: '#111111', dimColor: '#6A6A6A', coverColor1: '#F2E6DC', coverColor2: '#C4A389', coverTextColor: '#3B2A1E' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'topColor', label: 'Degradado superior', type: 'color' },
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'dimColor', label: 'Texto secundario', type: 'color' },
      { key: 'accentColor', label: 'Botón de play', type: 'color' },
      { key: 'coverColor1', label: 'Portada (sin imagen): color 1', type: 'color' },
      { key: 'coverColor2', label: 'Portada (sin imagen): color 2', type: 'color' },
      { key: 'coverTextColor', label: 'Texto de la portada', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Texto de la portada', family: 'coverFont', weight: 'coverWeight', size: 'coverTextSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'kickerText', label: 'Antetítulo', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleText', label: 'Nombre de la playlist', type: 'text' },
      { key: 'infoText', label: 'Descripción', type: 'text' },
      { key: 'coverText', label: 'Texto de la portada (sin imagen)', type: 'text' },
      { key: 'showGroups', label: 'Mostrar el grupo de cada canción', type: 'toggle', help: 'Usa el campo «Grupo» de cada canción (por ejemplo, el artista).' },
      { key: 'showHeart', label: 'Corazón y botones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 15, step: 0.5, unit: 'mm' },
      { key: 'coverSize', label: 'Tamaño de la portada', type: 'number', min: 15, max: 50, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 1.8, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const imgUrl = asset(state.images.background);
    const body = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, fontVariantNumeric: 'tabular-nums' };
    const dim = { ...body, color: s.dimColor, fontWeight: 400 };
    const digits = String(tracks.length).length;
    const maxAuto = `${(s.listSize * 0.3528 * 2).toFixed(2)}mm`;

    const cover = h('div', {
      style: {
        width: `${s.coverSize}mm`, height: `${s.coverSize}mm`, flex: 'none', borderRadius: '0.6mm', overflow: 'hidden',
        background: imgUrl ? `url("${imgUrl}") center / cover` : `linear-gradient(135deg, ${s.coverColor1}, ${s.coverColor2})`,
        boxShadow: `0 1.5mm 4mm ${rgba('#000000', 0.45)}`, display: 'flex', alignItems: 'flex-end', padding: '2mm', boxSizing: 'border-box',
      },
    }, imgUrl ? null : h('div', {
      text: fillTemplate(s.coverText, values),
      style: { fontFamily: fontStack(s.coverFont), fontWeight: s.coverWeight, fontSize: `${s.coverTextSize}pt`, color: s.coverTextColor, lineHeight: 0.95, textWrap: 'balance' },
    }));

    const head = h('div', { style: { display: 'flex', gap: '4mm', alignItems: 'flex-end', flex: 'none' } },
      cover,
      h('div', { style: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1mm', paddingBottom: '0.5mm' } },
        h('div', { text: fillTemplate(s.kickerText, values), style: { ...body, fontWeight: 600, fontSize: `${s.listSize * 0.95}pt` } }),
        h('div', { text: fillTemplate(s.titleText, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.textColor, lineHeight: 0.98, letterSpacing: '-0.03em', textWrap: 'balance' } }),
        h('div', { text: fillTemplate(s.infoText, values), style: { ...dim, fontSize: `${s.listSize * 0.95}pt` } })));

    const controls = h('div', { style: { display: 'flex', alignItems: 'center', gap: '3.5mm', margin: '2.6mm 0 1.6mm', flex: 'none' } },
      h('div', { style: { width: '7mm', height: '7mm', borderRadius: '50%', background: s.accentColor, display: 'grid', placeItems: 'center', flex: 'none' } },
        icon('M8 5.5v13l11-6.5z', s.bgColor, 4)),
      s.showHeart ? icon('M12 20s-7-4.4-9.3-9C1.2 7.7 3.3 4 6.8 4c2 0 3.6 1.1 5.2 3 1.6-1.9 3.2-3 5.2-3 3.5 0 5.6 3.7 4.1 7-2.3 4.6-9.3 9-9.3 9z', s.dimColor, 4.6, false) : null,
      s.showHeart ? icon('M12 4v12M6 11l6 6 6-6M5 20h14', s.dimColor, 4.2, false) : null,
      s.showHeart ? icon('M5 12h.1M12 12h.1M19 12h.1', s.dimColor, 4.2, false) : null);

    const headerRow = h('div', {
      style: { ...dim, display: 'flex', alignItems: 'center', gap: '2mm', paddingBottom: '1mm', borderBottom: `0.2mm solid ${rgba(s.dimColor, 0.35)}`, marginBottom: '1mm', flex: 'none', fontSize: `${s.listSize * 0.9}pt` },
    },
    h('span', { text: '#', style: { width: `${digits * 0.65 + 0.4}em`, textAlign: 'right', flex: 'none' } }),
    h('span', { text: 'Título', style: { flex: '1 1 auto' } }),
    icon('M12 7v5l3 2M12 3a9 9 0 1 1 0 18a9 9 0 1 1 0-18z', s.dimColor, 2.6, false));

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...tracks.map((t) => {
        const group = s.showGroups ? (state.tracks[t.index]?.group || '').trim() : '';
        return h('div', {
          style: {
            ...body, display: 'flex', alignItems: 'center', gap: '2mm',
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`,
          },
        },
        h('span', { text: String(t.number), style: { ...dim, color: t.numberColor || s.dimColor, width: `${digits * 0.65 + 0.4}em`, textAlign: 'right', flex: 'none' } }),
        h('div', { style: { flex: '1 1 auto', minWidth: 0, display: 'flex', alignItems: 'baseline', gap: '1.4mm', overflow: 'hidden' } },
          h('span', {
            class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
            style: { flex: '0 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.35 },
          }),
          group ? h('span', { text: group, style: { ...dim, fontSize: '0.88em', whiteSpace: 'pre', flex: '0 100 auto', minWidth: 0, overflow: 'hidden' } }) : null),
        h('span', { text: t.duration, style: { ...dim, flex: 'none' } }));
      }));

    return h('div', {
      style: { position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${s.topColor} 0, ${rgba(s.topColor, 0.55)} 30mm, ${s.bgColor} 62mm)`, backgroundColor: s.bgColor },
    }, h('div', { style: { position: 'absolute', inset: `${s.margin}mm`, display: 'flex', flexDirection: 'column' } },
      head, controls, headerRow, list));
  },
};
