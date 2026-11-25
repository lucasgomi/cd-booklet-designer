// Selector de tipografías: todo Google Fonts con buscador, filtros por tipo
// y estilo, y vista previa con tu propio texto.
import { store } from './store.js';
import { h } from './ui.js';
import { googleCatalog, FONT_CATEGORIES, FONT_TAGS, loadPreviewFont, previewFamily, loadCustomFonts, isBundled } from '../shared/fonts.js';

const PAGE = 48;
const PREVIEW_KEY = 'cdb.fontPreview';

let dlg = null;
let ui = null;
let resolveFn = null;
const filters = { q: '', cat: '', tag: '', sort: 'popular', current: '' };

function previewText() {
  try {
    const saved = localStorage.getItem(PREVIEW_KEY);
    if (saved) return saved;
  } catch { /* sin almacenamiento */ }
  return store.state.disc.title || store.state.disc.artist || 'Tu disco, tu portada';
}

function chip(label, active, onClick) {
  const b = h('button', { type: 'button', class: `chip${active ? ' on' : ''}`, text: label });
  b.addEventListener('click', onClick);
  return b;
}

function build() {
  dlg = h('dialog', { class: 'font-picker' });
  const search = h('input', { type: 'search', placeholder: 'Buscar tipografía…', class: 'fp-search' });
  const sample = h('input', { type: 'text', class: 'fp-sample', title: 'Texto de la vista previa' });
  const size = h('input', { type: 'range', min: 14, max: 56, value: 30, title: 'Tamaño de la vista previa' });
  const sort = h('select', {},
    h('option', { value: 'popular', text: 'Más populares' }),
    h('option', { value: 'az', text: 'A–Z' }),
    h('option', { value: 'new', text: 'Más nuevas' }));
  const cats = h('div', { class: 'fp-chips' });
  const tags = h('div', { class: 'fp-chips' });
  const grid = h('div', { class: 'fp-grid' });
  const count = h('span', { class: 'muted' });
  const close = h('button', { type: 'button', text: 'Cancelar' });
  dlg.append(
    h('div', { class: 'fp-head' },
      h('h2', { text: 'Elegir tipografía' }), count, h('div', { class: 'spacer' }), close),
    h('div', { class: 'fp-tools' }, search, sample, size, sort),
    cats, tags,
    h('p', { class: 'help fp-note', text: 'Las marcadas «incluida» funcionan sin internet. El resto se descarga de Google Fonts la primera vez que la eliges.' }),
    grid);
  document.body.appendChild(dlg);

  search.addEventListener('input', () => { filters.q = search.value.trim().toLowerCase(); render(); });
  sample.addEventListener('input', () => {
    try { localStorage.setItem(PREVIEW_KEY, sample.value); } catch { /* sin almacenamiento */ }
    clearTimeout(sample._t);
    sample._t = setTimeout(render, 350);
  });
  size.addEventListener('input', () => grid.style.setProperty('--fp-size', `${size.value}px`));
  sort.addEventListener('change', () => { filters.sort = sort.value; render(); });
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('close', () => { const r = resolveFn; resolveFn = null; r?.(dlg.returnValue || null); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  grid.style.setProperty('--fp-size', '30px');
  ui = { search, sample, size, sort, cats, tags, grid, count };
}

function matches() {
  const used = new Set(store.state.customFonts || []);
  let list = googleCatalog().filter((f) => {
    if (filters.q && !f.family.toLowerCase().includes(filters.q)) return false;
    if (filters.cat === 'offline') { if (!f.offline) return false; } else if (filters.cat === 'used') { if (!used.has(f.family) && f.family !== filters.current) return false; } else if (filters.cat && f.cat !== filters.cat) return false;
    if (filters.tag && !f.tags.includes(filters.tag)) return false;
    return true;
  });
  if (filters.sort === 'az') list = [...list].sort((a, b) => a.family.localeCompare(b.family));
  else if (filters.sort === 'new') list = [...list].sort((a, b) => b.year - a.year || a.rank - b.rank);
  else list = [...list].sort((a, b) => a.rank - b.rank);
  return list;
}

let observer = null;
function card(f, text) {
  const preview = h('div', { class: 'fp-preview', text });
  if (f.offline) {
    preview.style.fontFamily = `'${f.family}'`;
  } else {
    preview.classList.add('loading');
    preview._font = f;
  }
  const el = h('button', { type: 'button', class: `fp-card${f.family === filters.current ? ' current' : ''}`, title: f.family },
    preview,
    h('div', { class: 'fp-meta' },
      h('b', { text: f.family }),
      h('span', { class: 'muted', text: `${FONT_CATEGORIES.find((c) => c.id === f.cat)?.label || ''} · ${f.weights.length} grosor${f.weights.length === 1 ? '' : 'es'}` }),
      f.offline ? h('span', { class: 'badge', text: 'incluida' }) : null));
  el.addEventListener('click', () => { dlg.returnValue = f.family; dlg.close(f.family); });
  return el;
}

function render() {
  const { grid, cats, tags, count, sample } = ui;
  cats.replaceChildren(
    chip('Todas', !filters.cat, () => { filters.cat = ''; render(); }),
    chip('Incluidas (sin internet)', filters.cat === 'offline', () => { filters.cat = 'offline'; render(); }),
    chip('En este proyecto', filters.cat === 'used', () => { filters.cat = 'used'; render(); }),
    ...FONT_CATEGORIES.map((c) => chip(c.label, filters.cat === c.id, () => { filters.cat = filters.cat === c.id ? '' : c.id; render(); })));
  tags.replaceChildren(
    h('span', { class: 'muted fp-label', text: 'Estilo:' }),
    ...FONT_TAGS.map((t) => chip(t.label, filters.tag === t.id, () => { filters.tag = filters.tag === t.id ? '' : t.id; render(); })));

  const list = matches();
  count.textContent = `${list.length} tipografías`;
  const text = sample.value || 'Aa';
  observer?.disconnect();
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const p = e.target;
      observer.unobserve(p);
      loadPreviewFont(p._font, text).then((ok) => {
        p.classList.remove('loading');
        if (ok) p.style.fontFamily = `'${previewFamily(p._font.family)}'`;
        else p.classList.add('offline');
      });
    }
  }, { root: grid, rootMargin: '200px' });
  grid.replaceChildren();
  grid.scrollTop = 0;
  let shown = 0;
  const more = () => {
    const slice = list.slice(shown, shown + PAGE);
    shown += slice.length;
    for (const f of slice) {
      const c = card(f, text);
      grid.insertBefore(c, sentinel);
      const p = c.querySelector('.fp-preview');
      if (p._font) observer.observe(p);
    }
    if (shown >= list.length) sentinel.remove();
  };
  const sentinel = h('div', { class: 'fp-sentinel' });
  grid.appendChild(sentinel);
  if (!list.length) grid.prepend(h('p', { class: 'muted', text: 'Ninguna tipografía coincide.' }));
  new IntersectionObserver((entries, obs) => {
    if (!sentinel.isConnected) { obs.disconnect(); return; }
    if (entries.some((e) => e.isIntersecting)) more();
  }, { root: grid, rootMargin: '400px' }).observe(sentinel);
  more();
}

/** Abre el selector. Resuelve con la familia elegida (ya cargada) o null. */
export async function openFontPicker(current = '') {
  if (!dlg) build();
  filters.current = current;
  ui.sample.value = previewText();
  dlg.returnValue = '';
  render();
  dlg.showModal();
  ui.search.focus();
  const family = await new Promise((r) => { resolveFn = r; });
  if (family && !isBundled(family)) await loadCustomFonts([family]);
  return family || null;
}

/** Botón que muestra la tipografía actual (en su letra) y abre el selector. */
export function fontButton(family, onPick, { placeholder = 'Elegir…' } = {}) {
  const b = h('button', { type: 'button', class: 'font-button', title: 'Cambiar tipografía' },
    h('span', { class: 'fb-name', text: family || placeholder, style: { fontFamily: family ? `'${family}'` : 'inherit' } }),
    h('span', { class: 'fb-more', text: 'Aa ▾' }));
  b.addEventListener('click', async () => {
    const f = await openFontPicker(family);
    if (f) onPick(f);
  });
  return b;
}
