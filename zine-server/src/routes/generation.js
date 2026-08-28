import { Router } from 'express';
import { ImageGenerationClient, Config, HeaderUtils } from 'coze-coding-dev-sdk';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// 任务存储（内存）
const tasks = new Map();

// 内置免费模型映射（SDK 模型名）
const SDK_MODEL_MAP = {
  'seedream-4.5': 'doubao-seedream-4-5-251128',
  'seedream-5.0': 'doubao-seedream-5-0-260128',
  'doubao-seedream-4-5-251128': 'doubao-seedream-4-5-251128',
  'doubao-seedream-5-0-260128': 'doubao-seedream-5-0-260128',
};

// 尺寸映射
function getSize(ratio) {
  if (!ratio) return '1152x1536';
  // ratio: { width: 3, height: 4 } 或字符串 '3:4'
  let w, h;
  if (ratio.width && ratio.height) {
    w = ratio.width;
    h = ratio.height;
  } else if (typeof ratio === 'string' && ratio.includes(':')) {
    [w, h] = ratio.split(':').map(Number);
  } else {
    return '1152x1536';
  }
  // 基于比例计算尺寸（长边约1536）
  const longSide = 1536;
  const shortSide = Math.round(longSide * Math.min(w, h) / Math.max(w, h));
  // 确保是 32 的倍数（模型要求）
  const round32 = (n) => Math.round(n / 32) * 32;
  if (w >= h) {
    return `${round32(longSide)}x${round32(shortSide)}`;
  } else {
    return `${round32(shortSide)}x${round32(longSide)}`;
  }
}

// 构建风格 prompt 前缀
const STYLE_PROMPTS = {
  watercolor: 'watercolor painting style, soft brush strokes, delicate colors, artistic paper texture, ',
  woodcut: 'woodcut print style, bold black outlines, flat color blocks, graphic poster art, ',
  risograph: 'risograph print, retro grain texture, limited color palette, zine aesthetic, vintage print feel, ',
  polaroid: 'polaroid photo style, film grain, warm vintage tones, instant photo border, nostalgic feel, ',
};

// 构建 prompt
function buildPrompt(data) {
  const { mode, style, title, location, date, backMessage } = data;
  const stylePrefix = STYLE_PROMPTS[style] || '';
  
  let prompt = stylePrefix;
  
  if (mode === 'POSTCARD') {
    prompt += 'vintage postcard design, ';
    if (title) prompt += `with the text "${title}" as title, `;
    if (location) prompt += `with location "${location}", `;
    if (date) prompt += `with date "${date}", `;
    prompt += 'postcard layout, artistic, high quality illustration, ';
  } else {
    prompt += 'minimalist poster design, clean composition, ';
    if (title) prompt += `with the text "${title}" featured prominently, `;
    prompt += 'modern graphic design, high quality, ';
  }
  
  return prompt;
}

// 异步执行生成任务
async function runTask(taskId, data, customHeaders) {
  const task = tasks.get(taskId);
  if (!task) return;

  try {
    task.status = 'PROCESSING';
    task.message = '正在生成正面…';

    const config = new Config();
    const client = new ImageGenerationClient(config, customHeaders);

    const sdkModel = SDK_MODEL_MAP[data.provider?.model] || 'doubao-seedream-4-5-251128';
    const size = getSize(data.ratio);
    const prompt = buildPrompt(data);
    
    // 图生图或文生图
    const generateParams = {
      prompt,
      model: sdkModel,
      size,
      responseFormat: 'url',
    };
    
    // 如果有上传的图片，用图生图
    if (data.imageUrl) {
      generateParams.image = data.imageUrl;
    }

    console.log(`[task ${taskId}] generating front, model=${sdkModel}, size=${size}`);

    // 正面生成
    const frontResp = await client.generate(generateParams);
    const frontHelper = client.getResponseHelper(frontResp);
    
    if (!frontHelper.success) {
      throw new Error(frontHelper.errorMessages.join(', ') || '正面生成失败');
    }

    const frontUrl = frontHelper.imageUrls[0];
    task.message = '正面生成完成，正在生成背面…';
    task.progress = 50;

    // 背面生成（POSTCARD 模式才需要）
    let backUrl = null;
    let backMime = null;
    if (data.sides === 'both' && data.mode === 'POSTCARD') {
      const backPrompt = `${STYLE_PROMPTS[data.style] || ''}vintage postcard back side design, divided layout with address lines and stamp area, decorative border, classic postcard back`;
      const backResp = await client.generate({
        ...generateParams,
        prompt: backPrompt,
        // 背面翻转宽高
        size: size.split('x').reverse().join('x'),
      });
      const backHelper = client.getResponseHelper(backResp);
      if (backHelper.success) {
        backUrl = backHelper.imageUrls[0];
        backMime = 'image/jpeg';
      }
    }

    task.status = 'SUCCEEDED';
    task.message = '生成完成';
    task.progress = 100;
    task.result = {
      frontUrl,
      frontMime: 'image/jpeg',
      backUrl,
      backMime,
    };
    
    console.log(`[task ${taskId}] success`);
  } catch (error) {
    console.error(`[task ${taskId}] failed:`, error.message);
    task.status = 'FAILED';
    task.message = error.message || '生成失败';
  }

  // 任务结果保留 30 分钟
  setTimeout(() => {
    tasks.delete(taskId);
  }, 30 * 60 * 1000);
}

/**
 * 提交生成任务
 * POST /api/generation/
 */
router.post('/', (req, res) => {
  try {
    const data = req.body || {};
    
    const taskId = uuidv4().replace(/-/g, '');
    const customHeaders = HeaderUtils.extractForwardHeaders(req.headers);
    
    const task = {
      id: taskId,
      status: 'PENDING',
      message: '任务已提交，正在排队…',
      progress: 0,
      createdAt: Date.now(),
      result: null,
    };
    
    tasks.set(taskId, task);
    
    // 异步执行
    setImmediate(() => runTask(taskId, data, customHeaders));
    
    res.json({
      taskId,
      status: 'PENDING',
    });
  } catch (error) {
    console.error('[generation submit error]', error.message);
    res.status(500).json({
      status: 'FAILED',
      message: error.message || '提交失败',
    });
  }
});

/**
 * 查询任务状态
 * GET /api/generation/:taskId
 */
router.get('/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = tasks.get(taskId);
  
  if (!task) {
    return res.status(404).json({
      status: 'FAILED',
      message: '任务不存在',
    });
  }
  
  res.json({
    id: task.id,
    status: task.status,
    message: task.message,
    progress: task.progress,
    result: task.result,
  });
});

export default router;
