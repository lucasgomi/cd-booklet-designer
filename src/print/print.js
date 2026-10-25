// Página de exportación: monta la hoja a tamaño real (PDF A4 apaisado con
// marcas de corte y doblez) o a 300 ppp (PNG, sólo la hoja).
import { renderSheet, mountSheet, whenReady, scaledState, verticalOverflow, FIT_MIN_SCALE } from '../shared/render.js';
import { normalizeState, sheetWidth, PANEL_MM } from '../shared/model.js';
import { loadCustomFonts } from '../shared/fonts.js';

const A4 = { w: 297, h: 210 };
const MARK_OFFSET = 3;  // mm entre el corte y la marca
const MARK_LEN = 6;     // mm de largo de cada marca

function marksSvg(x0, y0, w, hgt, booklet) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${A4.w} ${A4.h}`);
  svg.style.cssText = `position:absolute;left:0;top:0;width:${A4.w}mm;height:${A4.h}mm`;
  const line = (x1, y1, x2, y2, dash) => {
    const l = document.createElementNS(NS, 'line');
    Object.entries({ x1, y1, x2, y2, stroke: '#000', 'stroke-width': 0.12 }).forEach(([k, v]) => l.setAttribute(k, v));
    if (dash) l.setAttribute('stroke-dasharray', dash);
    svg.appendChild(l);
  };
  const x1 = x0 + w;
  const y1 = y0 + hgt;
  const o = MARK_OFFSET;
  const L = MARK_LEN;
  // Marcas de corte en las cuatro esquinas (fuera del área impresa).
  for (const [x, y, sx, sy] of [[x0, y0, -1, -1], [x1, y0, 1, -1], [x0, y1, -1, 1], [x1, y1, 1, 1]]) {
    line(x + sx * o, y, x + sx * (o + L), y);
    line(x, y + sy * o, x, y + sy * (o + L));
  }
  // Marca de doblez en el centro (arriba y abajo).
  if (booklet) {
    const xm = x0 + w / 2;
    line(xm, y0 - o, xm, y0 - o - L, '1 0.8');
    line(xm, y1 + o, xm, y1 + o + L, '1 0.8');
  }
  // Regla de control de escala: 50 mm.
  const rx = x0;
  const ry = A4.h - 9;
  line(rx, ry, rx + 50, ry);
  for (let i = 0; i <= 50; i += 10) line(rx + i, ry - (i % 50 === 0 ? 1.6 : 1), rx + i, ry);
  return svg;
}

async function main() {
  const payload = await window.api.printPayload();
  if (!payload) return;
  try {
    const state = normalizeState(payload.state);
    await loadCustomFonts(state.customFonts);
    // Misma escala que calculó el editor (ajuste automático), para que el PDF/PNG sea idéntico.
    let scale = payload.fitScale || 1;
    const cols = payload.fitCols;
    let sheet = renderSheet(scaledState(state, scale, cols), payload.assets || {}, { editor: false });
    const W = sheetWidth(state);

    // Comprobación final: si a este tamaño de página la lista se saliera
    // (redondeos distintos al del editor), se reduce un poco más.
    const refit = async (current, mount) => {
      await whenReady(document.body); // medir con las tipografías ya cargadas
      if (state.autoFit === false) return current;
      let el = current;
      while (verticalOverflow(el) && scale > FIT_MIN_SCALE) {
        scale = Math.max(FIT_MIN_SCALE, scale - 0.02);
        el = renderSheet(scaledState(state, scale, cols), payload.assets || {}, { editor: false });
        mount(el);
      }
      return el;
    };

    if (payload.mode === 'png') {
      document.body.className = 'png';
      // 1 mm CSS = 96/25,4 px; a 300 ppp hacen falta 300/25,4 px por mm.
      document.body.style.zoom = String((payload.dpi || 300) / 96);
      mountSheet(document.body, sheet);
      sheet = await refit(sheet, (el) => mountSheet(document.body, el));
    } else {
      document.body.className = 'pdf';
      const x0 = (A4.w - W) / 2;
      const y0 = (A4.h - PANEL_MM) / 2;
      sheet.style.position = 'absolute';
      sheet.style.left = `${x0}mm`;
      sheet.style.top = `${y0}mm`;
      mountSheet(document.body, sheet);
      sheet = await refit(sheet, (el) => {
        Object.assign(el.style, { position: 'absolute', left: `${x0}mm`, top: `${y0}mm` });
        mountSheet(document.body, el);
      });
      document.body.appendChild(marksSvg(x0, y0, W, PANEL_MM, state.booklet.enabled));
      const note = document.createElement('div');
      note.className = 'note';
      note.style.left = `${x0 + 56}mm`;
      note.style.top = `${A4.h - 11}mm`;
      note.textContent = `IMPRIMIR AL 100 % / TAMAÑO REAL (sin «ajustar a la página»). `
        + `Hoja ${W} × ${PANEL_MM} mm. Recorta por las marcas de las esquinas`
        + `${state.booklet.enabled ? ' y dobla por la marca central' : ''}. La regla de la izquierda debe medir 50 mm.`;
      document.body.appendChild(note);
    }
    await whenReady(document.body);
    await window.api.printReady(null);
  } catch (err) {
    await window.api.printReady(String(err?.stack || err));
  }
}

main();
