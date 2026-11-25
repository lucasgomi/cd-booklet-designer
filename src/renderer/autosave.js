// Guardado automático: cada pocos segundos se guarda una copia del proyecto
// en el navegador (IndexedDB), para recuperar el trabajo si se cierra la app,
// la pestaña o se recarga el móvil sin guardar. Funciona igual en escritorio y web.
import { store, subscribe } from './store.js';

const DB = 'cdbook';
const STORE = 'autosave';
const KEEP = 3;      // copias de sesiones anteriores que se conservan
const DELAY = 1500;  // ms sin cambios antes de guardar
const session = String(Date.now());

function open() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, fn) {
  const db = await open();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(out?.result ?? out); };
    t.onerror = () => { db.close(); reject(t.error); };
  });
}

/** Copias de sesiones anteriores con cambios sin guardar, la más reciente primero. */
export async function pendingRecoveries() {
  try {
    const all = await tx('readonly', (s) => s.getAll());
    return (all || []).filter((r) => r.session !== session && r.dirty).sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export async function forget(id) {
  try { await tx('readwrite', (s) => s.delete(id)); } catch { /* sin IndexedDB */ }
}

async function prune() {
  const all = await tx('readonly', (s) => s.getAll()).catch(() => []);
  const old = (all || []).filter((r) => r.session !== session).sort((a, b) => b.at - a.at).slice(KEEP);
  for (const r of old) await forget(r.session);
}

/** Empieza a guardar: sólo cuando hay cambios sin guardar; al guardar, se borra la copia. */
export function startAutosave(serialize, name) {
  let timer = null;
  const write = async () => {
    try {
      await tx('readwrite', (s) => s.put({ session, at: Date.now(), dirty: true, name: name(), path: store.filePath, data: serialize() }, session));
    } catch { /* sin IndexedDB (modo privado…): no pasa nada */ }
  };
  subscribe(() => {
    clearTimeout(timer);
    if (store.dirty) timer = setTimeout(write, DELAY);
    else forget(session); // guardado o proyecto recién abierto: nada que recuperar
  });
  prune();
}
