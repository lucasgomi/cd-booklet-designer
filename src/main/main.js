// Proceso principal: ventana, menús, diálogos de archivo y exportación.
import { app, BrowserWindow, Menu, dialog, ipcMain, shell } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { audioDuration } from './audio.js';
import { withDpi } from './png.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(here, '..');
const PRELOAD = path.join(here, 'preload.cjs');
const SMOKE_DIR = process.env.CDBOOK_SMOKE || null;
const PANEL_MM = 120;
const PNG_DPI = 300;

let mainWindow = null;
if (SMOKE_DIR) console.log('[main] arrancando prueba en', SMOKE_DIR);
let dirty = false;
let forceClose = false;
const printJobs = new Map(); // webContents.id -> { payload, resolve }

const templatesDir = () => path.join(app.getPath('userData'), 'plantillas');

// ---------------------------------------------------------------- ventana

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1100,
    minHeight: 680,
    show: true,
    backgroundColor: '#1d1f24',
    title: 'CD Booklet Designer',
    icon: path.join(SRC, '..', 'build', 'icon.png'),
    webPreferences: { preload: PRELOAD, contextIsolation: true, nodeIntegration: false, sandbox: false, backgroundThrottling: false },
  });
  mainWindow.loadFile(path.join(SRC, 'renderer', 'index.html'));
  if (SMOKE_DIR) logConsole(mainWindow, 'ui');
  mainWindow.on('close', (e) => {
    if (!dirty || forceClose || SMOKE_DIR) return;
    e.preventDefault();
    const choice = dialog.showMessageBoxSync(mainWindow, {
      type: 'question',
      buttons: ['Guardar', 'No guardar', 'Cancelar'],
      defaultId: 0,
      cancelId: 2,
      title: 'Cambios sin guardar',
      message: '¿Guardar los cambios del proyecto antes de salir?',
    });
    if (choice === 0) mainWindow.webContents.send('menu', 'save-and-close');
    else if (choice === 1) { forceClose = true; mainWindow.close(); }
  });
  // Abrir enlaces externos en el navegador.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
  buildMenu();
}

function send(cmd) {
  mainWindow?.webContents.send('menu', cmd);
}

