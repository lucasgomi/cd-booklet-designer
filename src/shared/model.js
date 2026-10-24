// Modelo del proyecto. El estado es JSON puro (sin imágenes): las imágenes
// viven en `assets` (id -> data URL) para que el historial de deshacer y
// las copias sean ligeras.
import { TEMPLATES, getTemplate } from './templates/index.js';
import { newId } from './tracklist.js';
import { totalSeconds, formatTotal } from './time.js';

export const FILE_FORMAT = 'cdbook';
export const FILE_VERSION = 1;

export const PANEL_MM = 120;

export const GROUP_PALETTE = [
  '#2A4E8F', '#E2766B', '#3E8E6A', '#B4572E', '#7A4DA8', '#C79A1E', '#2B8C9E', '#B23A6B',
];

export function defaultState() {
  const tpl = TEMPLATES[0];
  return {
    disc: {
      artist: '',
      title: '',
      discNumber: '',
      date: '',
      show: { artist: true, title: true, discNumber: true, date: false },
      totalFormat: 'h-min',
    },
    tracks: [],
    groups: {},               // nombre -> color
    colorByGroup: false,
    templateId: tpl.id,
    styles: { [tpl.id]: { ...tpl.defaults } }, // ajustes por plantilla
    images: {
      background: null,       // id de asset
      cover: null,
      stickers: [],           // { id, asset, x, y, w, rot, shadow, flip }
    },
    booklet: { enabled: false, coverSide: 'right' },
    customFonts: [],          // familias de Google Fonts cargadas en línea
  };
}

/** Rellena con valores por defecto lo que falte (proyectos antiguos). */
export function normalizeState(state) {
  const base = defaultState();
  const s = { ...base, ...state };
  s.disc = { ...base.disc, ...state.disc, show: { ...base.disc.show, ...(state.disc?.show || {}) } };
  s.images = { ...base.images, ...state.images };
  s.booklet = { ...base.booklet, ...state.booklet };
  s.styles = { ...(state.styles || {}) };
  if (!getTemplate(s.templateId)) s.templateId = base.templateId;
  for (const tpl of TEMPLATES) {
    if (s.styles[tpl.id]) s.styles[tpl.id] = { ...tpl.defaults, ...s.styles[tpl.id] };
  }
  if (!s.styles[s.templateId]) s.styles[s.templateId] = { ...getTemplate(s.templateId).defaults };
  s.tracks = (s.tracks || []).map((t) => ({ id: t.id || newId('t'), title: '', shortTitle: '', duration: null, group: '', ...t }));
  return s;
}

export function currentStyle(state) {
  const tpl = getTemplate(state.templateId);
  return { ...tpl.defaults, ...(state.styles[state.templateId] || {}) };
}

/** Valores para los placeholders {artista}, {titulo}... respetando los interruptores. */
export function placeholderValues(state, style = {}) {
  const d = state.disc;
  const total = totalSeconds(state.tracks);
  return {
    artista: d.show.artist ? d.artist : '',
    titulo: d.show.title ? d.title : '',
    disco: d.show.discNumber ? d.discNumber : '',
    fecha: d.show.date ? d.date : '',
    pistas: String(state.tracks.length),
    total: formatTotal(total, style.totalFormat || d.totalFormat),
  };
}

export function groupColor(state, group, i = 0) {
  return state.groups[group] || GROUP_PALETTE[i % GROUP_PALETTE.length];
}

/** Asegura que cada grupo usado tenga color. Devuelve true si cambió algo. */
export function syncGroups(state) {
  let changed = false;
  const used = [...new Set(state.tracks.map((t) => t.group.trim()).filter(Boolean))];
  used.forEach((g) => {
    if (!state.groups[g]) {
      const taken = new Set(Object.values(state.groups));
      state.groups[g] = GROUP_PALETTE.find((c) => !taken.has(c)) || GROUP_PALETTE[Object.keys(state.groups).length % GROUP_PALETTE.length];
      changed = true;
    }
  });
  return changed;
}

/** Ancho total de la hoja en mm. */
export function sheetWidth(state) {
  return state.booklet.enabled ? PANEL_MM * 2 : PANEL_MM;
}
