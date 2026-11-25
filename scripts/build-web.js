// Monta la versión web en dist-web/ para GitHub Pages: los mismos archivos de
// la interfaz, con src/web/api.js haciendo de puente en lugar de Electron.
//   npm run build:web   (después de npm install, que prepara src/vendor)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const out = path.join(root, 'dist-web');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
if (process.env.WEB_VERSION) pkg.version = process.env.WEB_VERSION.replace(/^v/, '');

if (!fs.existsSync(path.join(src, 'vendor', 'fonts.js'))) {
  console.error('Falta src/vendor: ejecuta antes «npm install» (o node scripts/prepare-vendor.js).');
  process.exit(1);
}
fs.rmSync(out, { recursive: true, force: true });
for (const dir of ['renderer', 'shared', 'print', 'vendor', 'web']) {
  fs.cpSync(path.join(src, dir), path.join(out, dir), { recursive: true, filter: (f) => !f.endsWith('.map') });
}
fs.writeFileSync(path.join(out, 'web', 'build-info.js'), `export const VERSION = ${JSON.stringify(`${pkg.version} (web)`)};\n`);
fs.copyFileSync(path.join(root, 'build', 'icon.png'), path.join(out, 'icon.png'));
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="0; url=renderer/index.html">
  <link rel="icon" href="icon.png">
  <title>CD Booklet Designer</title>
</head>
<body><a href="renderer/index.html">Abrir CD Booklet Designer</a></body>
</html>
`);
fs.writeFileSync(path.join(out, '.nojekyll'), '');
console.log(`Web lista en ${path.relative(root, out)}/ (versión ${pkg.version})`);
