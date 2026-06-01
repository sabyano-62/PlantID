/**
 * PWA Icon Generator
 * Run: node scripts/generate-icons.js
 * Generates 192x192 and 512x512 PNG icons from the SVG.
 * Uses only Node.js built-ins (zlib) - no npm dependencies.
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZES = [192, 512];
const SVG_PATH = path.join(__dirname, '..', 'assets', 'icon.svg');
const OUT_DIR = path.join(__dirname, '..', 'assets');

// Read SVG
const svgContent = fs.readFileSync(SVG_PATH, 'utf8');

// Create a simple HTML page to render SVG and output PNG data
// We'll use a canvas-based approach by spawning a headless browser if available,
// or fall back to creating placeholder icons.

async function generate() {
  // Try using a simple embedded approach: create a data URL PNG
  // Since we can't render SVG in Node.js natively, we'll create
  // minimal but valid PNG icons with the leaf symbol drawn pixel-by-pixel.

  for (const size of SIZES) {
    const png = createPNG(size, svgContent);
    const outPath = path.join(OUT_DIR, `icon-${size}.png`);
    fs.writeFileSync(outPath, png);
    console.log(`Created ${outPath} (${(png.length / 1024).toFixed(1)} KB)`);
  }
  console.log('\nIcons generated in assets/');
}

function createPNG(size, svg) {
  // Create a simple PNG with the leaf icon drawn programmatically
  // This is a fallback when sharp/canvas isn't available

  const pixels = Buffer.alloc(size * size * 4, 255); // RGBA, start white

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.45;

  // Draw rounded rect background (green)
  const cornerR = size * 0.18;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // Check if inside rounded rectangle
      let inside = false;
      if (x >= cornerR && x < size - cornerR && y >= cornerR && y < size - cornerR) {
        inside = true;
      } else {
        // Check corners
        const corners = [
          [cornerR, cornerR],
          [size - 1 - cornerR, cornerR],
          [cornerR, size - 1 - cornerR],
          [size - 1 - cornerR, size - 1 - cornerR],
        ];
        for (const [ccx, ccy] of corners) {
          const dx = x - ccx;
          const dy = y - ccy;
          if (dx * dx + dy * dy <= cornerR * cornerR) {
            inside = true;
            break;
          }
        }
      }

      if (!inside) {
        pixels[idx + 3] = 0; // transparent
        continue;
      }

      // Background gradient (dark green to medium green)
      const t = (x + y) / (2 * size);
      pixels[idx] = Math.round(27 + t * 38);     // R
      pixels[idx + 1] = Math.round(106 + t * 40); // G
      pixels[idx + 2] = Math.round(79 + t * 20);  // B
      pixels[idx + 3] = 255;
    }
  }

  // Draw inner circle (lighter green)
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < r * 0.65) {
        const idx = (y * size + x) * 4;
        pixels[idx] = 149;     // R
        pixels[idx + 1] = 213; // G
        pixels[idx + 2] = 178; // B
        pixels[idx + 3] = 255;
      }
    }
  }

  // Draw checkmark
  function drawLine(x1, y1, x2, y2, width, r, g, b) {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        // Distance from point to line segment
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len === 0) continue;
        const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (len * len)));
        const px = x1 + t * dx;
        const py = y1 + t * dy;
        const d = Math.sqrt((x - px) * (x - px) + (y - py) * (y - py));
        if (d < width) {
          const idx = (y * size + x) * 4;
          pixels[idx] = r;
          pixels[idx + 1] = g;
          pixels[idx + 2] = b;
          pixels[idx + 3] = 255;
        }
      }
    }
  }

  // Checkmark lines (dark green)
  const s = size * 0.06; // stroke width
  drawLine(size * 0.38, size * 0.5, size * 0.48, size * 0.6, s, 27, 67, 50);
  drawLine(size * 0.48, size * 0.6, size * 0.62, size * 0.4, s, 27, 67, 50);

  // Draw small decorative dots
  function drawCircle(x, y, radius, r, g, b) {
    for (let py = -radius; py <= radius; py++) {
      for (let px = -radius; px <= radius; px++) {
        if (px * px + py * py <= radius * radius) {
          const ix = Math.round(x + px);
          const iy = Math.round(y + py);
          if (ix >= 0 && ix < size && iy >= 0 && iy < size) {
            const idx = (iy * size + ix) * 4;
            pixels[idx] = (pixels[idx] + r * 2) / 3;
            pixels[idx + 1] = (pixels[idx + 1] + g * 2) / 3;
            pixels[idx + 2] = (pixels[idx + 2] + b * 2) / 3;
            pixels[idx + 3] = 255;
          }
        }
      }
    }
  }

  drawCircle(size * 0.7, size * 0.35, size * 0.04, 116, 198, 157);
  drawCircle(size * 0.3, size * 0.68, size * 0.035, 116, 198, 157);

  return encodePNG(size, size, pixels);
}

function encodePNG(width, height, pixelData) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = createChunk('IHDR', ihdr);

  // IDAT chunk - raw pixel data with filter byte per row
  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // filter: None
    pixelData.copy(rawData, y * (1 + width * 4) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);

  const crc = crc32(crcData);
  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

generate().catch(console.error);
