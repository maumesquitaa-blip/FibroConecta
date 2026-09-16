const zlib = require('zlib');
const fs = require('fs');

function createPNG(width, height, drawFn) {
  const rowSize = width * 4;
  const raw = Buffer.alloc(height * (rowSize + 1));
  for (let y = 0; y < height; y++) {
    raw[y * (rowSize + 1)] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const offset = y * (rowSize + 1) + 1 + x * 4;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }
  const idatData = zlib.deflateSync(raw);

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const t = Buffer.from(type);
    const crc = zlib.crc32(Buffer.concat([t, data]));
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc >>> 0);
    return Buffer.concat([len, t, data, crcBuf]);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const brasaoPNG = createPNG(32, 32, (x, y, w, h) => {
  const cx = w / 2;
  const dx = Math.abs(x - cx);
  if (y < 4 || (y > 24 && dx > (32 - y))) return [0, 0, 0, 0];
  if (dx > 13) return [0, 0, 0, 0];
  if (dx >= 12 || y <= 5 || (y > 22 && dx >= (30 - y))) return [234, 179, 8, 255];
  if (dx <= 2 && y >= 10 && y <= 20) return [255, 255, 255, 255];
  if (y >= 14 && y <= 16 && dx <= 8) return [255, 255, 255, 255];
  return [30, 58, 138, 255];
});

const lacoPNG = createPNG(32, 40, (x, y, w, h) => {
  const cx = 16;
  if (y < 22) {
    const dist = Math.hypot(x - cx, y - 11);
    if (dist >= 5 && dist <= 11) {
      return [124, 58, 237, 255];
    }
    return [0, 0, 0, 0];
  }
  const leftLeg = Math.abs((x - (cx - (y - 20) * 0.5)));
  const rightLeg = Math.abs((x - (cx + (y - 20) * 0.5)));
  if (leftLeg <= 3 || rightLeg <= 3) {
    return [109, 40, 217, 255];
  }
  return [0, 0, 0, 0];
});

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/brasao.png', brasaoPNG);
fs.writeFileSync('public/laco.png', lacoPNG);

const assetsTs = `export const BRASAO_BASE64 = "data:image/png;base64,${brasaoPNG.toString('base64')}";\n` +
                 `export const LACO_BASE64 = "data:image/png;base64,${lacoPNG.toString('base64')}";\n`;
fs.writeFileSync('src/components/carteira/assets.ts', assetsTs);
console.log('Assets criados com sucesso!');
