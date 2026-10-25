// Prueba automática de humo (npm run smoke): recorre la app con el
// proyecto de ejemplo, hace capturas y exporta PDF y PNG.
import { store, commit, undo, usedAssets } from './store.js';
import { switchTemplate } from './panels/design.js';
import { drawCover } from './example.js';
import { addAsset } from './store.js';
import { currentStyle, syncGroups } from '../shared/model.js';
import { makeTrack } from '../shared/tracklist.js';
import { seeded } from '../shared/templates/common.js';
import { lastAnalysis, fitScale, fitCols } from './preview.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Títulos de ejemplo de longitudes variadas para el disco largo. */
const WORDS = ['Amor', 'Noche', 'Ciudad', 'Fuego', 'Mar', 'Luna', 'Caballo', 'Domingo', 'Verano', 'Eléctrico', 'Despacio', 'Corazón', 'Ruido', 'Cielo', 'Bailar', 'Para', 'de', 'la', 'en', 'Siempre'];
function longAlbum(n) {
  const r = seeded(42);
  return Array.from({ length: n }, (_, i) => {
    const words = 1 + Math.floor(r() * 4);
    let title = Array.from({ length: words }, () => WORDS[Math.floor(r() * WORDS.length)]).join(' ');
    if (i % 9 === 4) title += ' (Remix)';
    if (i % 13 === 7) title += ' (feat. Alguien Muy Famoso)';
    return makeTrack(title, 120 + Math.floor(r() * 180));
  });
}

/** Modo disco largo: CDBOOK_SMOKE_LONG=45 npm run smoke */
async function runLong(n, showTab) {
  const report = { steps: [], errors: [], long: {} };
  commit((s) => { s.tracks = longAlbum(n); s.images.stickers = []; }, { rebuild: true });
  const { TEMPLATES } = await import('../shared/templates/index.js');
  for (const auto of [false, true]) {
    commit((s) => { s.autoFit = auto; }, { rebuild: true });
    for (const t of TEMPLATES) {
      switchTemplate(t.id);
      showTab('design');
      await wait(350);
      report.long[`${auto ? 'auto' : 'sin'}:${t.id}`] = { scale: fitScale, cols: fitCols, vertical: lastAnalysis.vertical, titles: lastAnalysis.overflow.length };
      if (auto) {
        const res = await window.api.exportPng({ state: store.state, assets: usedAssets(), suggestedName: `largo-${t.id}`, fitScale, fitCols });
        report.steps.push({ name: `largo-${t.id}`, ok: !!res });
      }
    }
  }
  await window.api.smokeDone(report);
}

