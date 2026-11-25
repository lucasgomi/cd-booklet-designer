// Catálogo de tipografías: las incluidas en la app (sin conexión) y las que
// se descargan al elegirlas de Google Fonts, Fontshare o Fontsource.
import { BUNDLED_FONTS } from '../vendor/fonts.js';
import { GOOGLE_FONTS_RAW } from './google-fonts.js';

export { BUNDLED_FONTS };

export const FONT_CATEGORIES = [
  { id: 'sans', label: 'Sin serifa' },
  { id: 'serif', label: 'Con serifa' },
  { id: 'display', label: 'Display' },
  { id: 'hand', label: 'Manuscritas' },
  { id: 'mono', label: 'Monoespaciadas' },
];
export const FONT_TAGS = [
  { id: 'gotica', label: 'Góticas' },
  { id: 'graffiti', label: 'Grafiti / rotulador' },
  { id: 'retro', label: 'Retro' },
  { id: 'pixel', label: 'Píxel' },
  { id: 'futurista', label: 'Futuristas' },
  { id: 'terror', label: 'Terror' },
  { id: 'caligrafia', label: 'Caligrafía' },
  { id: 'elegante', label: 'Elegantes' },
  { id: 'condensada', label: 'Condensadas' },
  { id: 'maquina', label: 'Máquina de escribir' },
];

let googleCache = null;
/** Catálogo completo: Google Fonts + las incluidas (marcadas como sin conexión). */
export function googleCatalog() {
  if (googleCache) return googleCache;
  const bundled = new Map(BUNDLED_FONTS.map((f) => [f.family, f]));
  const list = GOOGLE_FONTS_RAW.map(([family, cat, weights, italic, rank, tags, year, src = 'g', id = '', license = 'OFL']) => ({
    family, cat, weights: weights.split(',').map(Number), italic: !!italic, rank, tags: tags ? tags.split(',') : [], year: Number(year) || 0,
    src, id, license, offline: bundled.has(family),
  }));
  const known = new Set(list.map((f) => f.family));
  for (const f of BUNDLED_FONTS) {
    if (!known.has(f.family)) list.push({ family: f.family, cat: 'display', weights: f.weights, italic: f.italic, rank: 9999, tags: [], year: 0, src: 'g', id: '', license: 'OFL', offline: true });
  }
  googleCache = list;
  return list;
}

export const FONT_SOURCES = [
  { id: 'g', label: 'Google Fonts', url: 'https://fonts.google.com' },
  { id: 'fs', label: 'Fontshare', url: 'https://www.fontshare.com' },
  { id: 'so', label: 'Fontsource', url: 'https://fontsource.org' },
];

/** Datos de una familia del catálogo (o null si no está: se trata como de Google). */
export function fontInfo(family) {
  return googleCatalog().find((f) => f.family === family) || null;
}

/** Hojas de estilo de una familia según su origen. */
function fontCssUrls(family, onlyWeight = null) {
  const f = fontInfo(family);
  const weights = onlyWeight ? [onlyWeight] : (f?.weights || [400, 700]);
  if (f?.src === 'fs') return [`https://api.fontshare.com/v2/css?f[]=${f.id}@${weights.join(',')}&display=block`];
  if (f?.src === 'so') {
    const base = `https://cdn.jsdelivr.net/fontsource/css/${f.id}@latest`;
    return weights.flatMap((w) => [`${base}/${w}.css`, ...(f.italic && !onlyWeight ? [`${base}/${w}-italic.css`] : [])]);
  }
  return [onlyWeight
    ? `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family).replace(/%20/g, '+')}:wght@${onlyWeight}&display=block`
    : googleFontsUrl(family)];
}

/**
 * CSS de una familia con las direcciones de los archivos absolutas (Fontshare
 * las da como «//cdn…», que en la app de escritorio apuntaría a file://).
 */
