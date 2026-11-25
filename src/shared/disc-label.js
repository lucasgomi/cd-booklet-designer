// Pegatina para el propio disco: diseño circular (con el agujero central)
// y hojas de etiquetas adhesivas con varios discos por hoja. Todo en mm.
import { h, fontStack, rgba } from './dom.js';
import { renderSheet, prepareTracks } from './render.js';
import { currentStyle, placeholderValues, PANEL_MM } from './model.js';
import { normalizeLabel } from './label-model.js';
import { fillTemplate } from './text.js';

export { defaultLabel, newLabelText, normalizeLabel, LABEL_PRESETS, applyLabelPreset } from './label-model.js';

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

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) e.setAttribute(k, v);
  return e;
};
const PT = 0.3528; // mm por punto

function backgroundLayer(L, state, assets, S, afterMount) {
  const bg = h('div', { style: { position: 'absolute', inset: 0, overflow: 'hidden', background: L.color } });
  const photo = (url) => {
    const k = L.imageScale || 1;
    bg.appendChild(h('img', {
      src: url,
      style: {
        position: 'absolute', width: `${S * k}mm`, height: `${S * k}mm`, objectFit: 'cover', display: 'block',
        left: `${(S - S * k) / 2 + (L.imageX || 0)}mm`, top: `${(S - S * k) / 2 + (L.imageY || 0)}mm`,
      },
    }));
  };
  const cover = state.images.cover && assets[state.images.cover];
  const own = L.image && assets[L.image];
  let kind = L.background;
  if (kind === 'cover' && !cover) kind = 'template';
  if (kind === 'image' && !own) kind = 'color';
  switch (kind) {
    case 'cover': photo(cover); break;
    case 'image': photo(own); break;
    case 'gradient':
      bg.style.background = L.gradient === 'radial' ? `radial-gradient(circle, ${L.color}, ${L.color2})`
        : L.gradient === 'conic' ? `conic-gradient(from ${L.angle}deg, ${L.color}, ${L.color2}, ${L.color})`
          : `linear-gradient(${L.angle}deg, ${L.color}, ${L.color2})`;
      break;
    case 'cdr':
      // Disco grabable: plateado con un brillo de arcoíris muy suave.
      bg.style.background = 'radial-gradient(circle, transparent 34%, rgba(255,60,170,.10) 46%, rgba(60,200,255,.12) 58%, rgba(255,225,60,.10) 70%, transparent 84%), '
        + 'conic-gradient(from 20deg, #E6E9EE, #C6CCD5, #F7F8FA, #B8C0CB, #EEF0F4, #CBD1D9, #E6E9EE)';
      break;
    case 'vinyl':
      bg.style.background = 'conic-gradient(from 35deg, transparent, rgba(255,255,255,.10) 8%, transparent 16%, transparent 50%, rgba(255,255,255,.10) 58%, transparent 66%), '
        + 'repeating-radial-gradient(circle, #0E0E0E 0 0.32mm, #1C1C1C 0.32mm 0.64mm)';
      break;
    case 'template': {
      const blank = { artista: '', titulo: '', disco: '', fecha: '', pistas: '', total: '' };
      const sheet = renderSheet(blankState(state), assets, { editor: false, values: blank });
      Object.assign(sheet.style, { position: 'absolute', left: 0, top: 0, transform: `scale(${S / PANEL_MM})`, transformOrigin: '0 0' });
      bg.appendChild(sheet);
      afterMount.push(...(sheet._afterMount || []));
      break;
    }
    default: break;
  }
  if (L.dim > 0) bg.appendChild(h('div', { style: { position: 'absolute', inset: 0, background: rgba('#000000', L.dim) } }));
  return bg;
}

/**
 * Pinta una pegatina. Devuelve un cuadrado de (diámetro + 2·sangrado) mm
 * con el disco recortado en círculo y el agujero central.
 * opts: { diameter, hole, bleed, guides, editor }
 */
