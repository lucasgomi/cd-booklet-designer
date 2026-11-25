// Pestaña «Canciones»: lista editable, pegar texto, importar .cue, grupos.
import { store, commit, addAsset } from '../store.js';
import { h, section, button, toggle, colorInput, toast } from '../ui.js';
import { parseDuration, formatDuration, totalSeconds, formatTotal, CD_LIMIT_SECONDS } from '../../shared/time.js';
import { parsePastedText, parseCue, cueToTracks, makeTrack, titlesFromFilenames, newId, TITLE_TOOLS, tracksToText } from '../../shared/tracklist.js';
import { syncGroups } from '../../shared/model.js';
import { readAudioTags } from '../../shared/audio-tags.js';


let summaryEl = null;
let sortable = null;

function summaryContent() {
  const { tracks, disc } = store.state;
  const total = totalSeconds(tracks);
  const missing = tracks.filter((t) => t.duration == null).length;
  const over = total > CD_LIMIT_SECONDS;
  return [
    h('span', { text: `${tracks.length} pistas` }),
    h('span', { class: over ? 'bad' : '', text: `Total ${formatTotal(total, 'mmss')} (${formatTotal(total, disc.totalFormat)})` }),
    over ? h('span', { class: 'bad', text: '⚠ Supera los 80 min de un CD' }) : null,
    missing ? h('span', { class: 'warn', text: `${missing} sin duración` }) : null,
  ];
}

export function updateTracksSummary() {
  summaryEl?.replaceChildren(...summaryContent().filter(Boolean));
}

function trackRow(t, i) {
  const dur = h('input', { type: 'text', class: 'dur', value: formatDuration(t.duration, 'm:ss'), placeholder: 'm:ss', spellcheck: false });
  dur.addEventListener('input', () => {
    const v = dur.value.trim();
    const sec = parseDuration(v);
    dur.classList.toggle('invalid', !!v && sec == null);
    if (!v || sec != null) commit((s) => { s.tracks[i].duration = v ? sec : null; }, { key: `dur.${t.id}` });
  });
  dur.addEventListener('blur', () => { if (!dur.classList.contains('invalid')) dur.value = formatDuration(store.state.tracks[i]?.duration, 'm:ss'); });

  const title = h('input', { type: 'text', class: 'title', value: t.title, placeholder: 'Título' });
  title.addEventListener('input', () => commit((s) => { s.tracks[i].title = title.value; }, { key: `title.${t.id}` }));
  const short = h('input', { type: 'text', class: 'short', value: t.shortTitle, placeholder: 'Versión abreviada (opcional)' });
  short.addEventListener('input', () => commit((s) => { s.tracks[i].shortTitle = short.value; }, { key: `short.${t.id}` }));
  const group = h('input', { type: 'text', class: 'group', value: t.group, placeholder: 'Grupo', list: 'group-list' });
  group.addEventListener('input', () => commit((s) => { s.tracks[i].group = group.value; }, { key: `group.${t.id}` }));
  group.addEventListener('change', () => commit((s) => { syncGroups(s); }, { rebuild: 'groups' }));

  const swatch = t.group && store.state.groups[t.group.trim()]
    ? h('span', { class: 'swatch', style: { background: store.state.groups[t.group.trim()] } }) : null;

  return h('div', { class: 'track-row', 'data-id': t.id },
    h('span', { class: 'drag', title: 'Arrastra para reordenar', text: '⋮⋮' }),
    h('span', { class: 'num', text: String(i + 1) }),
    h('div', { class: 'titles' }, title, short),
    dur,
    h('div', { class: 'group-cell' }, swatch, group),
    button('✕', () => commit((s) => { s.tracks.splice(i, 1); }, { rebuild: 'tracks' }), { class: 'icon danger', title: 'Borrar canción' }));
}

