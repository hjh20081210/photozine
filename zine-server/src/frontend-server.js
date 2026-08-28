import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.DEV_PORT || 5000;
const apiTarget = process.env.API_TARGET || 'http://127.0.0.1:8080';
const staticDir = path.join(__dirname, '..', '..', 'zine-app', 'dist', 'build', 'h5');

const app = express();

// API 反向代理
// Express app.use('/api', ...) 会自动去掉 /api 前缀，
// 所以需要用 pathRewrite 把 /api 加回来，确保转发到后端的完整路径
app.use('/api', createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  logLevel: 'warn',
  pathRewrite: { '^': '/api' },
}));

// 上传文件静态资源代理（同理，把 /upload 前缀加回来）
app.use('/upload', createProxyMiddleware({
  target: apiTarget,
  changeOrigin: true,
  logLevel: 'warn',
  pathRewrite: { '^': '/upload' },
}));

// 静态文件服务
app.use(express.static(staticDir, {
  maxAge: '1h',
  setHeaders(res, filePath) {
    // index.html 不缓存（确保更新立即生效）
    if (filePath.endsWith('index.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  },
}));

// SPA fallback：所有未匹配的路径都返回 index.html
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/upload/')) {
    return next();
  }
  res.sendFile(path.join(staticDir, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`[zine-frontend] 前端服务已启动: http://0.0.0.0:${port}`);
  console.log(`[zine-frontend] 静态目录: ${staticDir}`);
  console.log(`[zine-frontend] API 代理 -> ${apiTarget}`);
});
