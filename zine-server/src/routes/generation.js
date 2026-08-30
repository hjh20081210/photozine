import { Router } from 'express';
import { ImageGenerationClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 初始化对象存储客户端
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: '',
  secretKey: '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 风格对应的插画质感提示词（只影响插画本身，不再负责文字）
const STYLE_PROMPTS = {
  hand_drawn_watercolor: '手绘水彩插画风格，透明水彩晕染，水痕斑驳，纸张纹理，细腻笔触，低饱和柔和色彩，艺术插画',
  ink_line: '精细墨线勾线插画，黑白疏朗线条，留白呼吸感，东方式简练',
  gouache: '水粉画风格，平面水粉，柔和哑光色块，厚涂质感',
  cut_paper: '剪纸拼贴艺术，层叠撕纸形状，细阴影，手工粗糙边缘',
  pencil_sketch: '铅笔速写风格，柔和石墨笔触，轻阴影，素描纸纹理',
  risograph: 'Risograph 印刷风格，复古配色，网点纹理，颗粒感，拼贴风格',
  letterpress: '凸版印刷风格，油墨渗纸凹陷，复古排版质感，限量印刷',
  xerox_zine: '复印机黑白 Zine 风格，硬朗高对比，墨粉颗粒，做旧格调',
  vintage_film: '老胶片插画风格，复古暖调，胶片颗粒，柔和光晕',
  minimal_poster: '极简纸感海报风格，诗性负空间，大留白，微编辑排版',
  photoreal: '忠实还原原照片的写实插画，保留真实光影与色彩，细腻还原',
  woodblock_print: '木版画风格，粗粝木刻线条与块面，单色黑白，复古质感',
  linocut: '麻胶版画风格，硬朗刀痕，黑白强对比，手工印刷',
  screen_print: '丝网印刷风格，套色错位，半色调网点，复古平面',
  watercolor_wash: '水彩渲染风格，大面积湿画法，颜色晕染流动，透明度高',
  pastel: '粉彩画风格，柔和粉彩笔触，哑光质感，奶油色系',
  collage: '混合材料拼贴艺术，多种肌理叠加，纸张剪贴，手工感',
  silk_ink: '绢本水墨风格，宣纸绢本质地，淡墨渲染，意韵文人画',
  zine_comic: 'Zine 漫画风格，粗线条，叙事分镜感，黑白硬朗',
  stamp_print: '印章拓印风格，手工印章拓印肌理，斑驳墨迹，复古',
  polaroid_transfer: '宝丽来照片转印风格，银盐质感，怀旧褪色，边缘柔和',
  linen_texture: '亚麻布纹理插画，布面油画编织质感，哑光厚涂',
  frosted_glass: '磨砂玻璃风格，朦胧柔光，虚化前景，梦幻色调',
  washi_paper: '和纸贴金风格，和纸纤维纹理，金箔点缀，东方雅致',
  typewriter: '老式打字机复刻风格，字符压痕，纸纹，复古文献感',
  postage_stamp: '邮票边缘插画风格，齿孔边缘，复古色调，斑驳油墨',
};

// 风格 -> 通用质感（旧 key 兼容，未命中的 key 平滑用默认）
const STYLE_FALLBACK = '手绘水彩插画风格，透明水彩晕染，水痕斑驳，纸张纹理，细腻笔触，低饱和柔和色彩，艺术插画';

// 默认模型
const DEFAULT_MODEL = 'doubao-seedream-4-5-251128';
const MODEL_MAP = {
  'seedream-4.5': 'doubao-seedream-4-5-251128',
  'seedream-5.0': 'doubao-seedream-5-0-260128',
  'flux': 'doubao-seedream-5-0-260128',
};

// 字体族：柔和手写感（霞鹜文楷）+ 中文回退。
// 注意：librsvg/pango 对字体「名字」的解析不稳定（LXGWWenKai-Regular 名字匹配不到），
// 因此优先使用字体文件的「绝对路径」来确保中文一定能渲染，再回退到系统文泉驿。
// 霞鹜文楷已安装到系统，使用其 family name（librsvg/pango 按 family name，而非字体文件路径匹配）
const LXGW_FAMILY = '\'LXGW WenKai\'';
const FONT_SERIF = `${LXGW_FAMILY}, 'WenQuanYi Micro Hei', 'Noto Serif CJK SC', serif`;
const FONT_CN = `${LXGW_FAMILY}, 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'Noto Sans CJK SC', sans-serif`;

// 中文标题 -> 英文标题：内置常用词汇字典 + 英文原样保留 + 拼音回退
const CN_EN_DICT = {
  '冰岛': 'Iceland', '成都': 'Chengdu', '白鹭湾': 'Egret Bay', '海边': 'Seaside',
  '湖泊': 'Lake', '湖': 'Lake', '山': 'Mountain', '海': 'Sea', '森林': 'Forest',
  '树': 'Trees', '柳树': 'Willow', '日落': 'Sunset', '日出': 'Sunrise', '晨光': 'Morning Light',
  '旅行': 'Travel', '游记': 'Travel Notes', '手记': 'Notes', '时光': 'Time', '记忆': 'Memory',
  '风': 'Breeze', '雨': 'Rain', '云': 'Clouds', '雪': 'Snow', '海风': 'Sea Breeze',
  '草原': 'Grassland', '沙漠': 'Desert', '城市': 'City', '码头': 'Pier', '灯塔': 'Lighthouse',
  '小镇': 'Town', '村庄': 'Village', '花': 'Flower', '荷': 'Lotus', '月': 'Moon',
  '夜': 'Night', '黄昏': 'Dusk', '清晨': 'Dawn', '春': 'Spring', '夏': 'Summer',
  '秋': 'Autumn', '冬': 'Winter', '白鹭': 'Egret', '湾': 'Bay', '来信': 'Letter',
};
function toEnglishTitle(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  // 纯英文/数字标题原样保留
  if (/^[A-Za-z0-9\s\-—.,'’:&]+$/.test(s)) return s;
  // 中英混合：按词贪心最长匹配翻译，无法翻译的保留原样
  const out = [];
  let seg = '';
  const flush = () => {
    if (!seg) return;
    // 贪心最长分词：从段首尝试匹配字典里最长的 key
    let i = 0;
    const words = [];
    const keys = Object.keys(CN_EN_DICT).sort((a, b) => b.length - a.length);
    while (i < seg.length) {
      let matched = null;
      for (const k of keys) {
        if (k.length > 0 && seg.startsWith(k, i)) { matched = k; break; }
      }
      if (matched) { words.push(CN_EN_DICT[matched]); i += matched.length; }
      else { words.push(seg[i]); i += 1; }
    }
    for (const w of words) { if (w) { out.push(w); } }
    seg = '';
  };
  for (const ch of s) {
    if (/[\u4e00-\u9fff]/.test(ch)) {
      seg += ch;
    } else {
      flush();
      if (ch.trim()) out.push(ch);
    }
  }
  flush();
  return out.join(' ').replace(/\s+/g, ' ').trim() || s;
}

// 比例 -> 画布像素尺寸（保持比例，最长边 1024）
function getSize(ratio) {
  if (!ratio) return { w: 1024, h: 1024 };
  const w = ratio.width || ratio.w || 1;
  const h = ratio.height || ratio.h || 1;
  const max = 1024;
  if (w >= h) {
    return { w: max, h: Math.round(max * h / w) };
  } else {
    return { w: Math.round(max * w / h), h: max };
  }
}

// 中文字符需要宽一点（半角）
function esc(s) {
  return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// 在指定位置绘制一个方正的色块（用户指定的标准矩形，非不规则笔刷）
function brushSwatch(x, y, size, color) {
  const s = size;
  return `<g>
    <rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${Math.round(s * 0.06)}" fill="${color}" opacity="0.94"/>
    <rect x="${x + s * 0.06}" y="${y + s * 0.06}" width="${s * 0.88}" height="${s * 0.88}" rx="${Math.round(s * 0.04)}" fill="${color}" opacity="0.35"/>
  </g>`;
}

// 从参考照片提取 3 个主色（用于正面左侧色块）
async function extractPalette(imgBuf) {
  try {
    const raw = await sharp(imgBuf).resize(24, 24, { fit: 'fill' }).removeAlpha().raw().toBuffer();
    const n = 24 * 24;
    const pixels = [];
    for (let i = 0; i < n; i++) pixels.push([raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]]);
    let cents = [pixels[0], pixels[Math.floor(n / 2)], pixels[n - 1]];
    for (let it = 0; it < 8; it++) {
      const groups = [[], [], []];
      for (const p of pixels) {
        let bi = 0, bd = 1e9;
        for (let c = 0; c < 3; c++) {
          const d = (p[0] - cents[c][0]) ** 2 + (p[1] - cents[c][1]) ** 2 + (p[2] - cents[c][2]) ** 2;
          if (d < bd) { bd = d; bi = c; }
        }
        groups[bi].push(p);
      }
      for (let c = 0; c < 3; c++) {
        if (!groups[c].length) continue;
        const m = [0, 0, 0];
        for (const p of groups[c]) { m[0] += p[0]; m[1] += p[1]; m[2] += p[2]; }
        cents[c] = [Math.round(m[0] / groups[c].length), Math.round(m[1] / groups[c].length), Math.round(m[2] / groups[c].length)];
      }
    }
    return cents.map(c => '#' + c.map(x => x.toString(16).padStart(2, '0')).join('')).join(',');
  } catch (e) {
    return '#A8C4DA,#2E4A66,#E2D8C9';
  }
}

// 生成背面左侧主体轮廓线稿（AI），仅勾勒轮廓，无任何文字
function buildBackLinePrompt(body) {
  const { style } = body;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_FALLBACK;
  return `根据参考照片绘制一张纯粹的素描线稿插画：精确提取参考照片中占据视觉中心、最能代表画面气质的那一个主体景物，忠实按照照片中该主体的真实形态、朝向、比例与细节，用流畅的黑色铅笔/炭笔线条勾勒其外轮廓与内部结构，线条纤细优雅，适当留白，单色（深灰/墨色），背景为干净白色，大量留白。注意：画面主体必须是参考照片里的那个景物本身，不要添加照片中不存在的任何其他事物。这是作为明信片背面左侧的装饰线稿，画面中绝对不能出现任何文字、字母、数字、标点、标志、logo，绝对不能出现任何文字。整体克制的日系旅行手账风格。`
    .replace(/\s+/g, ' ').trim();
}

// 生成正面右侧插画（AI），基于原片创作主体插画，无文字
function buildFrontArtPrompt(body) {
  const { style, title, location, date } = body;
  const stylePrompt = STYLE_PROMPTS[style] || STYLE_FALLBACK;
  const titleText = title ? `主题为 "${esc(String(title).replace(/\n/g, ' '))}"` : '';
  return `根据参考照片创作一幅克制的手绘插画：严格忠实参考照片的构图、视角、主体、远近与色彩关系，将照片中最具视觉吸引力、最能代表画面气质的单一主景物（必须是照片里真实存在的那一个主体景物，按其真实形态与细节刻画）转化为${stylePrompt}。插画与原片主体高度相似、可辨认，只是转换为插画质感。画面带不规则水彩淡墨晕染毛边，颜料扩散斑驳水痕，半透明水彩质感，同色系柔和低饱和，边缘留白。${titleText}。这是明信片正面的插画部分，由程序自动排版，画面中绝对不能出现任何文字、字母、数字、标点、符号、标志或水印，绝对不能出现任何文字。`
    .replace(/\s+/g, ' ').trim();
}

// 正面合成：左侧文字信息栏（DOM 精确排版）+ 右侧插画
async function composeFront({ artBuffer, body, canvasW, canvasH }) {
  const { title, location, date } = body;
  const leftW = Math.round(canvasW * 0.35);
  const rightX = leftW;

  // 右侧插画铺满
  const artSized = await sharp(artBuffer)
    .resize(canvasW - leftW, canvasH, { fit: 'cover' })
    .png().toBuffer();

  // 左侧文字栏 SVG（可靠排版，绝不写 prompt 参数）
  const pad = Math.round(leftW * 0.22);
  const lineColor = '#2C241E';
  const subColor = '#8A7B6A';
  const labelColor = '#9B8B78';
  const swatch = body._palette ? body._palette.split(',').map(s => s.trim()) : ['#A8C4DA', '#2E4A66', '#E2D8C9'];

  const enTitle = title && String(title).trim() ? toEnglishTitle(String(title).trim()) : '';
  // 用户未填标题时留空（不输出 UNTITLED、不混入日期/地点）
  const titleText = esc(enTitle || '');
  const locText = esc(location && String(location).trim() ? String(location).trim() : '');
  const dateText = esc(date && String(date).trim() ? String(date).trim() : '');

  const swatchY = Math.round(canvasH * 0.78);
  const swatchSize = Math.max(24, Math.round(leftW * 0.15));

  // 文字可能很长，做简单换行
  function wrapLines(t, maxChars) {
    if (!t) return [];
    const arr = [];
    let cur = '';
    for (const ch of t) {
      if ((cur.length + 1) > maxChars) { arr.push(cur); cur = ch; }
      else cur += ch;
    }
    if (cur) arr.push(cur);
    return arr;
  }

  // 字段块：标签在上，横线在下，值写在横线上方（unfilled 则为空横线）
  function fieldBlock(label, value, y, fontSize) {
    const vfs = Math.round(fontSize * 0.9);
    const labelY = y;
    const lineY = y + Math.round(fontSize * 1.3);
    const valY = lineY - Math.round(vfs * 0.55);
    return `
    <text x="${pad}" y="${labelY}" font-family="${FONT_CN}" font-size="${fontSize}" fill="${labelColor}">${label}</text>
    ${value ? `<text x="${pad}" y="${valY}" font-family="${FONT_CN}" font-size="${vfs}" fill="${subColor}">${value}</text>` : ''}
    <line x1="${pad}" y1="${lineY}" x2="${leftW - pad}" y2="${lineY}" stroke="${labelColor}" stroke-width="1"/>`;
  }

  const titleLines = wrapLines(titleText, 9).slice(0, 3);
  const titleFontSize = Math.round(leftW * 0.085);
  // 标题起始位置：001 线下方留白
  let titleSvg = '';
  let ty = Math.round(canvasH * 0.28);
  for (const ln of titleLines) {
    titleSvg += `<text x="${pad}" y="${ty}" font-family="${FONT_CN}" font-size="${titleFontSize}" fill="${lineColor}">${ln}</text>`;
    ty += Math.round(titleFontSize * 1.4);
  }

  // 001 缩小
  const num001Size = Math.round(leftW * 0.07);
  const num001Y = Math.round(canvasH * 0.11);
  const num001LineY = num001Y + Math.round(num001Size * 1.4);

  // 字段底部长横线（贯穿左栏，与标题/色块分隔）
  const fieldTopY = Math.round(canvasH * 0.50);
  const fieldStep = Math.round(canvasH * 0.11);
  const locBlock = fieldBlock('LOCATION', locText, fieldTopY, Math.round(leftW * 0.05));
  const dateBlock = fieldBlock('DATE', dateText, fieldTopY + fieldStep, Math.round(leftW * 0.05));

  const svg = `<svg width="${leftW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
    <rect width="100%" height="100%" fill="#F5EEE0"/>
    <text x="${pad}" y="${num001Y}" font-family="${FONT_CN}" font-size="${num001Size}" fill="${lineColor}">001</text>
    <line x1="${pad}" y1="${num001LineY}" x2="${leftW - pad}" y2="${num001LineY}" stroke="${lineColor}" stroke-width="1"/>
    ${titleSvg}
    ${locBlock}
    ${dateBlock}
    ${brushSwatch(pad, swatchY, swatchSize, swatch[0])}
    ${brushSwatch(pad + swatchSize + 14, swatchY, swatchSize, swatch[1])}
    ${brushSwatch(pad + (swatchSize + 14) * 2, swatchY, swatchSize, swatch[2])}
  </svg>`;
  const svgBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  return await sharp({ create: { width: canvasW, height: canvasH, channels: 3, background: { r: 245, g: 238, b: 224 } } })
    .composite([
      { input: artSized, left: rightX, top: 0 },
      { input: svgBuf, left: 0, top: 0 },
    ])
    .png().toBuffer();
}

// 背面合成：左上邮编框 + 右上邮票 + 左侧主体线稿 + 右侧留言(从上多排空两格) + 地址最下
async function composeBack({ lineBuffer, body, canvasW, canvasH }) {
  const { backMessage } = body;
  const leftHalfW = Math.round(canvasW * 0.42);
  const rightX = Math.round(canvasW * 0.50);

  // 左侧线稿(已透明背景)直接铺在明信片底上，严格限制在左侧分隔线以内（不越界到右侧）
  // 分隔线在 canvasW*0.42，故线稿占宽不超过 0.40，left 取 0.02 使右边缘落在 0.42 内
  const lineW = Math.round(canvasW * 0.38);
  const lineH = Math.round(canvasH * 0.62);
  const lineLeft = Math.round(canvasW * 0.02);
  const lineTop = Math.round(canvasH * 0.18);
  const lineSized = await sharp(lineBuffer)
    .resize(lineW, lineH, { fit: 'fill', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer();

  const boxSize = Math.round(canvasW * 0.030);
  const boxGap = Math.round(boxSize * 0.28);
  const zipY = Math.round(canvasH * 0.08);
  const zipX = Math.round(canvasW * 0.045);

  let zipSvg = '';
  for (let i = 0; i < 6; i++) {
    zipSvg += `<rect x="${zipX + i * (boxSize + boxGap)}" y="${zipY}" width="${boxSize}" height="${boxSize}" fill="none" stroke="#C39A6B" stroke-width="1.5"/>`;
  }

  const stampSize = Math.round(canvasW * 0.075);
  const stampGap = Math.round(canvasW * 0.03);
  const stampX = canvasW - Math.round(canvasW * 0.045) - stampSize;
  const stampY = zipY;

  // 留言区：右栏上方，多排，从第一排空两格开始书写（邮票区下方避开）
  const mailX = rightX;
  const mailW = canvasW - rightX - Math.round(canvasW * 0.04);
  const mailTop = Math.round(canvasH * 0.36);
  const lineGap = Math.round(canvasH * 0.11);
  const msg = esc(backMessage && String(backMessage).trim() ? String(backMessage).trim() : '');
  const fontSize = Math.round(canvasH * 0.042);
  const indentW = fontSize * 2; // 空两格（两个汉字宽度）
  let mailLines = '';
  for (let i = 0; i < 4; i++) {
    const y = mailTop + i * lineGap;
    const x = i === 0 ? mailX + Math.round(canvasW * 0.02) + indentW : mailX + Math.round(canvasW * 0.02);
    mailLines += `<text x="${x}" y="${y}" font-family="${FONT_CN}" font-size="${fontSize}" fill="#6B5F53">${esc(msg.split('\n').slice(0, 4)[i] || '')}</text>`;
  }
  // 留言横线
  let mlines = '';
  for (let i = 0; i < 5; i++) {
    const y = mailTop + i * lineGap;
    mlines += `<line x1="${mailX}" y1="${y}" x2="${canvasW - Math.round(canvasW * 0.04)}" y2="${y}" stroke="#D9CCBB" stroke-width="1"/>`;
  }

  // 地址栏：最下方
  const addrY = Math.round(canvasH * 0.80);
  const addrLabel = esc('TO · 收件人地址');
  const addrText = esc('POSTAL ADDRESS');
  const addrSvg = `
    <text x="${mailX}" y="${addrY}" font-family="${FONT_CN}" font-size="${Math.round(canvasH * 0.022)}" fill="#8A7B6A">${addrLabel}</text>
    <line x1="${mailX}" y1="${addrY + 8}" x2="${canvasW - Math.round(canvasW * 0.04)}" y2="${addrY + 8}" stroke="#2C241E" stroke-width="1"/>
    <line x1="${mailX}" y1="${addrY + 20}" x2="${canvasW - Math.round(canvasW * 0.04)}" y2="${addrY + 20}" stroke="#D9CCBB" stroke-width="1"/>
    <line x1="${mailX}" y1="${addrY + 34}" x2="${canvasW - Math.round(canvasW * 0.04)}" y2="${addrY + 34}" stroke="#D9CCBB" stroke-width="1"/>
  `;

  const svg = `<svg width="${canvasW}" height="${canvasH}" xmlns="http://www.w3.org/2000/svg">
    ${zipSvg}
    <rect x="${stampX}" y="${stampY}" width="${stampSize}" height="${stampSize}" fill="none" stroke="#C39A6B" stroke-width="1.5"/>
    <line x1="${Math.round(canvasW * 0.42)}" y1="${Math.round(canvasH * 0.06)}" x2="${Math.round(canvasW * 0.42)}" y2="${Math.round(canvasH * 0.90)}" stroke="#DCCDB8" stroke-width="1" stroke-dasharray="4 4"/>
    ${mlines}
    ${mailLines}
    ${addrSvg}
  </svg>`;
  const svgBuf = await sharp(Buffer.from(svg)).png().toBuffer();

  // 底线稿放左半（SVG 应为透明底，不遮挡线稿），严格限制在左侧分隔线以内
  return await sharp({ create: { width: canvasW, height: canvasH, channels: 4, background: { r: 251, g: 246, b: 236, alpha: 1 } } })
    .composite([
      { input: lineSized, left: lineLeft, top: lineTop },
      { input: svgBuf, left: 0, top: 0 },
    ])
    .png().toBuffer();
}

// 处理图片：返回 base64 data URL（SDK 跳过 URL 可达性校验，对象存储签名 URL HEAD 会 403）
async function processImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith('/upload/')) {
    const uploadDir = process.env.UPLOAD_DIR || '/tmp/zine-upload';
    const filename = imageUrl.replace('/upload/', '');
    const filePath = path.join(uploadDir, filename);
    try {
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        return `data:${contentType};base64,${fileBuffer.toString('base64')}`;
      } else {
        console.error('[processImageUrl] file not found:', filePath);
        return null;
      }
    } catch (err) {
      console.error('[processImageUrl] read error:', err.message);
      return null;
    }
  }
  return imageUrl;
}

async function modelGenerate(body, client, prompt, size) {
  const generateReq = { prompt, model: body._model, size, watermark: false, responseFormat: 'b64_json' };
  if (body.imageUrl) {
    try {
      const processed = await processImageUrl(body.imageUrl);
      if (processed) generateReq.image = processed;
    } catch (imgErr) {
      console.error('[Generation] image error:', imgErr.message);
    }
  }
  const response = await client.generate(generateReq);
  const helper = client.getResponseHelper(response);
  if (!helper.success) {
    throw new Error(helper.errorMessages?.[0] || '生成失败');
  }
  const b64 = helper.imageB64List[0];
  if (!b64) throw new Error('生成返回数据异常');
  return Buffer.from(b64, 'base64');
}

// 同步生成接口
// 从用户原图提取"透明背景黑线"的真实素描线稿（描摹主体轮廓，必基于用户图片，直接画在明信片底上）
async function extractLineArtFromImage(imgBuf) {
  try {
    const meta = await sharp(imgBuf).metadata();
    // 用较高分辨率提取，保留细节；再经过合成时的缩放仍能保持线条浓度
    const W = 900;
    const H = Math.max(1, Math.round((meta.height || 900) * W / (meta.width || 1200)));
    // 1) 灰度（轻模糊，保留主体轮廓，弱化噪点）
    const gray = await sharp(imgBuf).resize(W, H, { fit: 'fill' }).grayscale().blur(0.7).toBuffer();
    // 2) 边缘检测（Sobel 组合）
    const horiz = await sharp(gray).convolve({ width: 3, height: 3, kernel: [-1, 0, 1, -2, 0, 2, -1, 0, 1] }).normalise().toBuffer();
    const vert = await sharp(gray).convolve({ width: 3, height: 3, kernel: [-1, -2, -1, 0, 0, 0, 1, 2, 1] }).normalise().toBuffer();
    // 3) 边缘强度相加 + 归一化
    const edges = await sharp(horiz).composite([{ input: vert, blend: 'add' }]).normalise().toBuffer();
    // 4) 自适应分位数阈值：保留约 55% 较强边缘作为线稿骨架（线条丰富、有造型）
    const { data } = await sharp(edges).greyscale().raw().toBuffer({ resolveWithObject: true });
    const arr = Array.from(data).sort((a, b) => a - b);
    const N = arr.length;
    const thr = arr[Math.max(0, Math.floor(N * 0.45))];
    // 5) 构造透明背景纯黑线稿：高于阈值的边缘 -> 纯黑不透明线条（保证合成缩放后依然深色），其余全透明
    const out = Buffer.alloc(N * 4);
    for (let i = 0; i < N; i++) {
      const g = data[i];
      if (g >= thr) {
        out[i * 4] = 26;       // R 深墨（近黑）
        out[i * 4 + 1] = 22;   // G
        out[i * 4 + 2] = 18;   // B
        out[i * 4 + 3] = 255;  // A 完全不透明，缩放/合成不变淡
      }
    }
    return await sharp(out, { raw: { width: W, height: H, channels: 4 } })
      // 膨胀让线条更连贯、更粗、更有造型（避免断点和过细）
      .dilate(2)
      .png().toBuffer();
  } catch (e) {
    console.warn('[extractLineArtFromImage] failed:', e.message);
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const body = req.body || {};
    const modelKey = body.provider?.model || body.model || 'seedream-4.5';
    const model = MODEL_MAP[modelKey] || DEFAULT_MODEL;
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);
    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);
    body._model = model;
    // 用户显式填了标题才保留（AI 拟题仅基于主题/风格，绝不混入日期地点；未填则标题留空）
    body.title = body.title && String(body.title).trim() ? String(body.title).trim() : '';

    const isDouble = body.mode === 'POSTCARD' && body.sides === 'FRONT_BACK';
    const { w: canvasW, h: canvasH } = getSize(body.ratio);

    // 尺寸：为提取主色，先读取参考照片
    let palette = '#A8C4DA,#2E4A66,#E2D8C9';
    if (body.imageUrl) {
      try {
        const imgData = await processImageUrl(body.imageUrl);
        if (imgData) {
          const imgBuf = Buffer.from(imgData.split(',')[1], 'base64');
          palette = await extractPalette(imgBuf);
        }
      } catch (e) { /* ignore */ }
    }
    body._palette = palette;
    console.log('[Generation] palette:', palette);

    // ---- 1) 正面：生成插画素材 （与背面线稿提取并行，降低等待） ----
    const [frontArtBuf, extractedBackLine] = await Promise.all([
      modelGenerate(body, client, buildFrontArtPrompt(body), `${canvasW - Math.round(canvasW * 0.35)}x${canvasH}`),
      (async () => {
        if (!isDouble || !body.imageUrl) return null;
        try {
          const imgData = await processImageUrl(body.imageUrl);
          if (!imgData) return null;
          const imgBuf = Buffer.from(imgData.split(',')[1], 'base64');
          return await extractLineArtFromImage(imgBuf);
        } catch (e) {
          console.warn('[Generation] no back lineart from image, fallback AI:', e.message);
          return null;
        }
      })(),
    ]);

    // ---- 2) 背面（仅双面）：优先用原图线稿，否则 AI 生成 ----
    let backLineBuf = extractedBackLine;
    if (isDouble && !backLineBuf) {
      backLineBuf = await modelGenerate(body, client, buildBackLinePrompt(body), `${Math.round(canvasW * 0.6)}x${canvasH}`);
    }

    // ---- 3) sharp 合成正/背面 ----
    const frontBuffer = await composeFront({ artBuffer: frontArtBuf, body, canvasW, canvasH });

    let backUrl = null;
    let backBuffer = null;
    if (isDouble && backLineBuf) {
      backBuffer = await composeBack({ lineBuffer: backLineBuf, body, canvasW, canvasH });
    }

    // ---- 4) 上传 ----
    const ts = Date.now();
    const frontKey = await storage.uploadFile({ fileContent: frontBuffer, fileName: `postcard/front_${ts}.png`, contentType: 'image/png' });
    const frontUrl = await storage.generatePresignedUrl({ key: frontKey, expireTime: 86400 });
    if (backBuffer) {
      const backKey = await storage.uploadFile({ fileContent: backBuffer, fileName: `postcard/back_${ts}.png`, contentType: 'image/png' });
      backUrl = await storage.generatePresignedUrl({ key: backKey, expireTime: 86400 });
    }

    console.log('[Generation] success, front:', frontUrl.substring(0, 60) + '...');

    res.json({
      code: 200,
      msg: 'ok',
      data: { status: 'SUCCEEDED', result: { frontUrl, backUrl } },
    });
  } catch (error) {
    console.error('[Generation] error:', error.message);
    res.status(500).json({ code: 500, msg: error.message || '生成服务异常' });
  }
});

// 兼容旧的轮询接口
router.get('/:taskId', (req, res) => {
  res.json({ code: 200, msg: 'ok', data: { status: 'SUCCEEDED', result: { frontUrl: '' } } });
});

export default router;
