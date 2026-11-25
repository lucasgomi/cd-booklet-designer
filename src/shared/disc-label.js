// Pegatina para el propio disco: diseño circular (con el agujero central)
// y hojas de etiquetas adhesivas con varios discos por hoja. Todo en mm.
import { h, fontStack, rgba } from './dom.js';
import { renderSheet, prepareTracks } from './render.js';
import { currentStyle, placeholderValues, PANEL_MM, defaultLabel } from './model.js';

export { defaultLabel };
import { fillTemplate } from './text.js';

/**
 * Formatos de hoja. `slots` son los centros de cada pegatina medidos desde
 * la esquina superior izquierda de la hoja. Cada marca coloca los discos a
 * su manera: las medidas se pueden ajustar en la app y comprobar con la
 * hoja de prueba.
 */
export const LABEL_SHEETS = [
  {
    id: 'a4-3', name: 'A4 · 3 CD por hoja (en zigzag)', page: { w: 210, h: 297 }, diameter: 117, hole: 41,
    slots: [{ x: 60.5, y: 70.5 }, { x: 149.5, y: 148.5 }, { x: 60.5, y: 226.5 }],
  },
  {
    id: 'a4-2', name: 'A4 · 2 CD por hoja', page: { w: 210, h: 297 }, diameter: 117, hole: 41,
    slots: [{ x: 105, y: 75 }, { x: 105, y: 222 }],
  },
  {
    id: 'a4-1', name: 'A4 · 1 CD centrado', page: { w: 210, h: 297 }, diameter: 117, hole: 41,
    slots: [{ x: 105, y: 148.5 }],
  },
  {
    id: 'letter-2', name: 'Carta (EE. UU.) · 2 CD por hoja', page: { w: 215.9, h: 279.4 }, diameter: 117, hole: 41,
    slots: [{ x: 108, y: 73 }, { x: 108, y: 206.4 }],
  },
];

export function sheetPreset(id) {
  return LABEL_SHEETS.find((s) => s.id === id) || LABEL_SHEETS[0];
}

/** Ajustes de la hoja (se guardan en el equipo, no en el proyecto). */
export function defaultSheetConfig(id = 'a4-3') {
  const p = sheetPreset(id);
  return {
    sheetId: p.id,
    page: { ...p.page },
    diameter: p.diameter,
    hole: p.hole,
    slots: p.slots.map((s) => ({ ...s })),
    selected: [0],
    offsetX: 0,     // calibración de la impresora (mm)
    offsetY: 0,
    bleed: 1.5,     // el diseño sobresale para que no queden bordes blancos
  };
}

export function normalizeSheetConfig(cfg) {
  const base = defaultSheetConfig(cfg?.sheetId);
  const c = { ...base, ...(cfg || {}) };
  c.page = { ...base.page, ...(cfg?.page || {}) };
  c.slots = (Array.isArray(cfg?.slots) && cfg.slots.length ? cfg.slots : base.slots).map((s) => ({ x: Number(s.x) || 0, y: Number(s.y) || 0 }));
  c.selected = (Array.isArray(c.selected) ? c.selected : [0]).filter((i) => i >= 0 && i < c.slots.length);
  return c;
}

/** Copia del proyecto sin textos ni canciones: sólo el «look» de la plantilla. */
function blankState(state) {
  return {
    ...state,
    tracks: [],
    booklet: { ...state.booklet, enabled: false },
    disc: { ...state.disc, show: { artist: false, title: false, discNumber: false, date: false } },
  };
}

/**
 * Pinta una pegatina. Devuelve un cuadrado de (diámetro + 2·sangrado) mm
 * con el disco recortado en círculo y el agujero central.
 * opts: { diameter, hole, bleed, guides }
 */
