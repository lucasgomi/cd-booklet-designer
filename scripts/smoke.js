// Lanza la app en modo de prueba automática. Deja capturas, PDF, PNG y un
// informe en ./smoke-out. En Linux sin pantalla usa xvfb-run.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electron from 'electron';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'smoke-out');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

const args = [root];
if (process.platform === 'linux') args.push('--no-sandbox', '--disable-gpu');
const needsXvfb = process.platform === 'linux' && !process.env.DISPLAY;
const cmd = needsXvfb ? 'xvfb-run' : electron;
const cmdArgs = needsXvfb ? ['-a', '-s', '-screen 0 1600x1000x24', electron, ...args] : args;

const env = { ...process.env, CDBOOK_SMOKE: out };
delete env.NODE_OPTIONS; // Electron no admite algunas opciones de Node
const res = spawnSync(cmd, cmdArgs, { env, stdio: 'inherit', timeout: 180000 });
const reportFile = path.join(out, 'report.json');
if (!fs.existsSync(reportFile)) {
  console.error('La prueba no terminó (sin informe). Código:', res.status, res.error || '');
  process.exit(1);
}
const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
const failed = report.steps.filter((s) => !s.ok);
for (const s of report.steps) console.log(`${s.ok ? '✔' : '✘'} ${s.name}${s.error ? `\n   ${s.error}` : ''}`);
if (report.errors.length) console.log('Errores de la interfaz:', report.errors);
console.log(`Salida en ${out}`);
process.exit(failed.length || report.errors.length ? 1 : 0);
