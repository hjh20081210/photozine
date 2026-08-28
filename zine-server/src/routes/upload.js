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
