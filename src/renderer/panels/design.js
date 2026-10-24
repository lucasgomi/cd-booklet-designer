// Pestaña «Diseño»: se genera sola a partir de `controls` de la plantilla,
// más la gestión de plantillas propias y de fuentes de Google.
import { store, commit } from '../store.js';
import { h, section, row, textInput, textArea, toggle, select, colorInput, numberInput, opacityInput, button, toast, prompt } from '../ui.js';
import { getTemplate, templateCategories } from '../../shared/templates/index.js';
import { currentStyle } from '../../shared/model.js';
import { fontCatalog, loadCustomFonts, BUNDLED_FONTS } from '../../shared/fonts.js';

let userTemplates = [];
const openSections = new Set(['Colores']);

export async function refreshUserTemplates() {
  userTemplates = await window.api.listTemplates();
}

function setStyle(key, value, opts = {}) {
  commit((s) => {
    const id = s.templateId;
    s.styles[id] = { ...currentStyle(s), [key]: value };
  }, { key: `style.${key}`, ...opts });
}

function fontControl(item, style) {
  const catalog = fontCatalog(store.state.customFonts);
  const groups = {};
  for (const f of catalog) (groups[f.category] ||= []).push({ value: f.family, label: f.family });
  const familyOptions = Object.entries(groups).map(([group, options]) => ({ group, options }));
  if (!catalog.some((f) => f.family === style[item.family])) {
    familyOptions.push({ group: 'No disponible', options: [{ value: style[item.family], label: `${style[item.family]} (no instalada)` }] });
  }
  const weightsFor = (fam) => catalog.find((f) => f.family === fam)?.weights || [400, 700];
  const nearest = (fam, w) => weightsFor(fam).reduce((a, b) => (Math.abs(b - w) < Math.abs(a - w) ? b : a));

  const family = select(style[item.family], familyOptions, (v) => {
    commit((s) => {
      const st = { ...currentStyle(s), [item.family]: v };
      st[item.weight] = nearest(v, st[item.weight]);
      s.styles[s.templateId] = st;
    }, { rebuild: 'design' });
  });
  family.style.fontFamily = `'${style[item.family]}'`;
  const weight = select(style[item.weight], weightsFor(style[item.family]).map((w) => ({ value: w, label: String(w) })),
    (v) => setStyle(item.weight, Number(v)));
  const size = numberInput(style[item.size], { min: 4, max: 40, step: 0.1, unit: 'pt' }, (v) => setStyle(item.size, v));
  return h('div', { class: 'font-control' },
    h('span', { class: 'field-label', text: item.label }),
    h('div', { class: 'font-line' }, family, weight), size);
}

function control(item, style) {
  if (item.when && !item.when(style)) return null;
  const v = style[item.key];
  const rebuild = { rebuild: 'design' };
  switch (item.type) {
    case 'color': return row(item.label, colorInput(v, (x) => setStyle(item.key, x)));
    case 'opacity': return row(item.label, opacityInput(v, (x) => setStyle(item.key, x)));
    case 'number': return row(item.label, numberInput(v, item, (x) => setStyle(item.key, x)));
    case 'toggle': return h('div', { class: 'field' }, toggle(v, (x) => setStyle(item.key, x, rebuild), item.label));
    case 'text': return row(item.label, textInput(v, (x) => setStyle(item.key, x), { maxLength: item.maxLength || 300 }), { help: item.help, half: item.half });
    case 'textarea': return row(item.label, textArea(v, (x) => setStyle(item.key, x)), { help: item.help });
    case 'select': return row(item.label, select(v, item.options, (x) => {
      const opt = item.options.find((o) => String(o.value) === x);
      setStyle(item.key, typeof opt?.value === 'number' ? Number(x) : x, rebuild);
    }), { half: item.half });
    case 'font': return fontControl(item, style);
    default: return null;
  }
}

function collapsible(title, children) {
  const det = h('details', { class: 'panel-section collapsible', open: openSections.has(title) },
    h('summary', { text: title }), h('div', { class: 'fields' }, ...children));
  det.addEventListener('toggle', () => { if (det.open) openSections.add(title); else openSections.delete(title); });
  return det;
}

function userTemplatesSection() {
  const tpl = getTemplate(store.state.templateId);
  const mine = userTemplates;
  const list = mine.length
    ? h('div', { class: 'user-templates' }, ...mine.map((t) => h('div', { class: 'user-template' },
      h('div', { class: 'ut-name' }, h('b', { text: t.name }), h('small', { class: 'muted', text: getTemplate(t.templateId)?.name || t.templateId })),
      button('Aplicar', () => applyUserTemplate(t)),
      button('Exportar', () => window.api.exportTemplate(t), { title: 'Guardar como archivo para compartir' }),
      button('✕', async () => {
        if (!confirm(`¿Borrar la plantilla «${t.name}»?`)) return;
        await window.api.deleteTemplate(t.file);
        await refreshUserTemplates();
        commit(() => {}, { rebuild: 'design' });
      }, { class: 'icon danger', title: 'Borrar' }))))
    : h('p', { class: 'muted', text: 'Guarda aquí tus ajustes visuales para reutilizarlos en otros discos.' });
  return section('Mis plantillas',
    list,
    h('div', { class: 'toolbar' },
      button('Guardar ajustes actuales…', async () => {
        const name = await prompt('Guardar como plantilla', `Se guardarán los colores, tipografías, textos y espaciado de «${tpl.name}» (no las canciones ni las imágenes).`, '');
        if (!name) return;
        await window.api.saveTemplate({
          name, templateId: store.state.templateId, style: currentStyle(store.state),
          customFonts: store.state.customFonts, created: new Date().toISOString(),
        });
        await refreshUserTemplates();
        commit(() => {}, { rebuild: 'design' });
        toast(`Plantilla «${name}» guardada.`, 'ok');
      }, { class: 'primary' }),
      button('Importar…', async () => {
        const t = await window.api.importTemplate().catch(() => null);
        if (!t?.templateId || !t.style) { if (t !== null) toast('Archivo de plantilla no válido.', 'bad'); return; }
        await window.api.saveTemplate(t);
        await refreshUserTemplates();
        commit(() => {}, { rebuild: 'design' });
        toast(`Plantilla «${t.name}» importada.`, 'ok');
      }),
      button('Restablecer', () => {
        if (!confirm('¿Volver a los ajustes por defecto de esta plantilla?')) return;
        commit((s) => { s.styles[s.templateId] = { ...getTemplate(s.templateId).defaults }; }, { rebuild: 'design' });
      })));
}