export async function runSmoke({ commands, showTab }) {
  const longN = await window.api.smokeLong();
  if (longN) { window.confirm = () => true; await wait(1200); await runLong(longN, showTab); return; }
  const report = { steps: [], errors: [] };
  window.confirm = () => true; // sin diálogos bloqueantes durante la prueba
  window.addEventListener('error', (e) => {
    // Aviso benigno de Chromium al redimensionar.
    if (!/ResizeObserver loop/.test(e.message)) report.errors.push(String(e.message));
  });
  const step = async (name, fn) => {
    console.log('paso', name);
    try {
      await fn();
      await wait(700);
      report.steps.push({ name, ok: true, warnings: document.getElementById('warnings').innerText.split('\n').filter(Boolean) });
      await window.api.smokeCapture(name);
    } catch (err) {
      report.steps.push({ name, ok: false, error: String(err?.stack || err) });
    }
  };
  const exp = async (kind, name) => {
    const payload = { state: store.state, assets: usedAssets(), suggestedName: name, fitScale, fitCols };
    const res = kind === 'pdf' ? await window.api.exportPdf(payload) : await window.api.exportPng(payload);
    report.steps.push({ name: `export-${kind}-${name}`, ok: !!res, result: res });
  };

  await wait(1200);
  await step('01-cabecera-lista', () => showTab('disc'));
  await step('02-canciones', () => showTab('tracks'));
  await step('03-ticket-avisos', () => { switchTemplate('ticket'); showTab('design'); });
  report.overflowBefore = lastAnalysis.overflow.map((o) => `${o.title} -> ${o.suggestion}`);
  await step('04-ticket-abreviado', () => {
    const btn = [...document.querySelectorAll('#warnings button')].find((b) => /todas/i.test(b.textContent))
      || document.querySelector('#warnings button');
    btn?.click();
  });
  report.overflowAfter = lastAnalysis.overflow.length;
  await exp('pdf', 'ticket');
  await exp('png', 'ticket');
  await step('05-ticket-qr', () => commit((s) => { s.styles.ticket = { ...currentStyle(s), codeType: 'qr', codeContent: 'https://open.spotify.com' }; }, { rebuild: 'design' }));
  await step('06-sticker-seleccionado', () => {
    switchTemplate('header-list');
    showTab('images');
    const el = document.querySelector('.cdb-sticker');
    const r = el.getBoundingClientRect();
    el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.x + r.width / 2, clientY: r.y + r.height / 2 }));
    window.dispatchEvent(new PointerEvent('pointerup'));
  });
  await step('07-librito', () => {
    const id = 'img_cover_smoke';
    addAsset(id, drawCover());
    commit((s) => { s.images.cover = id; s.booklet.enabled = true; }, { rebuild: true });
    showTab('booklet');
  });
  await exp('pdf', 'librito');
  await exp('png', 'librito');
  await step('08-grupos', () => {
    commit((s) => {
      s.tracks.forEach((t, i) => { t.group = i < 9 ? 'Baño María' : i < 18 ? 'Alv' : 'Tiny Desk'; });
      s.colorByGroup = true;
      syncGroups(s);
    }, { rebuild: 'tracks' });
    showTab('tracks');
  });
  // Plantillas nuevas: captura y PNG de cada una, con un estilo incluido.
  commit((s) => { s.booklet.enabled = false; s.images.stickers = []; s.colorByGroup = false; }, { rebuild: true });
  const only = (await window.api.smokeOnly?.()) || null;
  const ids = ['two-columns', 'setlist', 'lineup', 'terminal', 'notes', 'coquette', 'acid', 'book-index', 'playlist', 'y2k', 'vinyl', 'cassette', 'polaroid',
    'fanzine', 'brutalist', 'artdeco', 'synthwave', 'bauhaus', 'newspaper', 'boarding', 'gameboy', 'postcard', 'menu'];
  for (const id of only || ids) {
    await step(`09-${id}`, () => { switchTemplate(id); showTab('design'); });
    report[`overflow-${id}`] = lastAnalysis;
    await exp('png', `plantilla-${id}`);
    const tpl = (await import('../shared/templates/index.js')).getTemplate(id);
    const preset = tpl.presets[1];
    commit((s) => { s.styles[id] = { ...tpl.defaults, ...preset.style }; }, { rebuild: 'design' });
    await wait(500);
    report[`overflow-${id}-preset`] = lastAnalysis;
    await exp('png', `plantilla-${id}-${preset.name}`);
  }
  await step('10-galeria', async () => { showTab('gallery'); await wait(1500); });
  // Arrastrar y soltar: un .cue (sustituye la lista) y una imagen (sticker).
  const drop = (files) => {
    const dt = new DataTransfer();
    for (const f of files) dt.items.add(f);
    window.dispatchEvent(new DragEvent('drop', { dataTransfer: dt, bubbles: true, cancelable: true }));
  };
  await step('11-soltar-cue', async () => {
    drop([new File(['PERFORMER "Prueba"\nTITLE "Cue"\nFILE "x.wav" WAVE\n  TRACK 01 AUDIO\n    TITLE "Uno"\n    INDEX 01 00:00:00\n  TRACK 02 AUDIO\n    TITLE "Dos"\n    INDEX 01 03:00:00\n'], 'disco.cue')]);
    await wait(800);
  });
  report.dropCue = store.state.tracks.map((t) => `${t.title} ${t.duration}`);
  const stickersBefore = store.state.images.stickers.length;
  await step('12-soltar-imagen', async () => {
    const [, b64] = drawCover().split(',');
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const blob = new Blob([bytes], { type: 'image/jpeg' });
    drop([new File([blob], 'foto.jpg', { type: 'image/jpeg' })]);
    await wait(1200);
  });
  report.dropImage = store.state.images.stickers.length - stickersBefore;
  // Plantillas propias: guardar, listar y borrar.
  const name = `Prueba ${Date.now()}`;
  const file = await window.api.saveTemplate({ name, templateId: store.state.templateId, style: currentStyle(store.state), customFonts: [] });
  const listed = (await window.api.listTemplates()).some((t) => t.name === name);
  await window.api.deleteTemplate(file);
  report.steps.push({ name: 'plantillas-propias', ok: listed });
  report.undoWorks = undo();
  report.state = { tracks: store.state.tracks.length, template: store.state.templateId };
  await window.api.smokeDone(report);
}
