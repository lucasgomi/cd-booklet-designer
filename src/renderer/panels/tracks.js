// Pestaña «Canciones»: lista editable, pegar texto, importar .cue, grupos.
import { store, commit } from '../store.js';
import { h, section, button, toggle, colorInput, toast } from '../ui.js';
import { parseDuration, formatDuration, totalSeconds, formatTotal, CD_LIMIT_SECONDS } from '../../shared/time.js';
import { parsePastedText, parseCue, cueToTracks, makeTrack } from '../../shared/tracklist.js';
import { syncGroups } from '../../shared/model.js';

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