export function renderLabel(state, assets, { diameter = 117, hole = 41, bleed = 0, guides = false, editor = false } = {}) {
  const L = normalizeLabel(state.label);
  const style = currentStyle(state);
  const values = placeholderValues(state, style);
  const S = diameter + 2 * bleed;
  const c = S / 2;
  const R = diameter / 2;
  const holeR = Math.max(0, hole / 2 - bleed);
  const afterMount = [];
  const fam = (f) => f || style.titleFont || 'Montserrat';

  const disc = h('div', {
    class: 'cdb-label',
    style: {
      position: 'relative', width: `${S}mm`, height: `${S}mm`, overflow: 'hidden', borderRadius: '50%',
      WebkitMask: `radial-gradient(circle at center, transparent ${holeR}mm, #000 ${holeR + 0.05}mm)`,
      mask: `radial-gradient(circle at center, transparent ${holeR}mm, #000 ${holeR + 0.05}mm)`,
    },
  }, backgroundLayer(L, state, assets, S, afterMount));

  // Círculo central (como la etiqueta de un vinilo) y aro decorativo.
  if (L.hub.show) {
    const d = Math.max(hole, L.hub.size);
    disc.appendChild(h('div', {
      style: {
        position: 'absolute', left: `${c - d / 2}mm`, top: `${c - d / 2}mm`, width: `${d}mm`, height: `${d}mm`, borderRadius: '50%',
        background: L.hub.color, boxSizing: 'border-box', border: L.hub.border > 0 ? `${L.hub.border}mm solid ${L.hub.borderColor}` : 'none',
      },
    }));
  }
  if (L.edge.show) {
    const r = R - L.edge.inset;
    disc.appendChild(h('div', {
      style: {
        position: 'absolute', left: `${c - r}mm`, top: `${c - r}mm`, width: `${2 * r}mm`, height: `${2 * r}mm`, borderRadius: '50%',
        boxSizing: 'border-box', border: `${L.edge.width}mm solid ${L.edge.color}`,
      },
    }));
  }

  // Textos en curva (SVG) y textos libres (HTML).
  const svg = svgEl('svg', { viewBox: `0 0 ${S} ${S}` });
  svg.style.cssText = `position:absolute;left:0;top:0;width:${S}mm;height:${S}mm;overflow:visible;pointer-events:none`;
  const uid = `l${Math.random().toString(36).slice(2, 8)}`;
  let n = 0;
  const arcText = (raw, opts, { r, top, fit = 0.92, full = false, stretch = true, attrs = {} }) => {
    if (!raw) return null;
    const id = `${uid}${(n += 1)}`;
    // Arriba: de izquierda a derecha por encima. Abajo: por debajo, para que se lea derecho.
    const d = full
      ? `M ${c} ${c - r} A ${r} ${r} 0 1 1 ${c - 0.001} ${c - r}`
      : `M ${c - r} ${c} A ${r} ${r} 0 0 ${top ? 1 : 0} ${c + r} ${c}`;
    svg.appendChild(svgEl('path', { id, d, fill: 'none' }));
    const fontMm = opts.size * PT;
    const t = svgEl('text', {
      'font-family': fontStack(fam(opts.font)).replace(/"/g, "'"), 'font-weight': opts.weight, 'font-style': opts.italic ? 'italic' : 'normal',
      'font-size': fontMm, fill: opts.color, 'text-anchor': full ? 'start' : 'middle', 'letter-spacing': (opts.spacing || 0) * fontMm, opacity: opts.opacity ?? 1, ...attrs,
    });
    if (opts.outline) {
      for (const [k, v] of Object.entries({ stroke: opts.outlineColor, 'stroke-width': fontMm * (opts.outlineWidth ?? 0.16), 'stroke-linejoin': 'round', 'paint-order': 'stroke' })) t.setAttribute(k, v);
    }
    const tp = svgEl('textPath', { href: `#${id}`, startOffset: full ? '0' : '50%' });
    tp.textContent = opts.uppercase ? raw.toUpperCase() : raw;
    t.appendChild(tp);
    // Si no cabe se comprime en vez de cortarse; en el anillo, se reparte por toda la vuelta.
    const max = (full ? 2 : 1) * Math.PI * r * fit;
    afterMount.push(() => {
      try {
        const len = t.getComputedTextLength();
        if (full && (stretch || len > max)) { t.setAttribute('textLength', max); t.setAttribute('lengthAdjust', len > max ? 'spacingAndGlyphs' : 'spacing'); } else if (!full && len > max) { t.setAttribute('textLength', max); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
      } catch { /* sin medidas (fuera del DOM) */ }
    });
    return t;
  };

  const free = [];
  for (const T of L.texts) {
    const raw = fillTemplate(T.text, values);
    if (!raw) continue;
    const fontMm = T.size * PT;
    if (T.path === 'top' || T.path === 'bottom') {
      const top = T.path === 'top';
      const edge = R - (T.offset ?? 4.5);
      const r = top ? edge - fontMm * 0.72 : edge - fontMm * 0.22;
      const t = arcText(raw, T, { r, top, attrs: { 'data-ltext': T.id } });
      if (!t) continue;
      const g = svgEl('g', { transform: `rotate(${T.angle || 0} ${c} ${c})` });
      g.appendChild(t);
      if (editor) t.style.pointerEvents = 'auto';
      svg.appendChild(g);
    } else {
      const shadow = T.outline ? { WebkitTextStroke: `${(fontMm * (T.outlineWidth ?? 0.16) * 2).toFixed(2)}mm ${T.outlineColor}`, paintOrder: 'stroke fill' } : {};
      free.push(h('div', {
        'data-ltext': T.id,
        text: raw,
        style: {
          position: 'absolute', left: `${c + (T.x || 0)}mm`, top: `${c + (T.y || 0)}mm`, transform: `translate(-50%, -50%) rotate(${T.angle || 0}deg)`,
          fontFamily: fontStack(fam(T.font)), fontWeight: T.weight, fontStyle: T.italic ? 'italic' : 'normal', fontSize: `${T.size}pt`, color: T.color,
          letterSpacing: `${T.spacing || 0}em`, textTransform: T.uppercase ? 'uppercase' : 'none', whiteSpace: 'pre', textAlign: T.align || 'center',
          lineHeight: 1.05, opacity: T.opacity ?? 1, cursor: editor ? 'move' : 'default', ...shadow,
        },
      }));
    }
  }

  // Lista de canciones.
  const Ls = L.list;
  if (Ls.show && state.tracks.length) {
    const tracks = prepareTracks(state, { ...style, durationFormat: 'm:ss' });
    const label = (t) => `${String(t.number).padStart(2, '0')} ${t.title}${Ls.durations && t.duration ? ` ${t.duration}` : ''}`;
    const inner = (L.hub.show ? Math.max(hole, L.hub.size) : hole) / 2;
    const arcsTop = L.texts.filter((t) => t.path === 'top').reduce((m, t) => Math.max(m, (t.offset ?? 4.5) + t.size * PT * 1.1), 3);
    const arcsBottom = L.texts.filter((t) => t.path === 'bottom').reduce((m, t) => Math.max(m, (t.offset ?? 4.5) + t.size * PT * 1.1), 3);
    const outer = R - Math.max(arcsTop, arcsBottom) - 1.5;
    const listFont = { fontFamily: fontStack(fam(Ls.font)), fontWeight: Ls.weight, color: Ls.color, fontVariantNumeric: 'tabular-nums' };
    const shadow = Ls.outline ? [0.15, -0.15].flatMap((d) => [`${d}mm 0 0 ${Ls.outlineColor}`, `0 ${d}mm 0 ${Ls.outlineColor}`]).join(', ') : 'none';
    if (Ls.place === 'ring') {
      // Una o varias vueltas: se llena desde el círculo central hacia fuera
      // (o desde fuera hacia dentro sin círculo central) hasta que cabe todo.
      const items = tracks.map(label);
      const rMin = inner + 2.2;
      const rMax = outer - 0.5;
      let size = Ls.size;
      let rings = [];
      for (; size >= 3; size *= 0.9) {
        const fontMm = size * PT;
        const step = fontMm * 1.45;
        const charMm = fontMm * 0.5;
        rings = [];
        let rest = [...items];
        for (let k = 0; rest.length; k += 1) {
          const r = L.hub.show ? rMin + fontMm * 0.3 + k * step : rMax - fontMm * 0.75 - k * step;
          if (r < rMin + fontMm * 0.3 - 0.01 || r > rMax) break;
          const cap = (2 * Math.PI * r) / charMm;
          const take = [];
          let len = 0;
          while (rest.length && (take.length === 0 || len + rest[0].length + 5 <= cap)) { len += rest[0].length + 5; take.push(rest.shift()); }
          rings.push({ r, text: take.join('  •  '), fill: len / cap });
        }
        if (!rest.length) break;
      }
      for (const ring of rings) {
        const t = arcText(ring.text, { ...Ls, size, spacing: 0.02, uppercase: false, outlineWidth: 0.14 },
          { r: ring.r, full: true, stretch: ring.fill > 0.6, fit: 0.985 });
        if (t) svg.appendChild(t);
      }
    } else {
      const rows = (list, box, align) => h('div', {
        style: {
          position: 'absolute', ...box, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...listFont,
          fontSize: `${box.sizePt.toFixed(2)}pt`, textShadow: shadow, textAlign: align, lineHeight: 1.15,
        },
      }, ...list.map((t) => h('div', {
        style: { height: `${box.rowMm}mm`, display: 'flex', alignItems: 'center', gap: '0.8mm', flexDirection: align === 'right' ? 'row-reverse' : 'row', overflow: 'hidden' },
      },
      h('span', { text: String(t.number).padStart(2, '0'), style: { flex: 'none', opacity: 0.75 } }),
      h('span', { text: t.title, style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }),
      Ls.durations && t.duration ? h('span', { text: t.duration, style: { flex: 'none', opacity: 0.75 } }) : null)));
      const half = Math.ceil(tracks.length / 2);
      if (Ls.place === 'below') {
        // Bloque a dos columnas entre el agujero y el borde de abajo.
        const top = inner + 2.5;
        const bottom = Math.max(top + 8, outer * 0.82);
        const w = 2 * Math.sqrt(Math.max(0, outer * outer - bottom * bottom)) * 0.96;
        const rowMm = (bottom - top) / Math.max(1, half);
        const sizePt = Math.min(Ls.size, (rowMm * 0.8) / PT);
        const colW = (w - 3) / 2;
        disc.appendChild(rows(tracks.slice(0, half), { left: `${c - w / 2}mm`, top: `${c + top}mm`, width: `${colW}mm`, height: `${bottom - top}mm`, rowMm, sizePt }, 'left'));
        disc.appendChild(rows(tracks.slice(half), { left: `${c - w / 2 + colW + 3}mm`, top: `${c + top}mm`, width: `${colW}mm`, height: `${bottom - top}mm`, rowMm, sizePt }, 'left'));
      } else {
        // A los lados del agujero.
        const gap = inner + 2.5;
        const w = Math.max(10, outer * 0.92 - gap);
        const x2 = gap + w;
        const halfH = Math.sqrt(Math.max(0, outer * outer - x2 * x2)) * 0.98;
        const rowMm = (2 * halfH) / Math.max(1, half);
        const sizePt = Math.min(Ls.size, (rowMm * 0.78) / PT);
        disc.appendChild(rows(tracks.slice(0, half), { left: `${c - gap - w}mm`, top: `${c - halfH}mm`, width: `${w}mm`, height: `${2 * halfH}mm`, rowMm, sizePt }, 'right'));
        disc.appendChild(rows(tracks.slice(half), { left: `${c + gap}mm`, top: `${c - halfH}mm`, width: `${w}mm`, height: `${2 * halfH}mm`, rowMm, sizePt }, 'left'));
      }
    }
  }
  disc.appendChild(svg);
  for (const f of free) disc.appendChild(f);

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
