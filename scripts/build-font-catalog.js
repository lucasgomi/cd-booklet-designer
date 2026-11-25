// Genera src/shared/google-fonts.js: el catálogo de tipografías libres para
// el selector (familia, tipo, grosores, cursiva, popularidad, origen y licencia).
// Orígenes:
//   - Google Fonts (https://fonts.google.com/metadata/fonts)
//   - Fontshare, de Indian Type Foundry (https://api.fontshare.com/v2/fonts)
//   - Fontsource: las libres que no están en Google (https://api.fontsource.org/v1/fonts)
//   node scripts/build-font-catalog.js [google-metadata.json [fontsource.json [fontshare.json]]]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src', 'shared', 'google-fonts.js');

const CATEGORY = { 'Sans Serif': 'sans', Serif: 'serif', Display: 'display', Handwriting: 'hand', Monospace: 'mono' };

// Estilos que Google no clasifica: listas a mano + patrones en el nombre.
const TAGS = {
  gotica: { re: /fraktur|gotisch|blackletter|jacquard|pirata|new rocker|texturina|grenze|metal mania|almendra display|germania/i,
    names: ['UnifrakturMaguntia', 'UnifrakturCook', 'Pirata One', 'Grenze Gotisch', 'New Rocker', 'Texturina', 'Jacquard 12', 'Jacquard 24', 'Jacquarda Bastarda 9', 'Metal Mania', 'Germania One', 'Almendra Display', 'Fruktur', 'Eagle Lake', 'MedievalSharp', 'IM Fell English SC', 'Cinzel Decorative'] },
  pixel: { re: /pixel|press start|vt323|silkscreen|micro 5|tiny5|jersey|handjet|bytesized|sixtyfour|workbench|doto|pixelify|dotgothic|bitcount/i, names: ['VT323', 'Press Start 2P', 'Silkscreen', 'DotGothic16', 'Pixelify Sans'] },
  graffiti: { re: /spray|graffiti|marker|sedgwick|rock salt|wallpoet|bangers|rubik dirt|rubik wet|kablammo/i,
    names: ['Permanent Marker', 'Sedgwick Ave', 'Sedgwick Ave Display', 'Rock Salt', 'Rubik Spray Paint', 'Rubik Wet Paint', 'Rubik Dirt', 'Bangers', 'Wallpoet', 'Gochi Hand', 'Marck Script', 'Kablammo', 'Finger Paint', 'Knewave', 'Lacquer'] },
  terror: { re: /creep|nosifer|butcher|eater|horror|zombie|frijole|griffy|ghost|spooky/i,
    names: ['Creepster', 'Nosifer', 'Butcherman', 'Eater', 'Frijole', 'Griffy', 'Rubik Glitch', 'Jolly Lodger', 'Henny Penny', 'Metal Mania', 'Mystery Quest', 'Ewert', 'Freckle Face', 'Nova Square'] },
  retro: { re: /monoton|righteous|shrikhand|bungee|lobster|bowlby|ultra|alfa slab|bagel|fascinate|limelight|rampart|climate crisis|syne mono|honk|nabla|tilt|bungee shade/i,
    names: ['Monoton', 'Righteous', 'Shrikhand', 'Lobster', 'Bowlby One', 'Bowlby One SC', 'Ultra', 'Alfa Slab One', 'Bagel Fat One', 'Fascinate', 'Limelight', 'Rampart One', 'Climate Crisis', 'Honk', 'Nabla', 'Bungee', 'Bungee Shade', 'Bungee Inline', 'Cherry Cream Soda', 'Coiny', 'Chicle', 'Fugaz One', 'Racing Sans One', 'Titan One', 'Rubik Mono One', 'Poiret One', 'Abril Fatface', 'Cooper Hewitt', 'Gloock', 'Yeseva One', 'Sansita Swashed', 'Gluten', 'Grandstander', 'Lilita One', 'Chango', 'Holtwood One SC'] },
  futurista: { re: /orbitron|audiowide|zen dots|michroma|quantico|chakra|exo|aldrich|syncopate|major mono|tektur|oxanium|share tech|electrolize|krona|unbounded|space grotesk|turret road|goldman|iceland/i, names: [] },
  caligrafia: { re: /script|vibes|pinyon|parisienne|allura|tangerine|italianno|alex brush|dancing|great|petit formal|rouge|monsieur|mrs|herr von|lovers quarrel|ballet|whisper|corinthia|birthstone|imperial/i, names: [] },
  maquina: { re: /typewriter|special elite|courier|cutive|courier prime|kosugi/i, names: ['Special Elite', 'Courier Prime', 'Cutive Mono', 'Cutive', 'Anonymous Pro', 'Xanh Mono'] },
  condensada: { re: /condensed|narrow|compressed|anton|bebas|oswald|league gothic|fjalla|six caps|teko|big shoulders|saira extra|barlow condensed|antonio|smooch sans/i, names: [] },
  elegante: { re: /didone|bodoni|playfair|cormorant|cinzel|italiana|marcellus|gloock|instrument serif|dm serif|prata|forum|bellefair|gilda|abhaya|rozha|yeseva|libre caslon|eb garamond|young serif|fraunces|bodoni moda/i, names: [] },
};

