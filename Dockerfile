FROM node:22-slim

# 安装 sharp 所需系统依赖 + 中文字体
RUN apt-get update && apt-get install -y \
    libvips libvips-dev \
    fonts-noto-cjk \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm 和依赖
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源码
COPY . .

# 在 Hugging Face Spaces 上公开端口 7860
ENV PORT=7860

EXPOSE 7860

CMD ["node", "server.js"]