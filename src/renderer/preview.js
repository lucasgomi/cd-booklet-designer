// Vista previa en vivo, zoom, edición de stickers con el ratón y avisos.
import { store, commit } from './store.js';
import { renderFitted, mountSheet, analyzeSheet, FIT_MIN_SCALE, h } from '../shared/render.js';
import { sheetWidth, PANEL_MM, currentStyle } from '../shared/model.js';
import { totalSeconds, formatTotal, CD_LIMIT_SECONDS } from '../shared/time.js';
import { getSelectedSticker, setSelectedSticker } from './panels/images.js';
import { button, toast } from './ui.js';
import { getTemplate } from '../shared/templates/index.js';

const PX_PER_MM = 96 / 25.4;

const canvas = document.getElementById('canvas');
const frame = document.getElementById('sheet-frame');
const host = document.getElementById('sheet-host');
const warningsEl = document.getElementById('warnings');
const zoomLabel = document.getElementById('zoom-label');
const sizeLabel = document.getElementById('size-label');
const safeToggle = document.getElementById('show-safe');

let zoom = 1;
let autoFit = true;
let lastWidth = null;
let pending = false;
let onSelectionChange = () => {};
let onEditTrack = () => {};
export let lastAnalysis = { overflow: [], vertical: false };
/** Escala aplicada por el ajuste automático (1 = tamaño elegido). */
export let fitScale = 1;
/** Columnas decididas por el ajuste automático (undefined = las de la plantilla). */
export let fitCols;

export function initPreview({ selectionChanged, editTrack }) {
  onSelectionChange = selectionChanged;
  onEditTrack = editTrack || onEditTrack;
  safeToggle.addEventListener('change', () => schedule());
  new ResizeObserver(() => { if (autoFit) fit(); }).observe(canvas);
  host.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerdown', (e) => {
    if (e.target === canvas || e.target === frame) { select(null); hideDecoMenu(); }
  });
  canvas.addEventListener('wheel', (e) => {
    if (!e.ctrlKey) return;
    e.preventDefault();
    setZoom(zoom * (e.deltaY < 0 ? 1.1 : 1 / 1.1));
  }, { passive: false });
  window.addEventListener('keydown', onKey);
  document.fonts.addEventListener('loadingdone', () => schedule());
}

export function toggleSafe() {
  safeToggle.checked = !safeToggle.checked;
  schedule();
}

/** Redibuja en el próximo fotograma (agrupa cambios seguidos). */
export function schedule() {
  if (pending) return;
  pending = true;
  requestAnimationFrame(() => {
    pending = false;
    render();
  });
}

function render() {
  const { state, assets } = store;
  const fitted = renderFitted(state, assets, { editor: true, showSafe: safeToggle.checked, selectedSticker: getSelectedSticker() }, (s) => mountSheet(host, s));
  const { sheet } = fitted;
  fitScale = fitted.scale;
  fitCols = fitted.cols;
  const W = sheetWidth(state);
  sizeLabel.textContent = `Hoja ${W} × ${PANEL_MM} mm${state.booklet.enabled ? ' (librito)' : ''}`;
  if (W !== lastWidth) { lastWidth = W; autoFit = true; }
  if (autoFit) fit(); else applyZoom();
  lastAnalysis = analyzeSheet(sheet);
  renderWarnings();
}

function applyZoom() {
  const W = sheetWidth(store.state) * PX_PER_MM;
  const H = PANEL_MM * PX_PER_MM;
  host.style.transform = `scale(${zoom})`;
  frame.style.width = `${W * zoom}px`;
  frame.style.height = `${H * zoom}px`;
  zoomLabel.textContent = `${Math.round(zoom * 100)} %`;
}

export function fit() {
  const W = sheetWidth(store.state) * PX_PER_MM;
  const H = PANEL_MM * PX_PER_MM;
  const z = Math.min((canvas.clientWidth - 64) / W, (canvas.clientHeight - 64) / H);
  zoom = Math.max(0.2, Math.min(6, z));
  autoFit = true;
  applyZoom();
}

export function setZoom(z) {
  zoom = Math.max(0.2, Math.min(8, z));
  autoFit = false;
  applyZoom();
}
export const zoomIn = () => setZoom(zoom * 1.2);
export const zoomOut = () => setZoom(zoom / 1.2);

// ------------------------------------------------------------ stickers

