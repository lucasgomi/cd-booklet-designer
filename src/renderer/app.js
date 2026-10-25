// Punto de entrada de la interfaz: une estado, paneles, vista previa y menús.
import { store, subscribe, commit, undo, redo, loadProject, markSaved, usedAssets } from './store.js';
import { defaultState, normalizeState, FILE_FORMAT, FILE_VERSION } from '../shared/model.js';
import { templateCategories } from '../shared/templates/index.js';
import { loadCustomFonts } from '../shared/fonts.js';
import { renderDiscPanel } from './panels/disc.js';
import { renderTracksPanel, updateTracksSummary, setupPasteDialog, importCueResult } from './panels/tracks.js';
import { renderDesignPanel, refreshUserTemplates, switchTemplate } from './panels/design.js';
import { renderImagesPanel, setSelectedSticker, addStickerFiles } from './panels/images.js';
import { renderBookletPanel } from './panels/booklet.js';
import { renderGalleryPanel } from './panels/gallery.js';
import { initPreview, schedule, fit, zoomIn, zoomOut, toggleSafe, markTrackRows, fitScale, fitCols } from './preview.js';
import { exampleProject } from './example.js';
import { toast } from './ui.js';

const $ = (id) => document.getElementById(id);
const openPaste = setupPasteDialog();

// ------------------------------------------------------------- paneles

const panels = {
  disc: () => renderDiscPanel($('tab-disc')),
  tracks: () => renderTracksPanel($('tab-tracks'), { openPaste }),
  gallery: () => renderGalleryPanel($('tab-gallery')),
  design: () => renderDesignPanel($('tab-design')),
  images: () => renderImagesPanel($('tab-images')),
  booklet: () => renderBookletPanel($('tab-booklet'), { exportPdf, exportPng }),
};
// Qué paneles dependen de cada tipo de cambio.
const REBUILD = {
  tracks: ['tracks', 'disc'],
  groups: ['tracks'],
  disc: ['disc', 'tracks'],
  design: ['design'],
  images: ['images'],
  booklet: ['booklet'],
};

let galleryStale = true;

function rebuild(which) {
  const names = which === true ? Object.keys(panels) : REBUILD[which] || [];
  // La galería es costosa: sólo se redibuja si está a la vista (y al abrirla).
  if (which && which !== true && !$('tab-gallery').hidden && !names.includes('gallery')) names.push('gallery');
  if ($('tab-gallery').hidden) galleryStale = true;
  // Conserva el scroll de cada panel al redibujarlo.
  for (const n of names) {
    const el = $(`tab-${n}`);
    if (n === 'gallery' && el.hidden) continue;
    const top = el.scrollTop;
    panels[n]();
    el.scrollTop = top;
  }
}

function updateTitle() {
  const name = store.filePath ? store.filePath.split(/[\\/]/).pop() : 'Sin título';
  const title = `${store.dirty ? '• ' : ''}${name} — CD Booklet Designer`;
  document.title = title;
  window.api.setTitle(title);
}

subscribe(({ rebuild: which, title }) => {
  if (title) updateTitle();
  if (which) rebuild(which);
  if (which === true || which === 'tracks' || which === 'disc') markTrackRows();
  if (which === true) $('template-select').value = store.state.templateId;
  updateTracksSummary();
  schedule();
});

// Pestañas.
$('tabs').addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-tab]');
  if (!btn) return;
  showTab(btn.dataset.tab);
});
export function showTab(name) {
  for (const b of $('tabs').querySelectorAll('button')) b.classList.toggle('active', b.dataset.tab === name);
  for (const n of Object.keys(panels)) $(`tab-${n}`).hidden = n !== name;
  if (name === 'gallery' && galleryStale) {
    galleryStale = false;
    panels.gallery();
  }
}

// Selector de plantilla de la barra superior.
const tplSelect = $('template-select');
for (const cat of templateCategories()) {
  const group = document.createElement('optgroup');
  group.label = cat.name;
  for (const t of cat.templates) group.appendChild(new Option(t.name, t.id));
  tplSelect.appendChild(group);
}
tplSelect.addEventListener('change', () => switchTemplate(tplSelect.value));

// ---------------------------------------------------------- proyectos

function serialize() {
  return JSON.stringify({ format: FILE_FORMAT, version: FILE_VERSION, savedAt: new Date().toISOString(), state: store.state, assets: usedAssets() });
}

function suggestedName() {
  const d = store.state.disc;
  return [d.artist, d.title, d.discNumber && `n${d.discNumber}`].filter(Boolean).join(' - ') || 'librito';
}

