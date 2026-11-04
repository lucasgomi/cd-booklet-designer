// «Radio pop FM» — emisora de pop de un juego de mundo abierto: atardecer
// con palmeras, logo redondo de la emisora y la lista en el panel del menú
// de radio, con la canción que «está sonando» resaltada.
import { h, fontStack, rgba } from '../dom.js';
import { fillTemplate, PLACEHOLDER_HELP } from '../text.js';
import { TEXT_EXTRAS, rowControls, rowSizing, fitTitle, fitList, splitColumns, deco } from './common.js';

const svgUrl = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

export function palmSvg(color) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 60" width="40" height="60" fill="none" stroke="${color}" stroke-linecap="round">`
    + '<path d="M21 60 Q23 40 19 22" stroke-width="2.6"/>'
    + '<path d="M19 22 Q8 13 1 22 M19 22 Q10 7 3 9 M19 22 Q24 5 35 8 M19 22 Q31 13 39 23 M19 22 Q17 9 13 1 M19 22 Q27 17 31 28 M19 22 Q10 19 7 30" stroke-width="2.2"/></svg>';
}

export default {
  id: 'radio-pop',
  category: 'Radio de Los Santos',
  name: 'Radio pop FM',
  description: 'Emisora de pop al atardecer: logo redondo, palmeras y menú de radio.',

  defaults: {
    skyTop: '#2B1055',
    skyMid: '#C2378F',
    skyBottom: '#FF9F5A',
    sunColor: '#FFE08A',
    palmColor: '#1A0B2E',
    badgeColor: '#FF3EA5',
    badgeTextColor: '#FFFFFF',
    panelColor: '#0B0A12',
    panelOpacity: 0.78,
    accentColor: '#FF3EA5',
    textColor: '#FFFFFF',
    mutedColor: '#BDB5CC',
    badgeFont: 'Montserrat', badgeWeight: 900, badgeSize: 19,
    titleFont: 'Montserrat', titleWeight: 900, titleSize: 15,
    listFont: 'Montserrat', listWeight: 600, listSize: 6,
    badgeText: '{titulo}',
    badgeSub: 'FM',
    labelText: 'Ahora en la radio',
    titleText: '{artista}',
    infoText: '{pistas} temas · {total}[ · {fecha}]',
    nowPlaying: 1,
    useShortTitles: true,
    durationFormat: 'm:ss',
    totalFormat: 'h-min-lower',
    autoRowHeight: true,
    rowHeight: 3,
  },

  decorations: [
    { key: 'decoSun', label: 'Sol del atardecer' },
    { key: 'decoPalms', label: 'Palmeras' },
    { key: 'decoWaves', label: 'Ondas de radio' },
    { key: 'decoEq', label: 'Ecualizador en la canción que suena' },
  ],

  presets: [
    { name: 'Atardecer', style: {} },
    { name: 'Medianoche', style: { skyTop: '#05030F', skyMid: '#1B1446', skyBottom: '#5A1E78', sunColor: '#F2E9FF', palmColor: '#000000', badgeColor: '#8B5CFF', accentColor: '#8B5CFF' } },
    { name: 'Playa', style: { skyTop: '#2F8FE0', skyMid: '#7FD3F0', skyBottom: '#FFE3A3', sunColor: '#FFF6C2', palmColor: '#0E3B3A', badgeColor: '#00B3A4', accentColor: '#00B3A4', panelColor: '#0E2A33' } },
    { name: 'Chicle', style: { skyTop: '#FF7AC6', skyMid: '#FFB3DE', skyBottom: '#FFE4F2', sunColor: '#FFFFFF', palmColor: '#B0186E', badgeColor: '#FFFFFF', badgeTextColor: '#E0158A', panelColor: '#3A0A28', accentColor: '#FF3EA5' } },
  ],

  controls: [
    { section: 'Colores', items: [
      { key: 'skyTop', label: 'Cielo arriba', type: 'color' },
      { key: 'skyMid', label: 'Cielo en medio', type: 'color' },
      { key: 'skyBottom', label: 'Cielo abajo', type: 'color' },
      { key: 'sunColor', label: 'Sol', type: 'color', when: (s) => s.decoSun !== false },
      { key: 'palmColor', label: 'Palmeras', type: 'color', when: (s) => s.decoPalms !== false },
      { key: 'badgeColor', label: 'Logo de la emisora', type: 'color' },
      { key: 'badgeTextColor', label: 'Texto del logo', type: 'color' },
      { key: 'panelColor', label: 'Panel', type: 'color' },
      { key: 'panelOpacity', label: 'Opacidad del panel', type: 'opacity' },
      { key: 'accentColor', label: 'Canción que suena', type: 'color' },
      { key: 'textColor', label: 'Texto', type: 'color' },
      { key: 'mutedColor', label: 'Texto secundario', type: 'color' },
    ] },
    { section: 'Tipografías', items: [
      { type: 'font', label: 'Logo', family: 'badgeFont', weight: 'badgeWeight', size: 'badgeSize' },
      { type: 'font', label: 'Artista', family: 'titleFont', weight: 'titleWeight', size: 'titleSize' },
      { type: 'font', label: 'Lista', family: 'listFont', weight: 'listWeight', size: 'listSize' },
    ] },
    { section: 'Textos', items: [
      { key: 'badgeText', label: 'Nombre de la emisora (logo)', type: 'text', help: PLACEHOLDER_HELP },
      { key: 'badgeSub', label: 'Debajo del logo', type: 'text' },
      { key: 'labelText', label: 'Rótulo', type: 'text' },
      { key: 'titleText', label: 'Artista', type: 'text' },
      { key: 'infoText', label: 'Datos', type: 'text' },
      { key: 'nowPlaying', label: 'Canción que suena (0 = ninguna)', type: 'number', min: 0, max: 99, step: 1 },
      ...TEXT_EXTRAS,
    ] },
    { section: 'Espaciado', items: rowControls() },
  ],

  render(ctx) {
    const { style: s, tracks, values } = ctx;
    const italic = (font, weight, size) => ({ fontFamily: fontStack(font), fontWeight: weight, fontSize: `${size}pt`, fontStyle: 'italic' });

    // Logo redondo: el nombre de la emisora en bloque, palabra por línea.
    const words = fillTemplate(s.badgeText, values).toUpperCase().split(/\s+/).filter(Boolean);
    const longest = Math.max(4, ...words.map((w) => w.length));
    const badgeSize = s.badgeSize * Math.min(1, 4.5 / longest) * (words.length > 3 ? 0.8 : 1);
    const badgeSub = fillTemplate(s.badgeSub, values);
    const badge = h('div', {
      style: {
        position: 'relative', width: '31mm', height: '31mm', flex: 'none', borderRadius: '50%', background: s.badgeColor, border: `0.8mm solid ${s.badgeTextColor}`,
        boxShadow: `0 0 0 0.5mm ${rgba('#000000', 0.25)}, 0 1mm 3mm ${rgba('#000000', 0.35)}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxSizing: 'border-box', overflow: 'hidden',
      },
    },
    ...words.map((w) => h('div', { text: w, style: { ...italic(s.badgeFont, s.badgeWeight, badgeSize), color: s.badgeTextColor, lineHeight: 0.92, letterSpacing: '-0.02em', textShadow: `0.35mm 0.35mm 0 ${rgba('#000000', 0.25)}` } })),
    badgeSub ? h('div', { text: badgeSub.toUpperCase(), style: { ...italic(s.badgeFont, 800, Math.max(5, badgeSize * 0.45)), color: s.badgeColor, background: s.badgeTextColor, padding: '0 1.2mm', marginTop: '0.8mm', borderRadius: '0.6mm', lineHeight: 1.15 } }) : null);

    const waves = deco(s, 'decoWaves', () => h('div', { style: { position: 'absolute', left: '-4mm', top: '-4mm', width: '39mm', height: '39mm', pointerEvents: 'none' } },
      ...[0, 1].map((i) => h('div', { style: { position: 'absolute', inset: `${-i * 2.5}mm`, borderRadius: '50%', border: `0.35mm solid ${rgba(s.badgeTextColor, 0.55 - i * 0.25)}`, clipPath: 'polygon(55% 0, 100% 0, 100% 45%)' } }))));

    const label = fillTemplate(s.labelText, values);
    const artist = fillTemplate(s.titleText, values);
    const info = fillTemplate(s.infoText, values);
    const header = h('div', { style: { display: 'flex', alignItems: 'center', gap: '4mm', flex: 'none', paddingRight: '10mm' } },
      h('div', { style: { position: 'relative', flex: 'none' } }, waves, badge),
      h('div', { style: { minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.8mm' } },
        label ? h('div', { text: label.toUpperCase(), style: { ...italic(s.listFont, 800, s.listSize * 0.85), color: s.textColor, background: s.accentColor, alignSelf: 'flex-start', padding: '0.2mm 1.4mm', letterSpacing: '0.08em' } }) : null,
        artist ? h('div', { text: artist, style: { ...italic(s.titleFont, s.titleWeight, s.titleSize), color: s.textColor, lineHeight: 1, textWrap: 'balance', textShadow: `0.5mm 0.5mm 0 ${rgba('#000000', 0.35)}` } }) : null,
        info ? h('div', { text: info.toUpperCase(), style: { fontFamily: fontStack(s.listFont), fontWeight: 600, fontSize: `${s.listSize * 0.85}pt`, color: s.textColor, opacity: 0.85, letterSpacing: '0.1em' } }) : null));

    // Panel del menú de radio.
    const now = Number(s.nowPlaying) || 0;
    const eq = () => h('span', { style: { display: 'inline-flex', alignItems: 'flex-end', gap: '0.25mm', height: '0.8em', flex: 'none' } },
      ...[0.55, 1, 0.75].map((f) => h('span', { style: { width: '0.4mm', height: `${f * 100}%`, background: '#FFFFFF' } })));
    const row = { fontFamily: fontStack(s.listFont), fontWeight: s.listWeight, fontSize: `${s.listSize}pt`, color: s.textColor, fontVariantNumeric: 'tabular-nums' };
    const cols = splitColumns(tracks, 2).map((part) => fitList(part.map((t) => {
      const on = t.number === now;
      return h('div', {
        style: { ...row, ...rowSizing(s, { minFactor: 1.15, maxFactor: 2.6 }), display: 'flex', alignItems: 'center', gap: '1.3mm', padding: '0 1mm', borderRadius: '0.6mm', background: on ? s.accentColor : 'transparent' },
      },
      h('span', { text: String(t.number).padStart(2, '0'), style: { flex: 'none', color: on ? s.textColor : (t.numberColor || s.accentColor), fontWeight: 800, fontStyle: 'italic' } }),
      fitTitle(t, {}),
      on ? deco(s, 'decoEq', eq) : null,
      h('span', { text: t.duration, style: { flex: 'none', color: on ? s.textColor : s.mutedColor, fontWeight: 500 } }));
    })));
    const panel = h('div', {
      style: {
        flex: '1 1 auto', minHeight: 0, marginTop: '4mm', background: rgba(s.panelColor, s.panelOpacity), borderRadius: '2mm', padding: '2.4mm 2.4mm', display: 'flex', gap: '3mm',
        borderTop: `0.6mm solid ${s.accentColor}`, boxShadow: `0 1mm 4mm ${rgba('#000000', 0.35)}`,
      },
    }, ...cols);

    const layers = [];
    layers.push(deco(s, 'decoSun', () => h('div', {
      style: {
        position: 'absolute', right: '14mm', top: '10mm', width: '36mm', height: '36mm', borderRadius: '50%', background: `linear-gradient(${s.sunColor}, ${rgba(s.sunColor, 0.5)})`,
        boxShadow: `0 0 8mm ${rgba(s.sunColor, 0.6)}`,
        WebkitMask: 'linear-gradient(#000 0 52%, transparent 52% 57%, #000 57% 66%, transparent 66% 71%, #000 71% 78%, transparent 78% 84%, #000 84%)',
        mask: 'linear-gradient(#000 0 52%, transparent 52% 57%, #000 57% 66%, transparent 66% 71%, #000 71% 78%, transparent 78% 84%, #000 84%)',
      },
    })));
    layers.push(deco(s, 'decoPalms', () => h('div', { style: { position: 'absolute', inset: 0, pointerEvents: 'none' } },
      h('div', { style: { position: 'absolute', right: '-5mm', top: '2mm', width: '26mm', height: '39mm', background: `${svgUrl(palmSvg(s.palmColor))} center / contain no-repeat`, transform: 'scaleX(-1) rotate(-6deg)' } }),
      h('div', { style: { position: 'absolute', right: '12mm', top: '20mm', width: '15mm', height: '22mm', background: `${svgUrl(palmSvg(s.palmColor))} center / contain no-repeat`, transform: 'rotate(4deg)' } }))));
    layers.push(h('div', { style: { position: 'absolute', inset: '6mm', display: 'flex', flexDirection: 'column' } }, header, panel));

    return h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: `linear-gradient(${s.skyTop}, ${s.skyMid} 30%, ${s.skyBottom} 55%, ${s.skyMid} 100%)` } }, ...layers);
  },
};
