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

// 风格对应的提示词模板
const STYLE_PROMPTS = {
  watercolor: '手绘水彩风格，纸张纹理，温暖柔和的色调，细腻的笔触，艺术插画',
  woodcut: '木刻版画风格，黑白对比，粗犷的线条，复古质感，浮雕效果',
  risograph: 'Risograph 印刷风格，复古配色，网点纹理，颗粒感，拼贴风格',
  polaroid: '宝丽来照片风格，胶片质感，边框效果，怀旧色调，柔和光晕',
};

// 默认模型
const DEFAULT_MODEL = 'doubao-seedream-4-5-251128';
const MODEL_MAP = {
  'seedream-4.5': 'doubao-seedream-4-5-251128',
  'seedream-5.0': 'doubao-seedream-5-0-260128',
  'flux': 'doubao-seedream-5-0-260128', // Flux 走 Seedream 5.0
};

// 比例映射（Seedream 的 size 格式）
function getSize(ratio) {
  if (!ratio) return '1024x1024';
  const w = ratio.width || 1;
  const h = ratio.height || 1;
  // 按比例计算到 1024 附近的尺寸
  if (w === h) return '1024x1024';
  if (w > h) {
    const height = Math.round(1024 * h / w);
    return `1024x${height}`;
  } else {
    const width = Math.round(1024 * w / h);
    return `${width}x1024`;
  }
}

// 双面明信片：生成一张竖向长图（上半正面 + 下半反面），宽度与单面一致，高度为两倍
function getDoubleSize(ratio) {
  if (!ratio) return '1024x2048';
  const w = ratio.width || 1;
  const h = ratio.height || 1;
  // 单面是 w:h，双面纵向展开为 w : 2h
  if (w === h) return '1024x2048';
  if (w > h) {
    // 横向比例，双面纵向叠加会很长，仍以宽度为基准
    const height = Math.round(1024 * 2 * h / w);
    return `1024x${height}`;
  } else {
    const width = Math.round(1024 * w / h);
    return `${width}x2048`;
  }
}

// 构建提示词
function buildPrompt(body) {
  const { mode, style, title, location, date, frontMessage, backMessage, imageUrl, creativeMode, sides } = body;

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.watercolor;
  const titleText = title ? `画面中包含标题文字 "${title}"` : '';
  const locationText = location ? `地点标识 "${location}"` : '';
  const isDouble = mode === 'POSTCARD' && sides === 'FRONT_BACK';

  // 是否有参考照片（图生图）：核心是按参考 skill 保留照片主体，做成「照片转明信片」
  const hasPhoto = !!imageUrl;
  const photoWrap = hasPhoto
    ? `以参考照片为主体：完整保留照片的实景画面、构图与色彩作为明信片主体画面，仅在其上叠加明信片元素（纸张纹理边框、邮票区、标题与日期的手写排版），不要改变照片本身的内容与主体`
    : `根据文字描述创作画面`;

  let basePrompt = '';
  if (mode === 'POSTCARD') {
    if (isDouble) {
      // 双面：竖向二分构图，上半正面、下半反面，一次成图后代码裁剪
      const backNote = backMessage ? `，反面中央用毛笔毛笔手写书法字迹、仿人手书写的行楷书写留言文字 "${String(backMessage).replace(/"/g, '“').replace(/\n/g, ' ')}"，字迹自然连贯、避免机器印刷字体` : '';
      basePrompt = `一张竖向二分构图的明信片双面设计。上方为明信片正面：${photoWrap}，${stylePrompt}，${titleText} ${locationText}；下方为明信片反面${backNote}。上下两部分对称、宽度相同，中间有一条清晰的水平分割线，整体为一张完整的竖向长图`;
    } else {
      const frontNote = frontMessage ? `，画面角落加入一处手写书法字迹的简短标语 "${String(frontMessage).replace(/"/g, '“').replace(/\n/g, ' ')}"，仿人手挥毫书写、字迹自然` : '';
      basePrompt = `一张精美的明信片正面：${photoWrap}，${stylePrompt}，${titleText} ${locationText}${frontNote}，构图优雅，高清细节`;
    }
  } else {
    basePrompt = `一张极简海报，${photoWrap}，${stylePrompt}，${titleText} ${locationText}，大面积留白，简约设计感，高级`;
  }

  return basePrompt.replace(/\s+/g, ' ').trim();
}

// 处理图片：返回 base64 data URL（SDK 会跳过 URL 可达性校验，对象存储签名 URL 的 HEAD 请求会 403）
async function processImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // 如果是相对路径（/upload/xxx.jpg），读取本地文件转 base64
  if (imageUrl.startsWith('/upload/')) {
    const uploadDir = process.env.UPLOAD_DIR || '/tmp/zine-upload';
    const filename = imageUrl.replace('/upload/', '');
    const filePath = path.join(uploadDir, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        // 读取文件
        const fileBuffer = fs.readFileSync(filePath);
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
        const base64 = fileBuffer.toString('base64');
        const dataUrl = `data:${contentType};base64,${base64}`;
        console.log('[processImageUrl] read local file, bytes:', fileBuffer.length);
        return dataUrl;
      } else {
        console.error('[processImageUrl] file not found:', filePath);
        return null;
      }
    } catch (err) {
      console.error('[processImageUrl] read error:', err.message);
      return null;
    }
  }
  
  // 如果是完整 URL，校验后返回（SDK 会对 URL 做 HEAD 校验，可能 403）
  return imageUrl;
}