const LICENSES = { 'OFL-1.1': 'OFL', 'Apache-2.0': 'Apache', 'UFL-1.0': 'UFL', mit: 'MIT', 'CC0-1.0': 'CC0', Unlicense: 'Unlicense', itf_ffl: 'ITF FFL', sil_ofl: 'OFL' };
// De Fontsource sólo lo útil para portadas (fuera fuentes de iconos, CJK, etc.).
const SKIP = /^(Fusion |Genjyuu|LXGW|YakuHan|Unifont|Bravura|DSEG Weather|DejaVu Math|Syne Italic|Noto Mono)/;
const FS_CATEGORY = { 'sans-serif': 'sans', serif: 'serif', display: 'display', handwriting: 'hand', monospace: 'mono', other: 'display' };
const SHARE_CATEGORY = (c) => (/script|handwrit/i.test(c) ? 'hand' : /display|blackletter/i.test(c) ? 'display' : /serif|slab/i.test(c) && !/sans/i.test(c) ? 'serif' : 'sans');

const load = async (file, url) => JSON.parse(file ? fs.readFileSync(file, 'utf8') : (await (await fetch(url)).text()).replace(/^\)\]\}'/, ''));
const tagsFor = (family, cat) => {
  const tags = Object.entries(TAGS).filter(([, t]) => t.names.includes(family) || t.re.test(family)).map(([k]) => k);
  if (tags.includes('caligrafia') && cat !== 'hand') tags.splice(tags.indexOf('caligrafia'), 1);
  return tags;
};

async function main() {
  const [gFile, fsFile, shareFile] = process.argv.slice(2);
  const meta = await load(gFile, 'https://fonts.google.com/metadata/fonts');
  const fontsource = await load(fsFile, 'https://api.fontsource.org/v1/fonts');
  const share = await load(shareFile, 'https://api.fontshare.com/v2/fonts?limit=500');
  const fsLicense = new Map(fontsource.map((f) => [f.family, LICENSES[f.license] || f.license]));

  // Google Fonts (de las Noto, sólo las generales; el resto son para otros alfabetos).
  const NOTO = /^Noto (Sans|Serif)( Display| Mono)?$/;
  const google = meta.familyMetadataList
    .filter((f) => f.subsets.includes('latin') && !(f.classifications || []).includes('Symbols') && f.isOpenSource !== false)
    .filter((f) => (f.family.startsWith('Noto') ? NOTO.test(f.family) : !f.isBrandFont))
    .sort((a, b) => a.popularity - b.popularity);
  const rows = google.map((f, i) => {
    const keys = Object.keys(f.fonts);
    const weights = [...new Set(keys.map((k) => parseInt(k, 10)))].sort((a, b) => a - b);
    const cat = CATEGORY[f.category] || 'display';
    return [f.family, cat, weights.join(','), keys.some((k) => k.endsWith('i')) ? 1 : 0, i + 1, tagsFor(f.family, cat).join(','), (f.dateAdded || '').slice(0, 4), 'g', '', fsLicense.get(f.family) || 'OFL'];
  });
  const known = new Set(rows.map((r) => r[0]));

  // Fontshare: se intercalan con las populares de Google según sus visitas.
  const shareFonts = (share.fonts || share).filter((f) => !known.has(f.name) && /latin/i.test(f.script || 'latin')).sort((a, b) => (b.views || 0) - (a.views || 0));
  shareFonts.forEach((f, i) => {
    const styles = f.styles || [];
    const weights = [...new Set(styles.filter((st) => !st.is_italic && !st.is_variable).map((st) => st.weight?.weight || st.weight?.number).filter(Boolean))].sort((a, b) => a - b);
    if (!weights.length) return;
    const cat = SHARE_CATEGORY(f.category || '');
    const tags = tagsFor(f.name, cat);
    if (/blackletter/i.test(f.category) && !tags.includes('gotica')) tags.push('gotica');
    rows.push([f.name, cat, weights.join(','), styles.some((st) => st.is_italic) ? 1 : 0, (i + 1) * 9, tags.join(','), (f.inserted_at || '').slice(0, 4), 'fs', f.slug, LICENSES[f.license_type] || f.license_type]);
    known.add(f.name);
  });

  // Fontsource: las libres que no están en Google.
  for (const f of fontsource) {
    if (f.type === 'google' || known.has(f.family) || !f.subsets.includes('latin') || SKIP.test(f.family)) continue;
    const cat = FS_CATEGORY[f.category] || 'display';
    rows.push([f.family, cat, f.weights.join(','), f.styles.includes('italic') ? 1 : 0, 1500, tagsFor(f.family, cat).join(','), (f.lastModified || '').slice(0, 4), 'so', f.id, LICENSES[f.license] || f.license]);
    known.add(f.family);
  }

  const body = `// Generado por scripts/build-font-catalog.js. No editar a mano.
// [familia, tipo, grosores, cursiva, puesto en popularidad, estilos, año, origen, id, licencia]
// origen: g = Google Fonts, fs = Fontshare, so = Fontsource
export const GOOGLE_FONTS_RAW = ${JSON.stringify(rows).replace(/\],\[/g, '],\n[')};
`;
  fs.writeFileSync(out, body);
  const by = rows.reduce((m, r) => ({ ...m, [r[7]]: (m[r[7]] || 0) + 1 }), {});
  console.log(`Catálogo: ${rows.length} familias (${JSON.stringify(by)}) -> ${path.relative(root, out)} (${Math.round(body.length / 1024)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
