import sharp from 'sharp';
import fs from 'fs';
const KEY = 'sk-GjeCPWiTENHjn18RA51Uax6xjgQgbUfD4ixgXRom6p1dVcKI';
// 压缩图片到 200x300
const buf = await sharp('/tmp/zine-upload/test.jpg').resize(200, 300, { fit: 'fill' }).jpeg({ quality: 60 }).toBuffer();
const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
console.log('Compressed size:', buf.length, 'bytes, base64 length:', dataUrl.length);
const res = await fetch('https://speed.toter.me/chat/completions', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
  body: JSON.stringify({ model: '入梦 Pro', messages: [{ role: 'user', content: [
    { type: 'text', text: '根据这张图片生成一幅手绘风格插画。要求：直接返回完整的SVG代码（以<svg>开头），不要返回HTML、CSS、markdown代码块或其他格式。' },
    { type: 'image_url', image_url: { url: dataUrl } }
  ] }], stream: false, max_tokens: 8000 })
});
const text = await res.text();
console.log(`HTTP ${res.status}`, text.slice(0, 300));
