// «Polaroid» — página de álbum de recortes: una polaroid con la foto,
// cinta washi, dibujitos, el título a mano y la lista en una hoja de
// cuaderno con el borde arrancado.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

/** Borde superior irregular (papel arrancado), determinista. */
function tornClip() {
  const pts = [];
  let seed = 7;
  const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let x = 0; x <= 100; x += 2.5) pts.push(`${x}% ${(rand() * 2.2).toFixed(2)}mm`);
  return `polygon(${pts.join(', ')}, 100% 100%, 0 100%)`;
}

export default {
  id: 'polaroid',
  category: 'Objetos',
  name: 'Polaroid',
  description: 'Álbum de recortes: polaroid, cinta washi y hoja de cuaderno.',

  defaults: {
    bgColor: '#E9DCC9',
    paperColor: '#FFFEFA',
    lineColor: '#B8CDE6',
    photoColor1: '#F4B6C2',
    photoColor2: '#9BC1E8',
    tapeColor: '#F7C8D4',
    tape2Color: '#BFE3D0',
    inkColor: '#2B2B2B',
    accentColor: '#E25C7B',
    dimColor: '#8F8579',
    useBgImage: true,
    doodles: true,
    titleFont: 'Caveat', titleWeight: 700, titleSize: 22,
    listFont: 'Caveat', listWeight: 500, listSize: 8.6,
    captionText: '{titulo} ♡',
    titleText: '{artista}',
    infoText: '[nº {disco} · ][{fecha} · ]{pistas} canciones · {total}',
    useShortTitles: true,
    showDurations: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    photoRotation: -4,
    paperRotation: 1,
    autoRowHeight: true,
    rowHeight: 3.2,
  },

  presets: [
    { name: 'Verano', style: {} },
    { name: 'Corcho', style: { bgColor: '#C49A6C', tapeColor: '#FFE08A', tape2Color: '#F2A7A7', accentColor: '#C2410C' } },
    { name: 'Blanco y negro', style: { bgColor: '#EDEDED', photoColor1: '#BDBDBD', photoColor2: '#3A3A3A', tapeColor: '#2B2B2B', tape2Color: '#9E9E9E', accentColor: '#2B2B2B', lineColor: '#D0D0D0' } },
    { name: 'Lavanda', style: { bgColor: '#E4DDF4', photoColor1: '#CDB8F2', photoColor2: '#F7C6E0', tapeColor: '#C9B6F2', tape2Color: '#FFD9A8', accentColor: '#7C4DCC', lineColor: '#D2C6EE' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'paperColor', label: 'Hoja de cuaderno', type: 'color' },
      { key: 'lineColor', label: 'Líneas', type: 'color' },
      { key: 'useBgImage', label: 'Foto = imagen de fondo («Imágenes»)', type: 'toggle' },
      { key: 'photoColor1', label: 'Foto sin imagen: color 1', type: 'color' },
      { key: 'photoColor2', label: 'Foto sin imagen: color 2', type: 'color' },
      { key: 'tapeColor', label: 'Cinta washi 1', type: 'color' },
      { key: 'tape2Color', label: 'Cinta washi 2', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'accentColor', label: 'Detalles y números', type: 'color' },
      { key: 'dimColor', label: 'Duraciones', type: 'color' },
      { key: 'doodles', label: 'Dibujitos (estrellas, corazones)', type: 'toggle' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'captionText', label: 'Pie de la polaroid', type: 'text' },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Composición', items: [
      { key: 'photoRotation', label: 'Giro de la polaroid', type: 'number', min: -12, max: 12, step: 0.5, unit: '°' },
      { key: 'paperRotation', label: 'Giro de la hoja', type: 'number', min: -5, max: 5, step: 0.1, unit: '°' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const imgUrl = s.useBgImage ? asset(state.images.background) : null;
    const hand = (size, color = s.inkColor, weight = s.listWeight) => ({ fontFamily: fontStack(s.listFont), fontWeight: weight, fontSize: `${size}pt`, color });
    const tape = (style, color) => h('div', {
      style: {
        position: 'absolute', height: '5.5mm', width: '20mm', background: rgba(color, 0.85),
        backgroundImage: `repeating-linear-gradient(45deg, ${rgba('#FFFFFF', 0.25)} 0 0.8mm, transparent 0.8mm 1.8mm)`,
        boxShadow: `0 0.2mm 0.5mm ${rgba('#000000', 0.12)}`, clipPath: 'polygon(2% 0, 98% 4%, 100% 50%, 97% 100%, 1% 96%, 0 45%)', ...style,
      },
    });

    // Polaroid.
    const PW = 50;
    const photo = h('div', {
      style: {
        position: 'absolute', left: '6mm', top: '5mm', width: `${PW}mm`, height: `${PW * 1.18}mm`, background: '#FFFFFF', padding: '3mm 3mm 0', boxSizing: 'border-box',
        transform: `rotate(${s.photoRotation}deg)`, boxShadow: `0 1mm 2.5mm ${rgba('#000000', 0.28)}`,
      },
    },
    h('div', {
      style: {
        width: '100%', height: `${PW - 6}mm`,
        background: imgUrl ? `url("${imgUrl}") center / cover` : `linear-gradient(160deg, ${s.photoColor1}, ${s.photoColor2})`,
        filter: 'saturate(1.05) contrast(0.98)', boxShadow: `inset 0 0 6mm ${rgba('#000000', 0.12)}`,
      },
    }),
    h('div', { text: fillTemplate(s.captionText, values), style: { ...hand(s.listSize * 1.5), textAlign: 'center', marginTop: '1.6mm', whiteSpace: 'nowrap', overflow: 'hidden' } }),
    tape({ left: '50%', top: '-2.6mm', transform: 'translateX(-50%) rotate(3deg)' }, s.tapeColor));

    // Título y datos a la derecha.
    const title = h('div', {
      style: { position: 'absolute', left: `${PW + 12}mm`, right: '6mm', top: '12mm', transform: 'rotate(-2deg)' },
    },
    h('div', { text: fillTemplate(s.titleText, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.inkColor, lineHeight: 0.95, textWrap: 'balance' } }),
    h('div', { style: { height: '1.2mm', width: '70%', margin: '1.6mm 0 1.8mm', background: rgba(s.accentColor, 0.55), borderRadius: '1mm', transform: 'rotate(-1deg)' } }),
    h('div', { text: fillTemplate(s.infoText, values), style: { ...hand(s.listSize * 0.95, s.dimColor), lineHeight: 1.1 } }));

    const doodles = s.doodles ? [
      h('div', { text: '✦', style: { position: 'absolute', left: '102mm', top: '5mm', ...hand(14, s.accentColor), transform: 'rotate(12deg)' } }),
      h('div', { text: '♡', style: { position: 'absolute', left: '108mm', top: '42mm', ...hand(12, s.accentColor), transform: 'rotate(-10deg)' } }),
      h('div', { text: '✧', style: { position: 'absolute', left: '62mm', top: '50mm', ...hand(10, s.accentColor) } }),
    ] : [];

    // Hoja de cuaderno con la lista.
    const half = Math.ceil(tracks.length / 2);
    const rowMin = s.listSize * 0.3528 * 0.95;
    const maxAuto = `${(s.listSize * 0.3528 * 1.5).toFixed(2)}mm`;
    const column = (list) => h('div', { class: 'fit-v', style: { flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...list.map((t) => h('div', {
        style: {
          display: 'flex', alignItems: 'flex-end', gap: '1.2mm', ...hand(s.listSize),
          flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${rowMin.toFixed(2)}mm`,
          borderBottom: `0.18mm solid ${s.lineColor}`,
        },
      },
      h('span', { text: `${t.number}.`, style: { color: t.numberColor || s.accentColor, flex: 'none', minWidth: '1.3em', fontWeight: 700 } }),
      h('span', { class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle, style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.1 } }),
      s.showDurations ? h('span', { text: t.duration, style: { color: s.dimColor, flex: 'none', fontSize: '0.85em' } }) : null)));

    const paper = h('div', {
      style: {
        position: 'absolute', left: '5mm', right: '5mm', top: '66mm', bottom: '4mm', transform: `rotate(${s.paperRotation}deg)`,
        filter: `drop-shadow(0 0.8mm 1.4mm ${rgba('#000000', 0.25)})`,
      },
    },
    h('div', {
      style: { position: 'absolute', inset: 0, background: s.paperColor, clipPath: tornClip(), padding: '4mm 5mm 3mm 9mm', boxSizing: 'border-box', display: 'flex', gap: '5mm' },
    },
    h('div', { style: { position: 'absolute', left: '6mm', top: 0, bottom: 0, width: '0.25mm', background: rgba('#E0524A', 0.6) } }),
    column(tracks.slice(0, half)), column(tracks.slice(half))),
    tape({ right: '6mm', top: '-1.5mm', transform: 'rotate(-6deg)', width: '16mm' }, s.tape2Color));

    return h('div', {
      style: {
        position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden',
        backgroundImage: `radial-gradient(${rgba('#000000', 0.05)} 0.2mm, transparent 0.25mm)`, backgroundSize: '1.6mm 1.6mm',
      },
    }, paper, photo, title, ...doodles);
  },
};