export async function applyUserTemplate(t) {
  if (!getTemplate(t.templateId)) { toast('Esa plantilla usa un diseño que no existe en esta versión.', 'bad'); return; }
  if (t.customFonts?.length) await loadCustomFonts(t.customFonts);
  commit((s) => {
    s.templateId = t.templateId;
    s.styles[t.templateId] = { ...getTemplate(t.templateId).defaults, ...t.style };
    s.customFonts = [...new Set([...(s.customFonts || []), ...(t.customFonts || [])])];
  }, { rebuild: true });
  toast(`Aplicada «${t.name}».`, 'ok');
}

function googleFontsSection() {
  const input = h('input', { type: 'text', placeholder: 'Nombre exacto, p. ej. Rubik Mono One' });
  const add = async () => {
    const family = input.value.trim();
    if (!family) return;
    const ok = await loadCustomFonts([family]);
    const available = ok && document.fonts.check(`16px '${family}'`);
    if (!available) { toast(`No se pudo cargar «${family}». Revisa el nombre y la conexión a Internet.`, 'bad', 6000); return; }
    commit((s) => { s.customFonts = [...new Set([...(s.customFonts || []), family])]; }, { rebuild: 'design' });
    toast(`«${family}» añadida a la lista de tipografías.`, 'ok');
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') add(); });
  const custom = store.state.customFonts || [];
  return collapsible('Más fuentes de Google Fonts', [
    h('p', { class: 'help', text: `La app ya incluye ${BUNDLED_FONTS.length} familias que funcionan sin conexión. Puedes añadir cualquier otra de fonts.google.com por su nombre (necesita Internet).` }),
    h('div', { class: 'inline' }, input, button('Añadir', add)),
    custom.length ? h('div', { class: 'chips' }, ...custom.map((f) => h('span', { class: 'chip' }, f,
      button('×', () => commit((s) => { s.customFonts = s.customFonts.filter((x) => x !== f); }, { rebuild: 'design' }), { class: 'chip-x' })))) : null,
  ]);
}

export function renderDesignPanel(root) {
  const tpl = getTemplate(store.state.templateId);
  const style = currentStyle(store.state);
  root.replaceChildren();
  root.appendChild(section('Plantilla', ...templateCategories().flatMap((cat) => [
    h('div', { class: 'template-category', text: cat.name }),
    h('div', { class: 'template-cards' }, ...cat.templates.map((t) => {
      const card = h('button', { type: 'button', class: `template-card${t.id === tpl.id ? ' active' : ''}` },
        h('b', { text: t.name }), h('small', { text: t.description }));
      card.addEventListener('click', () => switchTemplate(t.id));
      return card;
    })),
  ])));
  if (tpl.presets?.length) {
    root.appendChild(section('Estilos incluidos',
      h('div', { class: 'preset-grid' }, ...tpl.presets.map((p) => {
        const st = { ...tpl.defaults, ...p.style };
        const swatches = [st.bgColor || st.bgColor1, st.paperColor || st.headerColor || st.bgColor2, st.numberColor || st.accentColor, st.trackTitleColor || st.textColor]
          .filter(Boolean).slice(0, 4);
        const btn = h('button', { type: 'button', class: 'preset', title: `Aplicar «${p.name}» (se puede deshacer)` },
          h('span', { class: 'preset-swatches' }, ...swatches.map((c) => h('span', { style: { background: c } }))),
          h('span', { text: p.name }));
        btn.addEventListener('click', () => {
          commit((s) => { s.styles[s.templateId] = { ...tpl.defaults, ...p.style }; }, { rebuild: 'design' });
          toast(`Estilo «${p.name}» aplicado. Ctrl+Z para deshacer.`, 'ok');
        });
        return btn;
      })),
      h('p', { class: 'help', text: 'Sustituye los colores, tipografías y ajustes de esta plantilla. Los datos e imágenes no cambian.' })));
  }
  root.appendChild(userTemplatesSection());
  for (const sec of tpl.controls) {
    root.appendChild(collapsible(sec.section, sec.items.map((it) => control(it, style)).filter(Boolean)));
  }
  root.appendChild(googleFontsSection());
}

export function switchTemplate(id) {
  commit((s) => {
    s.templateId = id;
    if (!s.styles[id]) s.styles[id] = { ...getTemplate(id).defaults };
  }, { rebuild: true });
}
