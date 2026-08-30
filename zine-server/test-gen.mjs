import fs from 'fs';
const buf = fs.readFileSync('/tmp/zine-upload/test.jpg');
const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
// 直接测试 applyArtStyle
const { applyArtStyle } = await import('./src/routes/generation.js');
const styleBuf = await applyArtStyle(buf, 'hand_drawn_watercolor', 'watercolor_paper', 731, 1024);
fs.writeFileSync('/tmp/styled-output.png', styleBuf);
console.log('Styled output size:', styleBuf.length);
const meta = await sharp(styleBuf).metadata();
console.log('Dimensions:', meta.width, 'x', meta.height);
