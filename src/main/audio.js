// Duración de archivos de audio referenciados por un .cue (WAV y FLAC),
// para calcular la última pista de cada archivo.
import fs from 'node:fs';

function readHead(file, bytes) {
  const fd = fs.openSync(file, 'r');
  try {
    const buf = Buffer.alloc(bytes);
    const n = fs.readSync(fd, buf, 0, bytes, 0);
    return buf.subarray(0, n);
  } finally {
    fs.closeSync(fd);
  }
}

function flacDuration(file) {
  const b = readHead(file, 64 * 1024);
  let off = 0;
  // Saltar etiqueta ID3 si la hubiera.
  if (b.toString('latin1', 0, 3) === 'ID3') {
    off = 10 + ((b[6] << 21) | (b[7] << 14) | (b[8] << 7) | b[9]);
  }
  if (b.toString('latin1', off, off + 4) !== 'fLaC') return null;
  const si = off + 8; // cabecera del bloque STREAMINFO (4 bytes) tras "fLaC"
  const sampleRate = (b[si + 10] << 12) | (b[si + 11] << 4) | (b[si + 12] >> 4);
  const totalSamples = (b[si + 13] & 0x0f) * 2 ** 32 + b.readUInt32BE(si + 14);
  if (!sampleRate || !totalSamples) return null;
  return totalSamples / sampleRate;
}

function wavDuration(file) {
  const size = fs.statSync(file).size;
  const b = readHead(file, 64 * 1024);
  if (b.toString('latin1', 0, 4) !== 'RIFF' || b.toString('latin1', 8, 12) !== 'WAVE') return null;
  let off = 12;
  let byteRate = 0;
  while (off + 8 <= b.length) {
    const id = b.toString('latin1', off, off + 4);
    const len = b.readUInt32LE(off + 4);
    if (id === 'fmt ') byteRate = b.readUInt32LE(off + 16);
    if (id === 'data') {
      const dataLen = Math.min(len, size - off - 8);
      return byteRate ? dataLen / byteRate : null;
    }
    off += 8 + len + (len % 2);
  }
  return null;
}

/** Segundos, o null si no se puede saber (formato no soportado, no existe…). */
export function audioDuration(file) {
  try {
    if (!fs.existsSync(file)) return null;
    const lower = file.toLowerCase();
    if (lower.endsWith('.flac')) return flacDuration(file);
    if (lower.endsWith('.wav')) return wavDuration(file);
    return flacDuration(file) ?? wavDuration(file);
  } catch {
    return null;
  }
}
