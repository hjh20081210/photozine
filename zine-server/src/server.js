import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import generationRouter from './routes/generation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
app.use(cors({
  origin: true,
  credentials: false,
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 静态资源 - 上传的文件
const uploadDir = process.env.UPLOAD_PATH || '/tmp/zine-upload';
app.use('/upload', express.static(uploadDir));

// 路由
app.use('/api/file', uploadRouter);
app.use('/api/generation', generationRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, msg: 'ok', data: { status: 'running' } });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[zine-server] 服务启动，监听端口 ${PORT}`);
  console.log(`[zine-server] 上传目录: ${uploadDir}`);
  console.log(`[zine-server] 健康检查: http://localhost:${PORT}/api/health`);
});
