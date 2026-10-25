// Actualizaciones automáticas desde las releases de GitHub.
//
// - Versión instalada (Setup): busca al arrancar y cada pocas horas, descarga
//   en segundo plano y se instala sola al cerrar la app (o al pulsar
//   «Reiniciar y actualizar»).
// - Versión portable: no puede sustituirse a sí misma; avisa de que hay una
//   versión nueva y ofrece descargarla.
import { app, net } from 'electron';
import updaterPkg from 'electron-updater';
import { isNewer } from '../shared/version.js';

const { autoUpdater } = updaterPkg;

export const REPO = { owner: 'lucasgomi', repo: 'cd-booklet-designer' };
const CHECK_EVERY_MS = 4 * 60 * 60 * 1000;
const isPortable = () => !!process.env.PORTABLE_EXECUTABLE_DIR;

let send = () => {};
let manual = false;
let lastStatus = { state: 'idle' };

function emit(status) {
  lastStatus = status;
  send(status);
}

async function checkPortable() {
  try {
    const res = await net.fetch(`https://api.github.com/repos/${REPO.owner}/${REPO.repo}/releases/latest`, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'cd-booklet-designer' },
    });
    if (!res.ok) throw new Error(`GitHub respondió ${res.status}`);
    const rel = await res.json();
    if (isNewer(rel.tag_name, app.getVersion())) {
      const asset = (rel.assets || []).find((a) => /portable/i.test(a.name) && a.name.endsWith('.exe'));
      emit({ state: 'portable', version: rel.tag_name.replace(/^v/, ''), url: asset?.browser_download_url || rel.html_url });
    } else if (manual) {
      emit({ state: 'latest', version: app.getVersion() });
    }
  } catch (err) {
    if (manual) emit({ state: 'error', message: String(err?.message || err) });
  }
}

export function checkForUpdates(isManual = false) {
  manual = isManual;
  if (!app.isPackaged) {
    if (isManual) emit({ state: 'dev', version: app.getVersion() });
    return;
  }
  if (isPortable()) { checkPortable(); return; }
  if (isManual) emit({ state: 'checking' });
  autoUpdater.checkForUpdates().catch((err) => {
    if (manual) emit({ state: 'error', message: String(err?.message || err) });
  });
}

export function initUpdates(sender) {
  send = sender;
  if (!app.isPackaged || process.env.CDBOOK_SMOKE) return;
  if (!isPortable()) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.on('update-available', (info) => emit({ state: 'downloading', version: info.version, percent: 0 }));
    autoUpdater.on('download-progress', (p) => emit({ ...lastStatus, state: 'downloading', percent: Math.round(p.percent) }));
    autoUpdater.on('update-downloaded', (info) => emit({ state: 'ready', version: info.version }));
    autoUpdater.on('update-not-available', () => { if (manual) emit({ state: 'latest', version: app.getVersion() }); });
    autoUpdater.on('error', (err) => { if (manual) emit({ state: 'error', message: String(err?.message || err) }); });
  }
  setTimeout(() => checkForUpdates(false), 5000);
  setInterval(() => checkForUpdates(false), CHECK_EVERY_MS);
}

export function lastUpdateStatus() {
  return lastStatus;
}

export function installUpdateNow() {
  // isSilent = true (sin asistente), isForceRunAfter = true (vuelve a abrir la app).
  autoUpdater.quitAndInstall(true, true);
}
