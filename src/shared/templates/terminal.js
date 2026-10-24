// Plantilla 6 — «Terminal».
// Pantalla de ordenador antiguo: fondo oscuro, texto de fósforo, la lista
// como un listado de archivos y un cursor al final.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, stripAccents, PLACEHOLDER_HELP } from '../text.js';
import { TOTAL_FORMAT_CONTROL } from './common.js';

export default {
  id: 'terminal',
  name: 'Terminal',
  description: 'Pantalla de fósforo verde con la lista como archivos.',

  defaults: {
    bgColor: '#0B120C',
    textColor: '#7CFF7A',
    dimColor: '#3E8F43',
    accentColor: '#E6FF6B',
    glow: true,
    scanlines: true,
    vignette: true,
    titleFont: 'JetBrains Mono', titleWeight: 800, titleSize: 12,
    listFont: 'JetBrains Mono', listWeight: 400, listSize: 6.4,
    promptText: 'C:\\> PLAY "{artista}"',
    titleText: '{artista}',
    infoText: '{titulo}[ · DISCO {disco}][ · {fecha}]',
    footerText: '{pistas} archivo(s)   {total}',
    uppercase: true,
    noAccents: true,
    extension: '.FLAC',
    useShortTitles: true,
    durationFormat: 'mm:ss',
    totalFormat: 'hmmss',
    margin: 7,
    autoRowHeight: true,
    rowHeight: 2.6,
  },

  presets: [
    { name: 'Fósforo verde', style: {} },
    { name: 'Ámbar', style: { bgColor: '#140C02', textColor: '#FFB547', dimColor: '#9A6420', accentColor: '#FFE2A8' } },
    { name: 'MS-DOS', style: { bgColor: '#0000AA', textColor: '#FFFFFF', dimColor: '#AAAAAA', accentColor: '#FFFF55', glow: false, scanlines: false, vignette: false, listFont: 'IBM Plex Mono', titleFont: 'IBM Plex Mono', titleWeight: 700 } },
    { name: 'Papel continuo', style: { bgColor: '#F3F1E8', textColor: '#1F1F1F', dimColor: '#8B8778', accentColor: '#B23A2E', glow: false, scanlines: false, vignette: false, listFont: 'Courier Prime', titleFont: 'Courier Prime', titleWeight: 700 } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'dimColor', label: 'Texto secundario', type: 'color' },
      { key: 'accentColor', label: 'Título y cursor', type: 'color' },
      { key: 'glow', label: 'Resplandor del texto', type: 'toggle' },
      { key: 'scanlines', label: 'Líneas de barrido', type: 'toggle' },
      { key: 'vignette', label: 'Viñeta en los bordes', type: 'toggle' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista y textos', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'promptText', label: 'Línea de comando', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleText', label: 'Título', type: 'text' },
      { key: 'infoText', label: 'Línea de datos', type: 'text' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'extension', label: 'Extensión de los «archivos»', type: 'text', half: true, maxLength: 8 },
      { key: 'uppercase', label: 'Todo en mayúsculas', type: 'toggle' },
      { key: 'noAccents', label: 'Sin tildes', type: 'toggle' },
      { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' },
      { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] },
      TOTAL_FORMAT_CONTROL,
    ] },
    { section: 'Espaciado', items: [
      { key: 'margin', label: 'Márgenes', type: 'number', min: 3, max: 20, step: 0.5, unit: 'mm' },
      { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
      { key: 'rowHeight', label: 'Altura de fila', type: 'number', min: 1.5, max: 8, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
    ] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const tx = (str) => {
      let out = str || '';
      if (s.noAccents) out = stripAccents(out);
      if (s.uppercase) out = out.toUpperCase();
      return out;
    };
    const glow = (c) => (s.glow ? `0 0 0.6mm ${rgba(c, 0.75)}, 0 0 1.6mm ${rgba(c, 0.35)}` : 'none');
    const mono = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, textShadow: glow(s.textColor), whiteSpace: 'pre', fontVariantNumeric: 'tabular-nums' };
    const dim = { ...mono, color: s.dimColor, textShadow: glow(s.dimColor) };
    const digits = Math.max(2, String(tracks.length).length);
    const maxAuto = `${(s.listSize * 0.3528 * 1.9).toFixed(2)}mm`;

    const list = h('div', { class: 'fit-v', style: { flex: '1 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', margin: '1.2mm 0' } },
      ...tracks.map((t) => {
        const title = h('span', {
          class: 'fit', text: tx(t.title) + s.extension, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
          style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', lineHeight: 1.3 },
        });
        title._fitTransform = (str) => tx(str) + s.extension;
        return h('div', {
          style: {
            ...mono, display: 'flex', alignItems: 'center', gap: '1.5ch',
            flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`, maxHeight: s.autoRowHeight ? maxAuto : 'none', minHeight: `${(s.listSize * 0.3528 * 1.05).toFixed(2)}mm`,
          },
        },
        h('span', { text: String(t.number).padStart(digits, '0'), style: { ...dim, color: t.numberColor || s.dimColor } }),
        title,
        h('span', { text: t.duration, style: dim }));
      }));

    const prompt = tx(fillTemplate(s.promptText, values));
    const info = tx(fillTemplate(s.infoText, values));
    const footer = tx(fillTemplate(s.footerText, values));
    const content = h('div', { style: { position: 'absolute', inset: `${s.margin}mm`, display: 'flex', flexDirection: 'column' } },
      prompt ? h('div', { text: prompt, style: { ...dim, marginBottom: '2mm', overflow: 'hidden' } }) : null,
      h('div', {
        text: tx(fillTemplate(s.titleText, values)),
        style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.accentColor, textShadow: glow(s.accentColor), lineHeight: 1.1, textWrap: 'balance' },
      }),
      info ? h('div', { text: info, style: { ...mono, marginTop: '1mm' } }) : null,
      h('div', { text: '═'.repeat(200), style: { ...dim, overflow: 'hidden', marginTop: '1.6mm', lineHeight: 1 } }),
      list,
      h('div', { text: '═'.repeat(200), style: { ...dim, overflow: 'hidden', lineHeight: 1 } }),
      h('div', { style: { ...mono, marginTop: '1.4mm', display: 'flex', alignItems: 'center', gap: '1ch' } },
        h('span', { text: footer }),
        h('span', { style: { display: 'inline-block', width: '0.62em', height: '1.05em', background: s.accentColor, boxShadow: glow(s.accentColor) } })));

    const layers = [content];
    if (s.scanlines) {
      layers.push(h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: `repeating-linear-gradient(to bottom, ${rgba('#000000', 0.18)} 0 0.25mm, transparent 0.25mm 0.6mm)` } }));
    }
    if (s.vignette) {
      layers.push(h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none', background: `radial-gradient(ellipse at center, transparent 55%, ${rgba('#000000', 0.55)} 100%)` } }));
    }
    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } }, ...layers);
  },
};
