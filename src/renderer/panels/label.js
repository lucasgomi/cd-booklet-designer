// Pestaña «Pegatina»: diseño circular para el disco y hojas de etiquetas
// adhesivas (varios discos por hoja; se elige en cuál imprimir).
import { store, commit, usedAssets, addAsset } from '../store.js';
import { h, section, row, textInput, toggle, select, colorInput, numberInput, opacityInput, button, toast, pickImages } from '../ui.js';
import {
  renderLabel, LABEL_SHEETS, defaultSheetConfig, normalizeSheetConfig, LABEL_PRESETS, applyLabelPreset, newLabelText, normalizeLabel,
} from '../../shared/disc-label.js';
import { currentStyle } from '../../shared/model.js';
import { mountSheet } from '../../shared/render.js';
import { fontWeights, withCustomFont } from '../../shared/fonts.js';
import { PLACEHOLDER_HELP } from '../../shared/text.js';
import { newId } from '../../shared/tracklist.js';
import { fontButton } from '../fontpicker.js';

const SHEET_KEY = 'cdb.labelSheet';
const PREVIEW_PX = 330;

// La hoja de pegatinas es del equipo (papel que tienes en casa), no del proyecto.
let sheet = loadSheet();
function loadSheet() {
  try {
    return normalizeSheetConfig(JSON.parse(localStorage.getItem(SHEET_KEY) || 'null'));
  } catch {
    return defaultSheetConfig();
  }
}
function saveSheet() {
  try { localStorage.setItem(SHEET_KEY, JSON.stringify(sheet)); } catch { /* sin almacenamiento */ }
}
export function sheetConfig() {
  return sheet;
}

let previewHost = null;
let mapHost = null;
let selected = null; // id del texto que se está editando

const label = () => normalizeLabel(store.state.label);

/** Cambia la pegatina. `rebuild` redibuja el panel (cambios de estructura). */
function setL(fn, { key = null, rebuild = false } = {}) {
  commit((s) => {
    s.label = normalizeLabel(s.label);
    fn(s.label, s);
  }, { key, rebuild: rebuild ? 'label' : false });
}
const setText = (id, patch, opts = {}) => setL((l) => { Object.assign(l.texts.find((t) => t.id === id) || {}, patch); }, { key: `label.${id}.${Object.keys(patch).join()}`, ...opts });

/** Redibuja la vista previa de la pegatina (se llama en cada cambio del proyecto). */
export function refreshLabelPreview() {
  if (!previewHost || !previewHost.isConnected) return;
  const el = renderLabel(store.state, store.assets, { diameter: sheet.diameter, hole: sheet.hole, bleed: 0, guides: true, editor: true });
  // 1 mm = 96/25,4 px: se escala para que el disco ocupe PREVIEW_PX.
  previewHost.style.zoom = String(PREVIEW_PX / (sheet.diameter * 96 / 25.4));
  mountSheet(previewHost, el);
  for (const n of previewHost.querySelectorAll('[data-ltext]')) n.classList.toggle('lt-selected', n.dataset.ltext === selected);
}

/** Arrastrar textos en la vista previa: los rectos se mueven y los curvos giran. */
function setupDrag(box, rerender) {
  let drag = null;
  box.addEventListener('pointerdown', (e) => {
    const el = e.target.closest('[data-ltext]');
    if (!el) return;
    const T = label().texts.find((t) => t.id === el.dataset.ltext);
    if (!T) return;
    e.preventDefault();
    box.setPointerCapture(e.pointerId);
    const r = previewHost.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const mmPerPx = sheet.diameter / r.width;
    const changed = selected !== T.id;
    selected = T.id;
    drag = { T: { ...T }, x0: e.clientX, y0: e.clientY, cx, cy, mmPerPx, a0: Math.atan2(e.clientY - cy, e.clientX - cx), changed };
    refreshLabelPreview();
  });
  box.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const { T } = drag;
    if (T.path === 'free') {
      const x = Math.round((T.x + (e.clientX - drag.x0) * drag.mmPerPx) * 2) / 2;
      const y = Math.round((T.y + (e.clientY - drag.y0) * drag.mmPerPx) * 2) / 2;
      setText(T.id, { x, y }, { key: `label.drag.${T.id}` });
    } else {
      const a = Math.atan2(e.clientY - drag.cy, e.clientX - drag.cx);
      let angle = T.angle + ((a - drag.a0) * 180) / Math.PI;
      angle = ((Math.round(angle) + 540) % 360) - 180;
      setText(T.id, { angle }, { key: `label.drag.${T.id}` });
    }
  });
  const end = () => {
    if (!drag) return;
    const { changed } = drag;
    drag = null;
    if (changed) rerender();
  };
  box.addEventListener('pointerup', end);
  box.addEventListener('pointercancel', end);
}

