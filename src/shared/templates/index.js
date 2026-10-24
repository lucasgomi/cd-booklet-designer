// Registro de plantillas.
//
// Para añadir una plantilla nueva:
//   1. Crea un archivo en esta carpeta que exporte por defecto un objeto con
//      { id, name, description, defaults, presets, controls, render(ctx) }
//      (`presets` es opcional: estilos de un clic, [{ name, style }]).
//      (mira header-list.js como ejemplo; `controls` genera solo el panel
//      de ajustes de la interfaz).
//   2. Impórtalo aquí y añádelo a TEMPLATES.
import headerList from './header-list.js';
import ticket from './ticket.js';
import twoColumns from './two-columns.js';
import setlist from './setlist.js';
import lineup from './lineup.js';
import terminal from './terminal.js';
import notes from './notes.js';
import coquette from './coquette.js';
import acid from './acid.js';
import bookIndex from './book-index.js';
import playlist from './playlist.js';
import vinyl from './vinyl.js';
import cassette from './cassette.js';
import polaroid from './polaroid.js';
import y2k from './y2k.js';

// `category` (opcional) agrupa las plantillas en la interfaz.
export const TEMPLATES = [headerList, ticket, twoColumns, setlist, lineup, terminal, notes, coquette, acid, bookIndex, playlist, y2k, vinyl, cassette, polaroid];

export function templateCategories() {
  const groups = new Map();
  for (const t of TEMPLATES) {
    const c = t.category || 'Clásicas';
    if (!groups.has(c)) groups.set(c, []);
    groups.get(c).push(t);
  }
  return [...groups.entries()].map(([name, templates]) => ({ name, templates }));
}

export function getTemplate(id) {
  return TEMPLATES.find((t) => t.id === id) || null;
}
