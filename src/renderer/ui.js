// Componentes de formulario reutilizables para los paneles.
import { h } from '../shared/dom.js';

export { h };

export function section(title, ...children) {
  return h('section', { class: 'panel-section' }, title ? h('h3', { text: title }) : null, ...children);
}

export function row(label, control, opts = {}) {
  return h('label', { class: `field${opts.half ? ' half' : ''}${opts.wide ? ' wide' : ''}` },
    h('span', { class: 'field-label', text: label }), control,
    opts.help ? h('small', { class: 'help', text: opts.help }) : null);
}

export function textInput(value, onInput, attrs = {}) {
  const el = h('input', { type: 'text', value: value ?? '', ...attrs });
  el.addEventListener('input', () => onInput(el.value));
  return el;
}

export function textArea(value, onInput, attrs = {}) {
  const el = h('textarea', { rows: 3, ...attrs });
  el.value = value ?? '';
  el.addEventListener('input', () => onInput(el.value));
  return el;
}

export function toggle(checked, onChange, label) {
  const input = h('input', { type: 'checkbox', checked: !!checked });
  input.addEventListener('change', () => onChange(input.checked));
  return h('label', { class: 'switch' }, input, h('span', { class: 'slider' }), label ? h('span', { class: 'switch-label', text: label }) : null);
}

export function select(value, options, onChange) {
  const el = h('select', {}, ...options.map((o) => (o.group
    ? h('optgroup', { label: o.group }, ...o.options.map((x) => h('option', { value: x.value, text: x.label })))
    : h('option', { value: o.value, text: o.label }))));
  el.value = String(value);
  el.addEventListener('change', () => onChange(el.value));
  return el;
}

const HEX = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;
export function normalizeHex(v) {
  const m = HEX.exec(String(v).trim());
  if (!m) return null;
  let x = m[1];
  if (x.length === 3) x = x.split('').map((c) => c + c).join('');
  return `#${x.toUpperCase()}`;
}

/** Selector de color + campo hexadecimal sincronizados. */
export function colorInput(value, onChange) {
  const picker = h('input', { type: 'color', value: normalizeHex(value) || '#000000' });
  const hex = h('input', { type: 'text', class: 'hex', value: normalizeHex(value) || value, maxLength: 7, spellcheck: false });
  picker.addEventListener('input', () => {
    hex.value = picker.value.toUpperCase();
    hex.classList.remove('invalid');
    onChange(hex.value);
  });
  hex.addEventListener('input', () => {
    const v = normalizeHex(hex.value);
    hex.classList.toggle('invalid', !v);
    if (v) { picker.value = v; onChange(v); }
  });
  hex.addEventListener('blur', () => { hex.value = picker.value.toUpperCase(); hex.classList.remove('invalid'); });
  return h('div', { class: 'color-input' }, picker, hex);
}

/** Deslizador + número con unidad. */
export function numberInput(value, { min = 0, max = 100, step = 1, unit = '' }, onChange) {
  const range = h('input', { type: 'range', min, max, step, value });
  const num = h('input', { type: 'number', min, max, step, value, class: 'num' });
  const set = (v, from) => {
    const n = Number(v);
    if (Number.isNaN(n)) return;
    if (from !== range) range.value = n;
    if (from !== num) num.value = n;
    onChange(n);
  };
  range.addEventListener('input', () => set(range.value, range));
  num.addEventListener('input', () => { if (num.value !== '') set(num.value, num); });
  return h('div', { class: 'number-input' }, range, num, unit ? h('span', { class: 'unit', text: unit }) : null);
}

/** Opacidad 0–1 mostrada como porcentaje. */
export function opacityInput(value, onChange) {
  return numberInput(Math.round((value ?? 1) * 100), { min: 0, max: 100, step: 1, unit: '%' }, (v) => onChange(v / 100));
}

export function button(label, onClick, attrs = {}) {
  const el = h('button', { type: 'button', text: label, ...attrs });
  el.addEventListener('click', onClick);
  return el;
}

/** Abre el selector de archivos del sistema y devuelve data URLs. */
export function pickImages({ multiple = false, accept = 'image/*' } = {}) {
  return new Promise((resolve) => {
    const input = h('input', { type: 'file', accept, multiple });
    input.addEventListener('change', async () => {
      const files = [...input.files];
      const out = await Promise.all(files.map((f) => new Promise((res) => {
        const r = new FileReader();
        r.onload = () => res({ name: f.name, url: r.result });
        r.onerror = () => res(null);
        r.readAsDataURL(f);
      })));
      resolve(out.filter(Boolean));
    });
    input.click();
  });
}

export function imageSize(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

let toastTimer = null;
export function toast(message, kind = 'info', ms = 3500) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = `toast ${kind}`;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, ms);
}

export function prompt(title, text, value = '') {
  const dlg = document.getElementById('dlg-prompt');
  document.getElementById('prompt-title').textContent = title;
  document.getElementById('prompt-text').textContent = text;
  const input = document.getElementById('prompt-input');
  input.value = value;
  input.onkeydown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); dlg.close('ok'); }
  };
  dlg.showModal();
  input.select();
  return new Promise((resolve) => {
    dlg.addEventListener('close', () => resolve(dlg.returnValue === 'ok' ? input.value.trim() : null), { once: true });
  });
}
