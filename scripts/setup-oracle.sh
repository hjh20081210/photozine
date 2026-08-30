#!/bin/bash
# ==============================================
# Oracle Cloud Free Tier 一键部署脚本
# 适用：Ampere A1 (4 vCPU, 24GB RAM)
# 在 SSH 连接到实例后运行
# ==============================================
set -e

echo "=== 1. 安装系统依赖 ==="
apt-get update && apt-get install -y \
    curl git \
    libvips libvips-dev \
    fonts-noto-cjk \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

echo "=== 2. 安装 Node.js 22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
npm install -g pnpm

echo "=== 3. 克隆项目 ==="
cd /opt
git clone https://github.com/hjh20081210/photozine.git
cd photozine

echo "=== 4. 安装依赖 ==="
pnpm install

echo "=== 5. 配置 systemd 服务 ==="
cat > /etc/systemd/system/photozine.service << 'SERVICE'
[Unit]
Description=PhotoZine Backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/photozine
ExecStart=/usr/bin/node /opt/photozine/server.js
Restart=always
RestartSec=5
Environment=PORT=8080
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable photozine
systemctl start photozine

echo "=== 6. 配置防火墙（开放 8080 端口）==="
iptables -I INPUT 6 -m state --state NEW -p tcp --dport 8080 -j ACCEPT
netfilter-persistent save

echo ""
echo "============================================"
echo "  部署完成！"
echo "  后端地址: http://$(curl -s ifconfig.me):8080"
echo "  健康检查: http://$(curl -s ifconfig.me):8080/api/health"
echo "============================================"