import fs from 'fs';
import sharp from 'sharp';
const buf = fs.readFileSync('/tmp/zine-upload/test.jpg');
const ink = await sharp(buf)
  .resize(731, 1024, { fit: 'fill' })
  .grayscale()
  .modulate({ brightness: 1.1 })
  .linear(1.8, -(128 * 1.8) + 128)
  .sharpen({ sigma: 2 })
  .png()
  .toBuffer();
fs.writeFileSync('/tmp/ink-local.png', ink);
console.log('Ink saved, size:', ink.length);
