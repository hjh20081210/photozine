import { spawn } from 'child_process'
import { execSync } from 'child_process'

const PORT = process.env.DEV_PORT || process.env.PORT || 5000
const SERVER_JS = '/workspace/projects/server.js'

function getPortPid(port) {
  try {
    const out = execSync(`ss -tulnp 2>/dev/null | grep ":${port}[[:space:]]" | grep -oP 'pid=\\K[0-9]+' | head -1`, { encoding: 'utf8' }).trim()
    return out || null
  } catch { return null }
}

function getCmdline(pid) {
  try {
    const fs = require('fs')
    return fs.readFileSync(`/proc/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ')
  } catch { return '' }
}

let serverProc = null

function startOurServer() {
  if (serverProc) {
    try { serverProc.kill('SIGKILL') } catch {}
    serverProc = null
  }
  console.log(`[watchdog] Starting our Express server on port ${PORT}...`)
  const proc = spawn('node', [SERVER_JS], {
    env: { ...process.env, PORT: String(PORT) },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  proc.stdout.on('data', d => process.stdout.write('[server] ' + d.toString()))
  proc.stderr.on('data', d => process.stderr.write('[server err] ' + d.toString()))
  proc.on('exit', code => {
    console.log(`[watchdog] Server exited with code ${code}`)
    serverProc = null
  })
  serverProc = proc
}

function checkAndFix() {
  const pid = getPortPid(PORT)
  if (!pid) {
    console.log('[watchdog] Port ' + PORT + ' is free, starting our server...')
    startOurServer()
    return
  }
  const cmdline = getCmdline(pid)
  // 如果是 npx serve 在跑，就干掉换成我们的
  if (cmdline.includes('npx serve') || cmdline.includes('serve -l') || cmdline.includes('/.bin/serve')) {
    console.log('[watchdog] Detected npx serve (pid ' + pid + '), replacing with our server...')
    try {
      execSync(`kill -9 ${pid}`, { stdio: 'ignore' })
    } catch {}
    // 等端口释放
    setTimeout(() => {
      startOurServer()
    }, 1500)
    return
  }
  // 如果是我们的 server.js，就什么也不做
  if (cmdline.includes('server.js')) {
    // 正常运行中
    return
  }
  console.log('[watchdog] Unknown process on port ' + PORT + ': ' + cmdline.substring(0, 80))
}

// 启动时先检查一次
checkAndFix()

// 每 5 秒检查一次
setInterval(checkAndFix, 5000)

console.log('[watchdog] Watchdog started, monitoring port ' + PORT)
