// Generates simple solid-color placeholder PNG app icons (no external deps).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';

function crc32(buf) {
  let c;
  const table = crc32.table || (crc32.table = (() => {
    const t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      t[n] = c >>> 0;
    }
    return t;
  })());
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size, [r, g, b], radius) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 4 + 1) * height);
  const cx = width / 2;
  const cy = height / 2;
  const accentR = Math.round(size * 0.3);
  for (let y = 0; y < height; y++) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0; // filter type none
    for (let x = 0; x < width; x++) {
      const dx = Math.min(x, width - 1 - x);
      const dy = Math.min(y, height - 1 - y);
      const inCorner = dx < radius && dy < radius && (radius - dx) ** 2 + (radius - dy) ** 2 > radius * radius;
      const idx = rowStart + 1 + x * 4;
      if (inCorner) {
        raw[idx] = 0;
        raw[idx + 1] = 0;
        raw[idx + 2] = 0;
        raw[idx + 3] = 0;
        continue;
      }
      const distFromCenter = Math.hypot(x - cx, y - cy);
      if (distFromCenter < accentR) {
        raw[idx] = 255;
        raw[idx + 1] = 255;
        raw[idx + 2] = 255;
        raw[idx + 3] = 255;
      } else {
        raw[idx] = r;
        raw[idx + 1] = g;
        raw[idx + 2] = b;
        raw[idx + 3] = 255;
      }
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const idat = deflateSync(raw);
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync('public/icons', { recursive: true });
const color = [28, 28, 30]; // matches theme_color
writeFileSync('public/icons/icon-192.png', makePng(192, color, 36));
writeFileSync('public/icons/icon-512.png', makePng(512, color, 96));
console.log('Icons generated.');
