import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

const YELLOW = '#F5B82E';
const INK = '#1c1917';
const outDir = 'public/icons';

/** Lucide-style sun on a yellow tile — same look as the landing header LogoMark. */
function sunSvg(size, { pad = 0.12, bg = YELLOW, fg = INK, radius = 0.22 } = {}) {
  const inset = size * pad;
  const box = size - inset * 2;
  const scale = box / 24;
  const t = (x, y) => [inset + x * scale, inset + y * scale];
  const [cx, cy] = t(12, 12);
  const r = 4 * scale;
  const stroke = Math.max(1.5, 2 * scale);
  const rays = [
    [12, 2, 12, 4],
    [12, 20, 12, 22],
    [4.93, 4.93, 6.34, 6.34],
    [17.66, 17.66, 19.07, 19.07],
    [2, 12, 4, 12],
    [20, 12, 22, 12],
    [4.93, 19.07, 6.34, 17.66],
    [17.66, 6.34, 19.07, 4.93],
  ];
  const lines = rays
    .map(([x1, y1, x2, y2]) => {
      const [a, b] = t(x1, y1);
      const [c, d] = t(x2, y2);
      return `<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="${fg}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    })
    .join('');
  const rx = size * radius;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${rx}" fill="${bg}"/><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${fg}" stroke-width="${stroke}"/>${lines}</svg>`;
}

async function writePng(name, size, opts) {
  const buf = await sharp(Buffer.from(sunSvg(size, opts))).png().toBuffer();
  writeFileSync(join(outDir, name), buf);
  console.log(name, size);
}

await writePng('favicon-32.png', 32, { pad: 0.14, radius: 0.22 });
await writePng('icon-192.png', 192, { pad: 0.18, radius: 0.22 });
await writePng('icon-512.png', 512, { pad: 0.18, radius: 0.22 });
await writePng('apple-touch-icon.png', 180, { pad: 0.18, radius: 0.22 });
await writePng('icon-maskable-192.png', 192, { pad: 0.28, radius: 0 });
await writePng('icon-maskable-512.png', 512, { pad: 0.28, radius: 0 });

const ico = await sharp(Buffer.from(sunSvg(32, { pad: 0.14, radius: 0.22 }))).png().toBuffer();
writeFileSync('src/app/favicon.ico', ico);
console.log('src/app/favicon.ico');
