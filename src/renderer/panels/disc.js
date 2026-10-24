// Pestaña «Disco»: datos generales con interruptor de visibilidad.
import { store, commit } from '../store.js';
import { h, section, textInput, toggle, select } from '../ui.js';
import { TOTAL_FORMATS, totalSeconds, formatTotal, CD_LIMIT_SECONDS } from '../../shared/time.js';
import { PLACEHOLDER_HELP } from '../../shared/text.js';

const FIELDS = [
  { key: 'artist', label: 'Artista', placeholder: 'CA7RIEL & Paco Amoroso', tag: '{artista}' },
  { key: 'title', label: 'Título del recopilatorio', placeholder: 'HITS', tag: '{titulo}' },
  { key: 'discNumber', label: 'Número de disco', placeholder: '69', tag: '{disco}' },
  { key: 'date', label: 'Fecha', placeholder: 'Octubre 2026', tag: '{fecha}' },
];

export function renderDiscPanel(root) {
  const { disc } = store.state;
  root.replaceChildren();
  root.appendChild(section('Datos del disco',
    ...FIELDS.map((f) => h('div', { class: 'disc-field' },
      h('div', { class: 'disc-field-head' },
        h('span', { class: 'field-label', text: f.label }),
        h('code', { class: 'tag', text: f.tag, title: 'Úsalo en los textos de la plantilla' }),
        toggle(disc.show[f.key], (v) => commit((s) => { s.disc.show[f.key] = v; }), 'Mostrar')),
      textInput(disc[f.key], (v) => commit((s) => { s.disc[f.key] = v; }, { key: `disc.${f.key}` }), { placeholder: f.placeholder }))),
    h('p', { class: 'help', text: PLACEHOLDER_HELP })));

  const total = totalSeconds(store.state.tracks);
  root.appendChild(section('Duración total',
    h('div', { class: 'stat-row' },
      h('div', { class: 'stat' }, h('b', { text: String(store.state.tracks.length) }), h('span', { text: 'pistas' })),
      h('div', { class: `stat${total > CD_LIMIT_SECONDS ? ' bad' : ''}` }, h('b', { text: formatTotal(total, 'hmmss') }), h('span', { text: 'total' }))),
    h('label', { class: 'field' }, h('span', { class: 'field-label', text: 'Formato del total ({total})' }),
      select(disc.totalFormat, TOTAL_FORMATS.map((f) => ({ value: f.id, label: `${formatTotal(total || 4566, f.id)}` })),
        (v) => commit((s) => { s.disc.totalFormat = v; }, { rebuild: 'disc' }))),
    total > CD_LIMIT_SECONDS ? h('p', { class: 'alert bad', text: `⚠ El total (${formatTotal(total, 'mmss')}) supera los 80 minutos de un CD.` }) : null));
}
