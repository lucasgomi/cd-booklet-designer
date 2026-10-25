// Puente seguro entre la interfaz y el proceso principal.
const { contextBridge, ipcRenderer, webUtils } = require('electron');

const invoke = (ch) => (...args) => ipcRenderer.invoke(ch, ...args);

contextBridge.exposeInMainWorld('api', {
  onMenu: (fn) => ipcRenderer.on('menu', (_e, cmd) => fn(cmd)),
  setDirty: invoke('app:set-dirty'),
  setTitle: invoke('app:set-title'),
  closeNow: invoke('app:close-now'),
  appVersion: invoke('app:version'),
  onUpdate: (fn) => ipcRenderer.on('update', (_e, status) => fn(status)),
  updateStatus: invoke('update:status'),
  checkUpdates: invoke('update:check'),
  installUpdate: invoke('update:install'),
  openExternal: invoke('shell:external'),
  smokeDir: invoke('app:smoke-dir'),
  smokeOnly: invoke('app:smoke-only'),
  initialFile: invoke('app:initial-file'),
  openProject: invoke('project:open'),
  saveProject: invoke('project:save'),
  openCue: invoke('cue:open'),
  readCue: invoke('cue:read'),
  // Ruta real de un archivo soltado en la ventana (arrastrar y soltar).
  pathForFile: (file) => { try { return webUtils.getPathForFile(file); } catch { return ''; } },
  exportPdf: invoke('export:pdf'),
  exportPng: invoke('export:png'),
  showInFolder: invoke('shell:show'),
  openPath: invoke('shell:open'),
  listTemplates: invoke('templates:list'),
  saveTemplate: invoke('templates:save'),
  deleteTemplate: invoke('templates:delete'),
  exportTemplate: invoke('templates:export'),
  importTemplate: invoke('templates:import'),
  printPayload: invoke('print:payload'),
  printReady: invoke('print:ready'),
  smokeCapture: invoke('smoke:capture'),
  smokeDone: invoke('smoke:done'),
});
