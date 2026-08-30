import sharp from 'sharp';
import fs from 'fs';
const KEY = 'sk-GjeCPWiTENHjn18RA51Uax6xjgQgbUfD4ixgXRom6p1dVcKI';
// 用完全不同的图片测试
const files = fs.readdirSync('/workspace/projects/assets/').filter(f => f.endsWith('.jpg'));
console.log('Available images:', files.length);
for (const f of files.slice(0, 2)) {
  const buf = await sharp(`/workspace/projects/assets/${f}`).resize(200, 260, { fit: 'fill' }).jpeg({ quality: 60 }).toBuffer();
  const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
  const res = await fetch('https://speed.toter.me/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: '入梦 Pro', messages: [{ role: 'user', content: [
      { type: 'text', text: '根据这张图片生成一幅手绘风格插画。直接返回完整SVG代码，不要HTML/CSS/markdown。' },
      { type: 'image_url', image_url: { url: dataUrl } }
    ] }], stream: false, max_tokens: 12000 })
  });
  const j = JSON.parse(await res.text());
  const content = j.choices?.[0]?.message?.content || '';
  const hasCat = /猫|cat|猫咪/i.test(content);
  const hasFlower = /花|flower|玫瑰|百合/i.test(content);
  console.log(`${f}: len=${content.length}, mentions cat=${hasCat}, mentions flower=${hasFlower}`);
}
