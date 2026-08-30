# AGENTS.md

## 项目概览
明信片/海报生成器（photo-zine），采用「**AI 出无字插画/线稿素材 + sharp SVG 精确排版文字**」核心方案。

- **前端** `zine-app`：UniApp (Vue3) 跨端应用，H5 构建产物由后端静态托管
- **后端** `zine-server`：Express 单进程 ESM，JSON 文件持久化（`/tmp/*.json`），统一 `{code,msg,data}` 响应
- **主服务**：根目录 `server.js` 监听 `5000`，动态导入 `zine-server/src/server.js` 并托管 `zine-app` 构建产物

## 目录结构
```
.
├── server.js            # 主服务入口 (port 5000, 由 keep-alive/watchdog 守护)
├── keep-alive.sh        # 端口空时自动拉起 server.js
├── watchdog.js          # 进程守护（判断 server.js 存活）
├── assets/              # 参考素材
├── zine-server/         # 后端 Express 服务
│   └── src/
│       ├── server.js          # 挂载 /api/auth /api/feedback /api/generation /api/history /api/file /api/health
│       ├── frontend-server.js # 托管前端 H5 构建产物
│       └── routes/
│           ├── generation.js  # 核心：AI 生成 + sharp 合成正/背面
│           ├── auth.js / auth-db.js  # 登录/注册 (scrypt + token)，管理员 seed
│           ├── history.js     # 生成历史，按 userId 隔离
│           ├── feedback.js    # 意见反馈
│           └── upload.js      # 上传 + /api/file/proxy 同源代理
└── zine-app/            # 前端 UniApp (Vue3)
    └── src/
        ├── pages/       # index(创作) result(结果) history mine feedback login admin-users settings license
        ├── components/  # StylePicker 等
        ├── store/       # 全局状态 (auth + fullUrl/serverUrl + addHistory)
        └── utils/       # request.js 自动附加 x-session 头
```

## 构建与运行
- **后端启动**：`node server.js`（或 `PORT=<port> node server.js`）；端点为 `/api/*`
- **前端构建**：`cd zine-app && pnpm build:h5`（产物由后端静态托管）
- **包管理**：仅用 `pnpm`，禁止 `npm`/`yarn`（当前为纯 JS 后端 + Vue3 前端，无 tsconfig/ESLint）
- **逻辑改动后**：因 `server.js` 非 watch 模式，需重启后端进程方生效

## 生成链路关键实现（generation.js）
- `composeFront(body)`：sharp SVG 排版左栏文字（001 序列号、标题、LOCATION/DATE 字段+横线、色块）；`titleText` 为空则标题区留空（不输出 UNTITLED）
- `composeBack(body)`：左栏铺 `extractLineArtFromImage` 线稿（限 `lineW=0.38*W`、`left=0.02*W`，右边缘 0.40<0.42 分隔线，不越界）；右栏邮编框、邮票框、留言区（书法体）、地址栏
- `extractLineArtFromImage(img)`：Sobel 边缘检测 → 分位数阈值(0.45)二值化为**纯黑不透明线条** → `dilate(2)` 加粗；输出透明底纯黑线稿
- `toEnglishTitle`：贪心最长分词中译英，用于用户填写的标题

## 字体（很重要）
- **必须用字体家族名，不能用文件路径**：librsvg/pango 按 family name 解析，文件路径无效会回退到黑体（印刷体）
- **中文书法体**：`LXGW WenKai`（霞鹜文楷），需安装到 `/usr/share/fonts` 并 `fc-cache -f`；未安装会回退为印刷体
- 常量：`FONT_CN = "'LXGW WenKai', 'WenQuanYi Micro Hei', sans-serif"`（标题/地点/日期/留言等全部文字）
- sharp 的 `dilate` / 卷积 `/ `.convolve`：`dilate` 只接受**整数半径** `dilate(n)`，不接受对象或数组

## 前端关键点
- `index.vue`：创作页，`compressImageForUpload`（canvas 降采样至最长边 2560px + JPEG 0.85）解决大图卡顿；`onGenerate` 传 title/location/date/backMessage；`store.addHistory` 保存生成历史
- `result.vue`：结果页，保存到相册用 `fetch` 代理 URL（`/api/file/proxy`）下载，避免跨域签名 URL 被 CORS 拦截
- `request.js`：统一 `fetch` 封装，自动附加 `x-session` 头用于用户身份识别

## 用户数据隔离
- `history.js`：生成时从 `x-session` 解析 userId 存入，查询/删除仅限本人
- 登录：`30 天免登录`，首次注册自动登录；登录页为应用第一页

## 其他
- 图片上传目录：`/tmp/zine-upload`（环境变量 `UPLOAD_DIR`）
- `/api/file/proxy` 白名单允许 `.coze.site` 等对象存储 CDN 域做同源代理