function select(id) {
  if (getSelectedSticker() === id) return;
  setSelectedSticker(id);
  schedule();
  onSelectionChange();
}

function hideDecoMenu() {
  document.getElementById('deco-menu')?.remove();
}

/** Botón flotante para ocultar el adorno pinchado. */
function showDecoMenu(decoEl, e) {
  hideDecoMenu();
  const key = decoEl.dataset.deco;
  const tpl = getTemplate(store.state.templateId);
  const label = tpl.decorations?.find((d) => d.key === key)?.label || 'este adorno';
  const rect = canvas.getBoundingClientRect();
  const menu = h('div', {
    id: 'deco-menu', class: 'deco-menu',
    style: { left: `${e.clientX - rect.left + canvas.scrollLeft + 8}px`, top: `${e.clientY - rect.top + canvas.scrollTop + 8}px` },
  }, h('span', { text: label }));
  menu.appendChild(button('Ocultar', () => {
    hideDecoMenu();
    commit((s) => { s.styles[s.templateId] = { ...currentStyle(s), [key]: false }; }, { rebuild: 'design' });
    toast(`«${label}» oculto. Ctrl+Z para recuperarlo, o en Diseño → Adornos.`, 'ok', 5000);
  }, { class: 'small primary' }));
  canvas.appendChild(menu);
}

