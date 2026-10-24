// Plantilla 4 — «Setlist».
// La hoja de setlist pegada en el escenario: papel ligeramente girado,
// trozos de cinta adhesiva, letras grandes y líneas de cuaderno.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, stripAccents, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'setlist',
  name: 'Setlist',
  description: 'Hoja de setlist con cinta adhesiva y letras grandes.',

  defaults: {
    bgColor: '#2B2B2E',
    useBgImage: false,
    paperColor: '#FBFAF6',
    textColor: '#151515',
    accentColor: '#D63A2F',
    lineColor: '#9DB8D9',
    tapeColor: '#E9DFB8',
    showTape: true,
    showLines: true,
    showMargin: true,
    showDurations: true,
    paperShadow: true,
    titleFont: 'Anton', titleWeight: 400, titleSize: 15,
    listFont: 'Bebas Neue', listWeight: 400, listSize: 7.6,
    infoFont: 'Courier Prime', infoWeight: 700, infoSize: 6.8,
    titleText: '{artista}',
    infoText: '{titulo}[ — Nº {disco}][ — {fecha}]',
    footerText: '{pistas} canciones · {total}',
    uppercase: true,
    noAccents: false,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: '',
    rotation: -1.2,
    paperInset: 6,
    paperPad: 4.5,
    autoRowHeight: true,
    rowHeight: 3.4,
  },

  presets: [
    { name: 'Escenario', style: {} },
    { name: 'Rotulador rojo', style: { textColor: '#C3261C', accentColor: '#151515', bgColor: '#101012' } },
    { name: 'Papel kraft', style: { paperColor: '#D9C3A0', lineColor: '#B59B72', tapeColor: '#F3F0E7', bgColor: '#3C2F25', accentColor: '#2B2118', showMargin: false } },
    { name: 'Neón', style: { bgColor: '#120A26', paperColor: '#1D1438', textColor: '#F4F1FF', accentColor: '#FF4FD8', lineColor: '#3B2E6E', tapeColor: '#56E3FF', paperShadow: true } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'useBgImage', label: 'Usar la imagen de fondo (pestaña «Imágenes»)', type: 'toggle' },
      { key: 'paperColor', label: 'Papel', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'accentColor', label: 'Números y detalles', type: 'color' },
      { key: 'lineColor', label: 'Líneas de cuaderno', type: 'color', when: (s) => s.showLines },
      { key: 'tapeColor', label: 'Cinta adhesiva', type: 'color', when: (s) => s.showTape },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Canciones', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { type: 'font', label: 'Datos y pie', family: 'infoFont', weight: 'infoWeight', size: 'infoSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'uppercase', label: 'Canciones en mayúsculas', type: 'toggle' },
      { key: 'noAccents', label: 'Sin tildes', type: 'toggle' },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Papel', items: [
      { key: 'rotation', label: 'Giro del papel', type: 'number', min: -6, max: 6, step: 0.1, unit: '°' },
      { key: 'showTape', label: 'Cinta adhesiva', type: 'toggle' },
      { key: 'showLines', label: 'Líneas de cuaderno', type: 'toggle' },
      { key: 'showMargin', label: 'Margen rojo', type: 'toggle' },
      { key: 'paperShadow', label: 'Sombra', type: 'toggle' },
      { key: 'paperInset', label: 'Hueco alrededor del papel', type: 'number', min: 0, max: 20, step: 0.5, unit: 'mm' },
      { key: 'paperPad', label: 'Margen interior', type: 'number', min: 2, max: 15, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 10, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const tx = (str) => {
      let out = str || '';
      if (s.noAccents) out = stripAccents(out);
      if (s.uppercase) out = out.toUpperCase();
      return out;
    };
    const bgUrl = s.useBgImage ? asset(state.images.background) : null;
    const small = { fontFamily: fontStack(s.infoFont), fontWeight: s.infoWeight, fontSize: `${s.infoSize}pt`, color: s.accentColor, letterSpacing: '0.04em' };
    const rowMin = s.listSize * 0.3528 * 0.9;
    const maxAuto = `${(s.listSize * 0.3528 * 1.7).toFixed(2)}mm`;
    // Columna de números a la izquierda; el margen rojo cae justo después.
    const numW = 4.2;
    const numGap = s.showMargin ? 2.6 : 1.6;
    const indent = numW + numGap;

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...tracks.map((t) => {
        const title = h('span', {
          class: 'fit', text: tx(t.title), 'data-track-index': t.index, 'data-full-title': t.fullTitle,
          style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.15 },
        });
        title._fitTransform = tx;
        return h('div', {
          style: {
            display: 'flex', alignItems: 'flex-end', gap: '1.6mm',
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${rowMin.toFixed(2)}mm`,
            fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor,
            borderBottom: s.showLines ? `0.18mm solid ${s.lineColor}` : 'none', paddingBottom: '0.3mm', fontVariantNumeric: 'tabular-nums',
          },
        },
        h('span', { text: String(t.number), style: { ...small, color: t.numberColor || s.accentColor, width: `${numW}mm`, flex: 'none', textAlign: 'right', marginRight: `${numGap - 1.6}mm`, paddingBottom: '0.4mm' } }),
        title,
        s.showDurations ? h('span', { text: t.duration, style: { ...small, flex: 'none', color: rgba(s.textColor, 0.6), paddingBottom: '0.4mm' } }) : null);
      }));

    const info = fillTemplate(s.infoText, values);
    const footer = fillTemplate(s.footerText, values);
    const content = h('div', {
      style: { position: 'absolute', inset: `${s.paperPad}mm ${s.paperPad}mm ${s.paperPad}mm 2mm`, display: 'flex', flexDirection: 'column' },
    },
    h('div', {
      text: fillTemplate(s.titleText, values),
      style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.textColor, lineHeight: 0.98, textTransform: 'uppercase', textWrap: 'balance', flex: 'none', paddingLeft: `${indent}mm` },
    }),
    info ? h('div', { text: info.toUpperCase(), style: { ...small, margin: '1.4mm 0 2mm', flex: 'none', paddingLeft: `${indent}mm` } }) : null,
    list,
    footer ? h('div', { text: footer.toUpperCase(), style: { ...small, color: rgba(s.textColor, 0.7), marginTop: '1.6mm', textAlign: 'right', flex: 'none' } }) : null);

    const paper = h('div', {
      style: {
        position: 'absolute', inset: `${s.paperInset}mm`, background: s.paperColor, transform: `rotate(${s.rotation}deg)`,
        boxShadow: s.paperShadow ? `0 1mm 3mm ${rgba('#000000', 0.45)}` : 'none',
      },
    },
    s.showMargin ? h('div', { style: { position: 'absolute', top: 0, bottom: 0, left: `${2 + numW + numGap / 2}mm`, width: '0.25mm', background: rgba('#E0524A', 0.7) } }) : null,
    content);
    if (s.showTape) {
      const tape = (left, rot) => h('div', {
        style: {
          position: 'absolute', top: '-2.5mm', left, width: '18mm', height: '6mm', background: rgba(s.tapeColor, 0.82),
          transform: `rotate(${rot}deg)`, boxShadow: `0 0.2mm 0.6mm ${rgba('#000000', 0.15)}`,
        },
      });
      paper.append(tape('8mm', -8), tape('calc(100% - 26mm)', 7));
    }

    return h('div', {
      style: {
        position: 'absolute', inset: 0, background: s.bgColor,
        backgroundImage: bgUrl ? `url("${bgUrl}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
      },
    }, paper);
  },
};
