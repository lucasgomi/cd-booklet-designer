// Plantilla 2 — «Ticket».
// La lista como un ticket de compra centrado sobre un fondo: monoespaciada,
// separadores de guiones, puntitos hasta la duración, total, textos de pie
// personalizables y código de barras o QR editable.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, stripAccents, PLACEHOLDER_HELP } from '../text.js';
import { barcodeSvg, decorativeBarcodeSvg, qrSvg } from '../codes.js';
import { TOTAL_FORMAT_CONTROL, COLUMNS_CONTROL, listColumns, columnize } from './common.js';

/** Borde inferior en zigzag como clip-path. */
function zigzagClip(widthMm, heightMm, toothMm) {
  const n = Math.max(4, Math.round(widthMm / toothMm));
  const step = 100 / n;
  const depth = (toothMm * 0.55 / heightMm) * 100;
  const pts = ['0% 0%', '100% 0%', `100% ${100 - depth}%`];
  for (let i = n; i > 0; i -= 1) {
    pts.push(`${(i - 0.5) * step}% 100%`, `${(i - 1) * step}% ${100 - depth}%`);
  }
  return `polygon(${pts.join(', ')})`;
}

export default {
  id: 'ticket',
  name: 'Ticket',
  description: 'La lista como un ticket de compra sobre un fondo.',

  defaults: {
    // Colores
    bgColor: '#163A82',
    paperColor: '#F5F0E6',
    textColor: '#1E1E1E',
    accentColor: '#E2766B',
    leaderColor: '#555555',
    codeColor: '#1E1E1E',
    paperShadow: true,
    zigzag: true,
    useBgImage: false,
    // Tipografías
    titleFont: 'Space Mono', titleWeight: 700, titleSize: 11.5,
    titleWidth: 75,
    listFont: 'Space Mono', listWeight: 400, listSize: 6.2,
    // Textos (personalizables)
    titleText: '{artista}',
    line1: '✻ {titulo} ✻[ DISCO Nº {disco} ✻]',
    line2: 'MAQUINA: CD-R 80 MIN  ·  CAJA SLIM',
    colNumber: 'Nº',
    colTitle: 'ARTICULO',
    colTime: 'MIN',
    footerLeft: '{pistas} PISTAS',
    footerRight: 'TOTAL  {total}',
    extraText: 'PAGO: 100% SIN PERDIDA (FLAC)',
    thanksText: 'GRACIAS POR SU VISITA · VUELVA PRONTO',
    uppercase: true,
    noAccents: true,
    padNumbers: true,
    useShortTitles: true,
    durationFormat: 'mm:ss',
    totalFormat: 'h-min-compact',
    separatorChar: '-',
    leaderChar: '.',
    // Código
    codeType: 'decorative',
    codeContent: '{artista} {titulo} {disco}',
    codeHeight: 6,
    codeBars: 26,
    codeWidth: 46,
    // Espaciado (mm)
    paperWidth: 80,
    paperTop: 0,
    paperBottom: 4,
    paperPadX: 6,
    paperPadTop: 3.5,
    paperPadBottom: 2,
    autoRowHeight: true,
    rowHeight: 2.5,
    columns: 'auto',
  },

  presets: [
    { name: 'Azul (muestra)', style: {} },
    { name: 'Térmico clásico', style: { bgColor: '#D9D6CF', paperColor: '#FFFFFF', textColor: '#222222', accentColor: '#222222', leaderColor: '#999999', codeColor: '#222222', titleFont: 'Courier Prime', listFont: 'Courier Prime' } },
    { name: 'Rosa', style: { bgColor: '#FF7AA8', paperColor: '#FFF6F0', textColor: '#3B1E2B', accentColor: '#E0337A', leaderColor: '#C08AA0', codeColor: '#3B1E2B' } },
    { name: 'Noche', style: { bgColor: '#0E0F13', paperColor: '#1C1E25', textColor: '#ECE8DE', accentColor: '#F2C14E', leaderColor: '#6F6B62', codeColor: '#ECE8DE' } },
    { name: 'Verde factura', style: { bgColor: '#1F5C46', paperColor: '#EEF3EA', textColor: '#1C2B22', accentColor: '#2F8F5B', leaderColor: '#7E9A88', codeColor: '#1C2B22', listFont: 'IBM Plex Mono', titleFont: 'IBM Plex Mono' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'paperColor', label: 'Papel del ticket', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'accentColor', label: 'Números y detalles', type: 'color' },
      { key: 'leaderColor', label: 'Puntitos', type: 'color' },
      { key: 'codeColor', label: 'Código de barras / QR', type: 'color' },
      { key: 'paperShadow', label: 'Sombra del papel', type: 'toggle' },
      { key: 'zigzag', label: 'Borde inferior dentado', type: 'toggle' },
      { key: 'useBgImage', label: 'Usar la imagen de fondo (pestaña «Imágenes»)', type: 'toggle' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista y textos', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos del ticket', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleWidth', label: 'Ancho máximo del título', type: 'number', min: 30, max: 100, step: 1, unit: '%' },
      { key: 'line1', label: 'Línea 1 (color de detalle)', type: 'text' },
      { key: 'line2', label: 'Línea 2', type: 'text' },
      { key: 'colNumber', label: 'Columna «número»', type: 'text', half: true },
      { key: 'colTime', label: 'Columna «duración»', type: 'text', half: true },
      { key: 'colTitle', label: 'Columna «título»', type: 'text' },
      { key: 'footerLeft', label: 'Pie izquierda', type: 'text', half: true },
      { key: 'footerRight', label: 'Pie derecha', type: 'text', half: true },
      { key: 'extraText', label: 'Texto libre (varias líneas)', type: 'textarea' },
      { key: 'thanksText', label: 'Despedida', type: 'text' },
      { key: 'uppercase', label: 'Todo en mayúsculas', type: 'toggle' },
      { key: 'noAccents', label: 'Sin tildes (como una impresora térmica)', type: 'toggle' },
      { key: 'padNumbers', label: 'Números con cero (01, 02…)', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
      { key: 'separatorChar', label: 'Separador', type: 'text', half: true, maxLength: 3 },
      { key: 'leaderChar', label: 'Relleno', type: 'text', half: true, maxLength: 3 },
    ] },
    { section: 'Código de barras / QR', items: [
      { key: 'codeType', label: 'Tipo', type: 'select', options: [
        { value: 'decorative', label: 'Código de barras decorativo' },
        { value: 'barcode', label: 'Código de barras real (Code 128, escaneable)' },
        { value: 'qr', label: 'Código QR' },
        { value: 'none', label: 'Ninguno' }] },
      { key: 'codeContent', label: 'Contenido (texto o enlace)', type: 'text', help: 'Admite los mismos campos: {artista}, {titulo}… En el decorativo, cambiar el texto cambia el dibujo de las barras. Un enlace en un QR se puede escanear con el móvil.', when: (s) => s.codeType !== 'none' },
      { key: 'codeBars', label: 'Número de barras', type: 'number', min: 8, max: 60, step: 1, when: (s) => s.codeType === 'decorative' },
      { key: 'codeWidth', label: 'Ancho del código de barras', type: 'number', min: 15, max: 70, step: 1, unit: 'mm', when: (s) => s.codeType === 'barcode' || s.codeType === 'decorative' },
      { key: 'codeHeight', label: 'Alto / tamaño del código', type: 'number', min: 3, max: 30, step: 0.5, unit: 'mm', when: (s) => s.codeType !== 'none' },
    ] },
    { section: 'Espaciado', items: [
      { key: 'paperWidth', label: 'Ancho del ticket', type: 'number', min: 50, max: 120, step: 0.5, unit: 'mm' },
      { key: 'paperTop', label: 'Hueco superior', type: 'number', min: 0, max: 30, step: 0.5, unit: 'mm' },
      { key: 'paperBottom', label: 'Hueco inferior', type: 'number', min: 0, max: 30, step: 0.5, unit: 'mm' },
      { key: 'paperPadX', label: 'Margen interior lateral', type: 'number', min: 1, max: 15, step: 0.5, unit: 'mm' },
      { key: 'paperPadTop', label: 'Margen interior superior', type: 'number', min: 1, max: 20, step: 0.5, unit: 'mm' },
      { key: 'paperPadBottom', label: 'Margen interior inferior', type: 'number', min: 1, max: 20, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 1.5, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
      COLUMNS_CONTROL,
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
    const fill = (tplText) => tx(fillTemplate(tplText, values));
    const bgUrl = s.useBgImage ? asset(state.images.background) : null;
    const mono = { fontFamily: fontStack(s.listFont), fontSize: `${s.listSize}pt`, fontWeight: s.listWeight, color: s.textColor, fontVariantNumeric: 'tabular-nums' };
    const bold = { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight };
    const center = { textAlign: 'center' };
    const line = (text, extra = {}) => (text ? h('div', { text, style: { ...mono, ...center, whiteSpace: 'pre-wrap', lineHeight: 1.3, ...extra } }) : null);
    const sep = () => h('div', {
      text: (s.separatorChar || '-').repeat(400),
      style: { ...mono, whiteSpace: 'pre', overflow: 'hidden', lineHeight: 1, margin: '0.7mm 0', flex: 'none', textAlign: 'center' },
    });
    const digits = Math.max(2, String(tracks.length).length);
    const numW = `${(s.padNumbers ? digits : String(tracks.length).length) + 1.6}ch`;

    const paperH = 120 - s.paperTop - s.paperBottom;
    const paper = h('div', {
      style: {
        position: 'absolute', inset: 0, background: s.paperColor,
        clipPath: s.zigzag ? zigzagClip(s.paperWidth, paperH, 2.6) : 'none',
        padding: `${s.paperPadTop}mm ${s.paperPadX}mm ${s.paperPadBottom + (s.zigzag ? 1.5 : 0)}mm`,
        display: 'flex', flexDirection: 'column', boxSizing: 'border-box',
      },
    });

    const title = fill(s.titleText);
    if (title) {
      paper.appendChild(h('div', {
        text: title,
        style: { ...bold, fontSize: `${s.titleSize}pt`, color: s.textColor, ...center, lineHeight: 1.08, marginBottom: '1.2mm', textWrap: 'balance', maxWidth: `${s.titleWidth}%`, alignSelf: 'center' },
      }));
    }
    paper.appendChild(line(fill(s.line1), { color: s.accentColor }));
    paper.appendChild(line(fill(s.line2)));
    paper.appendChild(sep());

    const row = (num, titleEl, time, extra = {}) => h('div', {
      style: { ...mono, display: 'flex', alignItems: 'center', whiteSpace: 'pre', lineHeight: 1, ...extra },
    }, h('div', { style: { width: numW, flex: 'none' } }, num), titleEl, h('div', { style: { flex: 'none', paddingLeft: '1.5ch' } }, time));

    paper.appendChild(row(
      h('span', { text: tx(s.colNumber), style: { ...bold } }),
      h('div', { text: tx(s.colTitle), style: { ...bold, flex: '1 1 auto' } }),
      h('span', { text: tx(s.colTime), style: { ...bold } }),
      { margin: '0.2mm 0' },
    ));
    paper.appendChild(sep());

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } });
    const leader = (s.leaderChar || '.').repeat(300);
    const maxAuto = `${(s.listSize * 0.3528 * 1.9).toFixed(2)}mm`;
    tracks.forEach((t) => {
      const titleEl = h('div', {
        class: 'fit', text: tx(t.title), 'data-track-index': t.index, 'data-full-title': t.fullTitle,
        style: { flex: '0 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.4 },
      });
      titleEl._fitTransform = tx;
      const lead = h('div', {
        text: leader,
        style: { flex: '1 1 0', minWidth: '2ch', overflow: 'hidden', whiteSpace: 'pre', direction: 'rtl', color: s.leaderColor, marginLeft: '1ch' },
      });
      const num = s.padNumbers ? String(t.number).padStart(digits, '0') : String(t.number);
      const r = row(h('span', { text: num, style: { color: t.numberColor || s.accentColor } }), h('div', {
        style: { flex: '1 1 auto', minWidth: 0, display: 'flex' },
      }, titleEl, lead), t.duration);
      r.style.flex = s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`;
      if (s.autoRowHeight) r.style.maxHeight = maxAuto;
      r.style.minHeight = `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`;
      list.appendChild(r);
    });
    paper.appendChild(columnize(list, listColumns(s), '4mm'));
    paper.appendChild(sep());

    const footL = fill(s.footerLeft);
    const footR = fill(s.footerRight);
    if (footL || footR) {
      paper.appendChild(h('div', {
        style: { ...mono, ...bold, display: 'flex', justifyContent: 'space-between', whiteSpace: 'pre', margin: '0.4mm 0 0.6mm' },
      }, h('span', { text: footL }), h('span', { text: footR })));
    }
    paper.appendChild(line(fill(s.extraText)));

    if (s.codeType !== 'none') {
      const content = fillTemplate(s.codeContent, values) || 'CD';
      const code = s.codeType === 'qr'
        ? qrSvg(content, { color: s.codeColor, sizeMm: s.codeHeight * 1.6 })
        : s.codeType === 'decorative'
          ? decorativeBarcodeSvg(content, { color: s.codeColor, widthMm: s.codeWidth, heightMm: s.codeHeight, bars: s.codeBars })
          : barcodeSvg(content, { color: s.codeColor, widthMm: s.codeWidth, heightMm: s.codeHeight });
      code.style.margin = '1.6mm auto 0.6mm';
      code.style.flex = 'none';
      paper.appendChild(code);
    }
    paper.appendChild(line(fill(s.thanksText), { color: s.accentColor, marginTop: s.codeType === 'none' ? '2mm' : 0 }));

    const wrap = h('div', {
      style: {
        position: 'absolute', left: `${(120 - s.paperWidth) / 2}mm`, width: `${s.paperWidth}mm`,
        top: `${s.paperTop}mm`, bottom: `${s.paperBottom}mm`,
        filter: s.paperShadow ? `drop-shadow(0 0.8mm 1.4mm ${rgba('#000000', 0.35)})` : 'none',
      },
    }, paper);

    return h('div', {
      style: {
        position: 'absolute', inset: 0, background: s.bgColor,
        backgroundImage: bgUrl ? `url("${bgUrl}")` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
      },
    }, wrap);
  },
};