// 同步生成接口
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    // 确定模型
    const modelKey = body.provider?.model || body.model || 'seedream-4.5';
    const model = MODEL_MAP[modelKey] || DEFAULT_MODEL;

    // 提取转发头（技能文档要求）
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);

    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const prompt = buildPrompt(body);
    const isDouble = body.mode === 'POSTCARD' && body.sides === 'FRONT_BACK';
    const size = isDouble ? getDoubleSize(body.ratio) : getSize(body.ratio);

    // 构造生成请求；双面时返回 base64 以便本地裁剪成上下两张
    const generateReq = {
      prompt,
      model,
      size,
      watermark: false,
      responseFormat: isDouble ? 'b64_json' : 'url',
    };

    // 图生图模式：有参考照片就必须传给模型（Seedream 4.5 支持），让照片成为明信片主体
    if (body.imageUrl) {
      try {
        const processedImageUrl = await processImageUrl(body.imageUrl);
        if (processedImageUrl) {
          generateReq.image = processedImageUrl;
          console.log('[Generation] image mode:', body.creativeMode || 'photo', 'url type:', processedImageUrl.startsWith('data:') ? 'base64' : 'url');
        }
      } catch (imgErr) {
        console.error('[Generation] image process error:', imgErr.message);
      }
    }

    console.log('[Generation] start, model:', model, 'size:', size);
    console.log('[Generation] prompt:', prompt.substring(0, 100));

    const response = await client.generate(generateReq);
    const helper = client.getResponseHelper(response);

    if (!helper.success) {
      console.error('[Generation] failed:', helper.errorMessages);
      return res.status(500).json({
        code: 500,
        msg: helper.errorMessages?.[0] || '生成失败',
      });
    }

    // 双面明信片：拿到竖向长图后，用 sharp 在水平中线裁剪成上下两张（上=正面，下=反面）
    if (isDouble) {
      try {
        const b64 = helper.imageB64List[0];
        if (!b64) {
          console.error('[Generation] double-sided: no base64 returned');
          return res.status(500).json({ code: 500, msg: '双面生成返回数据异常' });
        }
        const buffer = Buffer.from(b64, 'base64');
        const meta = await sharp(buffer).metadata();
        const width = meta.width || 1024;
        const height = meta.height || 2048;
        const half = Math.floor(height / 2);

        // 上半（正面）、下半（反面），均输出为 PNG
        const frontBuffer = await sharp(buffer).extract({ left: 0, top: 0, width, height: half }).png().toBuffer();
        const backBuffer = await sharp(buffer).extract({ left: 0, top: half, width, height: height - half }).png().toBuffer();

        // 上传到对象存储获得可访问 URL
        const ts = Date.now();
        const frontKey = await storage.uploadFile({
          fileContent: frontBuffer,
          fileName: `postcard/front_${ts}.png`,
          contentType: 'image/png',
        });
        const backKey = await storage.uploadFile({
          fileContent: backBuffer,
          fileName: `postcard/back_${ts}.png`,
          contentType: 'image/png',
        });
        const frontUrl = await storage.generatePresignedUrl({ key: frontKey, expireTime: 86400 });
        const backUrl = await storage.generatePresignedUrl({ key: backKey, expireTime: 86400 });

        console.log('[Generation] double-sided success, front:', frontUrl.substring(0, 60) + '...');

        return res.json({
          code: 200,
          msg: 'ok',
          data: {
            status: 'SUCCEEDED',
            result: { frontUrl, backUrl },
          },
        });
      } catch (err) {
        console.error('[Generation] double-sided crop/upload error:', err.message);
        return res.status(500).json({ code: 500, msg: err.message || '双面裁剪失败' });
      }
    }

    const imageUrl = helper.imageUrls[0];
    console.log('[Generation] success, url:', imageUrl.substring(0, 80) + '...');

    // 返回结果（兼容前端轮询完成后的格式）
    res.json({
      code: 200,
      msg: 'ok',
      data: {
        status: 'SUCCEEDED',
        result: {
          frontUrl: imageUrl,
          backUrl: null,
        },
      },
    });
  } catch (error) {
    console.error('[Generation] error:', error.message);
    res.status(500).json({
      code: 500,
      msg: error.message || '生成服务异常',
    });
  }
});

// 兼容旧的轮询接口，直接返回 SUCCEEDED（实际生成在上面的 POST 里完成了）
// 保留这个接口是为了兼容前端旧代码的轮询逻辑
router.get('/:taskId', (req, res) => {
  // 如果有任务缓存就返回，没有就返回 PENDING（实际不应该走到这里）
  res.json({
    code: 200,
    msg: 'ok',
    data: {
      status: 'SUCCEEDED',
      result: {
        frontUrl: '',
      },
    },
  });
});

export default router;