function groupsSection() {
  const { state } = store;
  const used = [...new Set(state.tracks.map((t) => t.group.trim()).filter(Boolean))];
  return section('Grupos (colores de los números)',
    toggle(state.colorByGroup, (v) => commit((s) => { s.colorByGroup = v; syncGroups(s); }, { rebuild: 'groups' }), 'Colorear los números según el grupo'),
    h('p', { class: 'help', text: 'Escribe un grupo en cada canción (por ejemplo, el álbum de origen) y elige un color para cada grupo.' }),
    used.length
      ? h('div', { class: 'group-list' }, ...used.map((g) => h('div', { class: 'group-item' },
        h('span', { text: g }),
        colorInput(state.groups[g] || '#888888', (v) => commit((s) => { s.groups[g] = v; }, { key: `gcolor.${g}` })))))
      : h('p', { class: 'muted', text: 'Todavía no hay grupos.' }));
}

export function renderTracksPanel(root, { openPaste }) {
  const { state } = store;
  sortable?.destroy();
  root.replaceChildren();

  summaryEl = h('div', { class: 'summary' }, ...summaryContent());
  const list = h('div', { class: 'track-list' }, ...state.tracks.map(trackRow));
  const datalist = h('datalist', { id: 'group-list' },
    ...Object.keys(state.groups).map((g) => h('option', { value: g })));

  root.appendChild(section('Lista de canciones',
    h('div', { class: 'toolbar' },
      button('+ Añadir', () => {
        commit((s) => { s.tracks.push(makeTrack()); }, { rebuild: 'tracks' });
        const inputs = root.querySelectorAll('.track-row .title');
        inputs[inputs.length - 1]?.focus();
      }),
      button('Pegar lista…', openPaste),
      button('Importar .cue…', importCue),
      button('Añadir audios…', pickAudioFiles, { title: 'Elige tus archivos de audio (wav, mp3, flac, m4a, ogg…): se crea la lista con sus duraciones' }),
      toolsMenu(),
      button('Vaciar', () => {
        if (state.tracks.length && confirm('¿Borrar todas las canciones?')) commit((s) => { s.tracks = []; }, { rebuild: 'tracks' });
      }, { class: 'danger' })),
    summaryEl,
    state.tracks.length
      ? h('div', { class: 'track-head' }, h('span'), h('span', { text: 'Nº' }), h('span', { text: 'Título' }), h('span', { text: 'Duración' }), h('span', { text: 'Grupo' }), h('span'))
      : h('p', { class: 'empty', text: 'Añade canciones, pega una lista o importa un .cue.' }),
    list, datalist));
  root.appendChild(groupsSection());

  sortable = window.Sortable.create(list, {
    handle: '.drag',
    animation: 140,
    onEnd: (e) => {
      if (e.oldIndex === e.newIndex) return;
      commit((s) => {
        const [moved] = s.tracks.splice(e.oldIndex, 1);
        s.tracks.splice(e.newIndex, 0, moved);
      }, { rebuild: 'tracks' });
    },
  });
}

/** Desplegable con herramientas para toda la lista. */
function toolsMenu() {
  const actions = [
    { value: 'title', label: 'Títulos en «Tipo Título»' },
    { value: 'upper', label: 'TÍTULOS EN MAYÚSCULAS' },
    { value: 'lower', label: 'títulos en minúsculas' },
    { value: 'noFeat', label: 'Quitar «feat.» y colaboraciones' },
    { value: 'noParens', label: 'Quitar lo que va entre paréntesis' },
    { value: 'noNumbers', label: 'Quitar números del principio' },
    { value: 'sort', label: 'Ordenar de la A a la Z' },
    { value: 'reverse', label: 'Invertir el orden' },
    { value: 'shuffle', label: 'Mezclar (orden aleatorio)' },
    { value: 'dedupe', label: 'Quitar canciones repetidas' },
    { value: 'copy', label: 'Copiar la lista como texto' },
  ];
  const sel = h('select', { class: 'tools-menu', title: 'Herramientas para toda la lista' },
    h('option', { value: '', text: 'Herramientas…' }), ...actions.map((a) => h('option', { value: a.value, text: a.label })));
  sel.addEventListener('change', async () => {
    const k = sel.value;
    sel.value = '';
    if (!k || !store.state.tracks.length) return;
    if (k === 'copy') {
      const text = tracksToText(store.state.tracks, (d) => formatDuration(d, 'm:ss'));
      try { await navigator.clipboard.writeText(text); toast('Lista copiada: pégala donde quieras.', 'ok'); } catch { toast('No se pudo copiar al portapapeles.', 'bad'); }
      return;
    }
    commit((s) => {
      if (TITLE_TOOLS[k]) {
        // También la versión abreviada, si la hay.
        for (const t of s.tracks) { t.title = TITLE_TOOLS[k](t.title); if (t.shortTitle) t.shortTitle = TITLE_TOOLS[k](t.shortTitle); }
      } else if (k === 'sort') s.tracks.sort((a, b) => a.title.localeCompare(b.title, 'es', { numeric: true }));
      else if (k === 'reverse') s.tracks.reverse();
      else if (k === 'shuffle') {
        for (let i = s.tracks.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [s.tracks[i], s.tracks[j]] = [s.tracks[j], s.tracks[i]]; }
      } else if (k === 'dedupe') {
        const seen = new Set();
        s.tracks = s.tracks.filter((t) => { const key = t.title.trim().toLowerCase(); if (seen.has(key)) return false; seen.add(key); return true; });
      }
    }, { rebuild: 'tracks' });
    toast(`${actions.find((a) => a.value === k).label}: hecho (Ctrl+Z para deshacer).`, 'ok');
  });
  return sel;
}

