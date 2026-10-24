// «Notas del móvil» — la lista escrita en la app de notas del teléfono,
// con barra superior, fecha y casillas de verificación.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

function svg(viewBox, d, color, sizeMm, { stroke = false, width = 2 } = {}) {
  const el = document.createElementNS(SVG_NS, 'svg');
  el.setAttribute('viewBox', viewBox);
  el.style.cssText = `width:${sizeMm}mm;height:${sizeMm}mm;display:block;flex:none;overflow:visible`;
  for (const part of [].concat(d)) {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', part);
    if (stroke) {
      p.setAttribute('fill', 'none');
      p.setAttribute('stroke', color);
      p.setAttribute('stroke-width', width);
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('stroke-linejoin', 'round');
    } else {
      p.setAttribute('fill', color);
    }
    el.appendChild(p);
  }
  return el;
}

export default {
  id: 'notes',
  category: 'White girl music',
  name: 'Notas del móvil',
  description: 'La lista apuntada en las notas del teléfono, con casillas.',

  defaults: {
    bgColor: '#FFFFFF',
    textColor: '#1C1C1E',
    dimColor: '#8E8E93',
    accentColor: '#E3A500',
    checkTextColor: '#8E8E93',
    showChrome: true,
    listStyle: 'checklist',
    checkedCount: 0,
    showDurations: true,
    titleFont: 'Inter', titleWeight: 800, titleSize: 15,
    listFont: 'Inter', listWeight: 400, listSize: 7.8,
    backText: 'Notas',
    dateText: '[{fecha} · ]{pistas} canciones · {total}',
    titleText: '{titulo} para llorar en el coche',
    footerText: '',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    margin: 7,
    autoRowHeight: true,
    rowHeight: 3,
  },

  presets: [
    { name: 'Notas clásicas', style: {} },
    { name: 'Modo oscuro', style: { bgColor: '#1C1C1E', textColor: '#F2F2F7', dimColor: '#8E8E93', accentColor: '#FFD60A', checkTextColor: '#8E8E93' } },
    { name: 'Diario rosa', style: { bgColor: '#FFF1F4', textColor: '#4A2633', dimColor: '#B38494', accentColor: '#F2668B', checkTextColor: '#B38494', titleFont: 'Caveat', titleWeight: 700, titleSize: 22, listFont: 'Caveat', listWeight: 500, listSize: 10 } },
    { name: 'Todo hecho', style: { listStyle: 'checklist', checkedCount: 99 } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'dimColor', label: 'Texto secundario', type: 'color' },
      { key: 'accentColor', label: 'Acento (casillas y barra)', type: 'color' },
      { key: 'checkTextColor', label: 'Canciones marcadas', type: 'color', when: (s) => s.listStyle === 'checklist' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'titleText', label: 'Título de la nota', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'dateText', label: 'Línea de fecha', type: 'text' },
      { key: 'backText', label: 'Botón de volver', type: 'text', half: true, when: (s) => s.showChrome },
      { key: 'footerText', label: 'Pie (opcional)', type: 'text' },
      { key: 'listStyle', label: 'Estilo de la lista', type: 'select', options: [
        { value: 'checklist', label: 'Casillas ○' }, { value: 'bullets', label: 'Viñetas •' }, { value: 'numbers', label: 'Números 1.' }, { value: 'dashes', label: 'Guiones –' }] },
      { key: 'checkedCount', label: 'Casillas marcadas (las primeras)', type: 'number', min: 0, max: 99, step: 1, when: (s) => s.listStyle === 'checklist' },
      { key: 'showDurations', label: 'Mostrar duraciones', type: 'toggle' },
      { key: 'showChrome', label: 'Barra superior e iconos', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 20, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 2, max: 10, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const body = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, fontVariantNumeric: 'tabular-nums' };
    const box = s.listSize * 0.3528 * 1.05;
    const maxAuto = `${(s.listSize * 0.3528 * 2.1).toFixed(2)}mm`;

    const marker = (t, checked) => {
      if (s.listStyle === 'checklist') {
        return checked
          ? svg('0 0 20 20', ['M10 0a10 10 0 1 1 0 20a10 10 0 1 1 0-20z'], s.accentColor, box)
          : svg('0 0 20 20', ['M10 1.2a8.8 8.8 0 1 1 0 17.6a8.8 8.8 0 1 1 0-17.6z'], rgba(s.dimColor, 0.9), box, { stroke: true, width: 1.6 });
      }
      const text = s.listStyle === 'numbers' ? `${t.number}.` : s.listStyle === 'dashes' ? '–' : '•';
      return h('span', { text, style: { flex: 'none', minWidth: s.listStyle === 'numbers' ? '1.6em' : '0.8em', color: t.numberColor || (s.listStyle === 'numbers' ? s.dimColor : s.textColor) } });
    };

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' } },
      ...tracks.map((t, i) => {
        const checked = s.listStyle === 'checklist' && i < s.checkedCount;
        const m = marker(t, checked);
        if (checked) {
          // Tick blanco dentro del círculo relleno.
          const tick = document.createElementNS(SVG_NS, 'path');
          tick.setAttribute('d', 'M5.5 10.3l3 3 6-6.4');
          tick.setAttribute('fill', 'none');
          tick.setAttribute('stroke', s.bgColor);
          tick.setAttribute('stroke-width', '2');
          tick.setAttribute('stroke-linecap', 'round');
          tick.setAttribute('stroke-linejoin', 'round');
          m.appendChild(tick);
        }
        if (t.numberColor && s.listStyle === 'checklist') m.querySelector('path').setAttribute(checked ? 'fill' : 'stroke', t.numberColor);
        return h('div', {
          style: {
            ...body, display: 'flex', alignItems: 'center', gap: '1.8mm',
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${box.toFixed(2)}mm`,
          },
        }, m,
        h('span', {
          class: 'fit', text: t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
          style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.35, color: checked ? s.checkTextColor : s.textColor },
        }),
        s.showDurations ? h('span', { text: t.duration, style: { flex: 'none', color: s.dimColor } }) : null);
      }));

    const chrome = s.showChrome ? h('div', {
      style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: s.accentColor, ...body, fontSize: `${s.listSize * 1.1}pt`, fontWeight: 500, flex: 'none', marginBottom: '2.5mm' },
    },
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '0.8mm' } },
      svg('0 0 12 20', 'M10 2L2 10l8 8', s.accentColor, 3.2, { stroke: true, width: 2.4 }),
      h('span', { text: fillTemplate(s.backText, values) })),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '3mm' } },
      svg('0 0 20 20', ['M10 12V2', 'M6 6l4-4 4 4', 'M4 9v8h12V9'], s.accentColor, 3.4, { stroke: true, width: 1.7 }),
      svg('0 0 20 20', ['M4 10h.1', 'M10 10h.1', 'M16 10h.1'], s.accentColor, 3.4, { stroke: true, width: 3 }))) : null;

    const date = fillTemplate(s.dateText, values);
    const footer = fillTemplate(s.footerText, values);
    const bottomBar = s.showChrome ? h('div', {
      style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 'none', marginTop: '2.5mm', padding: '0 2mm' },
    },
    svg('0 0 20 20', ['M3 4h3v3H3z', 'M9 5.5h8', 'M3 12h3v3H3z', 'M9 13.5h8'], s.accentColor, 3.4, { stroke: true, width: 1.6 }),
    svg('0 0 20 20', ['M2 7h4l1.5-2h5L14 7h4v9H2z', 'M10 9a3 3 0 1 1 0 6a3 3 0 1 1 0-6z'], s.accentColor, 3.4, { stroke: true, width: 1.6 }),
    svg('0 0 20 20', ['M4 16l1-4 8-8 3 3-8 8z', 'M11 6l3 3'], s.accentColor, 3.4, { stroke: true, width: 1.6 })) : null;

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor } },
      h('div', { style: { position: 'absolute', inset: `${s.margin}mm`, display: 'flex', flexDirection: 'column' } },
        chrome,
        date ? h('div', { text: date, style: { ...body, color: s.dimColor, fontSize: `${s.listSize * 0.85}pt`, textAlign: 'center', flex: 'none', marginBottom: '2mm' } }) : null,
        h('div', {
          text: fillTemplate(s.titleText, values),
          style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.textColor, lineHeight: 1.1, letterSpacing: '-0.015em', flex: 'none', marginBottom: '2.5mm', textWrap: 'balance' },
        }),
        list,
        footer ? h('div', { text: footer, style: { ...body, color: s.dimColor, flex: 'none', marginTop: '2mm' } }) : null,
        bottomBar));
  },
};
