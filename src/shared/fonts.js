// Catálogo de tipografías: las incluidas en la app (sin conexión) y las que
// el usuario añada por nombre desde Google Fonts (requieren conexión).
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
  const list = GOOGLE_FONTS_RAW.map(([family, cat, weights, italic, rank, tags, year]) => ({
    family, cat, weights: weights.split(',').map(Number), italic: !!italic, rank, tags: tags ? tags.split(',') : [], year: Number(year) || 0,
    offline: bundled.has(family),
  }));
  const known = new Set(list.map((f) => f.family));
  for (const f of BUNDLED_FONTS) {
    if (!known.has(f.family)) list.push({ family: f.family, cat: 'display', weights: f.weights, italic: f.italic, rank: 9999, tags: [], year: 0, offline: true });
  }
  googleCache = list;
  return list;
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
  const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(font.family).replace(/%20/g, '+')}:wght@${weight}&text=${encodeURIComponent(chars)}&display=block`;
  const job = fetch(url).then((r) => (r.ok ? r.text() : Promise.reject(new Error(r.status)))).then(async (css) => {
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

/** Añade las hojas de estilo de Google Fonts y espera a que carguen. */
export async function loadCustomFonts(families = []) {
  const jobs = [];
  for (const family of families) {
    if (loaded.has(family)) continue;
    loaded.add(family);
    jobs.push(new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = googleFontsUrl(family);
      link.onload = () => resolve(true);
      link.onerror = () => { loaded.delete(family); link.remove(); resolve(false); };
      document.head.appendChild(link);
    }));
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
