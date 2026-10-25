// «Tarjeta de embarque» — billete de avión con origen y destino, datos del
// vuelo, troquel perforado y la lista como itinerario.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { decorativeBarcodeSvg } from '../codes.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns } from './common.js';

export default {
  id: 'boarding',
  category: 'Estéticas',
  name: 'Tarjeta de embarque',
  description: 'Billete de avión con origen, destino y la lista como itinerario.',

  defaults: {
    bgColor: '#DCE6F2',
    cardColor: '#FFFFFF',
    bandColor: '#1F4FA3',
    bandTextColor: '#FFFFFF',
    inkColor: '#14213D',
    dimColor: '#7A869E',
    accentColor: '#E8505B',
    bigFont: 'Archivo Black', bigWeight: 400, bigSize: 24,
    listFont: 'DM Mono', listWeight: 500, listSize: 5.9,
    airline: '{artista} Airlines',
    fromCode: 'MAD',
    fromCity: 'Madrid',
    toCode: 'HIT',
    toCity: '{titulo}',
    passenger: 'Tú',
    flight: 'CD {disco}',
    gate: '26',
    seat: '1A',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 2.6,
  },

  presets: [
    { name: 'Clásica', style: {} },
    { name: 'Rosa', style: { bgColor: '#FBE3EA', bandColor: '#E8487A', inkColor: '#3D1424', accentColor: '#E8487A', dimColor: '#A57C8C' } },
    { name: 'Noche', style: { bgColor: '#0D1321', cardColor: '#1D2639', bandColor: '#F2B33D', bandTextColor: '#0D1321', inkColor: '#EDF2FB', dimColor: '#8D99AE', accentColor: '#F2B33D' } },
    { name: 'Lima', style: { bgColor: '#EEF7D9', bandColor: '#5AA02C', inkColor: '#1F2A12', accentColor: '#5AA02C', dimColor: '#7D8C6A' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'bgColor', label: 'Fondo', type: 'color' },
      { key: 'cardColor', label: 'Billete', type: 'color' },
      { key: 'bandColor', label: 'Banda superior', type: 'color' },
      { key: 'bandTextColor', label: 'Texto de la banda', type: 'color' },
      { key: 'inkColor', label: 'Texto', type: 'color' },
      { key: 'dimColor', label: 'Etiquetas', type: 'color' },
      { key: 'accentColor', label: 'Avión y números', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Códigos de aeropuerto', family: 'bigFont', weight: 'bigWeight', size: 'bigSize' },
      { type: 'font', label: 'Datos y lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'airline', label: 'Aerolínea', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'fromCode', label: 'Origen (código)', type: 'text', half: true, maxLength: 4 },
      { key: 'toCode', label: 'Destino (código)', type: 'text', half: true, maxLength: 4 },
      { key: 'fromCity', label: 'Ciudad de origen', type: 'text', half: true },
      { key: 'toCity', label: 'Ciudad de destino', type: 'text', half: true },
      { key: 'passenger', label: 'Pasajero', type: 'text', half: true },
      { key: 'flight', label: 'Vuelo', type: 'text', half: true },
      { key: 'gate', label: 'Puerta', type: 'text', half: true },
      { key: 'seat', label: 'Asiento', type: 'text', half: true },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const f = (t) => fillTemplate(t, values);
    const mono = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor, fontVariantNumeric: 'tabular-nums' };
    const label = { ...mono, fontSize: `${s.listSize * 0.75}pt`, color: s.dimColor, letterSpacing: '0.12em', textTransform: 'uppercase' };
    const field = (name, value) => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '0.3mm', minWidth: 0 } },
      h('span', { text: name, style: label }), h('span', { text: value, style: { ...mono, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden' } }));
    const city = (code, name, align) => h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: align, minWidth: 0 } },
      h('span', { text: f(code).toUpperCase(), style: { fontFamily: fontStack(s.bigFont), fontWeight: s.bigWeight, fontSize: `${s.bigSize}pt`, color: s.inkColor, lineHeight: 1 } }),
      h('span', { text: f(name), style: { ...label, letterSpacing: '0.05em', whiteSpace: 'nowrap' } }));

    const notch = (side) => h('div', { style: { position: 'absolute', [side]: '-2.5mm', top: '43.5mm', width: '5mm', height: '5mm', borderRadius: '50%', background: s.bgColor } });
    const top = h('div', { style: { display: 'flex', flexDirection: 'column', flex: 'none' } },
      h('div', { style: { background: s.bandColor, color: s.bandTextColor, padding: '2mm 4mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' } },
        h('span', { text: f(s.airline), style: { ...mono, color: s.bandTextColor, fontWeight: 700, letterSpacing: '0.06em' } }),
        h('span', { text: 'TARJETA DE EMBARQUE', style: { ...mono, color: s.bandTextColor, fontSize: `${s.listSize * 0.8}pt`, letterSpacing: '0.18em' } })),
      h('div', { style: { padding: '3mm 4mm 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2mm' } },
        city(s.fromCode, s.fromCity, 'flex-start'),
        h('div', { style: { flex: '1 1 auto', display: 'flex', alignItems: 'center', gap: '1mm', color: s.accentColor } },
          h('div', { style: { flex: 1, borderTop: `0.3mm dashed ${rgba(s.dimColor, 0.8)}` } }),
          h('span', { text: '✈', style: { fontSize: '13pt', color: s.accentColor, lineHeight: 1 } }),
          h('div', { style: { flex: 1, borderTop: `0.3mm dashed ${rgba(s.dimColor, 0.8)}` } })),
        city(s.toCode, s.toCity, 'flex-end')),
      h('div', { style: { padding: '2.5mm 4mm 3mm', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2mm' } },
        field('Pasajero', f(s.passenger)), field('Vuelo', f(s.flight)), field('Puerta', f(s.gate)), field('Asiento', f(s.seat)), field('Duración', values.total)));

    const perforation = h('div', { style: { borderTop: `0.4mm dashed ${rgba(s.dimColor, 0.7)}`, margin: '0 3mm', flex: 'none' } });
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...mono, ...rowSizing(s, { minFactor: 1.1, maxFactor: 2.2 }), display: 'flex', alignItems: 'center', gap: '1.4mm', borderBottom: `0.15mm solid ${rgba(s.dimColor, 0.3)}` },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { color: t.numberColor || s.accentColor, fontWeight: 700, flex: 'none' } }),
    fitTitle(t),
    h('span', { text: t.duration, style: { color: s.dimColor, flex: 'none' } })))));
    const itinerary = h('div', { style: { flex: '1 1 auto', minHeight: 0, padding: '2.5mm 4mm 3mm', display: 'flex', flexDirection: 'column' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2mm', flex: 'none' } },
        h('span', { text: 'Itinerario', style: label }),
        decorativeBarcodeSvg(`${values.artista}${values.titulo}`, { color: s.inkColor, widthMm: 28, heightMm: 3.5, bars: 22 })),
      h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap: '5mm' } }, ...cols));

    const card = h('div', {
      style: { position: 'absolute', inset: '6mm', background: s.cardColor, borderRadius: '3mm', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: `0 1mm 3mm ${rgba('#000000', 0.18)}` },
    }, top, perforation, itinerary);
    return h('div', { style: { position: 'absolute', inset: 0, background: s.bgColor } },
      card, h('div', { style: { position: 'absolute', inset: '6mm', pointerEvents: 'none' } }, notch('left'), notch('right')));
  },
};
