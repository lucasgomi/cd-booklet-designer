import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDuration, formatDuration, formatTotal, totalSeconds } from '../src/shared/time.js';
import { parsePastedText, parseCue, cueToTracks } from '../src/shared/tracklist.js';
import { fillTemplate, stripAccents, abbreviationCandidates } from '../src/shared/text.js';
import { isNewer } from '../src/shared/version.js';

test('parseDuration acepta varios formatos', () => {
  assert.equal(parseDuration('3:04'), 184);
  assert.equal(parseDuration('03:04'), 184);
  assert.equal(parseDuration('1:02:03'), 3723);
  assert.equal(parseDuration('76:06'), 4566);
  assert.equal(parseDuration('3’04'), 184);
  assert.equal(parseDuration('3:75'), null);
  assert.equal(parseDuration(''), null);
  assert.equal(parseDuration('abc'), null);
});

test('formatDuration con cifras de ancho fijo', () => {
  assert.equal(formatDuration(184), '03:04');
  assert.equal(formatDuration(184, 'm:ss'), '3:04');
  assert.equal(formatDuration(null), '');
});

test('formatTotal en todos los formatos', () => {
  const s = 4566; // 1:16:06
  assert.equal(formatTotal(s, 'h-min'), '1 H 16 MIN');
  assert.equal(formatTotal(s, 'h-min-compact'), '1H 16MIN');
  assert.equal(formatTotal(s, 'h-min-lower'), '1 h 16 min');
  assert.equal(formatTotal(s, 'min'), '76 MIN');
  assert.equal(formatTotal(s, 'mmss'), '76:06');
  assert.equal(formatTotal(s, 'hmmss'), '1:16:06');
  assert.equal(formatTotal(58 * 60, 'h-min'), '58 MIN');
});

test('parsePastedText entiende separadores y numeración', () => {
  const tracks = parsePastedText([
    'Gimme More – 3:04',
    '2. La Que Puede, Puede - 2:34',
    '03 Baby Gangsta\t2:33',
    'Dumbai (2:28)',
    '#Tetas — 2:29',
    'Sin duración',
    '',
    '10) Ay Ay Ay 3:01',
  ].join('\n'));
  assert.deepEqual(tracks.map((t) => [t.title, t.duration]), [
    ['Gimme More', 184],
    ['La Que Puede, Puede', 154],
    ['Baby Gangsta', 153],
    ['Dumbai', 148],
    ['#Tetas', 149],
    ['Sin duración', null],
    ['Ay Ay Ay', 181],
  ]);
});

test('el total de la muestra es 1 H 16 MIN', () => {
  const durs = '3:04 2:34 2:33 2:28 2:29 3:11 2:16 2:37 3:05 3:01 2:43 2:40 2:35 3:08 2:20 2:33 3:15 3:49 4:20 3:03 2:48 3:09 3:46 3:17 2:50 2:32'
    .split(' ').map((d) => ({ duration: parseDuration(d) }));
  assert.equal(durs.length, 26);
  assert.equal(formatTotal(totalSeconds(durs), 'h-min'), '1 H 16 MIN');
});

test('parseCue + cueToTracks calcula duraciones', () => {
  const cue = parseCue(`REM DATE 2024
PERFORMER "CA7RIEL & Paco Amoroso"
TITLE "HITS"
FILE "disco.flac" WAVE
  TRACK 01 AUDIO
    TITLE "Gimme More"
    INDEX 01 00:00:00
  TRACK 02 AUDIO
    TITLE "La Que Puede, Puede"
    INDEX 00 03:03:50
    INDEX 01 03:04:00
  TRACK 03 AUDIO
    TITLE "Baby Gangsta"
    PERFORMER "Otro"
    INDEX 01 05:38:00
`);
  assert.equal(cue.artist, 'CA7RIEL & Paco Amoroso');
  assert.equal(cue.title, 'HITS');
  assert.equal(cue.date, '2024');
  const { tracks, missing } = cueToTracks(cue, { 'disco.flac': 491 });
  // La pista 1 dura hasta el INDEX 00 (pregap) de la 2.
  assert.deepEqual(tracks.map((t) => [t.title, t.duration]), [
    ['Gimme More', 184],
    ['La Que Puede, Puede', 154],
    ['Baby Gangsta', 153],
  ]);
  assert.equal(tracks[2].group, 'Otro');
  assert.equal(missing, 0);
  assert.equal(cueToTracks(cue).missing, 1);
});

test('fillTemplate oculta tramos con campos vacíos y limpia separadores', () => {
  const v = { titulo: 'HITS', disco: '69', fecha: '', pistas: '26', total: '1 H 16 MIN', artista: '' };
  assert.equal(fillTemplate('{titulo}[ · Nº {disco}][ · {fecha}] · {pistas} PISTAS · {total}', v), 'HITS · Nº 69 · 26 PISTAS · 1 H 16 MIN');
  assert.equal(fillTemplate('{artista} · {titulo}', v), 'HITS');
  assert.equal(fillTemplate('✻ {titulo} ✻[ DISCO Nº {disco} ✻]', { ...v, disco: '' }), '✻ HITS ✻');
});

test('stripAccents', () => {
  assert.equal(stripAccents('Hasta Jesús Tuvo un Mal Día — El Único'), 'Hasta Jesus Tuvo un Mal Dia — El Unico');
  assert.equal(stripAccents('Nº'), 'Nº');
});

test('abreviaturas propuestas', () => {
  const c = abbreviationCandidates("Mi Deseo / Bad Bitch (Live at NPR Music's Tiny Desk)");
  assert.equal(c[0], 'Mi Deseo / Bad Bitch (Tiny Desk)');
  assert.ok(c.includes('Mi Deseo / Bad Bitch'));
  assert.ok(c.every((x) => !/[/]…$/.test(x)));
  assert.equal(abbreviationCandidates('Canción (feat. Alguien)')[0], 'Canción');
  assert.equal(abbreviationCandidates('Song - Remastered 2011')[0], 'Song');
  assert.ok(abbreviationCandidates("Beto's Horns (Fred Remix)").includes("Beto's Horns (Remix)"));
  assert.ok(!abbreviationCandidates("Mi Deseo / Bad Bitch (Live at NPR Music's Tiny Desk)").includes('Mi Deseo / Bad Bitch (Desk)'));
});

test('comparación de versiones para las actualizaciones', () => {
  assert.equal(isNewer('v1.10.0', '1.9.3'), true);
  assert.equal(isNewer('1.1.0', '1.1.0'), false);
  assert.equal(isNewer('v1.0.9', '1.1.0'), false);
  assert.equal(isNewer('2.0', '1.9.9'), true);
});
