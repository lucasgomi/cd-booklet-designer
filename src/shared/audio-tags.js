// Etiquetas de archivos de audio (sin dependencias): título, artista, álbum,
// año, número de pista y carátula.
//   - MP3: ID3v2.3 / ID3v2.4 (también el bloque «id3 » dentro de un WAV)
//   - FLAC: comentarios Vorbis y bloque PICTURE
//   - WAV: LIST/INFO
// `read(offset, length)` devuelve una promesa con un Uint8Array: así sólo se
// leen las partes necesarias de archivos grandes.

const latin1 = (b) => String.fromCharCode(...b);
const utf8 = (b) => new TextDecoder('utf-8').decode(b);
const be32 = (b, o) => ((b[o] << 24) >>> 0) + (b[o + 1] << 16) + (b[o + 2] << 8) + b[o + 3];
const le32 = (b, o) => b[o] + (b[o + 1] << 8) + (b[o + 2] << 16) + ((b[o + 3] << 24) >>> 0);
const syncsafe = (b, o) => (b[o] << 21) | (b[o + 1] << 14) | (b[o + 2] << 7) | b[o + 3];
const clean = (s) => (s || '').replace(/\0+$/g, '').replace(/\0/g, ' / ').trim();

function decodeText(enc, b) {
  if (enc === 0) return latin1(b);
  if (enc === 3) return utf8(b);
  // UTF-16 con BOM (1) o big-endian (2).
  let le = enc === 1;
  let start = 0;
  if (b[0] === 0xff && b[1] === 0xfe) { le = true; start = 2; } else if (b[0] === 0xfe && b[1] === 0xff) { le = false; start = 2; }
  let out = '';
  for (let i = start; i + 1 < b.length; i += 2) out += String.fromCharCode(le ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
  return out;
}

/** Fin de una cadena terminada en 0 (doble 0 en UTF-16). */
function nullEnd(b, from, enc) {
  if (enc === 1 || enc === 2) {
    for (let i = from; i + 1 < b.length; i += 2) if (b[i] === 0 && b[i + 1] === 0) return i;
    return b.length;
  }
  const i = b.indexOf(0, from);
  return i < 0 ? b.length : i;
}

function parseId3(tag) {
  const out = {};
  const ver = tag[3];
  if (ver < 3) return out; // ID3v2.2: poco habitual, se ignora
  const size = syncsafe(tag, 6);
  let p = 10;
  if (tag[5] & 0x40) p += ver === 4 ? syncsafe(tag, 10) : be32(tag, 10) + 4; // cabecera extendida
  const end = Math.min(tag.length, 10 + size);
  while (p + 10 <= end) {
    const id = latin1(tag.subarray(p, p + 4));
    if (!/^[A-Z0-9]{4}$/.test(id)) break;
    const len = ver === 4 ? syncsafe(tag, p + 4) : be32(tag, p + 4);
    const body = tag.subarray(p + 10, p + 10 + len);
    p += 10 + len;
    if (!len) continue;
    const text = () => clean(decodeText(body[0], body.subarray(1)));
    if (id === 'TIT2') out.title = text();
    else if (id === 'TPE1') out.artist = text();
    else if (id === 'TPE2') out.albumArtist = text();
    else if (id === 'TALB') out.album = text();
    else if (id === 'TRCK') out.track = parseInt(text(), 10) || null;
    else if (id === 'TYER' || id === 'TDRC') out.year = text().slice(0, 4);
    else if (id === 'APIC' && !out.picture) {
      const enc = body[0];
      const mimeEnd = body.indexOf(0, 1);
      const mime = latin1(body.subarray(1, mimeEnd)) || 'image/jpeg';
      const descEnd = nullEnd(body, mimeEnd + 2, enc);
      const data = body.subarray(descEnd + (enc === 1 || enc === 2 ? 2 : 1));
      if (data.length) out.picture = { mime: mime.includes('/') ? mime : `image/${mime.toLowerCase()}`, data };
    }
  }
  return out;
}

async function readFlac(read, size) {
  const out = {};
  let p = 4;
  for (let guard = 0; guard < 64 && p + 4 <= size; guard += 1) {
    const h = await read(p, 4);
    const last = h[0] & 0x80;
    const type = h[0] & 0x7f;
    const len = (h[1] << 16) | (h[2] << 8) | h[3];
    if (type === 4) {
      const b = await read(p + 4, len);
      let q = 4 + le32(b, 0); // se salta el «vendor»
      const n = le32(b, q);
      q += 4;
      for (let i = 0; i < n && q + 4 <= b.length; i += 1) {
        const l = le32(b, q);
        const kv = utf8(b.subarray(q + 4, q + 4 + l));
        q += 4 + l;
        const eq = kv.indexOf('=');
        const k = kv.slice(0, eq).toUpperCase();
        const v = kv.slice(eq + 1).trim();
        if (k === 'TITLE') out.title = v;
        else if (k === 'ARTIST') out.artist = out.artist ? `${out.artist} / ${v}` : v;
        else if (k === 'ALBUMARTIST') out.albumArtist = v;
        else if (k === 'ALBUM') out.album = v;
        else if (k === 'TRACKNUMBER') out.track = parseInt(v, 10) || null;
        else if (k === 'DATE' || k === 'YEAR') out.year = v.slice(0, 4);
      }
    } else if (type === 6 && !out.picture && len < 20e6) {
      const b = await read(p + 4, len);
      let q = 4;
      const ml = be32(b, q);
      const mime = latin1(b.subarray(q + 4, q + 4 + ml));
      q += 4 + ml;
      q += 4 + be32(b, q) + 16; // descripción + medidas
      const dl = be32(b, q);
      out.picture = { mime: mime || 'image/jpeg', data: b.subarray(q + 4, q + 4 + dl) };
    }
    p += 4 + len;
    if (last) break;
  }
  return out;
}

async function readWav(read, size) {
  const out = {};
  let p = 12;
  for (let guard = 0; guard < 200 && p + 8 <= size; guard += 1) {
    const h = await read(p, 8);
    const id = latin1(h.subarray(0, 4));
    const len = le32(h, 4);
    if (id === 'LIST' && len < 1e6) {
      const b = await read(p + 8, len);
      if (latin1(b.subarray(0, 4)) === 'INFO') {
        let q = 4;
        while (q + 8 <= b.length) {
          const sid = latin1(b.subarray(q, q + 4));
          const sl = le32(b, q + 4);
          const v = clean(utf8(b.subarray(q + 8, q + 8 + sl)));
          if (sid === 'INAM') out.title = v;
          else if (sid === 'IART') out.artist = v;
          else if (sid === 'IPRD') out.album = v;
          else if (sid === 'ICRD') out.year = v.slice(0, 4);
          else if (sid === 'ITRK' || sid === 'IPRT') out.track = parseInt(v, 10) || null;
          q += 8 + sl + (sl & 1);
        }
      }
    } else if ((id === 'id3 ' || id === 'ID3 ') && len < 30e6) {
      Object.assign(out, { ...parseId3(await read(p + 8, len)), ...Object.fromEntries(Object.entries(out).filter(([, v]) => v)) });
    }
    p += 8 + len + (len & 1);
  }
  return out;
}

/** Lee las etiquetas. Nunca falla: si no entiende el archivo devuelve {}. */
export async function readAudioTags(read, size) {
  try {
    const head = await read(0, 12);
    const magic = latin1(head.subarray(0, 4));
    if (magic.startsWith('ID3')) {
      const tagSize = syncsafe(head, 6) + 10;
      return parseId3(await read(0, Math.min(size, tagSize)));
    }
    if (magic === 'fLaC') return await readFlac(read, size);
    if (magic === 'RIFF' && latin1(head.subarray(8, 12)) === 'WAVE') return await readWav(read, size);
  } catch { /* archivo raro o cortado */ }
  return {};
}
