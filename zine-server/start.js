import { spawn } from 'node:child_process';

const port = process.env.DEV_PORT || 5000;

function start() {
  const proc = spawn('node', ['src/server.js'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port) },
    stdio: 'inherit',
  });

  proc.on('exit', (code, signal) => {
    console.log(`[zine-server] 进程退出 (code=${code}, signal=${signal})，2秒后重启...`);
    setTimeout(start, 2000);
  });

  proc.on('error', (err) => {
    console.error(`[zine-server] 启动失败: ${err.message}`);
    setTimeout(start, 2000);
  });
}

console.log(`Starting zine-server on port ${port} (frontend + API + upload)`);
start();