export function renderLabel(state, assets, { diameter = 117, hole = 41, bleed = 0, guides = false } = {}) {
  const L = { ...defaultLabel(), ...(state.label || {}) };
  const style = currentStyle(state);
  const values = placeholderValues(state, style);
  const S = diameter + 2 * bleed;
  const c = S / 2;
  const holeR = Math.max(0, hole / 2 - bleed);
  const afterMount = [];

  // Fondo.
  const bg = h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: L.color } });
  const cover = state.images.cover && assets[state.images.cover];
  if (L.background === 'cover' && cover) {
    bg.appendChild(h('img', { src: cover, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }));
  } else if (L.background !== 'color') {
    const blank = { artista: '', titulo: '', disco: '', fecha: '', pistas: '', total: '' };
    const sheet = renderSheet(blankState(state), assets, { editor: false, values: blank });
    const k = S / PANEL_MM;
    Object.assign(sheet.style, { position: 'absolute', left: 0, top: 0, transform: `scale(${k})`, transformOrigin: '0 0' });
    bg.appendChild(sheet);
    afterMount.push(...(sheet._afterMount || []));
  }
  if (L.dim > 0) bg.appendChild(h('div', { style: { position: 'absolute', inset: 0, background: rgba('#000000', L.dim) } }));

  const disc = h('div', {
    class: 'cdb-label',
    style: {
      position: 'relative', width: `${S}mm`, height: `${S}mm`, overflow: 'hidden', borderRadius: '50%',
      WebkitMask: `radial-gradient(circle at center, transparent ${holeR}mm, #000 ${holeR + 0.05}mm)`,
      mask: `radial-gradient(circle at center, transparent ${holeR}mm, #000 ${holeR + 0.05}mm)`,
    },
  }, bg);

  // Textos en arco (SVG con textPath) y lista a los lados del agujero.
  const family = L.font || style.titleFont || 'Montserrat';
  const fontMm = L.size * 0.3528;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
  svg.style.cssText = `position:absolute;left:0;top:0;width:${S}mm;height:${S}mm;overflow:visible`;
  const uid = `l${Math.random().toString(36).slice(2, 8)}`;
  const margin = bleed + 4.5;
  const arc = (text, top) => {
    if (!text) return;
    const r = top ? c - margin - fontMm * 0.72 : c - margin - fontMm * 0.22;
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('id', `${uid}${top ? 't' : 'b'}`);
    // Arriba: de izquierda a derecha por encima. Abajo: por debajo, para que se lea derecho.
    path.setAttribute('d', `M ${c - r} ${c} A ${r} ${r} 0 0 ${top ? 1 : 0} ${c + r} ${c}`);
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
    const t = document.createElementNS(NS, 'text');
    const attrs = {
      'font-family': fontStack(family).replace(/"/g, "'"), 'font-weight': L.weight, 'font-size': fontMm, fill: L.textColor, 'text-anchor': 'middle',
      'letter-spacing': fontMm * 0.04,
    };
    if (L.outline) Object.assign(attrs, { stroke: L.outlineColor, 'stroke-width': fontMm * 0.16, 'stroke-linejoin': 'round', 'paint-order': 'stroke' });
    for (const [k, v] of Object.entries(attrs)) t.setAttribute(k, v);
    const tp = document.createElementNS(NS, 'textPath');
    tp.setAttribute('href', `#${uid}${top ? 't' : 'b'}`);
    tp.setAttribute('startOffset', '50%');
    tp.textContent = text;
    t.appendChild(tp);
    svg.appendChild(t);
    // Si no cabe en medio círculo, se comprime en vez de cortarse.
    afterMount.push(() => {
      try {
        const max = Math.PI * r * 0.92;
        if (t.getComputedTextLength() > max) { t.setAttribute('textLength', max); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      } catch { /* sin medidas (fuera del DOM) */ }
    });
  };
  arc(fillTemplate(L.topText, values), true);
  arc(fillTemplate(L.bottomText, values), false);
  if (L.layout !== 'none') disc.appendChild(svg);

  if (L.layout === 'list' && state.tracks.length) {
    const tracks = prepareTracks(state, style);
    const half = Math.ceil(tracks.length / 2);
    const inner = hole / 2 + 2.5;                 // distancia al agujero
    const outer = c - margin - fontMm * 1.3 - 1.5; // por dentro de los textos en arco
    const w = Math.max(10, outer * 0.92 - inner);
    const x2 = inner + w;
    const halfH = Math.sqrt(Math.max(0, outer * outer - x2 * x2)) * 0.98;
    const rowMm = (2 * halfH) / Math.max(1, half);
    const sizePt = Math.min(L.listSize, (rowMm * 0.78) / 0.3528);
    const shadow = L.outline ? [0.15, -0.15].flatMap((d) => [`${d}mm 0 0 ${L.outlineColor}`, `0 ${d}mm 0 ${L.outlineColor}`]).join(', ') : 'none';
    const column = (list, left) => h('div', {
      style: {
        position: 'absolute', top: `${c - halfH}mm`, height: `${2 * halfH}mm`, width: `${w}mm`,
        left: left ? `${c - inner - w}mm` : `${c + inner}mm`, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        fontFamily: fontStack(family), fontWeight: 600, fontSize: `${sizePt.toFixed(2)}pt`, color: L.textColor, textShadow: shadow,
        textAlign: left ? 'right' : 'left', lineHeight: 1.15, fontVariantNumeric: 'tabular-nums',
      },
    }, ...list.map((t) => h('div', {
      style: { height: `${rowMm}mm`, display: 'flex', alignItems: 'center', gap: '0.8mm', flexDirection: left ? 'row-reverse' : 'row', overflow: 'hidden' },
    },
    h('span', { text: String(t.number).padStart(2, '0'), style: { flex: 'none', opacity: 0.75 } }),
    h('span', { text: t.title, style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }))));
    disc.appendChild(column(tracks.slice(0, half), true));
    disc.appendChild(column(tracks.slice(half), false));
  }

  const out = h('div', { style: { position: 'relative', width: `${S}mm`, height: `${S}mm` } }, disc);
  if (guides) out.appendChild(guideSvg(S, diameter, hole));
  out._afterMount = afterMount;
  return out;
}

/** Contornos de corte reales (sin sangrado): borde exterior y agujero. */
export function guideSvg(S, diameter, hole, { cross = false } = {}) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${S} ${S}`);
  svg.style.cssText = `position:absolute;left:0;top:0;width:${S}mm;height:${S}mm;overflow:visible;pointer-events:none`;
  const c = S / 2;
  const el = (tag, attrs) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    svg.appendChild(e);
  };
  el('circle', { cx: c, cy: c, r: diameter / 2, fill: 'none', stroke: '#E0006A', 'stroke-width': 0.25, 'stroke-dasharray': '1.2 0.8' });
  if (hole > 0) el('circle', { cx: c, cy: c, r: hole / 2, fill: 'none', stroke: '#E0006A', 'stroke-width': 0.25, 'stroke-dasharray': '1.2 0.8' });
  if (cross) {
    el('line', { x1: c - 4, y1: c, x2: c + 4, y2: c, stroke: '#000', 'stroke-width': 0.2 });
    el('line', { x1: c, y1: c - 4, x2: c, y2: c + 4, stroke: '#000', 'stroke-width': 0.2 });
  }
  return svg;
}
