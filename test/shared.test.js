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
PERFORMER "Artista de Ejemplo"
TITLE "Grandes Éxitos"
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
  assert.equal(cue.artist, 'Artista de Ejemplo');
  assert.equal(cue.title, 'Grandes Éxitos');
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
  const v = { titulo: 'Éxitos', disco: '69', fecha: '', pistas: '26', total: '1 H 16 MIN', artista: '' };
  assert.equal(fillTemplate('{titulo}[ · Nº {disco}][ · {fecha}] · {pistas} PISTAS · {total}', v), 'Éxitos · Nº 69 · 26 PISTAS · 1 H 16 MIN');
  assert.equal(fillTemplate('{artista} · {titulo}', v), 'Éxitos');
  assert.equal(fillTemplate('✻ {titulo} ✻[ DISCO Nº {disco} ✻]', { ...v, disco: '' }), '✻ Éxitos ✻');
});

test('stripAccents', () => {
  assert.equal(stripAccents('Canción Única — Él Volverá'), 'Cancion Unica — El Volvera');
  assert.equal(stripAccents('Nº'), 'Nº');
});

test('abreviaturas propuestas', () => {
  const c = abbreviationCandidates("Uno / Dos (Live at the BBC's Maida Vale)");
  assert.equal(c[0], 'Uno / Dos (Maida Vale)');
  assert.ok(c.includes('Uno / Dos'));
  assert.ok(c.every((x) => !/[/]…$/.test(x)));
  assert.equal(abbreviationCandidates('Canción (feat. Alguien)')[0], 'Canción');
  assert.equal(abbreviationCandidates('Song - Remastered 2011')[0], 'Song');
  assert.ok(abbreviationCandidates('Ruido Blanco (Club Remix)').includes('Ruido Blanco (Remix)'));
  assert.ok(!abbreviationCandidates("Volver a Empezar (Live at the BBC's Maida Vale)").includes('Volver a Empezar (Vale)'));
});

test('comparación de versiones para las actualizaciones', () => {
  assert.equal(isNewer('v1.10.0', '1.9.3'), true);
  assert.equal(isNewer('1.1.0', '1.1.0'), false);
  assert.equal(isNewer('v1.0.9', '1.1.0'), false);
  assert.equal(isNewer('2.0', '1.9.9'), true);
});

test('el ajuste automático escala la letra de la lista y fija columnas', async () => {
  const { scaledState } = await import('../src/shared/render.js');
  const { defaultState, currentStyle } = await import('../src/shared/model.js');
  const { listColumns } = await import('../src/shared/templates/common.js');
  const st = defaultState();
  const base = currentStyle(st);
  const half = currentStyle(scaledState(st, 0.5));
  assert.equal(half.listSize, +(base.listSize * 0.5).toFixed(3));
  assert.equal(half.rowHeight, +(base.rowHeight * 0.5).toFixed(3));
  assert.equal(base.titleSize, half.titleSize); // sólo la lista
  assert.equal(listColumns(currentStyle(scaledState(st, 1, 2))), 2);
  assert.equal(listColumns(base), 1); // 'auto' sin decidir = una
  assert.equal(scaledState(st, 1), st);
});

test('hojas de pegatinas: formatos válidos y ajustes guardados', async () => {
  const { LABEL_SHEETS, defaultSheetConfig, normalizeSheetConfig } = await import('../src/shared/disc-label.js');
  for (const sheet of LABEL_SHEETS) {
    const r = sheet.diameter / 2;
    for (const s of sheet.slots) {
      // Cada pegatina cabe en la hoja…
      assert.ok(s.x - r >= 0 && s.x + r <= sheet.page.w && s.y - r >= 0 && s.y + r <= sheet.page.h, `${sheet.id} se sale de la hoja`);
    }
    // …y no se pisa con las demás.
    sheet.slots.forEach((a, i) => sheet.slots.slice(i + 1).forEach((b) => {
      assert.ok(Math.hypot(a.x - b.x, a.y - b.y) >= sheet.diameter, `${sheet.id}: pegatinas solapadas`);
    }));
  }
  const cfg = defaultSheetConfig('a4-3');
  assert.equal(cfg.slots.length, 3);
  // Selecciones fuera de rango (de un formato anterior) se descartan.
  assert.deepEqual(normalizeSheetConfig({ ...cfg, selected: [0, 2, 5] }).selected, [0, 2]);
  assert.equal(normalizeSheetConfig(null).sheetId, 'a4-3');
});

test('pegatina: los proyectos antiguos se convierten y los estilos rápidos son válidos', async () => {
  const { normalizeLabel, LABEL_PRESETS, applyLabelPreset, defaultLabel } = await import('../src/shared/label-model.js');
  const old = normalizeLabel({ background: 'color', color: '#123456', layout: 'list', topText: '{titulo}', bottomText: '', size: 15, textColor: '#FF0000', listSize: 4 });
  assert.equal(old.v, 2);
  assert.equal(old.background, 'color');
  assert.equal(old.texts.length, 1);
  assert.equal(old.texts[0].path, 'top');
  assert.equal(old.texts[0].size, 15);
  assert.equal(old.list.show, true);
  assert.equal(normalizeLabel({ layout: 'none', topText: 'x' }).texts.length, 0);
  for (const p of LABEL_PRESETS) {
    const l = applyLabelPreset(defaultLabel(), p.id);
    assert.ok(l.texts.every((t) => t.id && t.text !== undefined), p.id);
  }
});

test('catálogo de Google Fonts', async () => {
  const { GOOGLE_FONTS_RAW } = await import('../src/shared/google-fonts.js');
  assert.ok(GOOGLE_FONTS_RAW.length > 1000);
  const marker = GOOGLE_FONTS_RAW.find((f) => f[0] === 'Permanent Marker');
  assert.ok(marker && marker[5].includes('graffiti'));
});