function pickAudioFiles() {
  const input = h('input', { type: 'file', accept: 'audio/*,.wav,.mp3,.flac,.m4a,.aac,.ogg,.opus,.aiff,.aif', multiple: true });
  input.addEventListener('change', () => importAudioFiles([...input.files]));
  input.click();
}

/** Duración de un archivo de audio (en segundos) leyendo sus metadatos. */
function audioDuration(file) {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    const done = (v) => { URL.revokeObjectURL(url); resolve(v); };
    audio.preload = 'metadata';
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
    audio.onerror = () => done(null);
    setTimeout(() => done(null), 15000);
    audio.src = url;
  });
}

/** Lee una parte de un archivo (para las etiquetas, sin cargarlo entero). */
const fileReader = (file) => async (offset, length) => new Uint8Array(await file.slice(offset, offset + length).arrayBuffer());

const toDataUrl = (blob) => new Promise((resolve) => { const r = new FileReader(); r.onload = () => resolve(r.result); r.readAsDataURL(blob); });

/**
 * Crea canciones a partir de archivos de audio. Usa sus etiquetas (título,
 * artista, álbum, año, número de pista y carátula) y, si no tienen, el nombre
 * del archivo. La duración se lee del propio audio.
 */
export async function importAudioFiles(files) {
  const audios = files.filter((f) => f.type.startsWith('audio/') || /\.(wav|mp3|flac|m4a|aac|ogg|opus|aiff?)$/i.test(f.name));
  if (!audios.length) return;
  toast(`Leyendo ${audios.length} archivo${audios.length === 1 ? '' : 's'} de audio…`, 'info', 20000);
  const byName = new Map(audios.map((f) => [f.name, f]));
  const fromNames = new Map(titlesFromFilenames(audios.map((f) => f.name)).map((i, k) => [i.name, { ...i, order: k }]));
  const items = await Promise.all(audios.map(async (f) => ({
    file: f, guess: fromNames.get(f.name), tags: await readAudioTags(fileReader(f), f.size), duration: await audioDuration(f),
  })));
  // Orden: número de pista de las etiquetas (si lo tienen todas) o el de los nombres.
  const tagged = items.every((i) => i.tags.track);
  items.sort((a, b) => (tagged ? a.tags.track - b.tags.track : a.guess.order - b.guess.order));
  const tracks = items.map((i) => makeTrack(i.tags.title || i.guess.title, i.duration));
  const missing = items.filter((i) => i.duration == null).length;

  // Datos del disco: los que comparten todas las canciones, si el disco está vacío.
  const common = (pick) => { const v = items.map(pick).filter(Boolean); return v.length === items.length && v.every((x) => x === v[0]) ? v[0] : ''; };
  const artist = common((i) => i.tags.albumArtist) || common((i) => i.tags.artist);
  const album = common((i) => i.tags.album);
  const year = common((i) => i.tags.year);
  const picture = items.find((i) => i.tags.picture)?.tags.picture;
  let coverId = null;
  if (picture && !store.state.images.cover) {
    coverId = newId('img');
    addAsset(coverId, await toDataUrl(new Blob([picture.data], { type: picture.mime })));
  }

  const replace = !store.state.tracks.length || confirm(`${tracks.length} canciones leídas. ¿Sustituir la lista actual?\n(Cancelar = añadirlas al final)`);
  const filled = [];
  commit((s) => {
    s.tracks = replace ? tracks : [...s.tracks, ...tracks];
    if (artist && (!s.disc.artist || replace)) { s.disc.artist = artist; filled.push('artista'); }
    if (album && (!s.disc.title || replace)) { s.disc.title = album; filled.push('título del disco'); }
    if (year && !s.disc.date) { s.disc.date = year; filled.push('fecha'); }
    if (coverId) { s.images.cover = coverId; filled.push('portada (de la carátula)'); }
  }, { rebuild: true });
  const fromTags = items.filter((i) => i.tags.title).length;
  toast([
    `${tracks.length} canciones añadidas con su duración.`,
    fromTags ? `${fromTags} con el título de sus etiquetas.` : 'Títulos sacados del nombre del archivo: revísalos por si sobra algo.',
    filled.length ? `También: ${filled.join(', ')}.` : '',
    missing ? `${missing} sin duración (formato que este navegador no lee): complétala a mano.` : '',
  ].filter(Boolean).join(' '), missing ? 'warn' : 'ok', 9000);
}

