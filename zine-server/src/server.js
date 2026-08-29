import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRouter from './routes/upload.js';
import generationRouter from './routes/generation.js';
import historyRouter from './routes/history.js';
import authRouter from './routes/auth.js';
import feedbackRouter from './routes/feedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
// 使用 DEV_PORT 环境变量（沙箱主仓固定 5000），兼容旧的 PORT
const PORT = process.env.DEV_PORT || process.env.PORT || 5000;

// 访问日志
app.use((req, res, next) => {
  const start = Date.now()
  console.log(`[REQ] ${req.method} ${req.url}`)
  const origEnd = res.end
  res.end = function(chunk, encoding) {
    const ms = Date.now() - start
    console.log(`[RES] ${req.method} ${req.url} -> ${res.statusCode} (${ms}ms)`)
    origEnd.call(this, chunk, encoding)
  }
  next()
})

// CORS
app.use(cors({
  origin: true,
  credentials: false,
}));

// JSON body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ========== API 路由（先处理，避免被静态文件拦截） ==========
// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 200, msg: 'ok', data: { status: 'running' } });
});
// 文件上传
app.use('/api/file', uploadRouter);
// 图像生成
app.use('/api/generation', generationRouter);
// 历史记录
app.use('/api/history', historyRouter);
// 账号认证（注册/登录/GitHub OAuth/会话/用户管理）
app.use('/api/auth', authRouter);
// 意见反馈
app.use('/api/feedback', feedbackRouter);
// 上传的文件静态访问
const uploadDir = process.env.UPLOAD_PATH || '/tmp/zine-upload';
app.use('/upload', express.static(uploadDir));

// ========== 前端静态资源 ==========
const frontendDist = path.resolve(__dirname, '../../zine-app/dist/build/h5');
app.use(express.static(frontendDist, {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// SPA fallback — 所有非 API 的路径返回 index.html
app.get(/^(?!\/api\/|\/upload\/).*/, (req, res, next) => {
  // 跳过有扩展名的静态资源请求（交给 express.static 处理 404）
  if (path.extname(req.path)) return next();
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[zine-server] 服务启动，监听端口 ${PORT}`);
  console.log(`[zine-server] 上传目录: ${uploadDir}`);
  console.log(`[zine-server] 前端目录: ${frontendDist}`);
  console.log(`[zine-server] 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`[zine-server] 前端页面: http://localhost:${PORT}/`);
});
