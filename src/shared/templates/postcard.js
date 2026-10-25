// «Postal» — «Saludos desde…» en letras gordas rellenas con tu foto, y el
// reverso de la postal con sello, matasellos y la lista escrita a mano.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns } from './common.js';

export default {
  id: 'postcard',
  category: 'Estéticas',
  name: 'Postal',
  description: '«Saludos desde…» con letras rellenas de foto y sello.',

  defaults: {
    bgColor: '#F2E7D3',
    frontColor1: '#2E86C1',
    frontColor2: '#F5B041',
    letterOutline: '#1B2631',
    inkColor: '#22313F',
    stampColor: '#C0392B',
    useBgImage: true,
    greetingFont: 'Great Vibes', greetingWeight: 400, greetingSize: 16,
    bigFont: 'Anton', bigWeight: 400, bigSize: 40,
    listFont: 'Caveat', listWeight: 500, listSize: 7.6,
    greetingText: 'Saludos desde',
    bigText: '{titulo}',
    toText: 'Para: quien escuche esto\nDe: {artista}',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  presets: [
    { name: 'Vintage', style: {} },
    { name: 'Playa', style: { bgColor: '#FDF2E9', frontColor1: '#48C9B0', frontColor2: '#F7DC6F', stampColor: '#E67E22', letterOutline: '#0E6655' } },
    { name: 'Noche de verano', style: { bgColor: '#E8E2F2', frontColor1: '#4A235A', frontColor2: '#E74C3C', stampColor: '#4A235A', letterOutline: '#1B1026' } },
    { name: 'Kodak', style: { bgColor: '#FFF4CC', frontColor1: '#E31F26', frontColor2: '#FFC72C', stampColor: '#E31F26', letterOutline: '#2B2B2B' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Cartulina', type: 'color' },
      { key: 'useBgImage', label: 'Rellenar letras con la imagen de fondo', type: 'toggle' },
      { key: 'frontColor1', label: 'Relleno (sin imagen): color 1', type: 'color' },
      { key: 'frontColor2', label: 'Relleno (sin imagen): color 2', type: 'color' },
      { key: 'letterOutline', label: 'Contorno de las letras', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'stampColor', label: 'Sello y matasellos', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: '«Saludos desde»', family: 'greetingFont', weight: 'greetingWeight', size: 'greetingSize' },
      { type: 'font', label: 'Letras gordas', family: 'bigFont', weight: 'bigWeight', size: 'bigSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'greetingText', label: 'Saludo', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'bigText', label: 'Letras gordas', type: 'text' },
      { key: 'toText', label: 'Dirección', type: 'textarea' },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values, asset, state } = ctx;
    const img = s.useBgImage ? asset(state.images.background) : null;
    const big = fillTemplate(s.bigText, values).toUpperCase();
    const fill = img ? `url("${img}") center / cover` : `linear-gradient(160deg, ${s.frontColor1}, ${s.frontColor2})`;

    const front = h('div', { style: { position: 'absolute', left: '6mm', right: '6mm', top: '5mm', height: '40mm', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } },
      h('div', { text: fillTemplate(s.greetingText, values), style: { fontFamily: fontStack(s.greetingFont), fontWeight: s.greetingWeight, fontSize: `${s.greetingSize}pt`, color: s.inkColor, lineHeight: 1, marginBottom: '-1mm', zIndex: 1, transform: 'rotate(-4deg)' } }),
      h('div', {
        text: big,
        style: {
          fontFamily: fontStack(s.bigFont), fontWeight: s.bigWeight, fontSize: `${s.bigSize}pt`, lineHeight: 1, letterSpacing: '0.02em', textAlign: 'center',
          background: fill, WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
          WebkitTextStroke: `0.45mm ${s.letterOutline}`, filter: `drop-shadow(0.8mm 0.8mm 0 ${rgba(s.letterOutline, 0.85)})`, whiteSpace: 'nowrap',
        },
      }));

    // Reverso: línea central, sello y matasellos.
    const hand = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...hand, ...rowSizing(s, { minFactor: 0.95, maxFactor: 1.6 }), display: 'flex', alignItems: 'flex-end', gap: '1mm', borderBottom: `0.15mm solid ${rgba(s.inkColor, 0.25)}` },
    },
    h('span', { text: `${t.number}.`, style: { color: t.numberColor || s.stampColor, flex: 'none', minWidth: '1.3em' } }),
    fitTitle(t, { lineHeight: 1.1 }),
    h('span', { text: t.duration, style: { flex: 'none', opacity: 0.6, fontSize: '0.85em' } })))));

    const stamp = h('div', {
      style: {
        // Troquel: agujeros por todo el fondo; el centro los tapa el papel blanco.
        position: 'absolute', right: '9mm', top: '49mm', width: '15mm', height: '18mm', padding: '1.2mm', boxSizing: 'border-box',
        background: `radial-gradient(circle, ${s.bgColor} 0 0.42mm, #FFFFFF 0.47mm) -0.75mm -0.75mm / 1.5mm 1.5mm`,
        filter: `drop-shadow(0.3mm 0.4mm 0.4mm ${rgba('#000000', 0.2)})`,
      },
    }, h('div', { style: { position: 'absolute', inset: '0.8mm', background: '#FFFFFF' } }), h('div', { style: { position: 'relative', width: '100%', height: '100%', background: img ? `url("${img}") center / cover` : s.stampColor, display: 'grid', placeItems: 'end', padding: '0.6mm', boxSizing: 'border-box' } },
      h('span', { text: `${values.pistas}`, style: { fontFamily: fontStack('Anton'), fontSize: '9pt', color: '#FFFFFF', textShadow: `0 0 1mm ${rgba('#000000', 0.5)}` } })));
    const postmark = h('div', {
      style: {
        position: 'absolute', right: '17mm', top: '52mm', width: '15mm', height: '15mm', borderRadius: '50%', border: `0.35mm solid ${rgba(s.stampColor, 0.7)}`,
        display: 'grid', placeItems: 'center', transform: 'rotate(-14deg)', fontFamily: fontStack('Space Mono'), fontSize: '4.2pt', color: rgba(s.stampColor, 0.8), textAlign: 'center', lineHeight: 1.2,
      },
    }, h('span', { text: `${values.total}\n${values.fecha || 'CORREOS'}`.toUpperCase(), style: { whiteSpace: 'pre' } }));
    const waves = h('div', { style: { position: 'absolute', right: '4mm', top: '56mm', width: '14mm', height: '6mm', transform: 'rotate(-14deg)', background: `repeating-linear-gradient(to bottom, ${rgba(s.stampColor, 0.6)} 0 0.3mm, transparent 0.3mm 1.4mm)` } });

    const back = h('div', { style: { position: 'absolute', left: '6mm', right: '6mm', top: '47mm', bottom: '5mm', display: 'flex', gap: '3mm' } },
      h('div', { style: { flex: '1 1 auto', minWidth: 0, display: 'flex', gap: '3mm', borderRight: `0.25mm solid ${rgba(s.inkColor, 0.4)}`, paddingRight: '3mm' } }, ...cols),
      h('div', { style: { width: '24mm', flex: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: '2mm' } },
        ...fillTemplate(s.toText, values).split('\n').map((line) => h('div', { text: line, style: { ...hand, borderBottom: `0.15mm solid ${rgba(s.inkColor, 0.35)}`, padding: '1mm 0 0.3mm', whiteSpace: 'nowrap', overflow: 'hidden' } }))));

    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor, overflow: 'hidden' } },
      front,
      h('div', { style: { position: 'absolute', left: '6mm', right: '6mm', top: '45.5mm', height: '0.3mm', background: rgba(s.inkColor, 0.25) } }),
      back, waves, postmark, stamp);
  },
};
