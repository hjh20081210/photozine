#!/bin/bash
# 守护脚本：确保 5000 端口跑的是我们的 Express 服务
# 如果是 npx serve 就杀掉替换掉

PROJECT_DIR="/workspace/projects"
LOG_FILE="/app/work/logs/bypass//keep-alive.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

log "keep-alive 脚本启动"

while true; do
  # 获取 5000 端口的进程 PID
  PID=$(ss -tulnp 2>/dev/null | grep ':5000 ' | grep -oP 'pid=\K\d+' | head -1)

  if [ -z "$PID" ]; then
    log "5000 端口无服务，启动 Express"
    cd "$PROJECT_DIR" && PORT=5000 node server.js >> /app/work/logs/bypass//dev.log 2>&1 &
    sleep 3
    continue
  fi

  # 检查是不是 npx serve
  CMDLINE=$(cat /proc/$PID/cmdline 2>/dev/null | tr '\0' ' ')
  if echo "$CMDLINE" | grep -q "npx serve\|serve -l"; then
    log "检测到 npx serve (PID=$PID)，替换为 Express"
    kill -9 "$PID" 2>/dev/null
    sleep 2
    cd "$PROJECT_DIR" && PORT=5000 node server.js >> /app/work/logs/bypass//dev.log 2>&1 &
    sleep 3
  fi

  sleep 5
done
