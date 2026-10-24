// Estado de la aplicación + historial para deshacer/rehacer.
import { defaultState, normalizeState } from '../shared/model.js';

const HISTORY_LIMIT = 80;
const COALESCE_MS = 900;

export const store = {
  state: defaultState(),
  assets: {},          // id -> data URL
  filePath: null,
  dirty: false,
};

const listeners = new Set();
let past = [];
let future = [];
let lastKey = null;
let lastTime = 0;
let current = JSON.stringify(store.state);

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(detail) {
  for (const fn of listeners) fn(detail);
}

function setDirty(value) {
  if (store.dirty === value) return;
  store.dirty = value;
  window.api?.setDirty(value);
  emit({ title: true });
}

/**
 * Aplica un cambio. `key` agrupa cambios seguidos del mismo campo (p. ej.
 * al escribir) en un solo paso de deshacer. `rebuild` indica qué paneles
 * deben redibujarse: 'tracks', 'design', 'images', 'disc', 'booklet' o true (todos).
 */
export function commit(mutate, { key = null, rebuild = false } = {}) {
  mutate(store.state);
  const next = JSON.stringify(store.state);
  if (next === current) { emit({ rebuild }); return; }
  const now = Date.now();
  if (!(key && key === lastKey && now - lastTime < COALESCE_MS)) {
    past.push(current);
    if (past.length > HISTORY_LIMIT) past.shift();
  }
  future = [];
  current = next;
  lastKey = key;
  lastTime = now;
  setDirty(true);
  emit({ rebuild });
}

export function undo() {
  if (!past.length) return false;
  future.push(current);
  current = past.pop();
  store.state = JSON.parse(current);
  lastKey = null;
  setDirty(true);
  emit({ rebuild: true });
  return true;
}

export function redo() {
  if (!future.length) return false;
  past.push(current);
  current = future.pop();
  store.state = JSON.parse(current);
  lastKey = null;
  setDirty(true);
  emit({ rebuild: true });
  return true;
}

/** Carga un proyecto entero (nuevo, abierto o ejemplo). */
export function loadProject(state, assets = {}, filePath = null) {
  store.state = normalizeState(state);
  store.assets = { ...assets };
  store.filePath = filePath;
  past = [];
  future = [];
  lastKey = null;
  current = JSON.stringify(store.state);
  store.dirty = true; // fuerza la notificación
  setDirty(false);
  emit({ rebuild: true });
}

export function markSaved(filePath) {
  store.filePath = filePath;
  setDirty(false);
}

export function addAsset(id, dataUrl) {
  store.assets[id] = dataUrl;
}

/** Ids de imágenes en uso (para no guardar imágenes huérfanas). */
export function usedAssets(state = store.state) {
  const ids = new Set([state.images.background, state.images.cover, ...state.images.stickers.map((s) => s.asset)].filter(Boolean));
  return Object.fromEntries(Object.entries(store.assets).filter(([id]) => ids.has(id)));
}
