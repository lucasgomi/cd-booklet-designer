// Importación de listas de canciones: texto pegado y archivos .cue.
import { parseDuration } from './time.js';

let idCounter = 0;
export function newId(prefix = 'id') {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function makeTrack(title = '', duration = null, extra = {}) {
  return { id: newId('t'), title, shortTitle: '', duration, group: '', ...extra };
}

/**
 * Una canción por línea. Formatos aceptados (entre otros):
 *   Título – 3:04      Título - 3:04      Título — 3:04
 *   1. Título 3:04     01 Título\t3:04    Título (3:04)
 *   Título             (sin duración)
 */
export function parsePastedText(text) {
  const tracks = [];
  for (let raw of String(text).split(/\r?\n/)) {
    let line = raw.trim();
    if (!line) continue;
    let duration = null;
    const timeMatch = /[\s([]*\(?\[?(\d{1,2}:\d{1,2}:\d{2}|\d{1,3}[:’'′]\d{2})\)?\]?\s*$/.exec(line);
    if (timeMatch) {
      duration = parseDuration(timeMatch[1]);
      line = line.slice(0, timeMatch.index).trim();
      // Separador entre título y duración.
      line = line.replace(/\s*[-–—|·:\t]+\s*$/, '').trim();
    }
    // Número de pista inicial: "1.", "01 -", "1)", "#1".
    line = line.replace(/^#?\d{1,3}\s*[.)\-–—:]\s*/, '').replace(/^\d{1,3}\s+(?=\S)/, '').trim();
    if (!line && duration == null) continue;
    tracks.push(makeTrack(line, duration));
  }
  return tracks;
}

function unquote(s) {
  s = s.trim();
  if (s.startsWith('"')) {
    const end = s.lastIndexOf('"');
    return s.slice(1, end > 0 ? end : undefined);
  }
  return s;
}

/** Convierte "mm:ss:ff" (75 frames/s) a segundos con decimales. */
function cueTime(s) {
  const m = /^(\d+):(\d{1,2}):(\d{1,2})$/.exec(s.trim());
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 75;
}

/**
 * Analiza el texto de un .cue. Devuelve
 * { artist, title, date, files: [{ name, tracks: [{ number, title, performer, start }] }] }.
 * `start` es el INDEX 01 en segundos dentro de su archivo.
 */
export function parseCue(text) {
  const result = { artist: '', title: '', date: '', files: [] };
  let file = null;
  let track = null;
  for (const raw of String(text).replace(/^﻿/, '').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const [cmdRaw, ...restParts] = line.split(/\s+/);
    const cmd = cmdRaw.toUpperCase();
    const rest = line.slice(cmdRaw.length).trim();
    if (cmd === 'FILE') {
      const name = unquote(rest.replace(/\s+\S+$/, ''));
      file = { name, tracks: [] };
      result.files.push(file);
      track = null;
    } else if (cmd === 'TRACK') {
      if (!file) { file = { name: '', tracks: [] }; result.files.push(file); }
      track = { number: Number(restParts[0]) || file.tracks.length + 1, title: '', performer: '', start: null };
      file.tracks.push(track);
    } else if (cmd === 'TITLE') {
      if (track) track.title = unquote(rest); else result.title = unquote(rest);
    } else if (cmd === 'PERFORMER') {
      if (track) track.performer = unquote(rest); else result.artist = unquote(rest);
    } else if (cmd === 'INDEX' && track) {
      const [idx, time] = rest.split(/\s+/);
      if (Number(idx) === 1) track.start = cueTime(time);
      else if (Number(idx) === 0 && track.start == null) track.pregap = cueTime(time);
    } else if (cmd === 'REM') {
      const m = /^DATE\s+(.+)$/i.exec(rest);
      if (m && !track) result.date = unquote(m[1]);
    }
  }
  return result;
}

/**
 * Calcula duraciones a partir del .cue analizado.
 * fileDurations: { [nombreArchivo]: segundos | null } (opcional, para la
 * última pista de cada archivo).
 * Devuelve { disc, tracks, missing } donde missing cuenta pistas sin duración.
 */
export function cueToTracks(cue, fileDurations = {}) {
  const tracks = [];
  let missing = 0;
  for (const file of cue.files) {
    const fileLen = fileDurations[file.name] ?? null;
    file.tracks.forEach((t, i) => {
      const next = file.tracks[i + 1];
      let dur = null;
      if (t.start != null) {
        if (next) {
          const nextStart = next.pregap ?? next.start;
          if (nextStart != null) dur = nextStart - t.start;
        } else if (fileLen != null) {
          dur = fileLen - t.start;
        }
      }
      if (dur == null) missing += 1;
      const showPerformer = t.performer && cue.artist && t.performer !== cue.artist;
      tracks.push(makeTrack(t.title || `Pista ${t.number}`, dur == null ? null : Math.round(dur), {
        group: showPerformer ? t.performer : '',
      }));
    });
  }
  return { disc: { artist: cue.artist, title: cue.title, date: cue.date }, tracks, missing };
}