function buildMenu() {
  const template = [
    { label: 'Archivo', submenu: [
      { label: 'Nuevo proyecto', accelerator: 'CmdOrCtrl+N', click: () => send('new') },
      { label: 'Abrir proyecto…', accelerator: 'CmdOrCtrl+O', click: () => send('open') },
      { label: 'Guardar', accelerator: 'CmdOrCtrl+S', click: () => send('save') },
      { label: 'Guardar como…', accelerator: 'CmdOrCtrl+Shift+S', click: () => send('save-as') },
      { type: 'separator' },
      { label: 'Cargar ejemplo', click: () => send('example') },
      { type: 'separator' },
      { label: 'Exportar PDF (A4, tamaño real)…', accelerator: 'CmdOrCtrl+P', click: () => send('export-pdf') },
      { label: 'Exportar PNG (300 ppp)…', accelerator: 'CmdOrCtrl+Shift+P', click: () => send('export-png') },
      { type: 'separator' },
      { role: 'quit', label: 'Salir' },
    ] },
    { label: 'Editar', submenu: [
      { label: 'Deshacer', accelerator: 'CmdOrCtrl+Z', click: () => send('undo') },
      { label: 'Rehacer', accelerator: 'CmdOrCtrl+Y', click: () => send('redo') },
      { type: 'separator' },
      { role: 'cut', label: 'Cortar' },
      { role: 'copy', label: 'Copiar' },
      { role: 'paste', label: 'Pegar' },
      { role: 'selectAll', label: 'Seleccionar todo' },
    ] },
    { label: 'Ver', submenu: [
      { label: 'Acercar', accelerator: 'CmdOrCtrl+=', click: () => send('zoom-in') },
      { label: 'Alejar', accelerator: 'CmdOrCtrl+-', click: () => send('zoom-out') },
      { label: 'Ajustar a la ventana', accelerator: 'CmdOrCtrl+0', click: () => send('zoom-fit') },
      { type: 'separator' },
      { label: 'Mostrar/ocultar margen de seguridad', accelerator: 'CmdOrCtrl+M', click: () => send('toggle-safe') },
      { type: 'separator' },
      { role: 'toggleDevTools', label: 'Herramientas de desarrollo' },
    ] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ------------------------------------------------------------- utilidades

/** En modo prueba, muestra en la terminal los mensajes de la consola. */
function logConsole(win, tag) {
  win.webContents.on('console-message', (_e, _level, message, line, source) => {
    console.log(`[${tag}] ${message} (${path.basename(source || '')}:${line})`);
  });
  win.webContents.on('render-process-gone', (_e, d) => console.log(`[${tag}] proceso caído`, d));
}

function readTextAuto(file) {
  const buf = fs.readFileSync(file);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    return new TextDecoder('windows-1252').decode(buf);
  }
}

function safeName(s) {
  return String(s || '').replace(/[<>:"/\\|?*\x00-\x1f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);
}

async function askSavePath(title, defaultName, filters) {
  if (SMOKE_DIR) return path.join(SMOKE_DIR, defaultName);
  const res = await dialog.showSaveDialog(mainWindow, {
    title,
    defaultPath: path.join(app.getPath('documents'), defaultName),
    filters,
  });
  return res.canceled ? null : res.filePath;
}

// --------------------------------------------------------- exportaciones

/** Abre una ventana oculta con la página de impresión y espera a que esté lista. */
async function renderJob(payload, { offscreen = false, width = 1200, height = 900 } = {}) {
  const win = new BrowserWindow({
    show: false,
    width,
    height,
    useContentSize: true,
    enableLargerThanScreen: true,
    webPreferences: { preload: PRELOAD, contextIsolation: true, offscreen, sandbox: false, backgroundThrottling: false },
  });
  if (SMOKE_DIR) logConsole(win, `export-${payload.mode}`);
  const ready = new Promise((resolve, reject) => {
    printJobs.set(win.webContents.id, { payload, resolve, reject });
    setTimeout(() => reject(new Error('Tiempo de espera agotado al preparar la exportación')), 30000);
  });
  await win.loadFile(path.join(SRC, 'print', 'print.html'), { query: { mode: payload.mode } });
  try {
    await ready;
  } finally {
    printJobs.delete(win.webContents.id);
  }
  return win;
}

async function exportPdf(payload, filePath) {
  const win = await renderJob({ ...payload, mode: 'pdf' });
  try {
    const pdf = await win.webContents.printToPDF({
      landscape: true,
      pageSize: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margins: { marginType: 'none' },
    });
    fs.writeFileSync(filePath, pdf);
  } finally {
    win.destroy();
  }
}

async function exportPng(payload, filePath) {
  const widthMm = payload.state.booklet.enabled ? PANEL_MM * 2 : PANEL_MM;
  const pxPerMm = PNG_DPI / 25.4;
  const width = Math.round(widthMm * pxPerMm);
  const height = Math.round(PANEL_MM * pxPerMm);
  const win = await renderJob({ ...payload, mode: 'png', dpi: PNG_DPI }, { offscreen: true, width, height });
  try {
    win.setContentSize(width, height);
    await new Promise((r) => setTimeout(r, 400));
    const image = await win.webContents.capturePage({ x: 0, y: 0, width, height });
    let png = image.toPNG();
    const size = image.getSize();
    if (size.width !== width || size.height !== height) {
      png = image.resize({ width, height, quality: 'best' }).toPNG();
    }
    fs.writeFileSync(filePath, withDpi(png, PNG_DPI));
    return { width, height };
  } finally {
    win.destroy();
  }
}

// ---------------------------------------------------------------- IPC

ipcMain.handle('print:payload', (e) => printJobs.get(e.sender.id)?.payload ?? null);
ipcMain.handle('print:ready', (e, error) => {
  const job = printJobs.get(e.sender.id);
  if (!job) return;
  if (error) job.reject(new Error(error)); else job.resolve();
});

ipcMain.handle('app:set-dirty', (_e, value) => { dirty = !!value; });
ipcMain.handle('app:set-title', (_e, title) => mainWindow?.setTitle(title));
ipcMain.handle('app:close-now', () => { forceClose = true; mainWindow?.close(); });
ipcMain.handle('app:smoke-dir', () => SMOKE_DIR);
ipcMain.handle('app:initial-file', () => {
  const arg = process.argv.slice(1).find((a) => a.toLowerCase().endsWith('.cdbook') && fs.existsSync(a));
  return arg ? { path: arg, data: fs.readFileSync(arg, 'utf8') } : null;
});

ipcMain.handle('project:open', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Abrir proyecto',
    filters: [{ name: 'Proyecto de librito', extensions: ['cdbook', 'json'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  const file = res.filePaths[0];
  return { path: file, data: fs.readFileSync(file, 'utf8') };
});

ipcMain.handle('project:save', async (_e, { path: current, data, suggestedName, saveAs }) => {
  let file = current;
  if (!file || saveAs) {
    file = await askSavePath('Guardar proyecto', `${safeName(suggestedName) || 'librito'}.cdbook`,
      [{ name: 'Proyecto de librito', extensions: ['cdbook'] }]);
    if (!file) return null;
  }
  fs.writeFileSync(file, data, 'utf8');
  return file;
});

ipcMain.handle('cue:open', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar archivo .cue',
    filters: [{ name: 'Hoja CUE', extensions: ['cue'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  const file = res.filePaths[0];
  const text = readTextAuto(file);
  // Duración de los archivos de audio referenciados (para la última pista).
  const durations = {};
  for (const m of text.matchAll(/^\s*FILE\s+"?(.+?)"?\s+\S+\s*$/gim)) {
    const name = m[1];
    durations[name] = audioDuration(path.resolve(path.dirname(file), name));
  }
  return { path: file, text, durations };
});

ipcMain.handle('export:pdf', async (_e, payload) => {
  const file = await askSavePath('Exportar PDF', `${safeName(payload.suggestedName) || 'librito'}.pdf`,
    [{ name: 'PDF', extensions: ['pdf'] }]);
  if (!file) return null;
  await exportPdf(payload, file);
  return { path: file };
});

ipcMain.handle('export:png', async (_e, payload) => {
  const file = await askSavePath('Exportar PNG', `${safeName(payload.suggestedName) || 'librito'}.png`,
    [{ name: 'Imagen PNG', extensions: ['png'] }]);
  if (!file) return null;
  const size = await exportPng(payload, file);
  return { path: file, ...size };
});

ipcMain.handle('shell:show', (_e, file) => shell.showItemInFolder(file));
ipcMain.handle('shell:open', (_e, file) => shell.openPath(file));

// Plantillas propias: un JSON por plantilla en la carpeta de datos del usuario.
ipcMain.handle('templates:list', () => {
  const dir = templatesDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => {
    try {
      return { file: f, ...JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) };
    } catch {
      return null;
    }
  }).filter(Boolean).sort((a, b) => a.name.localeCompare(b.name));
});

ipcMain.handle('templates:save', (_e, tpl) => {
  const dir = templatesDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = `${safeName(tpl.name) || 'plantilla'}.json`;
  fs.writeFileSync(path.join(dir, file), JSON.stringify(tpl, null, 2), 'utf8');
  return file;
});

ipcMain.handle('templates:delete', (_e, file) => {
  const target = path.join(templatesDir(), path.basename(file));
  if (fs.existsSync(target)) fs.unlinkSync(target);
});

ipcMain.handle('templates:export', async (_e, tpl) => {
  const file = await askSavePath('Exportar plantilla', `${safeName(tpl.name) || 'plantilla'}.cdtemplate`,
    [{ name: 'Plantilla de librito', extensions: ['cdtemplate'] }]);
  if (!file) return null;
  fs.writeFileSync(file, JSON.stringify(tpl, null, 2), 'utf8');
  return file;
});

ipcMain.handle('templates:import', async () => {
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar plantilla',
    filters: [{ name: 'Plantilla de librito', extensions: ['cdtemplate', 'json'] }],
    properties: ['openFile'],
  });
  if (res.canceled || !res.filePaths[0]) return null;
  return JSON.parse(fs.readFileSync(res.filePaths[0], 'utf8'));
});

// ---------------------------------------------------------------- arranque

app.whenReady().then(() => {
  if (SMOKE_DIR) console.log('[main] listo');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
}).catch((err) => {
  console.error('Error al iniciar', err);
  dialog.showErrorBox('CD Booklet Designer', String(err?.stack || err));
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Prueba automática (npm run smoke): la interfaz se maneja sola y al
// terminar pide capturas de la ventana.
ipcMain.handle('smoke:capture', async (_e, name) => {
  if (!SMOKE_DIR) return null;
  const img = await mainWindow.webContents.capturePage();
  const file = path.join(SMOKE_DIR, `${name}.png`);
  fs.writeFileSync(file, img.toPNG());
  return file;
});
ipcMain.handle('smoke:done', (_e, report) => {
  if (!SMOKE_DIR) return;
  fs.writeFileSync(path.join(SMOKE_DIR, 'report.json'), JSON.stringify(report, null, 2));
  forceClose = true;
  app.quit();
});