export async function fetchFontCss(family, onlyWeight = null) {
  const parts = await Promise.all(fontCssUrls(family, onlyWeight).map(async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${r.status} ${url}`);
    const text = await r.text();
    return text.replace(/url\((['"]?)([^)'"]+)\1\)/g, (_, q, u) => `url('${u.startsWith('//') ? `https:${u}` : new URL(u, url).href}')`);
  }));
  return parts.join('\n');
}

export function isBundled(family) {
  return BUNDLED_FONTS.some((f) => f.family === family);
}

/** Añade la familia al proyecto si hay que descargarla (devuelve la lista nueva). */
export function withCustomFont(customFonts = [], family) {
  if (!family || isBundled(family) || customFonts.includes(family)) return customFonts;
  return [...customFonts, family];
}

// Vistas previas del selector: sólo las letras del texto de muestra, con un
// nombre de familia propio para no mezclarse con la fuente completa.
const previews = new Map();
export function previewFamily(family) {
  return `cdbpv ${family}`;
}
export function loadPreviewFont(font, text) {
  const key = `${font.family}\u0000${text}`;
  if (previews.has(key)) return previews.get(key);
  const weight = font.weights.includes(400) ? 400 : font.weights[0] || 400;
  const chars = [...new Set(`${text}${font.family}`)].join('');
  // Google permite pedir sólo las letras de la muestra; los demás, el grosor entero.
  const css = font.src && font.src !== 'g'
    ? fetchFontCss(font.family, weight)
    : fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family).replace(/%20/g, '+')}:wght@${weight}&text=${encodeURIComponent(chars)}&display=block`)
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status))));
  const job = css.then(async (css) => {
    const style = document.createElement('style');
    style.textContent = css.replace(/font-family:\s*'[^']+'/g, `font-family: '${previewFamily(font.family)}'`).replace(/font-weight:\s*\d+/g, 'font-weight: 400');
    document.head.appendChild(style);
    await document.fonts.load(`400 20px '${previewFamily(font.family)}'`, chars).catch(() => null);
    return true;
  }).catch(() => { previews.delete(key); return false; });
  previews.set(key, job);
  return job;
}

const loaded = new Set();

export function googleFontsUrl(family) {
  // La API v1 tolera pesos inexistentes, así pedimos todos (y sus cursivas).
  const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900].flatMap((w) => [w, `${w}i`]).join(',');
  return `https://fonts.googleapis.com/css?family=${encodeURIComponent(family).replace(/%20/g, '+')}:${weights}&display=block`;
}

/** Descarga las familias (Google Fonts, Fontshare o Fontsource) y espera a que carguen. */
export async function loadCustomFonts(families = []) {
  const jobs = [];
  for (const family of families) {
    if (loaded.has(family)) continue;
    loaded.add(family);
    jobs.push(fetchFontCss(family).then((css) => {
      const style = document.createElement('style');
      style.dataset.font = family;
      style.textContent = css;
      document.head.appendChild(style);
      return true;
    }).catch(() => { loaded.delete(family); return false; }));
  }
  const results = await Promise.all(jobs);
  // Fuerza la descarga de los archivos de fuente usados.
  await Promise.all(families.flatMap((f) => [400, 700].map((w) => document.fonts.load(`${w} 12px '${f}'`).catch(() => null))));
  return results.every(Boolean);
}

export function fontCatalog(customFonts = []) {
  const google = new Map(googleCatalog().map((f) => [f.family, f]));
  return [
    ...BUNDLED_FONTS,
    ...customFonts.filter((family) => !isBundled(family)).map((family) => ({
      family, category: 'Google Fonts (en línea)', weights: google.get(family)?.weights || [100, 200, 300, 400, 500, 600, 700, 800, 900],
    })),
  ];
}

/** Grosores disponibles de una familia (incluida, de Google o desconocida). */
export function fontWeights(family) {
  return BUNDLED_FONTS.find((f) => f.family === family)?.weights
    || googleCatalog().find((f) => f.family === family)?.weights
    || [400, 700];
}
