import sharp from 'sharp';
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="100" viewBox="0 0 400 100">
  <rect width="400" height="100" fill="#f5f0e8"/>
  <text x="200" y="60" font-family="'LXGW WenKai'" font-size="40" text-anchor="middle" fill="#2c1810">马叙伦楷书测试</text>
</svg>`;
const png = await sharp(Buffer.from(svg)).png().toBuffer();
import fs from 'fs';
fs.writeFileSync('/tmp/font-test.png', png);
console.log('PNG size:', png.length, 'bytes');
