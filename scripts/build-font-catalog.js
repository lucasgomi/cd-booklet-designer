// Genera src/shared/google-fonts.js: el catálogo de Google Fonts (familia,
// tipo, grosores, cursiva y popularidad) para el selector de tipografías.
//   node scripts/build-font-catalog.js [metadata.json]
// Sin argumento descarga https://fonts.google.com/metadata/fonts.
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

async function main() {
  const src = process.argv[2];
  const text = src ? fs.readFileSync(src, 'utf8') : await (await fetch('https://fonts.google.com/metadata/fonts')).text();
  const meta = JSON.parse(text.replace(/^\)\]\}'/, ''));
  const list = meta.familyMetadataList
    .filter((f) => f.subsets.includes('latin') && !f.isNoto && !(f.classifications || []).includes('Symbols') && f.isOpenSource !== false && !f.isBrandFont)
    .sort((a, b) => a.popularity - b.popularity);
  const rows = list.map((f, i) => {
    const keys = Object.keys(f.fonts);
    const weights = [...new Set(keys.map((k) => parseInt(k, 10)))].sort((a, b) => a - b);
    const italic = keys.some((k) => k.endsWith('i'));
    const tags = Object.entries(TAGS).filter(([, t]) => t.names.includes(f.family) || t.re.test(f.family)).map(([k]) => k);
    if (tags.includes('caligrafia') && f.category !== 'Handwriting') tags.splice(tags.indexOf('caligrafia'), 1);
    return [f.family, CATEGORY[f.category] || 'display', weights.join(','), italic ? 1 : 0, i + 1, tags.join(','), (f.dateAdded || '').slice(0, 4)];
  });
  const body = `// Generado por scripts/build-font-catalog.js a partir de Google Fonts. No editar a mano.
// [familia, tipo, grosores, cursiva, puesto en popularidad, estilos, año]
export const GOOGLE_FONTS_RAW = ${JSON.stringify(rows).replace(/\],\[/g, '],\n[')};
`;
  fs.writeFileSync(out, body);
  console.log(`Catálogo: ${rows.length} familias -> ${path.relative(root, out)} (${Math.round(body.length / 1024)} KB)`);
}

main().catch((e) => { console.error(e); process.exit(1); });