function drawMap() {
  if (!mapHost) return;
  const { w, h: hh } = sheet.page;
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${w} ${hh}`);
  svg.setAttribute('class', 'label-map');
  const add = (tag, attrs, parent = svg) => {
    const e = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
    parent.appendChild(e);
    return e;
  };
  add('rect', { x: 0, y: 0, width: w, height: hh, class: 'page' });
  sheet.slots.forEach((s, i) => {
    const on = sheet.selected.includes(i);
    const g = add('g', { class: `slot${on ? ' on' : ''}`, 'data-slot': i });
    add('circle', { cx: s.x, cy: s.y, r: sheet.diameter / 2 }, g);
    add('circle', { cx: s.x, cy: s.y, r: sheet.hole / 2, class: 'hole' }, g);
    const t = add('text', { x: s.x, y: s.y + sheet.hole / 2 + 14, 'text-anchor': 'middle' }, g);
    t.textContent = on ? `${i + 1} ✓` : String(i + 1);
    g.addEventListener('click', () => {
      sheet.selected = on ? sheet.selected.filter((x) => x !== i) : [...sheet.selected, i].sort();
      saveSheet();
      drawMap();
    });
  });
  const n = sheet.selected.length;
  mapHost.replaceChildren(svg, h('p', { class: 'help', text: n
    ? `Se imprimirá en: ${sheet.selected.map((i) => i + 1).join(', ')}. Pincha los círculos para elegir dónde (por ejemplo, las que te queden libres en una hoja ya empezada).`
    : 'Pincha un círculo para elegir en qué pegatina de la hoja imprimir.' }));
}

function payload(extra = {}) {
  const d = store.state.disc;
  const name = [d.artist, d.title].filter(Boolean).join(' - ') || 'disco';
  return { state: store.state, assets: usedAssets(), suggestedName: name, sheet, ...extra };
}

export async function exportLabelsPdf(test = false) {
  if (!test && !sheet.selected.length) { toast('Elige al menos una pegatina de la hoja (pincha en el dibujo).', 'warn'); return null; }
  toast(test ? 'Generando hoja de prueba…' : 'Generando PDF de pegatinas…', 'info', 20000);
  try {
    const res = await window.api.exportLabels(payload(), { test });
    if (!res) { toast('Exportación cancelada.'); return null; }
    toast(res.path ? 'PDF guardado. Imprime al 100 % / tamaño real, sin «ajustar a la página».' : 'En el diálogo de imprimir elige «Guardar como PDF» (o tu impresora), escala 100 % / tamaño real y sin márgenes.', 'ok', 9000);
    if (!(await window.api.smokeDir())) window.api.showInFolder(res.path);
    return res;
  } catch (err) {
    toast(`No se pudo exportar: ${err.message}`, 'bad', 8000);
    return null;
  }
}

export async function exportLabelPng() {
  toast('Generando PNG a 300 ppp…', 'info', 20000);
  try {
    const res = await window.api.exportLabelPng(payload());
    if (!res) { toast('Exportación cancelada.'); return null; }
    toast(`PNG guardado (${res.width} × ${res.height} px, 300 ppp).`, 'ok', 6000);
    if (!(await window.api.smokeDir())) window.api.showInFolder(res.path);
    return res;
  } catch (err) {
    toast(`No se pudo exportar el PNG: ${err.message}`, 'bad', 8000);
    return null;
  }
}

function presetsSection() {
  const host = h('div', { class: 'label-presets' });
  for (const p of LABEL_PRESETS) {
    const mini = h('div', { class: 'lp-mini' });
    const b = h('button', { type: 'button', class: 'lp-card', title: p.name }, mini, h('span', { text: p.name }));
    b.addEventListener('click', () => {
      selected = null;
      setL((l, s) => {
        const next = applyLabelPreset(l, p.id);
        s.label = next;
        for (const t of next.texts) s.customFonts = withCustomFont(s.customFonts, t.font);
      }, { rebuild: true });
    });
    host.appendChild(b);
    // Miniatura: la pegatina con ese estilo y los datos de este disco.
    const st = { ...store.state, label: applyLabelPreset(label(), p.id) };
    const el = renderLabel(st, store.assets, { diameter: sheet.diameter, hole: sheet.hole });
    const inner = h('div', { style: { zoom: String(72 / (sheet.diameter * 96 / 25.4)) } });
    mini.appendChild(inner);
    requestAnimationFrame(() => mountSheet(inner, el));
  }
  return section('Estilos rápidos', host, h('p', { class: 'help', text: 'Un punto de partida: luego cambia lo que quieras abajo.' }));
}

function backgroundSection(L) {
  const hasCover = !!(store.state.images.cover && store.assets[store.state.images.cover]);
  const kind = L.background;
  const photo = kind === 'cover' || kind === 'image';
  return section('Fondo',
    row('Tipo', select(kind, [
      { value: 'cover', label: hasCover ? 'La portada' : 'La portada (aún no hay: se usa la plantilla)' },
      { value: 'image', label: 'Una imagen tuya' },
      { value: 'template', label: 'El estilo de la plantilla actual' },
      { value: 'color', label: 'Color liso' },
      { value: 'gradient', label: 'Degradado' },
      { value: 'cdr', label: 'CD-R plateado' },
      { value: 'vinyl', label: 'Vinilo (surcos negros)' },
    ], (v) => setL((l) => { l.background = v; }, { rebuild: true }))),
    kind === 'image' ? h('div', { class: 'toolbar' },
      button(L.image ? 'Cambiar imagen…' : 'Subir imagen…', async () => {
        const [f] = await pickImages();
        if (!f) return;
        const id = newId('img');
        addAsset(id, f.url);
        setL((l) => { l.image = id; }, { rebuild: true });
      }, { class: 'primary' })) : null,
    photo ? row('Zoom', numberInput(Math.round((L.imageScale || 1) * 100), { min: 50, max: 300, step: 1, unit: '%' }, (v) => setL((l) => { l.imageScale = v / 100; }, { key: 'label.imageScale' }))) : null,
    photo ? row('Mover en horizontal', numberInput(L.imageX, { min: -60, max: 60, step: 0.5, unit: 'mm' }, (v) => setL((l) => { l.imageX = v; }, { key: 'label.imageX' })), { half: true }) : null,
    photo ? row('Mover en vertical', numberInput(L.imageY, { min: -60, max: 60, step: 0.5, unit: 'mm' }, (v) => setL((l) => { l.imageY = v; }, { key: 'label.imageY' })), { half: true }) : null,
    kind === 'color' || kind === 'gradient' ? row(kind === 'gradient' ? 'Color 1' : 'Color', colorInput(L.color, (v) => setL((l) => { l.color = v; }, { key: 'label.color' }))) : null,
    kind === 'gradient' ? row('Color 2', colorInput(L.color2, (v) => setL((l) => { l.color2 = v; }, { key: 'label.color2' }))) : null,
    kind === 'gradient' ? row('Forma', select(L.gradient, [
      { value: 'linear', label: 'Lineal' }, { value: 'radial', label: 'Del centro hacia fuera' }, { value: 'conic', label: 'Girando (cónico)' },
    ], (v) => setL((l) => { l.gradient = v; }, { rebuild: true }))) : null,
    kind === 'gradient' && L.gradient !== 'radial' ? row('Ángulo', numberInput(L.angle, { min: 0, max: 360, step: 1, unit: '°' }, (v) => setL((l) => { l.angle = v; }, { key: 'label.angle' }))) : null,
    row('Oscurecer', opacityInput(L.dim, (v) => setL((l) => { l.dim = v; }, { key: 'label.dim' })), { help: 'Para que los textos se lean mejor sobre fotos.' }));
}

function centerSection(L) {
  const hub = (patch, rebuild = false) => setL((l) => { Object.assign(l.hub, patch); }, { key: `label.hub.${Object.keys(patch)}`, rebuild });
  const edge = (patch, rebuild = false) => setL((l) => { Object.assign(l.edge, patch); }, { key: `label.edge.${Object.keys(patch)}`, rebuild });
  return section('Centro y borde',
    h('div', { class: 'field' }, toggle(L.hub.show, (v) => hub({ show: v }, true), 'Círculo central (como la etiqueta de un vinilo)')),
    L.hub.show ? row('Color', colorInput(L.hub.color, (v) => hub({ color: v }))) : null,
    L.hub.show ? row('Diámetro', numberInput(L.hub.size, { min: 20, max: 100, step: 0.5, unit: 'mm' }, (v) => hub({ size: v }))) : null,
    L.hub.show ? row('Borde', numberInput(L.hub.border, { min: 0, max: 4, step: 0.1, unit: 'mm' }, (v) => hub({ border: v })), { half: true }) : null,
    L.hub.show && L.hub.border > 0 ? row('Color del borde', colorInput(L.hub.borderColor, (v) => hub({ borderColor: v })), { half: true }) : null,
    h('div', { class: 'field' }, toggle(L.edge.show, (v) => edge({ show: v }, true), 'Aro decorativo cerca del borde')),
    L.edge.show ? row('Color del aro', colorInput(L.edge.color, (v) => edge({ color: v }))) : null,
    L.edge.show ? row('Grosor', numberInput(L.edge.width, { min: 0.1, max: 4, step: 0.05, unit: 'mm' }, (v) => edge({ width: v })), { half: true }) : null,
    L.edge.show ? row('Distancia al borde', numberInput(L.edge.inset, { min: 0, max: 20, step: 0.5, unit: 'mm' }, (v) => edge({ inset: v })), { half: true }) : null);
}

function fontPick(current, onPick) {
  const style = currentStyle(store.state);
  return fontButton(current || style.titleFont, (f) => onPick(f), {});
}

function textCard(T, i, n, rerender) {
  const open = T.id === selected;
  const arc = T.path !== 'free';
  const set = (patch, rebuild = false) => setText(T.id, patch, { rebuild });
  const head = h('div', { class: 'lt-head' },
    textInput(T.text, (v) => set({ text: v }), { placeholder: 'Texto o {titulo}, {artista}…' }),
    select(T.path, [{ value: 'free', label: 'Recto' }, { value: 'top', label: 'Curva arriba' }, { value: 'bottom', label: 'Curva abajo' }], (v) => set({ path: v }, true)),
    button(open ? '▴' : '▾', () => { selected = open ? null : T.id; rerender(); }, { class: 'icon', title: open ? 'Cerrar' : 'Editar estilo' }));
  const card = h('div', { class: `lt-card${open ? ' open' : ''}` }, head);
  if (!open) return card;
  card.append(...[
    h('div', { class: 'font-control' },
      h('span', { class: 'field-label', text: 'Tipografía' }),
      h('div', { class: 'font-line' },
        fontPick(T.font, (f) => setL((l, s) => { const t = l.texts.find((x) => x.id === T.id); t.font = f; t.weight = fontWeights(f).reduce((a, b) => (Math.abs(b - t.weight) < Math.abs(a - t.weight) ? b : a)); s.customFonts = withCustomFont(s.customFonts, f); }, { rebuild: true })),
        select(T.weight, fontWeights(T.font || currentStyle(store.state).titleFont).map((w) => ({ value: w, label: String(w) })), (v) => set({ weight: Number(v) })))),
    row('Tamaño', numberInput(T.size, { min: 4, max: 60, step: 0.5, unit: 'pt' }, (v) => set({ size: v }))),
    row('Color', colorInput(T.color, (v) => set({ color: v })), { half: true }),
    row('Opacidad', opacityInput(T.opacity ?? 1, (v) => set({ opacity: v })), { half: true }),
    h('div', { class: 'field inline-toggles' },
      toggle(T.uppercase, (v) => set({ uppercase: v }), 'MAYÚSCULAS'),
      toggle(T.italic, (v) => set({ italic: v }), 'Cursiva'),
      toggle(T.outline, (v) => set({ outline: v }, true), 'Contorno')),
    T.outline ? row('Color del contorno', colorInput(T.outlineColor, (v) => set({ outlineColor: v })), { half: true }) : null,
    T.outline ? row('Grosor del contorno', numberInput(Math.round((T.outlineWidth ?? 0.16) * 100), { min: 2, max: 40, step: 1, unit: '%' }, (v) => set({ outlineWidth: v / 100 })), { half: true }) : null,
    row('Espaciado entre letras', numberInput(Math.round((T.spacing || 0) * 100), { min: -10, max: 80, step: 1, unit: '%' }, (v) => set({ spacing: v / 100 }))),
    arc ? row('Distancia al borde', numberInput(T.offset ?? 4.5, { min: 0, max: 40, step: 0.5, unit: 'mm' }, (v) => set({ offset: v })), { half: true }) : null,
    arc ? row('Girar', numberInput(T.angle || 0, { min: -180, max: 180, step: 1, unit: '°' }, (v) => set({ angle: v })), { half: true }) : null,
    !arc ? row('Horizontal', numberInput(T.x || 0, { min: -60, max: 60, step: 0.5, unit: 'mm' }, (v) => set({ x: v })), { half: true }) : null,
    !arc ? row('Vertical', numberInput(T.y || 0, { min: -60, max: 60, step: 0.5, unit: 'mm' }, (v) => set({ y: v })), { half: true }) : null,
    !arc ? row('Girar', numberInput(T.angle || 0, { min: -180, max: 180, step: 1, unit: '°' }, (v) => set({ angle: v })), { half: true }) : null,
    !arc ? row('Alineación (varias líneas)', select(T.align || 'center', [{ value: 'left', label: 'Izquierda' }, { value: 'center', label: 'Centro' }, { value: 'right', label: 'Derecha' }], (v) => set({ align: v })), { half: true }) : null,
    h('div', { class: 'toolbar' },
      button('Duplicar', () => setL((l) => { const copy = { ...T, id: newLabelText().id, y: (T.y || 0) + 8 }; l.texts.splice(i + 1, 0, copy); selected = copy.id; }, { rebuild: true })),
      i > 0 ? button('Subir', () => setL((l) => { l.texts.splice(i - 1, 0, ...l.texts.splice(i, 1)); }, { rebuild: true }), { title: 'Dibujarlo por debajo de los demás' }) : null,
      i < n - 1 ? button('Bajar', () => setL((l) => { l.texts.splice(i + 1, 0, ...l.texts.splice(i, 1)); }, { rebuild: true })) : null,
      button('Borrar', () => { selected = null; setL((l) => { l.texts.splice(i, 1); }, { rebuild: true }); }, { class: 'danger' }))].filter(Boolean));
  return card;
}

function textsSection(L, rerender) {
  const add = (over) => setL((l) => { const t = newLabelText(over); l.texts.push(t); selected = t.id; }, { rebuild: true });
  return section('Textos',
    h('p', { class: 'help', text: 'Arrastra los textos en la vista previa: los rectos se mueven y los curvos giran alrededor del disco.' }),
    ...L.texts.map((t, i) => textCard(t, i, L.texts.length, rerender)),
    h('div', { class: 'toolbar' },
      button('+ Texto recto', () => add({ text: 'Texto', path: 'free', y: 30 })),
      button('+ Texto en curva', () => add({ text: '{fecha}', path: 'top', offset: 12, size: 9 }))),
    h('p', { class: 'help', text: PLACEHOLDER_HELP }));
}

function listSection(L) {
  const Ls = L.list;
  const set = (patch, rebuild = false) => setL((l) => { Object.assign(l.list, patch); }, { key: `label.list.${Object.keys(patch)}`, rebuild });
  return section('Lista de canciones',
    h('div', { class: 'field' }, toggle(Ls.show, (v) => set({ show: v }, true), 'Poner la lista en la pegatina')),
    Ls.show ? row('Dónde', select(Ls.place, [
      { value: 'ring', label: 'En un anillo alrededor del agujero' },
      { value: 'sides', label: 'A los lados del agujero' },
      { value: 'below', label: 'Debajo del agujero (para discos cortos)' },
    ], (v) => set({ place: v }, true))) : null,
    Ls.show ? h('div', { class: 'font-control' },
      h('span', { class: 'field-label', text: 'Tipografía' }),
      h('div', { class: 'font-line' },
        fontPick(Ls.font, (f) => setL((l, s) => { l.list.font = f; s.customFonts = withCustomFont(s.customFonts, f); }, { rebuild: true })),
        select(Ls.weight, fontWeights(Ls.font || currentStyle(store.state).titleFont).map((w) => ({ value: w, label: String(w) })), (v) => set({ weight: Number(v) })))) : null,
    Ls.show ? row('Tamaño máximo', numberInput(Ls.size, { min: 3, max: 10, step: 0.1, unit: 'pt' }, (v) => set({ size: v })), { help: 'Si no caben, se hacen más pequeñas solas.' }) : null,
    Ls.show ? row('Color', colorInput(Ls.color, (v) => set({ color: v }))) : null,
    Ls.show ? h('div', { class: 'field inline-toggles' },
      toggle(Ls.durations, (v) => set({ durations: v }), 'Duraciones'),
      toggle(Ls.outline, (v) => set({ outline: v }, true), 'Contorno')) : null,
    Ls.show && Ls.outline ? row('Color del contorno', colorInput(Ls.outlineColor, (v) => set({ outlineColor: v }))) : null);
}

export function renderLabelPanel(root) {
  const L = label();
  if (selected && !L.texts.some((t) => t.id === selected)) selected = null;
  const rerender = () => { const top = root.scrollTop; renderLabelPanel(root); root.scrollTop = top; };
  root.replaceChildren();

  previewHost = h('div', { class: 'label-preview-host' });
  const box = h('div', { class: 'label-preview' }, previewHost);
  setupDrag(box, rerender);
  root.appendChild(section('Pegatina del CD', box,
    h('p', { class: 'help', text: 'Las líneas discontinuas son el borde y el agujero de la pegatina (no se imprimen).' })));
  root.appendChild(presetsSection());
  root.appendChild(backgroundSection(L));
  root.appendChild(textsSection(L, rerender));
  root.appendChild(listSection(L));
  root.appendChild(centerSection(L));

  // ------------------------------------------------------------ hoja
  mapHost = h('div', { class: 'label-map-host' });
  const redrawAll = () => { saveSheet(); drawMap(); refreshLabelPreview(); };
  const num = (value, opts, fn) => numberInput(value, opts, (v) => { fn(v); redrawAll(); });
  root.appendChild(section('Hoja de pegatinas',
    row('Formato', select(sheet.sheetId, LABEL_SHEETS.map((s) => ({ value: s.id, label: s.name })), (v) => {
      sheet = defaultSheetConfig(v);
      saveSheet();
      renderLabelPanel(root);
      refreshLabelPreview();
    })),
    mapHost,
    h('details', { class: 'label-measures' },
      h('summary', { text: 'Medidas de la hoja (por si tu marca es distinta)' }),
      h('p', { class: 'help', text: 'Mide con una regla tu hoja: el diámetro de la pegatina, el del agujero y dónde está el centro de cada disco (desde el borde izquierdo y desde arriba).' }),
      row('Diámetro de la pegatina', num(sheet.diameter, { min: 80, max: 125, step: 0.5, unit: 'mm' }, (v) => { sheet.diameter = v; })),
      row('Diámetro del agujero', num(sheet.hole, { min: 0, max: 46, step: 0.5, unit: 'mm' }, (v) => { sheet.hole = v; })),
      ...sheet.slots.flatMap((s, i) => [
        row(`Centro ${i + 1}: desde la izquierda`, num(s.x, { min: 0, max: sheet.page.w, step: 0.5, unit: 'mm' }, (v) => { s.x = v; }), { half: true }),
        row(`Centro ${i + 1}: desde arriba`, num(s.y, { min: 0, max: sheet.page.h, step: 0.5, unit: 'mm' }, (v) => { s.y = v; }), { half: true }),
      ])),
    h('details', { class: 'label-measures' },
      h('summary', { text: 'Calibración de la impresora' }),
      h('p', { class: 'help', text: 'Si al imprimir la hoja de prueba todo sale movido unos milímetros, corrígelo aquí (positivo = a la derecha / hacia abajo).' }),
      row('Mover en horizontal', num(sheet.offsetX, { min: -10, max: 10, step: 0.25, unit: 'mm' }, (v) => { sheet.offsetX = v; }), { half: true }),
      row('Mover en vertical', num(sheet.offsetY, { min: -10, max: 10, step: 0.25, unit: 'mm' }, (v) => { sheet.offsetY = v; }), { half: true }),
      row('Sangrado', num(sheet.bleed, { min: 0, max: 3, step: 0.25, unit: 'mm' }, (v) => { sheet.bleed = v; }),
        { help: 'El diseño se imprime un poco más grande que la pegatina (y el agujero un poco más pequeño) para que no queden bordes blancos si la impresora se desvía.' }))));

  root.appendChild(section('Imprimir pegatinas',
    h('div', { class: 'print-box' },
      h('b', { text: '⚠ Imprimir al 100 % / tamaño real' }),
      h('p', { text: 'La primera vez, imprime la hoja de prueba en papel normal y ponla sobre la hoja de pegatinas a contraluz para comprobar que coinciden.' })),
    h('div', { class: 'toolbar' },
      button('Exportar PDF de pegatinas…', () => exportLabelsPdf(false), { class: 'primary' }),
      button('Hoja de prueba…', () => exportLabelsPdf(true)),
      button('PNG de la pegatina (300 ppp)…', exportLabelPng))));

  drawMap();
  refreshLabelPreview();
}
