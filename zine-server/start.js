// 统一启动脚本：后端 API + 前端静态服务（带代理）
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.DEV_PORT || process.env.DEPLOY_RUN_PORT || 5000;
const API_PORT = 8080;

// 启动后端
const server = spawn('node', ['src/server.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  env: { ...process.env, PORT: API_PORT }
});

// 等待后端启动后再启动前端
setTimeout(() => {
  const frontend = spawn('node', ['src/frontend-server.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, DEV_PORT: PORT }
  });

  frontend.on('exit', (code) => {
    console.log(`[frontend] exited with code ${code}`);
    server.kill();
  });
}, 1500);

server.on('exit', (code) => {
  console.log(`[server] exited with code ${code}`);
  process.exit(code || 0);
});

console.log(`Starting zine-server on ports ${PORT} (frontend) + ${API_PORT} (API)`);
