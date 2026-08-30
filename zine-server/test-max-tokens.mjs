import sharp from 'sharp';
import fs from 'fs';
const KEY = 'sk-GjeCPWiTENHjn18RA51Uax6xjgQgbUfD4ixgXRom6p1dVcKI';
const buf = await sharp('/tmp/zine-upload/test.jpg').resize(200, 300, { fit: 'fill' }).jpeg({ quality: 60 }).toBuffer();
const dataUrl = `data:image/jpeg;base64,${buf.toString('base64')}`;
for (const mt of [8000, 12000, 16000]) {
  console.log(`=== max_tokens: ${mt} ===`);
  const res = await fetch('https://speed.toter.me/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
    body: JSON.stringify({ model: '入梦 Pro', messages: [{ role: 'user', content: [
      { type: 'text', text: '根据这张图片生成一幅手绘风格插画。直接返回完整SVG代码，不要HTML/CSS/markdown。' },
      { type: 'image_url', image_url: { url: dataUrl } }
    ] }], stream: false, max_tokens: mt })
  });
  const j = JSON.parse(await res.text());
  console.log('finish:', j.choices?.[0]?.finish_reason, 'len:', j.choices?.[0]?.message?.content?.length);
}