async function openFromData(data, path) {
  let parsed;
  try {
    parsed = JSON.parse(data);
  } catch {
    toast('El archivo no es un proyecto válido.', 'bad');
    return;
  }
  if (parsed.format !== FILE_FORMAT || !parsed.state) { toast('El archivo no es un proyecto de CD Booklet Designer.', 'bad'); return; }
  const state = normalizeState(parsed.state);
  await loadCustomFonts(state.customFonts);
  setSelectedSticker(null);
  loadProject(state, parsed.assets || {}, path);
  toast(`Abierto ${path.split(/[\\/]/).pop()}`, 'ok');
}

function confirmDiscard() {
  return !store.dirty || confirm('Hay cambios sin guardar. ¿Descartarlos?');
}

async function save(saveAs = false) {
  const path = await window.api.saveProject({ path: store.filePath, data: serialize(), suggestedName: suggestedName(), saveAs });
  if (!path) return false;
  markSaved(path);
  toast('Proyecto guardado.', 'ok');
  return true;
}

function exportPayload() {
  return { state: store.state, assets: usedAssets(), suggestedName: suggestedName(), fitScale, fitCols };
}

async function exportPdf() {
  toast('Generando PDF…', 'info', 20000);
  try {
    const res = await window.api.exportPdf(exportPayload());
    if (!res) { toast('Exportación cancelada.'); return null; }
    toast(`PDF guardado. Recuerda: imprimir al 100 % / tamaño real.`, 'ok', 7000);
    if (!(await window.api.smokeDir())) window.api.showInFolder(res.path);
    return res;
  } catch (err) {
    toast(`No se pudo exportar el PDF: ${err.message}`, 'bad', 8000);
    return null;
  }
}

async function exportPng() {
  toast('Generando PNG a 300 ppp…', 'info', 20000);
  try {
    const res = await window.api.exportPng(exportPayload());
    if (!res) { toast('Exportación cancelada.'); return null; }
    toast(`PNG guardado (${res.width} × ${res.height} px, 300 ppp).`, 'ok', 6000);
    if (!(await window.api.smokeDir())) window.api.showInFolder(res.path);
    return res;
  } catch (err) {
    toast(`No se pudo exportar el PNG: ${err.message}`, 'bad', 8000);
    return null;
  }
}

const commands = {
  new: () => { if (confirmDiscard()) { setSelectedSticker(null); loadProject(defaultState()); showTab('disc'); } },
  open: async () => {
    if (!confirmDiscard()) return;
    const res = await window.api.openProject();
    if (res) await openFromData(res.data, res.path);
  },
  save: () => save(false),
  'save-as': () => save(true),
  'save-and-close': async () => { if (await save(false)) window.api.closeNow(); },
  example: () => { if (confirmDiscard()) { const ex = exampleProject(); setSelectedSticker(null); loadProject(ex.state, ex.assets); } },
  'export-pdf': exportPdf,
  'export-png': exportPng,
  undo: () => undo(),
  redo: () => redo(),
  'zoom-in': zoomIn,
  'zoom-out': zoomOut,
  'zoom-fit': fit,
  'toggle-safe': toggleSafe,
};

window.api.onMenu((cmd) => commands[cmd]?.());
document.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-cmd]');
  if (btn) commands[btn.dataset.cmd]?.();
});
// Deshacer/rehacer fuera de los campos de texto (dentro, el del propio campo).
document.addEventListener('keydown', (e) => {
  if (!(e.ctrlKey || e.metaKey) || e.target.closest('input, textarea')) return;
  const k = e.key.toLowerCase();
  if (k === 'z' && !e.shiftKey) { e.preventDefault(); undo(); } else if (k === 'y' || (k === 'z' && e.shiftKey)) { e.preventDefault(); redo(); }
});

/** Lleva a la pestaña «Canciones» y enfoca la versión abreviada de esa canción. */
function editTrack(index) {
  showTab('tracks');
  const row = document.querySelectorAll('.track-row')[index];
  if (!row) return;
  row.scrollIntoView({ block: 'center', behavior: 'smooth' });
  row.classList.add('flash');
  setTimeout(() => row.classList.remove('flash'), 1400);
  (row.querySelector('.short') || row.querySelector('.title'))?.focus();
}

