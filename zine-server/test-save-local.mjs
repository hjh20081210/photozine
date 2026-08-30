import fs from 'fs';
import sharp from 'sharp';
const buf = fs.readFileSync('/tmp/zine-upload/test.jpg');
// 模拟 applyArtStyle 的效果
const styled = await sharp(buf)
  .resize(731, 1024, { fit: 'fill' })
  .modulate({ brightness: 1.15, saturation: 0.75 })
  .blur(0.8)
  .sharpen({ sigma: 1.2 })
  .png()
  .toBuffer();
fs.writeFileSync('/tmp/styled-local.png', styled);
console.log('Saved, size:', styled.length);
// 检查与原图的差异
const origStats = await sharp(buf).stats();
const styledStats = await sharp(styled).stats();
console.log('Original mean:', origStats.channels.map(c => c.mean.toFixed(1)));
console.log('Styled mean:', styledStats.channels.map(c => c.mean.toFixed(1)));
