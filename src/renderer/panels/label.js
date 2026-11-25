// Pestaña «Pegatina»: diseño circular para el disco y hojas de etiquetas
// adhesivas (varios discos por hoja; se elige en cuál imprimir).
import { store, commit, usedAssets } from '../store.js';
import { h, section, row, textInput, toggle, select, colorInput, numberInput, opacityInput, button, toast } from '../ui.js';
import { renderLabel, LABEL_SHEETS, defaultSheetConfig, normalizeSheetConfig } from '../../shared/disc-label.js';
import { defaultLabel, currentStyle } from '../../shared/model.js';
import { mountSheet } from '../../shared/render.js';
import { fontCatalog } from '../../shared/fonts.js';
import { PLACEHOLDER_HELP } from '../../shared/text.js';

const SHEET_KEY = 'cdb.labelSheet';
const PREVIEW_PX = 300;

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

function label() {
  return { ...defaultLabel(), ...(store.state.label || {}) };
}

function setLabel(key, value, opts = {}) {
  commit((s) => { s.label = { ...defaultLabel(), ...(s.label || {}), [key]: value }; }, { key: `label.${key}`, ...opts });
}

/** Redibuja la vista previa de la pegatina (se llama en cada cambio del proyecto). */
export function refreshLabelPreview() {
  if (!previewHost || !previewHost.isConnected) return;
  const el = renderLabel(store.state, store.assets, { diameter: sheet.diameter, hole: sheet.hole, bleed: 0, guides: true });
  // 1 mm = 96/25,4 px: se escala para que el disco ocupe PREVIEW_PX.
  previewHost.style.zoom = String(PREVIEW_PX / (sheet.diameter * 96 / 25.4));
  mountSheet(previewHost, el);
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
    toast('PDF guardado. Imprime al 100 % / tamaño real, sin «ajustar a la página».', 'ok', 7000);
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

export function renderLabelPanel(root) {
  const L = label();
  const style = currentStyle(store.state);
  const rebuild = { rebuild: 'label' };
  root.replaceChildren();

  // ---------------------------------------------------------- diseño
  previewHost = h('div', { class: 'label-preview-host' });
  const catalog = fontCatalog(store.state.customFonts);
  const groups = {};
  for (const f of catalog) (groups[f.category] ||= []).push({ value: f.family, label: f.family });
  const fontOptions = [
    { value: '', label: `La del título de la plantilla (${style.titleFont || 'Montserrat'})` },
    ...Object.entries(groups).map(([group, options]) => ({ group, options })),
  ];
  const hasCover = !!(store.state.images.cover && store.assets[store.state.images.cover]);

  root.appendChild(section('Pegatina del CD',
    h('div', { class: 'label-preview' }, previewHost),
    h('p', { class: 'help', text: 'Las líneas discontinuas son el borde y el agujero de la pegatina (no se imprimen).' }),
    row('Fondo', select(L.background, [
      { value: 'cover', label: hasCover ? 'La portada' : 'La portada (aún no hay: se usa la plantilla)' },
      { value: 'template', label: 'El estilo de la plantilla actual' },
      { value: 'color', label: 'Color liso' },
    ], (v) => setLabel('background', v, rebuild))),
    L.background === 'color' ? row('Color de fondo', colorInput(L.color, (v) => setLabel('color', v))) : null,
    row('Oscurecer el fondo', opacityInput(L.dim, (v) => setLabel('dim', v)), { help: 'Para que los textos se lean mejor sobre fotos.' }),
    row('Textos', select(L.layout, [
      { value: 'arcs', label: 'Título arriba y artista abajo, en curva' },
      { value: 'list', label: 'En curva + lista de canciones' },
      { value: 'none', label: 'Sin textos (sólo el fondo)' },
    ], (v) => setLabel('layout', v, rebuild)))));

  if (L.layout !== 'none') {
    root.appendChild(section('Textos de la pegatina',
      row('Texto de arriba', textInput(L.topText, (v) => setLabel('topText', v)), { help: PLACEHOLDER_HELP }),
      row('Texto de abajo', textInput(L.bottomText, (v) => setLabel('bottomText', v))),
      row('Tipografía', select(L.font, fontOptions, (v) => setLabel('font', v, rebuild))),
      row('Grosor', select(L.weight, [300, 400, 500, 600, 700, 800, 900].map((w) => ({ value: w, label: String(w) })), (v) => setLabel('weight', Number(v)))),
      row('Tamaño', numberInput(L.size, { min: 6, max: 30, step: 0.5, unit: 'pt' }, (v) => setLabel('size', v))),
      L.layout === 'list' ? row('Tamaño máximo de la lista', numberInput(L.listSize, { min: 3, max: 9, step: 0.1, unit: 'pt' }, (v) => setLabel('listSize', v)),
        { help: 'Si no caben, las canciones se hacen más pequeñas solas.' }) : null,
      row('Color del texto', colorInput(L.textColor, (v) => setLabel('textColor', v))),
      h('div', { class: 'field' }, toggle(L.outline, (v) => setLabel('outline', v, rebuild), 'Contorno para que se lea sobre cualquier fondo')),
      L.outline ? row('Color del contorno', colorInput(L.outlineColor, (v) => setLabel('outlineColor', v))) : null));
  }

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