async function importCue() {
  const res = await window.api.openCue();
  if (res) importCueResult(res);
}

/** Importa un .cue ya leído (desde el diálogo o soltado en la ventana). */
export function importCueResult(res) {
  const cue = parseCue(res.text);
  const { disc, tracks, missing } = cueToTracks(cue, res.durations);
  if (!tracks.length) { toast('El .cue no contiene pistas.', 'bad'); return; }
  const replace = !store.state.tracks.length || confirm(`Se han encontrado ${tracks.length} pistas. ¿Sustituir la lista actual?\n(Cancelar = añadirlas al final)`);
  commit((s) => {
    s.tracks = replace ? tracks : [...s.tracks, ...tracks];
    if (disc.artist && !s.disc.artist) s.disc.artist = disc.artist;
    if (disc.title && !s.disc.title) s.disc.title = disc.title;
    if (disc.date && !s.disc.date) s.disc.date = disc.date;
    syncGroups(s);
  }, { rebuild: true });
  toast(missing
    ? `Importadas ${tracks.length} pistas. ${missing} sin duración (no se encontró el audio para calcularla): complétala a mano.`
    : `Importadas ${tracks.length} pistas desde el .cue.`, missing ? 'warn' : 'ok', 6000);
}

/** Diálogo de pegar texto. */
export function setupPasteDialog() {
  const dlg = document.getElementById('dlg-paste');
  const text = document.getElementById('paste-text');
  const preview = document.getElementById('paste-preview');
  const update = () => {
    const tracks = parsePastedText(text.value);
    const total = totalSeconds(tracks);
    const missing = tracks.filter((t) => t.duration == null).length;
    preview.textContent = tracks.length
      ? `${tracks.length} canciones · ${formatTotal(total, 'mmss')}${missing ? ` · ${missing} sin duración` : ''}`
      : '';
  };
  text.addEventListener('input', update);
  dlg.addEventListener('close', () => {
    if (dlg.returnValue !== 'ok') return;
    const tracks = parsePastedText(text.value);
    if (!tracks.length) return;
    const replace = document.getElementById('paste-replace').checked;
    commit((s) => { s.tracks = replace ? tracks : [...s.tracks, ...tracks]; }, { rebuild: true });
    toast(`${tracks.length} canciones añadidas.`, 'ok');
  });
  return () => {
    text.value = '';
    preview.textContent = '';
    dlg.returnValue = '';
    dlg.showModal();
    text.focus();
  };
}
