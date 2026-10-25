// Pestaña «Plantilla»: galería con miniaturas en vivo (con tus datos) de
// todas las plantillas y de los estilos incluidos de la actual.
import { store, commit } from '../store.js';
import { h, section, button, toast } from '../ui.js';
import { renderFitted, mountSheet } from '../../shared/render.js';
import { TEMPLATES, getTemplate, templateCategories } from '../../shared/templates/index.js';
import { currentStyle, PANEL_MM } from '../../shared/model.js';
import { switchTemplate } from './design.js';

const PX_PER_MM = 96 / 25.4;
const CACHE_LIMIT = 120;
const cache = new Map(); // clave -> nodo ya maquetado (se clona al reutilizar)
let observer = null;

function dataKey(state) {
  return JSON.stringify([state.disc, state.tracks, state.images.background, state.groups, state.colorByGroup, state.customFonts]);
}

/** Pinta la miniatura dentro de `box` (que ya está en el DOM y visible). */
function fill(box) {
  const { templateId } = box.dataset;
  const style = JSON.parse(box.dataset.style);
  const key = `${templateId}|${box.dataset.style}|${dataKey(store.state)}`;
  const scale = box.clientWidth / (PANEL_MM * PX_PER_MM);
  let inner = cache.get(key);
  if (inner) {
    inner = inner.cloneNode(true);
    inner.style.transform = `scale(${scale})`;
    box.replaceChildren(inner);
    return;
  }
  const st = {
    ...store.state,
    templateId,
    styles: { ...store.state.styles, [templateId]: style },
    booklet: { enabled: false, coverSide: 'right' },
    images: { ...store.state.images, stickers: [] },
  };
  inner = h('div', { class: 'thumb-inner', style: { transform: `scale(${scale})` } });
  box.replaceChildren(inner);
  try {
    renderFitted(st, store.assets, { editor: false }, (sheet) => mountSheet(inner, sheet));
  } catch (err) {
    box.replaceChildren(h('span', { class: 'muted', text: 'Sin vista previa' }));
    console.warn(err);
    return;
  }
  cache.set(key, inner.cloneNode(true));
  if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value);
}

function thumbBox(templateId, style) {
  const box = h('div', { class: 'thumb-box', 'data-template-id': templateId, 'data-style': JSON.stringify(style) });
  observer?.observe(box);
  return box;
}

function card({ templateId, style, label, sub, active, onClick, title }) {
  const el = h('button', { type: 'button', class: `gallery-card${active ? ' active' : ''}`, title: title || label },
    thumbBox(templateId, style),
    h('span', { class: 'gallery-label' }, h('b', { text: label }), sub ? h('small', { text: sub }) : null));
  el.addEventListener('click', onClick);
  return el;
}

function applyPreset(tpl, preset) {
  commit((s) => {
    s.templateId = tpl.id;
    s.styles[tpl.id] = { ...tpl.defaults, ...preset.style };
  }, { rebuild: true });
  toast(`«${tpl.name} · ${preset.name}» aplicado. Ctrl+Z para deshacer.`, 'ok');
}

function surprise() {
  const options = TEMPLATES.flatMap((t) => (t.presets?.length ? t.presets.map((p) => [t, p]) : [[t, { name: 'Por defecto', style: {} }]]));
  const current = JSON.stringify(currentStyle(store.state));
  let pick;
  for (let i = 0; i < 10; i += 1) {
    pick = options[Math.floor(Math.random() * options.length)];
    if (JSON.stringify({ ...pick[0].defaults, ...pick[1].style }) !== current) break;
  }
  applyPreset(pick[0], pick[1]);
}

export function renderGalleryPanel(root) {
  observer?.disconnect();
  observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      observer.unobserve(e.target);
      fill(e.target);
    }
  }, { root, rootMargin: '200px' });

  const tpl = getTemplate(store.state.templateId);
  const style = currentStyle(store.state);
  const styleJson = JSON.stringify(style);
  root.replaceChildren();

  root.appendChild(section(`Estilos de «${tpl.name}»`,
    h('div', { class: 'gallery-grid' }, ...(tpl.presets?.length ? tpl.presets : [{ name: 'Por defecto', style: {} }]).map((p) => {
      const st = { ...tpl.defaults, ...p.style };
      return card({
        templateId: tpl.id, style: st, label: p.name, active: JSON.stringify(st) === styleJson,
        onClick: () => applyPreset(tpl, p), title: `Aplicar «${p.name}»: cambia colores y letras, no tus datos`,
      });
    })),
    h('div', { class: 'toolbar' },
      button('🎲 Sorpréndeme', surprise, { class: 'primary', title: 'Plantilla y estilo al azar (Ctrl+Z para volver)' }),
      button('Ajustar a mano en «Diseño» →', () => document.querySelector('#tabs [data-tab="design"]').click()))));

  for (const cat of templateCategories()) {
    root.appendChild(section(cat.name, h('div', { class: 'gallery-grid' }, ...cat.templates.map((t) => {
      // Cada plantilla se ve con el estilo que tenga ya en el proyecto (o el suyo por defecto).
      const st = { ...t.defaults, ...(store.state.styles[t.id] || {}) };
      return card({
        templateId: t.id, style: st, label: t.name, active: t.id === tpl.id,
        onClick: () => switchTemplate(t.id), title: t.description,
      });
    }))));
  }
  root.appendChild(h('p', { class: 'help', text: 'Las miniaturas usan tus canciones e imágenes. Cambiar de plantilla no borra los ajustes de las demás: cada una recuerda los suyos.' }));
}
