// Draws the SolarDesy mark (cobalt tile, white sun) as the PNG icons a PWA install needs.
// Run: node scripts/generate-pwa-icons.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { crc32, deflateSync } from 'node:zlib';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons');
const BLUE = [0x1d, 0x4e, 0xd8];

function distToSegment(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const len = abx * abx + aby * aby || 1;
  const t = Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / len));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

/** 1 inside the sun, 0 outside, with a one-pixel edge so the mark stays sharp at small sizes. */
function sun(x, y, size, reach) {
  const cx = (size - 1) / 2;
  const cy = (size - 1) / 2;
  const sunR = size * 0.145 * reach;
  const rayIn = size * 0.21 * reach;
  const rayOut = size * 0.36 * reach;
  const rayR = size * 0.03 * reach;
  let d = Math.hypot(x - cx, y - cy) - sunR;
  for (let i = 0; i < 8; i += 1) {
    const a = (Math.PI / 4) * i - Math.PI / 2;
    const ax = cx + Math.cos(a) * rayIn;
    const ay = cy + Math.sin(a) * rayIn;
    const bx = cx + Math.cos(a) * rayOut;
    const by = cy + Math.sin(a) * rayOut;
    d = Math.min(d, distToSegment(x, y, ax, ay, bx, by) - rayR);
  }
  return Math.max(0, Math.min(1, 0.65 - d));
}

function render(size, reach) {
  const scale = 3;
  const raw = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let white = 0;
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          white += sun((x * scale + sx + 0.5) / scale, (y * scale + sy + 0.5) / scale, size, reach);
        }
      }
      white /= scale * scale;
      const i = (y * size + x) * 4;
      raw[i] = Math.round(BLUE[0] * (1 - white) + 255 * white);
      raw[i + 1] = Math.round(BLUE[1] * (1 - white) + 255 * white);
      raw[i + 2] = Math.round(BLUE[2] * (1 - white) + 255 * white);
      raw[i + 3] = 255;
    }
  }
  return raw;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function png(size, rgba) {
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// `reach` below 1 keeps the sun inside the maskable safe zone (the centre 80%).
const files = [
  ['favicon-32.png', 32, 1],
  ['icon-192.png', 192, 1],
  ['icon-512.png', 512, 1],
  ['apple-touch-icon.png', 180, 0.78],
  ['icon-maskable-192.png', 192, 0.72],
  ['icon-maskable-512.png', 512, 0.72],
];

mkdirSync(OUT, { recursive: true });
for (const [name, size, reach] of files) {
  writeFileSync(join(OUT, name), png(size, render(size, reach)));
  console.log(name, size);
}
