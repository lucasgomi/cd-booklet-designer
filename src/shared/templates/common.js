// Piezas de configuración compartidas entre plantillas.
import { TOTAL_FORMATS } from '../time.js';
import { h } from '../dom.js';

/** Formato del total propio de la plantilla ('' = el elegido en «Disco»). */
export const TOTAL_FORMAT_CONTROL = {
  key: 'totalFormat',
  label: 'Formato del total ({total})',
  type: 'select',
  options: [{ value: '', label: 'Como en la pestaña «Disco»' }, ...TOTAL_FORMATS.map((f) => ({ value: f.id, label: f.label }))],
};

// ------------------------------------------------------------------
// Utilidades para escribir plantillas con menos repetición.

export const DURATION_CONTROL = { key: 'durationFormat', label: 'Duraciones', type: 'select', options: [{ value: 'mm:ss', label: '03:04' }, { value: 'm:ss', label: '3:04' }] };
export const SHORT_TITLES_CONTROL = { key: 'useShortTitles', label: 'Usar títulos abreviados', type: 'toggle' };

/** Controles de «Textos» que comparten casi todas las plantillas. */
export const TEXT_EXTRAS = [SHORT_TITLES_CONTROL, DURATION_CONTROL, TOTAL_FORMAT_CONTROL];

/** Controles de altura de fila. */
export function rowControls(min = 1.8, max = 8) {
  return [
    { key: 'autoRowHeight', label: 'Altura de fila automática', type: 'toggle' },
    { key: 'rowHeight', label: 'Altura de fila', type: 'number', min, max, step: 0.1, unit: 'mm', when: (s) => !s.autoRowHeight },
  ];
}

/** Estilo de tamaño de una fila (automática o fija). */
export function rowSizing(s, { maxFactor = 2, minFactor = 1.05, size = s.listSize } = {}) {
  const em = size * 0.3528;
  return {
    flex: s.autoRowHeight ? '1 1 0' : `0 0 ${s.rowHeight}mm`,
    maxHeight: s.autoRowHeight ? `${(em * maxFactor).toFixed(2)}mm` : 'none',
    minHeight: `${(em * minFactor).toFixed(2)}mm`,
  };
}

/** Título de canción medible (avisos de «no cabe»). */
export function fitTitle(t, style = {}, transform = null) {
  const el = h('span', {
    class: 'fit', text: transform ? transform(t.title) : t.title, 'data-track-index': t.index, 'data-full-title': t.fullTitle,
    style: { flex: '1 1 auto', minWidth: 0, overflow: 'hidden', whiteSpace: 'pre', lineHeight: 1.3, ...style },
  });
  if (transform) el._fitTransform = transform;
  return el;
}

/** Contenedor de lista que avisa si no cabe en vertical. */
export function fitList(rows, style = {}) {
  return h('div', { class: 'fit-v', style: { flex: '1 1 0', minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', ...style } }, ...rows);
}

/** Reparte las pistas en n columnas. */
export function splitColumns(tracks, n) {
  const per = Math.ceil(tracks.length / n);
  return Array.from({ length: n }, (_, i) => tracks.slice(i * per, (i + 1) * per));
}

/** Generador pseudoaleatorio determinista (mismo dibujo en pantalla y al imprimir). */
export function seeded(seed = 1) {
  let s = seed % 2147483647 || 1;
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}

/** Semilla a partir de un texto. */
export function hashSeed(text) {
  let x = 2166136261;
  for (const ch of String(text)) x = Math.imul(x ^ ch.codePointAt(0), 16777619) >>> 0;
  return x || 1;
}

// ------------------------------------------------------------------
// Columnas automáticas: las plantillas de una columna pasan a dos cuando
// la lista es tan larga que la letra tendría que encogerse demasiado.

export const COLUMNS_CONTROL = {
  key: 'columns', label: 'Columnas de la lista', type: 'select',
  options: [{ value: 'auto', label: 'Automático (dos si son muchas)' }, { value: 1, label: 'Una' }, { value: 2, label: 'Dos' }],
};

/** Número de columnas que debe pintar la plantilla. */
export function listColumns(s) {
  if (s._cols) return s._cols; // decidido por el ajuste automático
  return Number(s.columns) === 2 ? 2 : 1;
}

/**
 * Coloca las filas en una o varias columnas. Con una columna devuelve un
 * único contenedor .fit-v; con más, una fila de contenedores .fit-v.
 */
export function columnsBox(rows, cols, { gap = '5mm', style = {}, columnStyle = {} } = {}) {
  if (cols <= 1) return fitList(rows, { flex: '1 1 auto', ...style, ...columnStyle });
  return h('div', { style: { flex: '1 1 auto', minHeight: 0, display: 'flex', gap, ...style } },
    ...splitColumns(rows, cols).map((part) => fitList(part, columnStyle)));
}

/** Reparte en columnas una lista .fit-v ya construida (sin tocar sus filas). */
export function columnize(list, cols, gap = '5mm') {
  if (cols <= 1) return list;
  const rows = [...list.children];
  const box = h('div', { style: { flex: list.style.flex || '1 1 auto', minHeight: 0, display: 'flex', gap, margin: list.style.margin } });
  for (const part of splitColumns(rows, cols)) box.appendChild(fitList(part));
  return box;
}

// ------------------------------------------------------------------
// Adornos modulares: cada adorno de una plantilla se puede ocultar por
// separado. La plantilla los declara en `decorations: [{ key, label }]`
// (salen como interruptores en Diseño → Adornos) y los pinta con deco().
// Están activos salvo que el estilo tenga `key: false`.

/**
 * Devuelve el adorno (marcado para poder ocultarlo con un clic en el
 * editor) o null si está desactivado. `make` puede ser el elemento o una
 * función que lo crea.
 */
export function deco(s, key, make) {
  if (s[key] === false) return null;
  const el = typeof make === 'function' ? make() : make;
  if (el) {
    el.classList.add('cdb-deco');
    el.dataset.deco = key;
  }
  return el;
}
