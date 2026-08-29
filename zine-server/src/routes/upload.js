import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

const router = Router();

const uploadDir = process.env.UPLOAD_PATH || '/tmp/zine-upload';

// 确保上传目录存在
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = uuidv4().replace(/-/g, '') + ext;
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片文件'));
    }
  },
});

// 同源代理下载：解决前端 fetch 跨域签名 URL 被 CORS 拦截的问题
// 前端保存到相册时改为请求本端点，由后端代理拉取对象存储图片并回流
router.get('/proxy', async (req, res) => {
  const target = req.query.url;
  if (!target || typeof target !== 'string') {
    return res.status(400).json({ code: 400, msg: '缺少 url 参数', data: null });
  }

  // 仅允许代理本站对象存储的 presigned URL，防止 SSRF
  let targetHost = '';
  try {
    targetHost = new URL(target).hostname;
  } catch {
    return res.status(400).json({ code: 400, msg: '无效的 url', data: null });
  }

  const allowedHosts = new Set(
    [process.env.COZE_BUCKET_ENDPOINT_URL, process.env.COZE_BUCKET_PUBLIC_URL, process.env.COZE_BUCKET_DOMAIN]
      .filter(Boolean)
      .map((h) => {
        try {
          return new URL(h.includes('://') ? h : `https://${h}`).hostname;
        } catch {
          return '';
        }
      })
  );
  // 显式放行对象存储代理网关域名（presigned URL 通常由该网关签发）
  ['integration.coze.cn', 'coze.cn', 'coze.com'].forEach((d) => allowedHosts.add(d));
  // 也允许请求同源（本服务自己）
  allowedHosts.add(req.headers.host?.split(':')[0] || '');

  // 放行沙箱对象存储标准 CDN 域名（如 coze-coding-project.tos.coze.site 等 *.coze.site / *.tos.coze.site）
  const isCozeCdn =
    targetHost.endsWith('.coze.site') ||
    targetHost.endsWith('.coze.cn') ||
    targetHost.endsWith('.coze.com') ||
    targetHost.endsWith('.tos.coze.site');
  if (allowedHosts.size && !allowedHosts.has(targetHost) && !isCozeCdn) {
    return res.status(403).json({ code: 403, msg: '不允许代理该地址', data: null });
  }

  try {
    const upstream = await fetch(target);
    if (!upstream.ok) {
      return res.status(upstream.status).json({ code: upstream.status, msg: '代理拉取失败', data: null });
    }
    const contentType = upstream.headers.get('content-type') || 'application/octet-stream';
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${req.query.name || 'image.png'}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(buf);
  } catch (err) {
    console.error('[proxy error]', err.message);
    res.status(500).json({ code: 500, msg: err.message || '代理失败', data: null });
  }
});

// 文件上传
router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.json({
      code: 400,
      msg: '未找到上传的文件',
      data: null,
    });
  }

  const fileInfo = {
    url: `/upload/${req.file.filename}`,
    fileName: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype,
  };

  res.json({
    code: 200,
    msg: 'ok',
    data: fileInfo,
  });
});

// 错误处理
router.use((err, req, res, next) => {
  console.error('[upload error]', err.message);
  res.json({
    code: 500,
    msg: err.message || '上传失败',
    data: null,
  });
});

export default router;
