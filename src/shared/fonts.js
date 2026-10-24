// Catálogo de tipografías: las incluidas en la app (sin conexión) y las que
// el usuario añada por nombre desde Google Fonts (requieren conexión).
import { BUNDLED_FONTS } from '../vendor/fonts.js';

export { BUNDLED_FONTS };

const loaded = new Set();

export function googleFontsUrl(family) {
  // La API v1 tolera pesos inexistentes, así pedimos todos.
  return `https://fonts.googleapis.com/css?family=${encodeURIComponent(family).replace(/%20/g, '+')}:100,200,300,400,500,600,700,800,900&display=block`;
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
  return [
    ...BUNDLED_FONTS,
    ...customFonts.map((family) => ({ family, category: 'Google Fonts (en línea)', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900] })),
  ];
}