function onPointerDown(e) {
  hideDecoMenu();
  const stickerEl = e.target.closest('.cdb-sticker');
  if (!stickerEl) {
    select(null);
    const decoEl = e.target.closest('.cdb-deco');
    if (decoEl) showDecoMenu(decoEl, e);
    return;
  }
  e.preventDefault();
  const id = stickerEl.dataset.stickerId;
  const idx = store.state.images.stickers.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const handle = e.target.closest('.cdb-handle')?.dataset.handle || 'move';
  if (getSelectedSticker() !== id) select(id);
  const st = store.state.images.stickers[idx];
  const start = { x: e.clientX, y: e.clientY, sx: st.x, sy: st.y, w: st.w, rot: st.rot || 0 };
  const rect = stickerEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dist0 = Math.hypot(e.clientX - cx, e.clientY - cy) || 1;
  const ang0 = Math.atan2(e.clientY - cy, e.clientX - cx);
  const scale = PX_PER_MM * zoom;
  let moved = false;

  const move = (ev) => {
    moved = true;
    const live = host.querySelector(`[data-sticker-id="${id}"]`);
    if (handle === 'move') {
      st.x = +(start.sx + (ev.clientX - start.x) / scale).toFixed(2);
      st.y = +(start.sy + (ev.clientY - start.y) / scale).toFixed(2);
      if (live) { live.style.left = `${st.x}mm`; live.style.top = `${st.y}mm`; }
    } else if (handle === 'scale') {
      const ratio = Math.hypot(ev.clientX - cx, ev.clientY - cy) / dist0;
      st.w = Math.max(2, +(start.w * ratio).toFixed(2));
      if (live) live.style.width = `${st.w}mm`;
    } else if (handle === 'rotate') {
      let rot = start.rot + ((Math.atan2(ev.clientY - cy, ev.clientX - cx) - ang0) * 180) / Math.PI;
      rot = ((rot + 540) % 360) - 180;
      if (ev.shiftKey) rot = Math.round(rot / 15) * 15;
      st.rot = +rot.toFixed(1);
      if (live) live.style.transform = `translate(-50%, -50%) rotate(${st.rot}deg)`;
    }
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    if (moved) commit(() => {}, { rebuild: 'images' });
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function onKey(e) {
  const id = getSelectedSticker();
  if (!id || e.target.closest?.('input, textarea, select, [contenteditable]')) return;
  const idx = store.state.images.stickers.findIndex((s) => s.id === id);
  if (idx < 0) return;
  const step = e.shiftKey ? 5 : 0.5;
  const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
  if (e.key === 'Delete' || e.key === 'Backspace') {
    e.preventDefault();
    setSelectedSticker(null);
    commit((s) => { s.images.stickers.splice(idx, 1); }, { rebuild: 'images' });
  } else if (moves[e.key]) {
    e.preventDefault();
    const [dx, dy] = moves[e.key];
    commit((s) => { s.images.stickers[idx].x += dx; s.images.stickers[idx].y += dy; }, { key: `nudge.${id}`, rebuild: 'images' });
  } else if (e.key === 'Escape') {
    select(null);
  }
}

// --------------------------------------------------------------- avisos

function renderWarnings() {
  const { state } = store;
  const items = [];
  const total = totalSeconds(state.tracks);
  if (total > CD_LIMIT_SECONDS) {
    items.push(h('div', { class: 'warning bad' }, `⚠ El total (${formatTotal(total, 'mmss')}) supera los 80 minutos de un CD-R.`));
  }
  const missing = state.tracks.filter((t) => t.duration == null).length;
  if (missing) items.push(h('div', { class: 'warning' }, `${missing} ${missing === 1 ? 'canción no tiene' : 'canciones no tienen'} duración.`));
  if (lastAnalysis.vertical) {
    items.push(h('div', { class: 'warning bad' }, state.autoFit === false
      ? '⚠ La lista no cabe en la página: activa «Ajustar la letra si no cabe» (Diseño), o reduce el tamaño de letra, la altura de fila o los márgenes.'
      : `⚠ No caben ${state.tracks.length} canciones ni con la letra al ${Math.round(FIT_MIN_SCALE * 100)} %: prueba una plantilla de dos o tres columnas (Dos columnas, Periódico, Ticket…), reduce márgenes o reparte el disco en dos libritos.`));
  } else if (fitScale < 1 || fitCols > 1 && currentStyle(state).columns === 'auto') {
    const parts = [];
    if (fitCols > 1 && currentStyle(state).columns === 'auto') parts.push('la lista se ha repartido en dos columnas');
    if (fitScale < 1) parts.push(`la letra de la lista se ha reducido al ${Math.round(fitScale * 100)} % (igual en todas las filas)`);
    items.push(h('div', { class: 'warning info' }, `ℹ Para que quepan las ${state.tracks.length} canciones, ${parts.join(' y ')}. Se puede cambiar en «Diseño».`));
  }
  const style = currentStyle(state);
  for (const o of lastAnalysis.overflow) {
    const t = state.tracks[o.index];
    if (!t) continue;
    const msg = h('span', {}, h('a', { class: 'warn-link', text: `El título ${o.index + 1} «${o.title}»`, title: 'Ir a esta canción', href: '#' }), ' no cabe. ');
    msg.firstChild.addEventListener('click', (e) => { e.preventDefault(); onEditTrack(o.index); });
    if (o.suggestion) {
      msg.append('Propuesta: ', h('b', { text: `«${o.suggestion}»` }));
      items.push(h('div', { class: 'warning' }, msg, button('Usar abreviatura', () => {
        commit((s) => {
          s.tracks[o.index].shortTitle = o.suggestion;
          s.styles[s.templateId] = { ...currentStyle(s), useShortTitles: true };
        }, { rebuild: true });
      }, { class: 'small' })));
    } else {
      msg.append(style.useShortTitles && t.shortTitle ? 'La versión abreviada tampoco cabe.' : 'Escribe una versión abreviada en «Canciones».');
      items.push(h('div', { class: 'warning' }, msg));
    }
  }
  if (lastAnalysis.overflow.length > 1 && lastAnalysis.overflow.some((o) => o.suggestion)) {
    items.unshift(h('div', { class: 'warning' }, `${lastAnalysis.overflow.length} títulos no caben. `, button('Usar todas las abreviaturas propuestas', () => {
      commit((s) => {
        for (const o of lastAnalysis.overflow) if (o.suggestion && s.tracks[o.index]) s.tracks[o.index].shortTitle = o.suggestion;
        s.styles[s.templateId] = { ...currentStyle(s), useShortTitles: true };
      }, { rebuild: true });
    }, { class: 'small primary' })));
  }
  warningsEl.replaceChildren(...items);
  warningsEl.hidden = !items.length;
  markTrackRows();
}

/** Señala en la pestaña «Canciones» las filas cuyo título no cabe. */
export function markTrackRows() {
  const bad = new Map(lastAnalysis.overflow.map((o) => [store.state.tracks[o.index]?.id, o]));
  for (const row of document.querySelectorAll('.track-row')) {
    const o = bad.get(row.dataset.id);
    row.classList.toggle('overflow', !!o);
    row.title = o ? `No cabe en el diseño${o.suggestion ? `. Propuesta: «${o.suggestion}»` : ''}` : '';
  }
}
