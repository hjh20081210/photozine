/**
 * 兜底常量：当无法访问后端 /api/meta 时使用，保证创作页可渲染。
 * 与后端 StyleRegistry / MetaController 保持一致。
 */

export const STYLES = [
  { key: 'hand_drawn_watercolor', name: '手绘水彩', desc: '克制水彩编辑插画，保留轮廓与色彩性格', mode: 'BOTH' },
  { key: 'ink_line', name: '墨线插画', desc: '精细墨线勾线，疏朗黑白插画', mode: 'BOTH' },
  { key: 'gouache', name: '水粉画', desc: '平面水粉，柔和哑光色块', mode: 'BOTH' },
  { key: 'cut_paper', name: '剪纸拼贴', desc: '层叠撕纸形状与细阴影', mode: 'BOTH' },
  { key: 'pencil_sketch', name: '铅笔速写', desc: '柔和石墨速写，轻阴影', mode: 'BOTH' },
  { key: 'risograph', name: '孔版印刷', desc: 'Riso 颗粒网点与错位叠印', mode: 'BOTH' },
  { key: 'letterpress', name: '凸版印刷', desc: '油墨渗纸的压凹触感', mode: 'BOTH' },
  { key: 'xerox_zine', name: '复印做旧', desc: '复印机 Zine 硬朗黑白', mode: 'BOTH' },
  { key: 'vintage_film', name: '老胶片', desc: '复古胶片颗粒与暖调', mode: 'BOTH' },
  { key: 'minimal_poster', name: '极简纸感', desc: '诗性负空间微编辑海报', mode: 'BOTH' },
  { key: 'photoreal', name: '原图写实', desc: '忠实保留原照片', mode: 'BOTH' },
  { key: 'woodblock_print', name: '木版画', desc: '粗粝木刻线条与块面', mode: 'BOTH' },
  { key: 'linocut', name: '麻胶版画', desc: '硬朗刀痕与黑白对比', mode: 'BOTH' },
  { key: 'screen_print', name: '丝网印刷', desc: '套色错位与半色调网点', mode: 'BOTH' },
  { key: 'watercolor_wash', name: '水彩渲染', desc: '大面积湿画法与颜色晕染', mode: 'BOTH' },
  { key: 'pastel', name: '粉彩', desc: '柔和粉彩笔触与哑光质感', mode: 'BOTH' },
  { key: 'collage', name: '拼贴艺术', desc: '混合材料拼贴与肌理叠加', mode: 'BOTH' },
  { key: 'silk_ink', name: '绢本水墨', desc: '宣纸绢本风格的淡墨渲染', mode: 'BOTH' },
  { key: 'zine_comic', name: 'Zine 漫画', desc: '粗线条漫画风格，适合叙事', mode: 'BOTH' },
  { key: 'stamp_print', name: '印章拓印', desc: '手工印章般的拓印肌理', mode: 'BOTH' },
  { key: 'polaroid_transfer', name: '宝丽来转印', desc: '宝丽来照片的银盐质感', mode: 'BOTH' },
  { key: 'linen_texture', name: '亚麻布纹', desc: '布面油画般的编织纹理', mode: 'BOTH' },
  { key: 'frosted_glass', name: '磨砂玻璃', desc: '朦胧柔光的磨砂质感', mode: 'BOTH' },
  { key: 'washi_paper', name: '和纸贴金', desc: '和纸纤维与金箔点缀', mode: 'BOTH' },
  { key: 'typewriter', name: '打字机复刻', desc: '老式打字机字符与纸纹', mode: 'BOTH' },
  { key: 'postage_stamp', name: '邮票边缘', desc: '邮票齿孔边与复古色调', mode: 'BOTH' },
]

export const PAPER_TEXTURES = [
  { key: 'pure_white',  name: '纯白',        desc: '无纹理，干净白纸' },
  { key: 'xuan_paper',  name: '宣纸',        desc: '柔软纤维，水墨渗化' },
  { key: 'kraft',       name: '牛皮纸',      desc: '暖棕粗粝，复古质感' },
  { key: 'vellum',      name: '羊皮纸',      desc: '半透明，温润细腻' },
  { key: 'linen',       name: '亚麻纸',      desc: '编织纹理，挺括有型' },
  { key: 'rice_paper',  name: '毛边纸',      desc: '手工纸边，自然毛糙' },
  { key: 'cardboard',   name: '卡纸',        desc: '厚实挺括，哑光面' },
  { key: 'matte_photo', name: '哑粉相纸',    desc: '细腻哑光，照片质感' },
  { key: 'glossy',      name: '光面相纸',    desc: '高光反射，色彩鲜艳' },
  { key: 'recycled',    name: '再生纸',      desc: '灰白底色，环保纸浆' },
  { key: 'kraft_brown', name: '牛皮纸 (深)', desc: '深棕粗糙，工业感' },
  { key: 'tracing',     name: '硫酸纸',      desc: '半透明，冷白光滑' },
  { key: 'newsprint',   name: '新闻纸',      desc: '灰黄薄纸，易留墨' },
  { key: 'watercolor_pad', name: '水彩纸',   desc: '凹凸纹理，吸水性好' },
  { key: 'japanese_tape',  name: '和纸胶带', desc: '细纤维，温润半透' },
]

