// Copia las librerías de terceros y las tipografías (Google Fonts vía
// @fontsource) a src/vendor para que la app funcione sin conexión.
// Se ejecuta automáticamente tras `npm install`.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nm = path.join(root, 'node_modules');
const vendor = path.join(root, 'src', 'vendor');
const fontsDir = path.join(vendor, 'fonts');

// Familia -> categoría (para agrupar en el selector).
const FONTS = {
  'inter': 'Sans',
  'roboto': 'Sans',
  'montserrat': 'Sans',
  'poppins': 'Sans',
  'oswald': 'Display',
  'bebas-neue': 'Display',
  'anton': 'Display',
  'archivo-black': 'Display',
  'fraunces': 'Serif',
  'young-serif': 'Serif',
  'playfair-display': 'Serif',
  'dm-serif-display': 'Serif',
  'abril-fatface': 'Serif',
  'lora': 'Serif',
  'space-mono': 'Mono',
  'ibm-plex-mono': 'Mono',
  'jetbrains-mono': 'Mono',
  'dm-mono': 'Mono',
  'courier-prime': 'Mono',
  'cormorant-garamond': 'Serif',
  'arimo': 'Sans',
  'caveat': 'Manuscrita',
  'great-vibes': 'Manuscrita',
  'special-elite': 'Mono',
  'poiret-one': 'Display',
  'monoton': 'Display',
  'vt323': 'Pixel',
  'press-start-2p': 'Pixel',
  'unifrakturmaguntia': 'Display',
  'pirata-one': 'Display',
  'permanent-marker': 'Manuscrita',
  'rubik-mono-one': 'Display',
};
const SUBSETS = ['latin', 'latin-ext'];

fs.rmSync(vendor, { recursive: true, force: true });
fs.mkdirSync(fontsDir, { recursive: true });

const copy = (from, to) => fs.copyFileSync(path.join(nm, from), path.join(vendor, to));
copy('jsbarcode/dist/JsBarcode.all.min.js', 'JsBarcode.all.min.js');
copy('qrcode-generator/dist/qrcode.js', 'qrcode.js');
copy('sortablejs/Sortable.min.js', 'Sortable.min.js');

let css = '';
const catalog = [];
for (const [pkg, category] of Object.entries(FONTS)) {
  const dir = path.join(nm, '@fontsource', pkg);
  if (!fs.existsSync(dir)) { console.warn('Falta la fuente', pkg); continue; }
  // Nombre real de la familia desde el CSS de fontsource.
  const indexCss = fs.readFileSync(path.join(dir, 'index.css'), 'utf8');
  const family = /font-family:\s*'([^']+)'/.exec(indexCss)[1];
  const weights = new Set();
  let italic = false;
  // Cada <peso>.css (y <peso>-italic.css) de fontsource trae un @font-face por subconjunto con su
  // unicode-range; nos quedamos con latin y latin-ext.
  const weightFiles = fs.readdirSync(dir).filter((f) => /^\d+(-italic)?\.css$/.test(f));
  for (const wf of weightFiles) {
    const text = fs.readFileSync(path.join(dir, wf), 'utf8');
    for (const block of text.split('@font-face').slice(1)) {
      const file = /url\(\.\/files\/([^)]+\.woff2)\)/.exec(block)?.[1];
      if (!file) continue;
      const m = new RegExp(`^${pkg}-(${SUBSETS.join('|')})-(\\d+)-(normal|italic)\\.woff2$`).exec(file);
      if (!m) continue;
      const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
      if (m[3] === 'italic') italic = true; else weights.add(Number(m[2]));
      fs.copyFileSync(path.join(dir, 'files', file), path.join(fontsDir, file));
      css += `@font-face {\n  font-family: '${family}';\n  font-style: ${m[3]};\n  font-display: block;\n  font-weight: ${m[2]};\n  src: url('./${file}') format('woff2');${range ? `\n  unicode-range: ${range};` : ''}\n}\n`;
    }
  }
  catalog.push({ family, category, weights: [...weights].sort((a, b) => a - b), italic });
}

fs.writeFileSync(path.join(fontsDir, 'fonts.css'), css);
fs.writeFileSync(path.join(vendor, 'fonts.js'),
  `// Generado por scripts/prepare-vendor.js\nexport const BUNDLED_FONTS = ${JSON.stringify(catalog, null, 2)};\n`);
console.log(`Vendor listo: ${catalog.length} familias tipográficas.`);
