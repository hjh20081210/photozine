import sharp from 'sharp';
import fs from 'fs';
const inputBuf = fs.readFileSync('/tmp/zine-upload/test.jpg');
async function extractLineArt(imgBuf, opts = {}) {
  const { threshold = 0.45, blur = 0.5, dilateRadius = 1, contrast = 1.2 } = opts;
  const { data, info } = await sharp(imgBuf).greyscale().blur(blur).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  // Sobel
  const grey = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) grey[i] = data[i];
  const edges = new Float32Array(w * h);
  let maxE = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = (grey[i - w + 1] + 2 * grey[i + 1] + grey[i + w + 1]) - (grey[i - w - 1] + 2 * grey[i - 1] + grey[i + w - 1]);
      const gy = (grey[i + w - 1] + 2 * grey[i + w] + grey[i + w + 1]) - (grey[i - w - 1] + 2 * grey[i - w] + grey[i - w + 1]);
      edges[i] = Math.sqrt(gx * gx + gy * gy);
      if (edges[i] > maxE) maxE = edges[i];
    }
  }
  // Threshold
  const sorted = Array.from(edges).filter(e => e > 0).sort((a, b) => a - b);
  const threshIdx = Math.floor(sorted.length * threshold);
  const thresh = sorted[threshIdx] || 0;
  // Binary: black lines on transparent
  const out = Buffer.alloc(w * h * 4);
  let blackCount = 0;
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (edges[i] > thresh) {
      out[o] = 0; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255;
      blackCount++;
    } else {
      out[o + 3] = 0;
    }
  }
  let result = sharp(out, { raw: { width: w, height: h, channels: 4 } });
  if (dilateRadius > 0) result = result.dilate(dilateRadius);
  return { buf: await result.png().toBuffer(), blackCount, total: w * h };
}
// Test different params
const configs = [
  { name: 'current', threshold: 0.45, blur: 0.7, dilateRadius: 2 },
  { name: 'sharper', threshold: 0.30, blur: 0.3, dilateRadius: 1 },
  { name: 'clean', threshold: 0.25, blur: 0.5, dilateRadius: 1 },
];
for (const c of configs) {
  const { buf, blackCount, total } = await extractLineArt(inputBuf, c);
  fs.writeFileSync(`/tmp/lineart-${c.name}.png`, buf);
  console.log(`${c.name}: ${(blackCount / total * 100).toFixed(2)}% black pixels, size: ${buf.length}`);
}
