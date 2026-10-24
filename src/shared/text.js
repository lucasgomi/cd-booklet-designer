// Utilidades de texto: placeholders, mayúsculas, acentos y abreviaturas.

export function stripAccents(s) {
  return String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').normalize('NFC');
}

/**
 * Sustituye {campo} por su valor. Un tramo entre corchetes [ ... ] se
 * omite entero si alguno de sus campos está vacío u oculto, p. ej.
 * "HITS[ · Nº {disco}]". Al final limpia separadores "·" sobrantes.
 */
export function fillTemplate(template, values) {
  if (!template) return '';
  const sub = (str) => str.replace(/\{(\w+)\}/g, (_, k) => (values[k] ?? ''));
  const hasEmpty = (str) => [...str.matchAll(/\{(\w+)\}/g)].some(([, k]) => !values[k]);
  let out = String(template).replace(/\[([^\]]*)\]/g, (_, inner) => (hasEmpty(inner) ? '' : sub(inner)));
  out = sub(out);
  // Separadores huérfanos al principio, al final o duplicados.
  out = out.replace(/^(\s*[·•|]\s*)+/, '').replace(/(\s*[·•|]\s*)+$/, '');
  out = out.replace(/([·•|])(\s*[·•|])+/g, '$1');
  return out.trim();
}

export const PLACEHOLDER_HELP =
  'Campos: {artista} {titulo} {disco} {fecha} {pistas} {total}. ' +
  'Lo que va entre [corchetes] se oculta si un campo está vacío.';

/**
 * Propuestas de versión abreviada para un título largo, de menos a más
 * agresiva. La interfaz prueba cada una y propone la primera que cabe.
 */
export function abbreviationCandidates(title) {
  const out = [];
  const push = (s) => {
    s = s.replace(/\s{2,}/g, ' ').replace(/\(\s*\)|\[\s*\]/g, '').trim();
    if (s && s !== title && !out.includes(s)) out.push(s);
  };
  let t = title;

  // "Canción - Remastered 2011" -> "Canción"
  const dash = /\s+[-–—]\s+(remaster(ed)?|remasterizad[oa]|versi[oó]n|mono|stereo|live|en vivo|edit|radio edit).*$/i;
  if (dash.test(t)) { t = t.replace(dash, ''); push(t); }

  // "(feat. X)" / "ft. X" fuera.
  const feat = /\s*[([]?\s*(feat\.?|ft\.?|featuring|con)\s+[^)\]]*[)\]]?/i;
  if (feat.test(t)) { t = t.replace(feat, ''); push(t); }

  // "(Live at NPR Music's Tiny Desk)" -> "(Tiny Desk)"
  // (y se quita el posesivo: "NPR Music's Tiny Desk" -> "Tiny Desk").
  t = t.replace(/([([])\s*(live at|live from|live in|en vivo en|en directo en|en vivo desde)\s+/gi, '$1');
  t = t.replace(/([([])[^)\]]*?['’]s\s+/g, '$1');
  push(t);

  // "(Fred Remix)" -> "(Remix)"
  push(t.replace(/([([])[^)\]]*\s(\S+)([)\]])/g, '$1$2$3'));

  // Sin paréntesis.
  const noParens = t.replace(/\s*[([][^)\]]*[)\]]/g, '');
  push(noParens);

  // Recortes por palabras con "…".
  const words = noParens.split(/\s+/);
  for (let n = words.length - 1; n >= 1; n -= 1) push(`${words.slice(0, n).join(' ').replace(/[\s/,;:·&+-]+$/, '')}…`);
  return out;
}

/** 4 -> "IV" (minúsculas con lower = true). */
export function toRoman(n, lower = false) {
  const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of table) {
    while (n >= v) { out += s; n -= v; }
  }
  return lower ? out.toLowerCase() : out;
}