// Arrastrar y soltar: imágenes -> stickers, .cue -> canciones, .cdbook -> proyecto.
function setupDrop() {
  const overlay = $('drop-overlay');
  let depth = 0;
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes('Files');
  window.addEventListener('dragenter', (e) => { if (!hasFiles(e)) return; depth += 1; overlay.hidden = false; });
  window.addEventListener('dragleave', () => { depth = Math.max(0, depth - 1); if (!depth) overlay.hidden = true; });
  window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
  window.addEventListener('drop', async (e) => {
    if (!hasFiles(e)) return;
    e.preventDefault();
    depth = 0;
    overlay.hidden = true;
    const files = [...e.dataTransfer.files];
    const ext = (f) => f.name.toLowerCase().split('.').pop();
    const project = files.find((f) => ext(f) === 'cdbook');
    if (project) {
      if (confirmDiscard()) await openFromData(await project.text(), window.api.pathForFile(project) || project.name);
      return;
    }
    const cue = files.find((f) => ext(f) === 'cue');
    if (cue) {
      const res = await window.api.readCue(window.api.pathForFile(cue));
      importCueResult(res || { text: await cue.text(), durations: {} });
      showTab('tracks');
      return;
    }
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length) {
      const read = await Promise.all(images.map((f) => new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res({ name: f.name, url: r.result });
        r.onerror = () => res(null);
        r.readAsDataURL(f);
      })));
      await addStickerFiles(read.filter(Boolean));
      showTab('images');
      return;
    }
    toast('Suelta imágenes (stickers), un .cue o un proyecto .cdbook.', 'warn');
  });
}

// ------------------------------------------------------- actualizaciones

function renderUpdate(status) {
  const bar = $('update-bar');
  const close = () => { bar.hidden = true; };
  const btn = (label, fn, cls = '') => {
    const b = document.createElement('button');
    b.textContent = label;
    if (cls) b.className = cls;
    b.addEventListener('click', fn);
    return b;
  };
  const text = (t) => { const s = document.createElement('span'); s.textContent = t; return s; };
  const spacer = () => { const s = document.createElement('div'); s.className = 'spacer'; return s; };
  bar.className = 'update-bar';
  switch (status.state) {
    case 'checking':
      bar.replaceChildren(text('Buscando actualizaciones…'));
      break;
    case 'downloading': {
      const p = document.createElement('progress');
      p.max = 100;
      p.value = status.percent || 0;
      bar.replaceChildren(text(`Descargando la versión ${status.version || 'nueva'}…`), p, spacer(), btn('Ocultar', close));
      break;
    }
    case 'ready':
      bar.replaceChildren(
        text(`✨ Versión ${status.version} lista. Se instalará sola al cerrar la app.`), spacer(),
        btn('Reiniciar y actualizar ahora', async () => {
          if (store.dirty && !confirm('Hay cambios sin guardar. ¿Reiniciar igualmente? (Cancelar para guardar antes)')) return;
          window.api.installUpdate();
        }, 'primary'),
        btn('Luego', close));
      break;
    case 'portable':
      bar.replaceChildren(
        text(`✨ Hay una versión nueva (${status.version}). La versión portable no se actualiza sola: descarga el nuevo .exe o usa el instalador, que sí se actualiza.`), spacer(),
        btn('Descargar', () => window.api.openExternal(status.url), 'primary'), btn('Luego', close));
      break;
    case 'latest':
      bar.replaceChildren(text(`Tienes la última versión (${status.version}).`), spacer(), btn('Vale', close));
      break;
    case 'dev':
      bar.replaceChildren(text(`Versión de desarrollo (${status.version}): las actualizaciones sólo funcionan en la app instalada.`), spacer(), btn('Vale', close));
      break;
    case 'error':
      bar.className = 'update-bar error';
      bar.replaceChildren(text(`No se pudo buscar actualizaciones: ${status.message}`), spacer(), btn('Cerrar', close));
      break;
    default:
      bar.hidden = true;
      return;
  }
  bar.hidden = false;
}
window.api.onUpdate(renderUpdate);

// ---------------------------------------------------------------- inicio

async function start() {
  initPreview({ selectionChanged: () => rebuild('images'), editTrack });
  setupDrop();
  window.api.updateStatus().then((s) => { if (s && s.state !== 'idle') renderUpdate(s); });
  window.api.appVersion().then((v) => { document.querySelector('.brand').title = `Versión ${v}`; });
  await refreshUserTemplates().catch(() => {});
  const initial = await window.api.initialFile();
  if (initial) {
    await openFromData(initial.data, initial.path);
  } else {
    // Primer arranque: el ejemplo de las muestras, para ver la app en marcha.
    const ex = exampleProject();
    loadProject(ex.state, ex.assets);
  }
  await document.fonts.ready;
  schedule();
  const smoke = await window.api.smokeDir();
  if (smoke) {
    const { runSmoke } = await import('./smoke.js');
    runSmoke({ commands, showTab, exportPdf, exportPng, commit, openPaste });
  }
}

start();
