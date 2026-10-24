// Plantilla 1 — «Cabecera + lista».
// Cabecera con imagen de fondo, título y línea de datos; debajo la lista en
// una columna con filas alternas resaltadas y barra lateral opcional.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'header-list',
  name: 'Cabecera + lista',
  description: 'Cabecera con imagen, título y datos; lista en una columna.',

  defaults: {
    // Colores
    bgColor: '#FAF8F3',
    headerColor: '#1F4A98',
    headerOverlay: 0,
    headerTitleColor: '#FFFFFF',
    headerInfoColor: '#FFFFFF',
    titleShadow: true,
    trackTitleColor: '#1F2430',
    numberColor: '#2A4E8F',
    durationColor: '#7A7F8C',
    rowColor: '#F2C4B8',
    rowOpacity: 0.45,
    rowAlternate: 'odd',
    rowRounded: true,
    showSidebar: true,
    sidebarColor: '#F29C8F',
    // Tipografías
    titleFont: 'Fraunces', titleWeight: 800, titleSize: 16,
    infoFont: 'Inter', infoWeight: 500, infoSize: 7.6,
    listFont: 'Inter', listWeight: 400, listSize: 8.4,
    numberWeight: 700,
    // Textos
    titleText: '{artista}',
    infoText: '{titulo}[ · Nº {disco}][ · {fecha}] · {pistas} PISTAS · {total}',
    infoUppercase: true,
    useShortTitles: false,
    durationFormat: 'mm:ss',
    totalFormat: '',
    // Imagen de cabecera
    bgPosY: 50,
    bgZoom: 100,
    // Espaciado (mm)
    headerHeight: 24,
    headerPadX: 8,
    marginX: 4.5,
    marginTop: 5,
    marginBottom: 7,
    autoRowHeight: true,
    rowHeight: 3.2,
    sidebarWidth: 1.2,
  },

  presets: [
    { name: 'Cielo (muestra)', style: {} },
    { name: 'Medianoche', style: {
      bgColor: '#12141A', headerColor: '#0B0D12', headerOverlay: 0.35, trackTitleColor: '#E9E7E2', numberColor: '#8FB4FF',
      durationColor: '#8A8F9C', rowColor: '#2A3550', rowOpacity: 0.6, sidebarColor: '#8FB4FF' } },
    { name: 'Chicle', style: {
      bgColor: '#FFF4F8', headerColor: '#FF5FA2', trackTitleColor: '#3A1630', numberColor: '#FF2E88', durationColor: '#B07A98',
      rowColor: '#FFC2DD', rowOpacity: 0.55, sidebarColor: '#FF5FA2', titleFont: 'Poppins', titleWeight: 800, listFont: 'Poppins' } },
    { name: 'Bosque', style: {
      bgColor: '#F1F0E6', headerColor: '#2F4A35', trackTitleColor: '#1E2A20', numberColor: '#2F6B44', durationColor: '#7C8676',
      rowColor: '#C9D8B6', rowOpacity: 0.55, sidebarColor: '#6E9A5B', titleFont: 'Young Serif', titleWeight: 400 } },
    { name: 'Periódico', style: {
      bgColor: '#FFFFFF', headerColor: '#111111', trackTitleColor: '#111111', numberColor: '#111111', durationColor: '#555555',
      rowColor: '#E9E9E9', rowOpacity: 1, rowRounded: false, showSidebar: false, titleFont: 'Playfair Display', titleWeight: 900, listFont: 'Lora', titleShadow: false } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'headerColor', label: 'Cabecera', type: 'color' },
      { key: 'headerOverlay', label: 'Tinte sobre la imagen', type: 'opacity' },
      { key: 'headerTitleColor', label: 'Título de cabecera', type: 'color' },
      { key: 'headerInfoColor', label: 'Línea de datos', type: 'color' },
      { key: 'trackTitleColor', label: 'Títulos de canciones', type: 'color' },
      { key: 'numberColor', label: 'Números', type: 'color' },
      { key: 'durationColor', label: 'Duraciones', type: 'color' },
      { key: 'rowColor', label: 'Filas resaltadas', type: 'color' },
      { key: 'rowOpacity', label: 'Opacidad de filas', type: 'opacity' },
      { key: 'sidebarColor', label: 'Barra lateral', type: 'color', when: (s) => s.showSidebar },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Línea de datos', family: 'infoFont', weight: 'infoWeight', size: 'infoSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
      { key: 'numberWeight', label: 'Grosor de los números', type: 'select', options: [300, 400, 500, 600, 700, 800, 900].map((v) => ({ value: v, label: String(v) })) },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoText', label: 'Línea de datos', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'infoUppercase', label: 'Línea de datos en mayúsculas', type: 'toggle' },
      { key: 'titleShadow', label: 'Sombra en el título', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Lista', items: [
      { key: 'rowAlternate', label: 'Filas resaltadas', type: 'select', options: [
        { value: 'odd', label: 'Impares (1, 3, 5…)' }, { value: 'even', label: 'Pares (2, 4, 6…)' }, { value: 'none', label: 'Ninguna' }] },
      { key: 'rowRounded', label: 'Filas redondeadas', type: 'toggle' },
      { key: 'showSidebar', label: 'Barra vertical a la izquierda', type: 'toggle' },
      { key: 'sidebarWidth', label: 'Grosor de la barra', type: 'number', min: 0.4, max: 4, step: 0.1, unit: 'mm', when: (s) => s.showSidebar },
    ] },
    { section: 'Imagen de cabecera', items: [
      { key: 'bgPosY', label: 'Encuadre vertical', type: 'number', min: 0, max: 100, step: 1, unit: '%' },
      { key: 'bgZoom', label: 'Zoom', type: 'number', min: 100, max: 300, step: 5, unit: '%' },
    ] },
    { section: 'Espaciado', items: [
      { key: 'headerHeight', label: 'Alto de la cabecera', type: 'number', min: 10, max: 60, step: 0.5, unit: 'mm' },
      { key: 'headerPadX', label: 'Margen del título', type: 'number', min: 2, max: 25, step: 0.5, unit: 'mm' },
      { key: 'marginX', label: 'Márgenes laterales', type: 'number', min: 0, max: 20, step: 0.5, unit: 'mm' },
      { key: 'marginTop', label: 'Margen superior de la lista', type: 'number', min: 0, max: 30, step: 0.5, unit: 'mm' },
      { key: 'marginBottom', label: 'Margen inferior', type: 'number', min: 0, max: 30, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 10, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const bgUrl = asset(state.images.background);
    const listTop = s.headerHeight + s.marginTop;

    const header = h('div', {
      style: {
        position: 'absolute', left: 0, top: 0, right: 0, height: `${s.headerHeight}mm`,
        background: s.headerColor, overflow: 'hidden',
      },
    });
    if (bgUrl) {
      header.appendChild(h('div', {
        style: {
          position: 'absolute', inset: 0, backgroundImage: `url("${bgUrl}")`,
          backgroundSize: s.bgZoom > 100 ? `${s.bgZoom}% auto` : 'cover',
          backgroundPosition: `50% ${s.bgPosY}%`, backgroundRepeat: 'no-repeat',
        },
      }));
      if (s.headerOverlay > 0) {
        header.appendChild(h('div', { style: { position: 'absolute', inset: 0, background: rgba(s.headerColor, s.headerOverlay) } }));
      }
    }
    const shadow = s.titleShadow ? '0 0.35mm 1mm rgba(0,0,0,0.35)' : 'none';
    let info = fillTemplate(s.infoText, values);
    if (s.infoUppercase) info = info.toUpperCase();
    header.appendChild(h('div', {
      style: {
        position: 'absolute', inset: 0, padding: `0 ${s.headerPadX}mm`, display: 'flex',
        flexDirection: 'column', justifyContent: 'center', gap: '1.6mm',
      },
    },
    h('div', {
      text: fillTemplate(s.titleText, values),
      style: {
        fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`,
        color: s.headerTitleColor, lineHeight: 1.05, textShadow: shadow, letterSpacing: '-0.01em',
      },
    }),
    info ? h('div', {
      text: info,
      style: {
        fontFamily: fontStack(s.infoFont), fontWeight: s.infoWeight, fontSize: `${s.infoSize}pt`,
        color: s.headerInfoColor, letterSpacing: '0.02em', textShadow: shadow, whiteSpace: 'pre',
        fontVariantNumeric: 'tabular-nums',
      },
    }) : null));

    const sideW = s.showSidebar ? s.sidebarWidth : 0;
    const gap = s.showSidebar ? 1.4 : 0;
    const digits = String(tracks.length).length;
    const rowH = s.autoRowHeight ? null : s.rowHeight;

    const rows = h('div', {
      class: 'fit-v',
      style: {
        position: 'absolute', left: `${s.marginX + sideW + gap}mm`, right: `${s.marginX}mm`,
        top: `${listTop}mm`, bottom: `${s.marginBottom}mm`,
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      },
    });
    const listFont = { fontFamily: fontStack(s.listFont), fontSize: `${s.listSize}pt`, fontVariantNumeric: 'tabular-nums' };
    // Altura máxima de fila en modo automático: no más de 2,2 veces la letra.
    const maxAuto = `${(s.listSize * 0.3528 * 2.2).toFixed(2)}mm`;
    tracks.forEach((t, i) => {
      const highlighted = s.rowAlternate === 'odd' ? i % 2 === 0 : s.rowAlternate === 'even' ? i % 2 === 1 : false;
      const title = h('div', {
        class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
        style: {
          flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', textOverflow: 'clip',
          color: s.trackTitleColor, fontWeight: s.listWeight, paddingRight: '2mm', lineHeight: 1.4,
        },
      });
      rows.appendChild(h('div', {
        style: {
          ...listFont, display: 'flex', alignItems: 'center', minHeight: `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`,
          flex: rowH ? `0 0 ${rowH}mm` : '1 1 0', maxHeight: rowH ? 'none' : maxAuto,
          padding: '0 2.2mm 0 0', lineHeight: 1,
          background: highlighted ? rgba(s.rowColor, s.rowOpacity) : 'transparent',
          borderRadius: s.rowRounded ? '10mm' : 0,
        },
      },
      h('div', {
        text: String(t.number),
        style: {
          width: `${digits * 0.62 + 0.9}em`, flex: 'none', textAlign: 'right', paddingRight: '0.55em',
          color: t.numberColor || s.numberColor, fontWeight: s.numberWeight,
        },
      }),
      title,
      h('div', { text: t.duration, style: { flex: 'none', color: s.durationColor, fontWeight: s.listWeight } })));
    });

    const panel = h('div', {
      style: { position: 'absolute', inset: 0, background: s.bgColor },
    }, header, rows);

    if (s.showSidebar && tracks.length) {
      // La barra acompaña a la lista: se ajusta a la altura real de las filas.
      const bar = h('div', {
        class: 'cdb-sidebar',
        style: {
          position: 'absolute', left: `${s.marginX}mm`, width: `${sideW}mm`, top: `${listTop}mm`,
          height: `calc(100% - ${listTop + s.marginBottom}mm)`, background: s.sidebarColor, borderRadius: `${sideW}mm`,
        },
      });
      panel.appendChild(bar);
      // Tras montar, recorta la barra al alto ocupado por las filas.
      ctx.afterMount.push(() => {
        const last = rows.lastElementChild;
        if (!last) return;
        const used = Math.min(rows.clientHeight, last.offsetTop + last.offsetHeight);
        bar.style.height = `${used}px`;
      });
    }
    return panel;
  },
};
