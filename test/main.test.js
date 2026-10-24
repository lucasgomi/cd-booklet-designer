import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { audioDuration } from '../src/main/audio.js';
import { withDpi } from '../src/main/png.js';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cdbook-'));

test('duración de un WAV', () => {
  const rate = 44100;
  const seconds = 2;
  const data = Buffer.alloc(rate * 4 * seconds);
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + data.length, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(rate, 24); h.writeUInt32LE(rate * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(data.length, 40);
  const file = path.join(tmp, 'a.wav');
  fs.writeFileSync(file, Buffer.concat([h, data]));
  assert.equal(audioDuration(file), 2);
});

test('duración de un FLAC (STREAMINFO)', () => {
  const b = Buffer.alloc(42);
  b.write('fLaC', 0);
  b[4] = 0x80; b[7] = 34; // último bloque, STREAMINFO de 34 bytes
  const si = 8;
  const rate = 44100;
  const samples = rate * 184;
  b[si + 10] = (rate >> 12) & 0xff;
  b[si + 11] = (rate >> 4) & 0xff;
  b[si + 12] = ((rate & 0x0f) << 4) | (1 << 1);
  b[si + 13] = 0x10 * 15 + Math.floor(samples / 2 ** 32);
  b.writeUInt32BE(samples >>> 0, si + 14);
  const file = path.join(tmp, 'a.flac');
  fs.writeFileSync(file, b);
  assert.equal(audioDuration(file), 184);
  assert.equal(audioDuration(path.join(tmp, 'no-existe.flac')), null);
});

test('el PNG declara 300 ppp', () => {
  // PNG mínimo de 1×1.
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
  const out = withDpi(png, 300);
  const i = out.indexOf('pHYs');
  assert.ok(i > 0);
  assert.equal(out.readUInt32BE(i + 4), 11811);
});
