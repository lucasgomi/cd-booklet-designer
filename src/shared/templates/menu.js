// «Carta de restaurante» — la lista servida como un menú: entrantes,
// principales y postres, con puntos hasta el «precio» (la duración).
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, COLUMNS_CONTROL, listColumns, columnize, deco } from './common.js';

export default {
  id: 'menu',
  category: 'Estéticas',
  name: 'Carta de restaurante',
  description: 'Entrantes, principales y postres; la duración es el precio.',

  defaults: {
    paperColor: '#FBF7EE',
    inkColor: '#2A2420',
    accentColor: '#8C2F39',
    leaderColor: '#B9AFA3',
    titleFont: 'Cormorant Garamond', titleWeight: 600, titleSize: 19,
    sectionFont: 'Cormorant Garamond', sectionWeight: 700, sectionSize: 8,
    listFont: 'Cormorant Garamond', listWeight: 500, listSize: 6.8,
    restaurant: 'Casa {artista}',
    subtitle: 'Menú degustación «{titulo}»',
    sections: 'Entrantes, Principales, Postres',
    footerText: '{pistas} platos · {total} de sobremesa · IVA incluido',
    priceStyle: 'euro',
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 2.8,
    columns: 'auto',
  },

  decorations: [
    { key: 'decoOrnament', label: 'Adorno ❦' },
    { key: 'decoFrame', label: 'Marco' },
  ],

  presets: [
    { name: 'Bistró', style: {} },
    { name: 'Trattoria', style: { paperColor: '#FFFDF5', accentColor: '#1E7B3A', inkColor: '#2B2B2B', leaderColor: '#D9534F' } },
    { name: 'Marisquería', style: { paperColor: '#F1F6FA', accentColor: '#1F4E79', inkColor: '#1B2838', leaderColor: '#9FB6CD' } },
    { name: 'Pastelería', style: { paperColor: '#FFF1F5', accentColor: '#D94C86', inkColor: '#4A2B38', leaderColor: '#F0A9C4', titleFont: 'Great Vibes', titleWeight: 400, titleSize: 26 } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'paperColor', label: 'Papel', type: 'color' },
      { key: 'inkColor', label: 'Texto', type: 'color' },
      { key: 'accentColor', label: 'Secciones y adornos', type: 'color' },
      { key: 'leaderColor', label: 'Puntitos', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Nombre del restaurante', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Secciones', family: 'sectionFont', weight: 'sectionWeight', size: 'sectionSize' },
      { type: 'font', label: 'Platos', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'restaurant', label: 'Restaurante', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'subtitle', label: 'Subtítulo', type: 'text' },
      { key: 'sections', label: 'Secciones (separadas por comas)', type: 'text', help: 'Las canciones se reparten a partes iguales entre las secciones.' },
      { key: 'footerText', label: 'Pie', type: 'text' },
      { key: 'priceStyle', label: 'Precio', type: 'select', options: [{ value: 'euro', label: '3,04 €' }, { value: 'time', label: '3:04' }] },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: [...rowControls(), COLUMNS_CONTROL] },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const names = String(s.sections).split(',').map((x) => x.trim()).filter(Boolean);
    const n = Math.max(1, names.length);
    const per = Math.ceil(tracks.length / n);
    const serif = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.inkColor };
    const price = (d) => (s.priceStyle === 'euro' && d ? `${d.replace(':', ',')} €` : d);
    const leader = '.'.repeat(240);

    const blocks = [];
    for (let i = 0; i < n; i += 1) {
      const part = tracks.slice(i * per, (i + 1) * per);
      if (!part.length) continue;
      blocks.push(h('div', { style: { display: 'flex', alignItems: 'center', gap: '2mm', margin: i ? '1.4mm 0 0.4mm' : '0 0 0.4mm', flex: 'none' } },
        h('div', { style: { flex: 1, height: '0.15mm', background: rgba(s.accentColor, 0.5) } }),
        h('div', { text: names[i] || '', style: { fontFamily: fontStack(s.sectionFont), fontWeight: s.sectionWeight, fontSize: `${s.sectionSize}pt`, color: s.accentColor, letterSpacing: '0.3em', textTransform: 'uppercase' } }),
        h('div', { style: { flex: 1, height: '0.15mm', background: rgba(s.accentColor, 0.5) } })));
      blocks.push(columnize(fitList(part.map((t) => h('div', {
        style: { ...serif, ...rowSizing(s, { minFactor: 1, maxFactor: 1.9 }), display: 'flex', alignItems: 'baseline' },
      },
      fitTitle(t, { flex: '0 1 auto', fontStyle: 'italic' }),
      h('span', { text: leader, style: { flex: '1 1 0', minWidth: '2ch', overflow: 'hidden', whiteSpace: 'pre', direction: 'rtl', color: s.leaderColor, margin: '0 1ch' } }),
      h('span', { text: price(t.duration), style: { flex: 'none', fontVariantNumeric: 'tabular-nums lining-nums' } }))), { flex: `${part.length} 1 0` }), listColumns(s), '6mm'));
    }

    const footer = fillTemplate(s.footerText, values);
    return h('div', { style: { position: 'absolute', inset: 0, background: s.paperColor } },
      deco(s, 'decoFrame', () => h('div', { style: { position: 'absolute', inset: '4.5mm', border: `0.25mm solid ${rgba(s.accentColor, 0.6)}` } })),
      h('div', { style: { position: 'absolute', inset: '8mm 12mm 6.5mm', display: 'flex', flexDirection: 'column' } },
        deco(s, 'decoOrnament', () => h('div', { text: '❦', style: { textAlign: 'center', color: s.accentColor, fontSize: '10pt', flex: 'none', lineHeight: 1 } })),
        h('div', { text: fillTemplate(s.restaurant, values), style: { fontFamily: fontStack(s.titleFont), fontWeight: s.titleWeight, fontSize: `${s.titleSize}pt`, color: s.inkColor, textAlign: 'center', lineHeight: 1.05, flex: 'none', textWrap: 'balance' } }),
        h('div', { text: fillTemplate(s.subtitle, values), style: { ...serif, fontStyle: 'italic', textAlign: 'center', color: s.accentColor, margin: '0.6mm 0 2mm', flex: 'none' } }),
        ...blocks,
        footer ? h('div', { text: footer, style: { ...serif, fontSize: `${s.listSize * 0.85}pt`, textAlign: 'center', marginTop: '2.5mm', fontStyle: 'italic', opacity: 0.75, flex: 'none' } }) : null));
  },
};
