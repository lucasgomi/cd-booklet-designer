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
  // Selección extra para portadas: sólo normal y negrita, para no engordar el instalador.
  'bungee': 'Display|400,700',
  'righteous': 'Display|400,700',
  'lobster': 'Manuscrita|400,700',
  'pacifico': 'Manuscrita|400,700',
  'bodoni-moda': 'Serif|400,700',
  'syne': 'Sans|400,700',
  'space-grotesk': 'Sans|400,700',
  'dm-sans': 'Sans|400,700',
  'instrument-serif': 'Serif|400,700',
  'unbounded': 'Display|400,700',
  'shrikhand': 'Display|400,700',
  'bricolage-grotesque': 'Sans|400,700',
  'dela-gothic-one': 'Display|400,700',
  'major-mono-display': 'Mono|400,700',
  'silkscreen': 'Pixel|400,700',
  'cinzel': 'Serif|400,700',
  'italiana': 'Serif|400,700',
  'gloock': 'Serif|400,700',
  'black-ops-one': 'Display|400,700',
  'metal-mania': 'Display|400,700',
  'creepster': 'Display|400,700',
  'rubik-glitch': 'Display|400,700',
  'sedgwick-ave-display': 'Manuscrita|400,700',
  'rock-salt': 'Manuscrita|400,700',
  'pinyon-script': 'Manuscrita|400,700',
  'bowlby-one': 'Display|400,700',
  'orbitron': 'Display|400,700',
  'audiowide': 'Display|400,700',
  'alfa-slab-one': 'Display|400,700',
  'league-gothic': 'Display|400,700',
  'grenze-gotisch': 'Display|400,700',
  'unifrakturcook': 'Display|400,700',
  'nosifer': 'Display|400,700',
  'bangers': 'Display|400,700',
  'zen-dots': 'Display|400,700',
  'climate-crisis': 'Display|400,700',
  'yeseva-one': 'Serif|400,700',
  'bagel-fat-one': 'Display|400,700',
  'titan-one': 'Display|400,700',
  'fugaz-one': 'Display|400,700',
  'playfair-display-sc': 'Serif|400,700',
};
const SUBSETS = ['latin', 'latin-ext'];

fs.rmSync(vendor, { recursive: true, force: true });
fs.mkdirSync(fontsDir, { recursive: true });

const copy = (from, to) => fs.copyFileSync(path.join(nm, from), path.join(vendor, to));
copy('jsbarcode/dist/JsBarcode.all.min.js', 'JsBarcode.all.min.js');
copy('qrcode-generator/dist/qrcode.js', 'qrcode.js');
copy('sortablejs/Sortable.min.js', 'Sortable.min.js');
copy('html-to-image/dist/html-to-image.js', 'html-to-image.js'); // PNG en la versión web

let css = '';
const catalog = [];
// Licencias de lo que va dentro de la app: las de las fuentes OFL/Apache y
// las de las bibliotecas MIT exigen acompañar su texto al redistribuirlas.
const notices = [];
const readLicense = (dir) => {
  const f = fs.readdirSync(dir).find((x) => /^(licen[sc]e|mit-license)/i.test(x));
  return f ? fs.readFileSync(path.join(dir, f), 'utf8').trim() : '';
};
for (const [pkg, spec] of Object.entries(FONTS)) {
  // 'Categoría' o 'Categoría|400,700' (sólo esos grosores, sin cursivas).
  const [category, only] = spec.split('|');
  const onlyWeights = only ? only.split(',').map(Number) : null;
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
      if (onlyWeights && (m[3] === 'italic' || !onlyWeights.includes(Number(m[2])))) continue;
      const range = /unicode-range:\s*([^;]+);/.exec(block)?.[1];
      if (m[3] === 'italic') italic = true; else weights.add(Number(m[2]));
      fs.copyFileSync(path.join(dir, 'files', file), path.join(fontsDir, file));
      css += `@font-face {\n  font-family: '${family}';\n  font-style: ${m[3]};\n  font-display: block;\n  font-weight: ${m[2]};\n  src: url('./${file}') format('woff2');${range ? `\n  unicode-range: ${range};` : ''}\n}\n`;
    }
  }
  catalog.push({ family, category, weights: [...weights].sort((a, b) => a - b), italic });
  const pkgJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  notices.push({ kind: 'font', name: family, license: pkgJson.license, url: `https://fonts.google.com/specimen/${family.replace(/ /g, '+')}`, text: readLicense(dir) });
}

const MIT = (who) => `MIT License\n\nCopyright (c) ${who}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`;
for (const lib of ['jsbarcode', 'qrcode-generator', 'sortablejs', 'html-to-image']) {
  const dir = path.join(nm, lib);
  const pkgJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  const author = typeof pkgJson.author === 'string' ? pkgJson.author : pkgJson.author?.name || lib;
  notices.push({ kind: 'lib', name: lib, license: pkgJson.license, url: `https://www.npmjs.com/package/${lib}`, text: readLicense(dir) || MIT(author) });
}
fs.writeFileSync(path.join(vendor, 'THIRD-PARTY-LICENSES.txt'),
  `Licencias de terceros incluidas en CD Booklet Designer\n${'='.repeat(54)}\n\n`
  + notices.map((n) => `${n.name} (${n.license})\n${n.url}\n${'-'.repeat(60)}\n${n.text}\n`).join('\n\n'));
// El texto completo va aparte y se carga sólo al abrir el diálogo de licencias.
fs.writeFileSync(path.join(vendor, 'licenses-text.js'),
  `// Generado por scripts/prepare-vendor.js\nexport const THIRD_PARTY_TEXT = ${JSON.stringify(fs.readFileSync(path.join(vendor, 'THIRD-PARTY-LICENSES.txt'), 'utf8'))};\n`);
fs.writeFileSync(path.join(vendor, 'licenses.js'),
  `// Generado por scripts/prepare-vendor.js\nexport const THIRD_PARTY = ${JSON.stringify(notices.map(({ text, ...n }) => n), null, 1)};\n`);

fs.writeFileSync(path.join(fontsDir, 'fonts.css'), css);
fs.writeFileSync(path.join(vendor, 'fonts.js'),
  `// Generado por scripts/prepare-vendor.js\nexport const BUNDLED_FONTS = ${JSON.stringify(catalog, null, 2)};\n`);
console.log(`Vendor listo: ${catalog.length} familias tipográficas, ${notices.length} licencias de terceros.`);
