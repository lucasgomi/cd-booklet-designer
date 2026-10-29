// «Flyer de barrio» — rap de calle madrileño: cartel fotocopiado pegado en
// una farola, título en bandas, firma de grafiti, pegatina y cinta.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, seeded, deco } from './common.js';

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export default {
  id: 'flyer-barrio',
  category: 'Rap / trap',
  name: 'Flyer de barrio',
  description: 'Cartel fotocopiado con firma de grafiti, pegatina y cinta.',

  defaults: {
    paperColor: '#E7E3D8',
    inkColor: '#111111',
    accentColor: '#FFD400',
    tagColor: '#E4002B',
    listBg: '#FFFFFF',
    listInk: '#111111',
    tapeColor: '#D8CFA8',
    halftone: 0.16,
    tagFont: 'Permanent Marker', tagWeight: 400, tagSize: 17,
    titleFont: 'Anton', titleWeight: 400, titleSize: 25,
    listFont: 'Oswald', listWeight: 500, listSize: 6.6,
    tagText: '{artista}',
    titleText: '{titulo}',
    stickerText: 'Madrid[ · {fecha}]',
    infoText: '{pistas} temas · {total}[ · vol. {disco}]',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoSticker', label: 'Pegatina redonda' },
    { key: 'decoCrown', label: 'Corona de grafiti' },
    { key: 'decoTape', label: 'Cinta adhesiva' },
    { key: 'decoHalftone', label: 'Trama de fotocopia' },
    { key: 'decoInfoBar', label: 'Banda de datos' },
  ],

  presets: [
    { name: 'Fotocopia', style: {} },
    { name: 'Metro', style: { paperColor: '#F3F3F3', accentColor: '#2DBEF0', tagColor: '#E4002B', tapeColor: '#C9C9C9' } },
    { name: 'Noche', style: { paperColor: '#141414', inkColor: '#F2F2F2', accentColor: '#FF2E88', tagColor: '#39FF14', listBg: '#1F1F1F', listInk: '#F2F2F2', tapeColor: '#6B6B6B', halftone: 0.22 } },
    { name: 'Chándal', style: { paperColor: '#0F2A5C', inkColor: '#FFFFFF', accentColor: '#E30613', tagColor: '#FFFFFF', listBg: '#FFFFFF', listInk: '#0F2A5C', tapeColor: '#B9C3D6' } },
    { name: 'Butano', style: { paperColor: '#FF7A00', inkColor: '#111111', accentColor: '#FFFFFF', tagColor: '#111111', tapeColor: '#F0E0B0' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'paperColor', label: 'Cartel', type: 'color' },
      { key: 'inkColor', label: 'Tinta', type: 'color' },
      { key: 'accentColor', label: 'Destacado (pegatina, números)', type: 'color' },
      { key: 'tagColor', label: 'Firma de grafiti', type: 'color' },
      { key: 'listBg', label: 'Fondo de la lista', type: 'color' },
      { key: 'listInk', label: 'Texto de la lista', type: 'color' },
      { key: 'tapeColor', label: 'Cinta adhesiva', type: 'color', when: (s) => s.decoTape !== false },
      { key: 'halftone', label: 'Intensidad de la trama', type: 'opacity', when: (s) => s.decoHalftone !== false },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Firma', family: 'tagFont', weight: 'tagWeight', size: 'tagSize' },
      { type: 'font', label: 'Título', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'tagText', label: 'Firma (grafiti)', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'titleText', label: 'Título', type: 'text' },
      { key: 'stickerText', label: 'Pegatina', type: 'text', when: (s) => s.decoSticker !== false },
      { key: 'infoText', label: 'Banda de datos', type: 'text', when: (s) => s.decoInfoBar !== false },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    // La pegatina va arriba a la derecha; la firma y el título le dejan sitio.
    const sticker = s.decoSticker !== false ? fillTemplate(s.stickerText, values) : '';

    // Firma de grafiti con halo de spray y corona.
    const tag = fillTemplate(s.tagText, values);
    const crown = deco(s, 'decoCrown', () => h('div', {
      style: {
        width: '9mm', height: '5mm', flex: 'none', marginBottom: '-1.2mm', transform: 'rotate(-10deg)',
        background: `${svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 10" width="18" height="10" fill="none" stroke="${s.tagColor}" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9 L1.5 2 L5.5 5.5 L9 1 L12.5 5.5 L16.5 2 L16 9 Z"/><circle cx="1.5" cy="1.4" r="0.8"/><circle cx="9" cy="0.6" r="0.6"/><circle cx="16.5" cy="1.4" r="0.8"/></svg>`)} center / contain no-repeat`,
      },
    }));
    const tagEl = tag ? h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 'none', marginLeft: '1mm', paddingRight: sticker ? '22mm' : 0 } },
      crown,
      h('div', {
        text: tag,
        style: {
          fontFamily: fontStack(s.tagFont), fontWeight: s.tagWeight, fontSize: `${s.tagSize}pt`, color: s.tagColor, lineHeight: 1.05, transform: 'rotate(-5deg)', transformOrigin: '0 50%',
          textShadow: `0 0 1.2mm ${rgba(s.tagColor, 0.45)}, 0.5mm 0.5mm 0 ${rgba(s.inkColor, 0.25)}`, 
        },
      })) : null;

    // Título en bandas de tinta, una por palabra (o por línea si son muchas).
    const words = fillTemplate(s.titleText, values).toUpperCase().split(/\s+/).filter(Boolean);
    const lines = words.length > 4 ? words.reduce((acc, w, i) => { if (i % 2) acc[acc.length - 1] += ` ${w}`; else acc.push(w); return acc; }, []) : words;
    const rand = seeded(lines.join('').length + 3);
    const title = h('div', { style: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.8mm', flex: 'none', marginTop: '1.4mm', paddingRight: sticker ? '24mm' : 0 } },
      ...lines.map((w, i) => h('div', {
        text: w,
        style: {
          fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, lineHeight: 0.98, background: s.inkColor, color: i % 3 === 1 ? s.accentColor : s.paperColor,
          padding: '0.4mm 1.6mm 0.2mm', transform: `rotate(${(rand() - 0.5) * 3}deg) translateX(${(rand() * 3).toFixed(1)}mm)`, maxWidth: '100%', overflowWrap: 'anywhere',
        },
      })));

    // Lista en una hoja blanca pegada con cinta.
    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.listInk, fontVariantNumeric: 'tabular-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => h('div', {
      style: { ...row, ...rowSizing(s, { minFactor: 1.1, maxFactor: 2.7 }), display: 'flex', alignItems: 'baseline', gap: '1.3mm' },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { flex: 'none', background: t.numberColor || s.inkColor, color: s.accentColor, padding: '0 0.7mm', fontSize: '0.85em', lineHeight: 1.25, fontWeight: 700 } }),
    fitTitle(t, { lineHeight: 1.25 }, (x) => x.toUpperCase()),
    h('span', { text: t.duration, style: { flex: 'none', fontFamily: fontStack('Courier Prime'), fontWeight: 700, fontSize: '0.92em', opacity: 0.8 } })))));
    const tape = (pos, rot) => h('div', { style: { position: 'absolute', width: '16mm', height: '4.5mm', background: rgba(s.tapeColor, 0.8), transform: `rotate(${rot}deg)`, boxShadow: `0 0.2mm 0.4mm ${rgba('#000000', 0.15)}`, ...pos } });
    const sheet = h('div', {
      style: { flex: '1 1 auto', minHeight: 0, marginTop: '3mm', position: 'relative', background: s.listBg, padding: '2.6mm 3mm', display: 'flex', gap: '4mm', boxShadow: `0.6mm 0.8mm 0 ${rgba('#000000', 0.25)}`, transform: 'rotate(-0.6deg)' },
    },
    ...cols,
    deco(s, 'decoTape', () => tape({ left: '-5mm', top: '-2mm' }, -28)),
    deco(s, 'decoTape', () => tape({ right: '-5mm', top: '-2mm' }, 30)));

    const info = fillTemplate(s.infoText, values);
    const infoBar = info ? deco(s, 'decoInfoBar', () => h('div', {
      text: info.toUpperCase(),
      style: { ...row, flex: 'none', marginTop: '2.4mm', background: s.accentColor, color: s.inkColor === s.accentColor ? s.paperColor : '#111111', fontWeight: 700, fontSize: `${s.listSize * 0.9}pt`, letterSpacing: '0.18em', textAlign: 'center', padding: '0.5mm 2mm', transform: 'rotate(0.6deg)' },
    })) : null;

    const layers = [
      h('div', { style: { position: 'absolute', inset: '6mm 7mm 6mm', display: 'flex', flexDirection: 'column' } }, tagEl, title, sheet, infoBar),
    ];
    if (sticker) {
      layers.push(deco(s, 'decoSticker', () => h('div', {
        style: {
          position: 'absolute', right: '6mm', top: '9mm', width: '22mm', height: '22mm', borderRadius: '50%', background: s.accentColor, border: `0.5mm solid ${s.inkColor}`,
          display: 'grid', placeItems: 'center', textAlign: 'center', transform: 'rotate(12deg)', boxShadow: `0.5mm 0.7mm 0 ${rgba('#000000', 0.3)}`, boxSizing: 'border-box', padding: '2mm',
        },
      },
      h('div', { text: sticker.toUpperCase(), style: { fontFamily: fontStack('Rubik Mono One'), fontSize: '7pt', lineHeight: 1.15, color: '#111111', overflowWrap: 'anywhere' } }))));
    }
    // Trama de fotocopia: un patrón de puntos más bordes quemados.
    layers.unshift(deco(s, 'decoHalftone', () => h('div', {
      style: {
        position: 'absolute', inset: 0, pointerEvents: 'none', opacity: s.halftone,
        background: `radial-gradient(circle, ${s.inkColor} 0.22mm, transparent 0.3mm) 0 0 / 1.2mm 1.2mm`,
        WebkitMask: 'radial-gradient(ellipse at 30% 20%, transparent 25%, #000 85%)', mask: 'radial-gradient(ellipse at 30% 20%, transparent 25%, #000 85%)',
      },
    })));
    return h('div', { style: { position: 'absolute', inset: 0, background: s.paperColor, overflow: 'hidden' } }, ...layers);
  },
};
