// Versión web (GitHub Pages): sustituye al puente de Electron (preload.cjs)
// con lo que ofrece el navegador. En la app de escritorio no hace nada.
import { renderSheet, mountSheet, whenReady, scaledState } from '../shared/render.js';
import { renderLabel, normalizeSheetConfig } from '../shared/disc-label.js';
import { normalizeState, sheetWidth, PANEL_MM } from '../shared/model.js';
import { googleFontsUrl, loadCustomFonts } from '../shared/fonts.js';

const RELEASES = 'https://github.com/lucasgomi/cd-booklet-designer/releases/latest';
const DPI = 300;
const PX_PER_MM = 96 / 25.4;

// ------------------------------------------------------------- archivos

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 10000);
}

function pickFile(accept) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.addEventListener('change', () => resolve(input.files[0] || null));
    input.click();
  });
}

const safeName = (s) => String(s || '').replace(/[\\/:*?"<>|]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 120);

// Con la API de archivos del navegador (Chrome, Edge) «Guardar» sobrescribe
// el mismo archivo; en los demás, descarga una copia.
let projectHandle = null;
const fsApi = typeof window.showSaveFilePicker === 'function';
const CDBOOK = [{ description: 'Proyecto de librito', accept: { 'application/json': ['.cdbook'] } }];

async function openProject() {
  if (fsApi) {
    try {
      const [handle] = await window.showOpenFilePicker({ types: CDBOOK });
      projectHandle = handle;
      const file = await handle.getFile();
      return { data: await file.text(), path: file.name };
    } catch { return null; }
  }
  const file = await pickFile('.cdbook,application/json');
  return file ? { data: await file.text(), path: file.name } : null;
}

async function saveProject({ data, suggestedName, saveAs }) {
  const name = `${safeName(suggestedName) || 'librito'}.cdbook`;
  if (fsApi) {
    try {
      if (!projectHandle || saveAs) projectHandle = await window.showSaveFilePicker({ suggestedName: name, types: CDBOOK });
      const w = await projectHandle.createWritable();
      await w.write(data);
      await w.close();
      return projectHandle.name;
    } catch { return null; }
  }
  download(new Blob([data], { type: 'application/json' }), name);
  return name;
}

// --------------------------------------------------------- plantillas

const TPL_KEY = 'cdb.userTemplates';
const readTemplates = () => { try { return JSON.parse(localStorage.getItem(TPL_KEY) || '[]'); } catch { return []; } };
const writeTemplates = (list) => localStorage.setItem(TPL_KEY, JSON.stringify(list));

// ------------------------------------------------------------ PNG

function crc32(bytes) {
  let c = ~0;
  for (const b of bytes) {
    c ^= b;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

/** Inserta el bloque pHYs (resolución en ppp) tras IHDR. */
function withDpi(png, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const chunk = new Uint8Array(21);
  const dv = new DataView(chunk.buffer);
  dv.setUint32(0, 9);
  chunk.set([0x70, 0x48, 0x59, 0x73], 4); // pHYs
  dv.setUint32(8, ppm);
  dv.setUint32(12, ppm);
  chunk[16] = 1;
  dv.setUint32(17, crc32(chunk.subarray(4, 17)));
  const ihdrEnd = 8 + 12 + new DataView(png.buffer, png.byteOffset).getUint32(8);
  const out = new Uint8Array(png.length + chunk.length);
  out.set(png.subarray(0, ihdrEnd), 0);
  out.set(chunk, ihdrEnd);
  out.set(png.subarray(ihdrEnd), ihdrEnd + chunk.length);
  return out;
}

let htmlToImage = null;
function loadHtmlToImage() {
  if (htmlToImage) return htmlToImage;
  htmlToImage = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = new URL('../vendor/html-to-image.js', import.meta.url).href;
    s.onload = () => resolve(window.htmlToImage);
    s.onerror = () => reject(new Error('No se pudo cargar el generador de imágenes'));
    document.head.appendChild(s);
  });
  return htmlToImage;
}

const toDataUrl = (blob) => new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });

/** @font-face de lo que se usa (familia, grosor y estilo), con los archivos incrustados. */
async function fontCss(root, customFonts) {
  const used = new Map(); // familia -> Set('400 normal')
  const add = (stack, weight, style) => {
    for (const f of String(stack || '').split(',')) {
      const fam = f.trim().replace(/^['"]|['"]$/g, '');
      if (!used.has(fam)) used.set(fam, new Set());
      used.get(fam).add(`${weight} ${style === 'italic' ? 'italic' : 'normal'}`);
    }
  };
  for (const el of [root, ...root.querySelectorAll('*')]) {
    const cs = getComputedStyle(el);
    add(cs.fontFamily, cs.fontWeight, cs.fontStyle);
  }
  const sheets = [new URL('../vendor/fonts/fonts.css', import.meta.url).href];
  for (const f of customFonts || []) if (used.has(f)) sheets.push(googleFontsUrl(f));
  const faces = [];
  for (const url of sheets) {
    const text = await fetch(url).then((r) => r.text()).catch(() => '');
    for (const block of text.match(/@font-face\s*{[^}]*}/g) || []) {
      const family = /font-family:\s*['"]?([^;'"]+)['"]?;/.exec(block)?.[1];
      if (!family || !used.has(family)) continue;
      const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
      // Sólo latín (las que no indican rango, o las que cubren U+0000-00FF / U+0100…).
      if (range && !/U\+0000-00FF|U\+0100/i.test(range)) continue;
      const src = /url\(['"]?([^)'"]+)['"]?\)/.exec(block)?.[1];
      if (!src) continue;
      const weight = Number(/font-weight:\s*(\d+)/.exec(block)?.[1] || 400);
      const style = /font-style:\s*italic/.test(block) ? 'italic' : 'normal';
      faces.push({ family, weight, style, block, src: new URL(src, url).href });
    }
  }
  // Para cada grosor usado, el más cercano que exista de esa familia.
  const wanted = new Set();
  for (const [family, combos] of used) {
    for (const combo of combos) {
      const [w, style] = combo.split(' ');
      const options = faces.filter((f) => f.family === family && f.style === style);
      const pool = options.length ? options : faces.filter((f) => f.family === family);
      if (!pool.length) continue;
      const best = pool.reduce((a, b) => (Math.abs(b.weight - w) < Math.abs(a.weight - w) ? b : a)).weight;
      for (const f of pool) if (f.weight === best) wanted.add(f);
    }
  }
  let css = '';
  for (const f of wanted) {
    const data = await fetch(f.src).then((r) => r.blob()).then(toDataUrl).catch(() => null);
    if (data) css += f.block.replace(/url\([^)]+\)/, `url(${data})`) + '\n';
  }
  return css;
}

/** Pinta `el` fuera de la vista y lo convierte en PNG a 300 ppp. */
async function elementPng(el, wMm, hMm, customFonts) {
  const lib = await loadHtmlToImage();
  const host = document.createElement('div');
  host.style.cssText = `position:fixed;left:-30000px;top:0;width:${wMm}mm;height:${hMm}mm;background:#fff`;
  document.body.appendChild(host);
  try {
    mountSheet(host, el);
    await whenReady(host);
    const width = Math.round(wMm * PX_PER_MM);
    const height = Math.round(hMm * PX_PER_MM);
    const url = await lib.toPng(el, {
      width, height, pixelRatio: DPI / 96, backgroundColor: '#ffffff', cacheBust: false,
      fontEmbedCSS: await fontCss(el, customFonts), style: { margin: '0' },
    });
    const bytes = Uint8Array.from(atob(url.split(',')[1]), (c) => c.charCodeAt(0));
    return { png: withDpi(bytes, DPI), width: Math.round(wMm / 25.4 * DPI), height: Math.round(hMm / 25.4 * DPI) };
  } finally {
    host.remove();
  }
}

async function exportPng(payload) {
  const state = normalizeState(payload.state);
  await loadCustomFonts(state.customFonts);
  const el = renderSheet(scaledState(state, payload.fitScale || 1, payload.fitCols), payload.assets || {}, { editor: false });
  const res = await elementPng(el, sheetWidth(state), PANEL_MM, state.customFonts);
  download(new Blob([res.png], { type: 'image/png' }), `${safeName(payload.suggestedName) || 'librito'}.png`);
  return { path: '', width: res.width, height: res.height };
}

async function exportLabelPng(payload) {
  const state = normalizeState(payload.state);
  await loadCustomFonts(state.customFonts);
  const cfg = normalizeSheetConfig(payload.sheet);
  const el = renderLabel(state, payload.assets || {}, { diameter: cfg.diameter, hole: cfg.hole, bleed: 0 });
  const res = await elementPng(el, cfg.diameter, cfg.diameter, state.customFonts);
  download(new Blob([res.png], { type: 'image/png' }), `${safeName(payload.suggestedName) || 'disco'} - pegatina.png`);
  return { path: '', width: res.width, height: res.height };
}

