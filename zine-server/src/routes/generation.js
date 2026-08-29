import { Router } from 'express';
import { ImageGenerationClient, Config, HeaderUtils, S3Storage } from 'coze-coding-dev-sdk';
import fs from 'fs';
import path from 'path';
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

// 构建提示词
function buildPrompt(body) {
  const { mode, style, title, location, date, frontMessage, backMessage, imageUrl, creativeMode } = body;

  const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.watercolor;
  const titleText = title ? `画面中包含标题文字 "${title}"` : '';
  const locationText = location ? `地点标识 "${location}"` : '';

  let basePrompt = '';
  if (mode === 'POSTCARD') {
    basePrompt = `一张精美的明信片正面，${stylePrompt}，${titleText} ${locationText}，构图优雅，艺术感强，高清细节`;
  } else {
    basePrompt = `一张极简海报，${stylePrompt}，${titleText} ${locationText}，大面积留白，简约设计感，高级`;
  }

  // 如果有参考图（图生图），加入风格转换描述
  if (imageUrl && creativeMode && creativeMode !== 'original') {
    if (creativeMode === 'handdraw' || creativeMode === 'hand_draw_2') {
      basePrompt += `，将参考图中的内容重新手绘成 ${stylePrompt} 风格，保留主体意境`;
    } else if (creativeMode === 'tricolor' || creativeMode === 'tri_sample') {
      basePrompt += `，将参考图内容抽象为三色块风格，保留构图和主体轮廓`;
    }
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
    const size = getSize(body.ratio);

    // 构造生成请求
    const generateReq = {
      prompt,
      model,
      size,
      watermark: false,
      responseFormat: 'url',
    };

    // 图生图模式：Seedream 4.5 支持图生图
    if (body.imageUrl && body.creativeMode && body.creativeMode !== 'original') {
      try {
        const processedImageUrl = await processImageUrl(body.imageUrl);
        if (processedImageUrl) {
          generateReq.image = processedImageUrl;
          console.log('[Generation] image mode:', body.creativeMode, 'url type:', processedImageUrl.startsWith('data:') ? 'base64' : 'url');
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
          backUrl: body.mode === 'POSTCARD' && body.sides === 'both' ? imageUrl : null,
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