// 明信片：横长比例（宽 > 高）
export const POSTCARD_RATIOS = [
  { w: 3, h: 2, name: '3:2 明信片' },
  { w: 4, h: 3, name: '4:3 明信片' },
  { w: 5, h: 3, name: '5:3 明信片' },
  { w: 16, h: 9, name: '16:9 明信片' },
  { w: 1, h: 1, name: '1:1 明信片' },
]

// 海报：竖版比例（宽 < 高）
export const POSTER_RATIOS = [
  { w: 2, h: 3, name: '2:3 海报' },
  { w: 3, h: 4, name: '3:4 海报' },
  { w: 3, h: 5, name: '3:5 海报' },
  { w: 9, h: 16, name: '9:16 海报' },
]

// 兼容旧引用
export const RATIOS = POSTCARD_RATIOS

export const PROVIDERS = [
  {
    key: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-image-1',
    models: [
      { key: 'gpt-image-1', label: 'gpt-image-1（推荐·图生图）' },
      { key: 'dall-e-3', label: 'dall-e-3（文生图）' },
      { key: 'dall-e-2', label: 'dall-e-2（经典）' },
      { key: 'flux', label: 'Flux（高质量）' },
    ],
    hint: '支持 gpt-image-1 / dall-e-3，上传照片时走原图编辑 /images/editions',
  },
  {
    key: 'dashscope',
    name: '通义万相',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'wanx2.1-t2i-turbo',
    models: [
      { key: 'wanx2.1-t2i-turbo', label: 'wanx2.1-t2i-turbo（推荐·快速）' },
      { key: 'wanx2.1-t2i-plus', label: 'wanx2.1-t2i-plus（高质量）' },
      { key: 'wanx-v5', label: 'wanx-v5（通义老版本）' },
      { key: 'qwen-image-v2', label: 'qwen-image-v2（兼容 OpenAI 协议）' },
    ],
    hint: '阿里云通义万相，兼容 OpenAI /images/generations 协议',
  },
  {
    key: 'ark',
    name: '火山方舟/即梦',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    defaultModel: 'seedream-4.5',
    models: [
      { key: 'seedream-4.5', label: 'Seedream 4.5（最新·推荐）' },
      { key: 'doubao-seedream-3-0-t2i-250415', label: '即梦 Seedream 3.0' },
      { key: 'doubao-seedream-2-0-t2i-250115', label: '即梦 Seedream 2.0' },
      { key: 'doubao-1-5-vision-pro-32k-250115', label: '豆包视觉（图生图编辑）' },
    ],
    hint: '火山引擎豆包 / 即梦 Seedream，注意在火山方舟控制台复制你的模型推理接入点（Endpoint ID）填到模型字段',
  },
  {
    key: 'gemini',
    name: 'Gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash-exp-image-generation',
    models: [
      { key: 'gemini-2.0-flash-exp-image-generation', label: 'Gemini 2.0 Flash（推荐·图片版）' },
      { key: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash（标准版）' },
      { key: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
      { key: 'gemini-2.5-pro-exp-03-25', label: 'Gemini 2.5 Pro（最新实验）' },
    ],
    hint: 'Google Gemini 原生图片输出，支持图生图编辑，建议使用带 -image-generation 的版本 ID',
  },
  {
    key: 'custom',
    name: '自定义兼容',
    baseUrl: '',
    defaultModel: 'gpt-image-1',
    models: [
      { key: 'gpt-image-1', label: 'gpt-image-1' },
      { key: 'dall-e-3', label: 'dall-e-3' },
      { key: 'flux', label: 'Flux' },
      { key: 'midjourney-proxy', label: 'Midjourney Proxy 兼容' },
      { key: 'stable-diffusion', label: 'Stable Diffusion WebUI 兼容' },
    ],
    hint: '任意 OpenAI 兼容的 /images/generations 端点（例如 OneAPI/NewAPI/自建兼容服务），请填你的 Base URL 和模型名',
  },
]

export const SIDES_OPTIONS = [
  { label: '正反面双面', value: 'FRONT_BACK' },
  { label: '仅正面', value: 'FRONT_ONLY' },
  { label: '仅背面', value: 'BACK_ONLY' },
]

export const MODE_OPTIONS = [
  { label: '明信片', value: 'POSTCARD' },
  { label: '极简海报', value: 'POSTER' },
]