// ------------------------------------------------------------ PDF

/**
 * La página de impresión de la app se monta en un marco oculto y se abre el
 * diálogo de imprimir del navegador (ahí se elige «Guardar como PDF»).
 */
function printJob(payload, mode) {
  return new Promise((resolve, reject) => {
    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:fixed;left:-30000px;top:0;width:1200px;height:900px;border:0';
    const timer = setTimeout(() => { frame.remove(); reject(new Error('Tiempo de espera agotado al preparar la impresión')); }, 30000);
    window.__cdbPrintApi = {
      printPayload: async () => ({ ...payload, mode }),
      printReady: async (error) => {
        clearTimeout(timer);
        if (error) { frame.remove(); reject(new Error(error)); return; }
        setTimeout(() => {
          frame.contentWindow.focus();
          frame.contentWindow.print();
          // print() espera a que se cierre el diálogo; luego se limpia.
          setTimeout(() => frame.remove(), 1000);
          resolve({ path: '' });
        }, 50);
      },
    };
    frame.src = new URL(`../print/print.html?mode=${mode}`, import.meta.url).href;
    document.body.appendChild(frame);
  });
}

// ------------------------------------------------------------ puente

let menuHandler = () => {};
let dirty = false;

const api = {
  onMenu: (fn) => { menuHandler = fn; },
  setDirty: async (v) => { dirty = !!v; },
  setTitle: async (t) => { document.title = t; },
  closeNow: async () => {},
  appVersion: async () => (await import('./build-info.js').catch(() => ({ VERSION: 'web' }))).VERSION,
  onUpdate: () => {},
  updateStatus: async () => ({ state: 'idle' }),
  checkUpdates: async () => {},
  installUpdate: async () => {},
  openExternal: async (url) => { window.open(url, '_blank', 'noopener'); },
  smokeDir: async () => null,
  smokeOnly: async () => null,
  smokeLong: async () => null,
  initialFile: async () => null,
  openProject,
  saveProject,
  openCue: async () => {
    const f = await pickFile('.cue');
    return f ? { text: await f.text(), durations: {} } : null;
  },
  readCue: async () => null,
  pathForFile: () => '',
  exportPdf: (payload) => printJob(payload, 'pdf'),
  exportPng,
  exportLabels: (payload, { test = false } = {}) => printJob(payload, test ? 'labels-test' : 'labels'),
  exportLabelPng,
  showInFolder: async () => {},
  openPath: async () => {},
  listTemplates: async () => readTemplates().sort((a, b) => a.name.localeCompare(b.name)),
  saveTemplate: async (tpl) => {
    const file = `${safeName(tpl.name) || 'plantilla'}.json`;
    writeTemplates([...readTemplates().filter((t) => t.file !== file), { ...tpl, file }]);
    return file;
  },
  deleteTemplate: async (file) => writeTemplates(readTemplates().filter((t) => t.file !== file)),
  exportTemplate: async (tpl) => {
    download(new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' }), `${safeName(tpl.name) || 'plantilla'}.cdtemplate`);
    return tpl.name;
  },
  importTemplate: async () => {
    const f = await pickFile('.cdtemplate,.json');
    return f ? JSON.parse(await f.text()) : null;
  },
  printPayload: async () => null,
  printReady: async () => {},
  smokeCapture: async () => {},
  smokeDone: async () => {},
};

if (!window.api) {
  window.api = api;
  document.documentElement.classList.add('web');
  // Atajos de teclado que en escritorio da el menú.
  const keys = { s: 'save', o: 'open', p: 'export-pdf' };
  window.addEventListener('keydown', (e) => {
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 's' && e.shiftKey) { e.preventDefault(); menuHandler('save-as'); return; }
    if (k === 'p' && e.shiftKey) { e.preventDefault(); menuHandler('export-png'); return; }
    if (keys[k]) { e.preventDefault(); menuHandler(keys[k]); }
  });
  window.addEventListener('beforeunload', (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  // Enlace a la app de escritorio.
  window.addEventListener('DOMContentLoaded', () => {
    const brand = document.querySelector('.topbar .brand');
    if (!brand) return;
    const a = document.createElement('a');
    a.href = RELEASES;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'web-download';
    a.textContent = '⬇ App para Windows';
    a.title = 'Descarga la app de escritorio (funciona sin internet y exporta el PDF directamente)';
    brand.after(a);
  });
}
