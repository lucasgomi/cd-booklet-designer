// Añade el bloque pHYs a un PNG para que declare su resolución (ppp).
import zlib from 'node:zlib';

function crc32(buf) {
  if (zlib.crc32) return zlib.crc32(buf) >>> 0;
  let c = ~0;
  for (const byte of buf) {
    c ^= byte;
    for (let k = 0; k < 8; k += 1) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

export function withDpi(png, dpi) {
  const ppm = Math.round(dpi / 0.0254);
  const data = Buffer.alloc(9);
  data.writeUInt32BE(ppm, 0);
  data.writeUInt32BE(ppm, 4);
  data[8] = 1; // unidad: metros
  const type = Buffer.from('pHYs', 'latin1');
  const chunk = Buffer.alloc(12 + 9);
  chunk.writeUInt32BE(9, 0);
  type.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([type, data])), 17);

  // Quitar un pHYs existente e insertar el nuevo tras IHDR.
  const parts = [png.subarray(0, 8)];
  let off = 8;
  while (off < png.length) {
    const len = png.readUInt32BE(off);
    const t = png.toString('latin1', off + 4, off + 8);
    const end = off + 12 + len;
    if (t !== 'pHYs') parts.push(png.subarray(off, end));
    if (t === 'IHDR') parts.push(chunk);
    off = end;
  }
  return Buffer.concat(parts);
}
