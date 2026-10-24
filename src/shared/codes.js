// Código de barras (Code 128) y código QR como SVG vectorial.
// Usa las librerías cargadas como scripts globales: JsBarcode y qrcode.
import { stripAccents } from './text.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** Code 128 sólo admite ASCII: quitamos acentos y lo demás. */
export function barcodeSafe(text) {
  return stripAccents(text || '').replace(/[^\x20-\x7E]/g, '').trim() || 'CD';
}

export function barcodeSvg(text, { color = '#000', widthMm = 50, heightMm = 8 } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  try {
    window.JsBarcode(svg, barcodeSafe(text), {
      format: 'CODE128', displayValue: false, margin: 0, height: 100, width: 2,
      lineColor: color, background: 'transparent',
    });
  } catch (err) {
    console.warn('Código de barras no válido', err);
  }
  const w = parseFloat(svg.getAttribute('width')) || 100;
  const h = parseFloat(svg.getAttribute('height')) || 100;
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  svg.style.cssText = `width:${widthMm}mm;height:${heightMm}mm;display:block`;
  return svg;
}

export function qrSvg(text, { color = '#000', sizeMm = 14 } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  const qrcode = window.qrcode;
  qrcode.stringToBytes = qrcode.stringToBytesFuncs['UTF-8'];
  const qr = qrcode(0, 'M');
  qr.addData(text || ' ');
  qr.make();
  const n = qr.getModuleCount();
  let d = '';
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  svg.setAttribute('viewBox', `0 0 ${n} ${n}`);
  svg.setAttribute('shape-rendering', 'crispEdges');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', color);
  svg.appendChild(path);
  svg.style.cssText = `width:${sizeMm}mm;height:${sizeMm}mm;display:block`;
  return svg;
}

/** Barras decorativas (no escaneables) generadas a partir del texto. */
export function decorativeBarcodeSvg(text, { color = '#000', widthMm = 46, heightMm = 6, bars = 26 } = {}) {
  let seed = 2166136261;
  for (const ch of String(text || 'CD')) seed = Math.imul(seed ^ ch.codePointAt(0), 16777619) >>> 0;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const pick = (weights) => {
    const r = rand();
    let acc = 0;
    for (const [v, w] of weights) { acc += w; if (r <= acc) return v; }
    return weights[weights.length - 1][0];
  };
  const svg = document.createElementNS(SVG_NS, 'svg');
  let x = 0;
  let d = '';
  for (let i = 0; i < bars; i += 1) {
    const w = pick([[1, 0.45], [2, 0.3], [3, 0.25]]);
    d += `M${x} 0h${w}v1h-${w}z`;
    x += w + (i === bars - 1 ? 0 : pick([[1, 0.4], [2, 0.25], [3, 0.15], [5, 0.12], [7, 0.08]]));
  }
  svg.setAttribute('viewBox', `0 0 ${x} 1`);
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.setAttribute('shape-rendering', 'crispEdges');
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', d);
  path.setAttribute('fill', color);
  svg.appendChild(path);
  svg.style.cssText = `width:${widthMm}mm;height:${heightMm}mm;display:block`;
  return svg;
}
