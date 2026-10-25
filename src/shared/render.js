// Motor de maquetación común: el editor, el PDF y el PNG usan exactamente
// este código, así lo que ves es lo que se imprime. Todo se mide en mm.
import { getTemplate } from './templates/index.js';
import { currentStyle, placeholderValues, groupColor, PANEL_MM, sheetWidth } from './model.js';
import { formatDuration } from './time.js';
import { abbreviationCandidates } from './text.js';
import { h, rgba } from './dom.js';

export { h, rgba, fontStack } from './dom.js';

export const SAFE_MARGIN_MM = 5;

/** Pistas listas para pintar. */
export function prepareTracks(state, style) {
  const groups = [...new Set(state.tracks.map((t) => t.group.trim()).filter(Boolean))];
  return state.tracks.map((t, i) => {
    const g = t.group.trim();
    const useShort = style.useShortTitles && t.shortTitle && t.shortTitle.trim();
    return {
      index: i,
      number: i + 1,
      title: useShort ? t.shortTitle.trim() : t.title,
      fullTitle: t.title,
      duration: formatDuration(t.duration, style.durationFormat),
      numberColor: state.colorByGroup && g ? groupColor(state, g, groups.indexOf(g)) : null,
    };
  });
}

/**
 * Pinta la hoja completa (lista + portada si es librito).
 * opts: { editor: bool, showSafe: bool, selectedSticker: id }
 */
