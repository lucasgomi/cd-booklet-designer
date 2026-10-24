// Utilidades DOM sin dependencias (las usan el motor y las plantillas).

/** Crea un elemento: h('div', { class: 'x', style: {...} }, hijos...). */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('data-')) el.setAttribute(k, v);
    else if (k in el) {
      try { el[k] = v; } catch { el.setAttribute(k, v); } // p. ej. `list` es de sólo lectura
    } else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

export function fontStack(family) {
  const generic = /mono|courier/i.test(family) ? 'monospace' : /serif|fraunces|playfair|lora|abril/i.test(family) ? 'serif' : 'sans-serif';
  return `'${family}', ${generic}`;
}

export function rgba(hex, opacity = 1) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex || '');
  if (!m) return hex;
  let v = m[1];
  if (v.length === 3) v = v.split('').map((c) => c + c).join('');
  const n = parseInt(v, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${opacity})`;
}
