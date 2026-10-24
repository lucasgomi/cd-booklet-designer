// Prueba automática de humo (npm run smoke): recorre la app con el
// proyecto de ejemplo, hace capturas y exporta PDF y PNG.
import { store, commit, undo, usedAssets } from './store.js';
import { switchTemplate } from './panels/design.js';
import { drawCover } from './example.js';
import { addAsset } from './store.js';
import { currentStyle, syncGroups } from '../shared/model.js';
import { lastAnalysis } from './preview.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runSmoke({ commands, showTab }) {
  const report = { steps: [], errors: [] };
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
    const payload = { state: store.state, assets: usedAssets(), suggestedName: name };
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
  for (const id of ['two-columns', 'setlist', 'lineup', 'terminal', 'notes', 'coquette', 'acid', 'book-index', 'playlist']) {
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