export function renderSheet(state, assets, opts = {}) {
  const tpl = getTemplate(state.templateId);
  const style = currentStyle(state);
  const W = sheetWidth(state);
  const asset = (id) => (id && assets[id]) || null;
  const coverLeft = state.booklet.enabled && state.booklet.coverSide === 'left';
  const listX = coverLeft ? PANEL_MM : 0;

  const sheet = h('div', {
    class: 'cdb-sheet',
    style: { position: 'relative', width: `${W}mm`, height: `${PANEL_MM}mm`, overflow: 'hidden', background: '#fff' },
  });

  const ctx = {
    state, style, assets, asset, h,
    tracks: prepareTracks(state, style),
    values: placeholderValues(state, style),
    editor: !!opts.editor,
    afterMount: [], // ajustes que necesitan medir el DOM ya montado
  };
  const listPanel = h('div', {
    class: 'cdb-panel cdb-panel-list',
    style: { position: 'absolute', left: `${listX}mm`, top: 0, width: `${PANEL_MM}mm`, height: `${PANEL_MM}mm`, overflow: 'hidden' },
  }, tpl.render(ctx));
  sheet.appendChild(listPanel);

  if (state.booklet.enabled) {
    const coverUrl = asset(state.images.cover);
    const cover = h('div', {
      class: 'cdb-panel cdb-panel-cover',
      style: {
        position: 'absolute', left: `${coverLeft ? 0 : PANEL_MM}mm`, top: 0, width: `${PANEL_MM}mm`, height: `${PANEL_MM}mm`,
        overflow: 'hidden', background: coverUrl ? '#000' : (opts.editor ? '#e9e6df' : '#fff'),
      },
    });
    if (coverUrl) {
      cover.appendChild(h('img', { src: coverUrl, style: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' } }));
    } else if (opts.editor) {
      cover.appendChild(h('div', { class: 'cdb-cover-placeholder', text: 'Portada 120 × 120 mm — súbela en «Librito»' }));
    }
    sheet.appendChild(cover);
  }

  // Stickers: coordenadas en mm relativas al panel de la lista (centro).
  const layer = h('div', {
    class: 'cdb-stickers',
    style: { position: 'absolute', left: `${listX}mm`, top: 0, width: `${PANEL_MM}mm`, height: `${PANEL_MM}mm`, pointerEvents: 'none' },
  });
  for (const st of state.images.stickers) {
    const url = asset(st.asset);
    if (!url) continue;
    const shadow = st.shadow
      ? `drop-shadow(${st.shadowX ?? 0.6}mm ${st.shadowY ?? 0.9}mm ${st.shadowBlur ?? 1.2}mm ${rgba('#000000', st.shadowOpacity ?? 0.35)})`
      : 'none';
    const el = h('div', {
      class: `cdb-sticker${opts.selectedSticker === st.id ? ' selected' : ''}`,
      'data-sticker-id': st.id,
      style: {
        position: 'absolute', left: `${st.x}mm`, top: `${st.y}mm`, width: `${st.w}mm`,
        transform: `translate(-50%, -50%) rotate(${st.rot || 0}deg)`,
        pointerEvents: opts.editor ? 'auto' : 'none',
      },
    }, h('img', {
      src: url, draggable: false,
      style: { width: '100%', display: 'block', filter: shadow, transform: st.flip ? 'scaleX(-1)' : 'none', opacity: st.opacity ?? 1 },
    }));
    if (opts.editor && opts.selectedSticker === st.id) {
      el.appendChild(h('div', { class: 'cdb-handle cdb-handle-scale', 'data-handle': 'scale' }));
      el.appendChild(h('div', { class: 'cdb-handle cdb-handle-rot', 'data-handle': 'rotate' }));
    }
    layer.appendChild(el);
  }
  sheet.appendChild(layer);

  // Ayudas visibles sólo en el editor.
  if (opts.editor) {
    const panels = state.booklet.enabled ? [0, PANEL_MM] : [0];
    if (opts.showSafe !== false) {
      for (const x of panels) {
        sheet.appendChild(h('div', {
          class: 'cdb-safe',
          style: {
            position: 'absolute', left: `${x + SAFE_MARGIN_MM}mm`, top: `${SAFE_MARGIN_MM}mm`,
            width: `${PANEL_MM - 2 * SAFE_MARGIN_MM}mm`, height: `${PANEL_MM - 2 * SAFE_MARGIN_MM}mm`,
          },
        }));
      }
    }
    if (state.booklet.enabled) {
      sheet.appendChild(h('div', { class: 'cdb-fold', style: { position: 'absolute', left: `${PANEL_MM}mm`, top: 0, height: '100%' } }));
    }
  }
  sheet._afterMount = ctx.afterMount;
  return sheet;
}

/** Inserta la hoja en el DOM y ejecuta los ajustes posteriores al montaje. */
export function mountSheet(parent, sheet) {
  parent.replaceChildren(sheet);
  for (const fn of sheet._afterMount || []) fn();
}

/**
 * Revisa la hoja ya montada en el DOM: títulos que no caben (con propuesta
 * abreviada) y lista que se sale por abajo.
 */
export function analyzeSheet(sheet) {
  const overflow = [];
  for (const el of sheet.querySelectorAll('.fit')) {
    if (el.scrollWidth <= el.clientWidth + 0.5) continue;
    const original = el.textContent;
    const transform = el._fitTransform || ((s) => s);
    const fullTitle = el.dataset.fullTitle || original;
    let suggestion = null;
    for (const cand of abbreviationCandidates(fullTitle)) {
      el.textContent = transform(cand);
      if (el.scrollWidth <= el.clientWidth + 0.5) { suggestion = cand; break; }
    }
    el.textContent = original;
    overflow.push({ index: Number(el.dataset.trackIndex), title: fullTitle, suggestion });
  }
  return { overflow, vertical: verticalOverflow(sheet) };
}

/** ¿Alguna lista se sale por abajo? (la última fila acaba bajo su contenedor) */
export function verticalOverflow(sheet) {
  for (const el of sheet.querySelectorAll('.fit-v')) {
    const last = el.lastElementChild;
    if (!last) continue;
    // Medidas de maquetación (no de pantalla): funcionan aunque la hoja esté girada o escalada.
    const top = last.offsetParent === el ? last.offsetTop : last.offsetTop - el.offsetTop;
    if (top + last.offsetHeight > el.clientHeight + 1) return true; // 1 px de tolerancia por redondeos
  }
  return false;
}

// ------------------------------------------------------- ajuste automático

/** Escala mínima de la letra de la lista al ajustar (55 % del tamaño elegido). */
export const FIT_MIN_SCALE = 0.55;

/** Copia del estado con la letra (y la altura fija de fila) de la lista
 * escalada y, opcionalmente, el número de columnas decidido. */
export function scaledState(state, scale = 1, cols = undefined) {
  if ((!scale || scale === 1) && !cols) return state;
  const style = currentStyle(state);
  const next = { ...style, listSize: +(style.listSize * (scale || 1)).toFixed(3) };
  if (typeof style.rowHeight === 'number') next.rowHeight = +(style.rowHeight * (scale || 1)).toFixed(3);
  if (cols) next._cols = cols;
  return { ...state, styles: { ...state.styles, [state.templateId]: next } };
}

/** Por debajo de esta escala, una plantilla con columnas automáticas prueba a usar dos. */
export const COLUMN_SWITCH_SCALE = 0.7;

function templateHasColumns(id) {
  return !!getTemplate(id)?.controls?.some((sec) => sec.items.some((it) => it.key === 'columns'));
}

/**
 * Pinta la hoja ajustándola para que quepa la lista:
 *  1. reduce la letra de toda la lista por igual (nunca sólo una fila) hasta
 *     el tamaño más grande que quepa, con un mínimo de FIT_MIN_SCALE;
 *  2. en plantillas con columnas en «Automático», si con una columna la letra
 *     bajaría de COLUMN_SWITCH_SCALE (o no cabría), prueba con dos.
 * mount(sheet) debe insertar la hoja en el DOM (para poder medirla).
 * Devuelve { sheet, scale, cols, fits }.
 */
export function renderFitted(state, assets, opts, mount) {
  const at = (scale, cols) => {
    const sheet = renderSheet(scaledState(state, scale, cols), assets, opts);
    mount(sheet);
    return { sheet, scale, cols, fits: !verticalOverflow(sheet) };
  };
  const autoCols = currentStyle(state).columns === 'auto' && templateHasColumns(state.templateId);
  if (state.autoFit === false || !state.tracks.length) return at(1, autoCols ? 1 : undefined);

  const search = (cols) => {
    const full = at(1, cols);
    if (full.fits) return full;
    const low = at(FIT_MIN_SCALE, cols);
    if (!low.fits) return low;
    let lo = FIT_MIN_SCALE;
    let hi = 1;
    for (let i = 0; i < 7; i += 1) {
      const mid = (lo + hi) / 2;
      if (at(mid, cols).fits) lo = mid; else hi = mid;
    }
    // 3 % de holgura: el PNG a 300 ppp redondea las alturas de otra forma.
    return { scale: Math.max(FIT_MIN_SCALE, Math.floor(lo * 0.97 * 1000) / 1000), cols, fits: true };
  };

  let best = search(autoCols ? 1 : undefined);
  if (autoCols && (!best.fits || best.scale < COLUMN_SWITCH_SCALE)) {
    const two = search(2);
    if (two.fits && (!best.fits || two.scale > best.scale)) best = two;
  }
  const final = at(best.scale, best.cols);
  return final.fits || !best.fits ? final : at(Math.min(1, best.scale / 0.97), best.cols);
}

/** Espera a que fuentes e imágenes estén listas (para exportar). */
export async function whenReady(root) {
  await document.fonts.ready;
  const imgs = [...root.querySelectorAll('img')];
  await Promise.all(imgs.map((img) => (img.complete ? null : img.decode().catch(() => null))));
  // Dos fotogramas (o 150 ms si la ventana está oculta y no hay fotogramas).
  await Promise.race([
    new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))),
    new Promise((r) => setTimeout(r, 150)),
  ]);
}
