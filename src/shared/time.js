// Duraciones: se guardan siempre en segundos (entero) o null si se desconoce.

export const CD_LIMIT_SECONDS = 80 * 60;

/** "3:04", "03:04", "1:02:03", "184" (segundos) -> segundos, o null. */
export function parseDuration(text) {
  if (text == null) return null;
  const s = String(text).trim().replace(/[’'′]/g, ':').replace(/\s+/g, '');
  if (!s) return null;
  if (/^\d+$/.test(s)) return Number(s);
  const m = /^(?:(\d+):)?(\d{1,3}):(\d{1,2})$/.exec(s);
  if (!m) return null;
  const h = Number(m[1] || 0);
  const min = Number(m[2]);
  const sec = Number(m[3]);
  if (sec > 59) return null;
  return h * 3600 + min * 60 + sec;
}

const pad = (n) => String(n).padStart(2, '0');

/** Duración de una pista. style: 'mm:ss' (03:04) o 'm:ss' (3:04). */
export function formatDuration(seconds, style = 'mm:ss') {
  if (seconds == null || Number.isNaN(seconds)) return '';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${style === 'm:ss' ? m : pad(m)}:${pad(s)}`;
}

export const TOTAL_FORMATS = [
  { id: 'h-min', label: '1 H 16 MIN' },
  { id: 'h-min-compact', label: '1H 16MIN' },
  { id: 'h-min-lower', label: '1 h 16 min' },
  { id: 'min', label: '76 MIN' },
  { id: 'mmss', label: '76:06' },
  { id: 'hmmss', label: '1:16:06' },
];

/** Total del disco en el formato elegido. */
export function formatTotal(seconds, format = 'h-min') {
  seconds = Math.max(0, Math.round(seconds || 0));
  const totalMin = Math.round(seconds / 60);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  switch (format) {
    case 'h-min-compact':
      return h ? `${h}H ${min}MIN` : `${min}MIN`;
    case 'h-min-lower':
      return h ? `${h} h ${min} min` : `${min} min`;
    case 'min':
      return `${totalMin} MIN`;
    case 'mmss':
      return `${Math.floor(seconds / 60)}:${pad(seconds % 60)}`;
    case 'hmmss':
      return `${Math.floor(seconds / 3600)}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`;
    case 'h-min':
    default:
      return h ? `${h} H ${min} MIN` : `${min} MIN`;
  }
}

export function totalSeconds(tracks) {
  return tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
}
