import { reactive } from 'vue'

const KEY_SERVER = 'zine_serverUrl'
const KEY_PROVIDER = 'zine_provider'              // 旧单套（向后兼容读取用）
const KEY_MODEL_CONFIGS = 'zine_model_configs'    // 新：多套配置数组
const KEY_ACTIVE_CONFIG_ID = 'zine_active_config' // 新：当前选中的配置ID
const KEY_PRIVACY_AGREED = 'zine_privacy_agreed'  // 隐私协议是否同意
const KEY_FIRST_OPEN = 'zine_first_open'          // 是否首次打开
const KEY_AUTH_TOKEN = 'zine_auth_token'          // 登录 token
const KEY_AUTH_USER = 'zine_auth_user'            // 登录用户信息

const PROVIDER_NAME_MAP = {
  openai: 'OpenAI',
  deepseek: 'DeepSeek',
  dashscope: '通义万相',
  ark: '火山方舟/即梦',
  gemini: 'Gemini',
  custom: '自定义兼容',
}

/**
 * 单套配置的结构：
 * {
 *   id: 'cfg_xxx',        // 唯一ID，本地存储持久化
 *   name: '我的通义万相',  // 用户可识别的名字，显示在创作页选择器里
 *   provider: 'openai' | 'dashscope' | 'ark' | 'gemini' | 'custom',
 *   apiFormat: 'chat' | 'responses' | 'anthropic',  // 接口格式
 *   baseUrl: 'https://...',
 *   customPath: '/custom/path',  // 自定义请求路径（可选）
 *   apiKey: 'sk-...',
 *   model: 'gpt-image-1',
 *   imageInput: 'auto' | 'edit' | 'ref' | 'none',
 *   createdAt: 1763xxx,    // 创建时间戳
 * }
 */

/**
 * 全局轻量状态（Vue3 reactive + uni 本地存储持久化）。
 * 用户的自有 API Key 只保存在本机，不提交给第三方。
 * 支持多套 API+模型配置（用户可接入多个不同服务商/模型），创作前可直接切换。
 */
const store = reactive({
  // 默认为空（走相对路径），由前端服务的反向代理转发到后端
  // 这样无论在 localhost 还是公网域名下都能正常访问 API
  serverUrl: '',

  /** 多套配置（创作页模型选择器遍历这个数组） */
  modelConfigs: [],

  /** 当前创作时选中的配置 ID（对应 modelConfigs[i].id） */
  activeConfigId: '',

  /** 隐私协议是否已同意 */
  privacyAgreed: false,

  /** 是否首次打开APP（决定是否显示欢迎弹窗） */
  firstOpen: true,

  preview: null,   // 结果页预览数据：{taskId, frontUrl, backUrl, ratio, styleName, sides, mode}
  meta: null,      // /api/meta 缓存：{styles, providers, ratios}

  /* ============ 登录状态 ============ */
  token: '',
  user: null,      // {id, username, isAdmin, createdAt} 或 null

  loadAuth() {
    this.token = uni.getStorageSync(KEY_AUTH_TOKEN) || ''
    const u = uni.getStorageSync(KEY_AUTH_USER)
    this.user = (u && typeof u === 'object') ? u : null
  },

  saveAuth(token, user) {
    this.token = token || ''
    this.user = user || null
    if (this.token) uni.setStorageSync(KEY_AUTH_TOKEN, this.token)
    else uni.removeStorageSync(KEY_AUTH_TOKEN)
    if (this.user) uni.setStorageSync(KEY_AUTH_USER, this.user)
    else uni.removeStorageSync(KEY_AUTH_USER)
  },

  login(data) {
    if (!data) return null
    const token = data.token || ''
    const user = data.user || (data.isAdmin !== undefined ? { id: data.id, username: data.username, isAdmin: data.isAdmin, createdAt: data.createdAt } : null)
    this.saveAuth(token, user)
    this.meta = null
    return user
  },

  logout() {
    this.clearAuth()
  },

  clearAuth() {
    this.token = ''
    this.user = null
    uni.removeStorageSync(KEY_AUTH_TOKEN)
    uni.removeStorageSync(KEY_AUTH_USER)
  },

  /* ============ 免费模型定义 ============ */
  // 所有用户默认可用的免费模型，通过本地生成代理调用，无需配置 API Key
  FREE_MODELS: [
    {
      id: 'cfg_free_gpt_image_2',
      name: 'gpt-image-2（免费）',
      provider: 'local',
      apiFormat: 'image',
      baseUrl: '',
      customPath: '',
      apiKey: 'free',
      model: 'gpt-image-2',
      modelKey: 'gpt-image-2',
      imageInput: 'auto',
      free: true,
    },
  ],

  /* ============ 加载 & 持久化 ============ */
  load() {
    const su = uni.getStorageSync(KEY_SERVER)
    if (su) this.serverUrl = su

    const agreed = uni.getStorageSync(KEY_PRIVACY_AGREED)
    this.privacyAgreed = !!agreed
    const first = uni.getStorageSync(KEY_FIRST_OPEN)
    this.firstOpen = first !== '1'

    let list = []
    let activeId = ''
    let needSave = false

    // ① 优先读多套配置
    const storedList = uni.getStorageSync(KEY_MODEL_CONFIGS)
    const storedActiveId = uni.getStorageSync(KEY_ACTIVE_CONFIG_ID)
    if (Array.isArray(storedList) && storedList.length) {
      list = storedList.slice()
      activeId = storedActiveId
    } else {
      // ② 旧单套兼容：读取 zine_provider，如果存在自动迁移为一套配置
      const p = uni.getStorageSync(KEY_PROVIDER)
      if (p && typeof p === 'object' && p.apiKey && p.apiKey.trim()) {
        list = [{
          id: 'cfg_migrated_' + Date.now(),
          name: '我的配置（迁移）',
          provider: p.provider || 'openai',
          baseUrl: p.baseUrl || '',
          apiKey: p.apiKey,
          model: p.model || '',
          imageInput: p.imageInput || 'auto',
          createdAt: Date.now(),
        }]
        activeId = list[0].id
        needSave = true
      }
    }

    // ③ 清理旧的免费模型残留（Seedream/Flux 等已下线的内置免费模型）
    const freeIds = new Set(this.FREE_MODELS.map((c) => c.id))
    const beforeLen = list.length
    list = list.filter((c) => {
      // 只清理曾作为"内置免费模型"的旧配置（provider local + apiKey free），
      // 但保留当前正在使用的新免费模型
      const isLegacyFree = c && c.provider === 'local' && c.apiKey === 'free'
      if (isLegacyFree && !freeIds.has(c.id)) {
        if (activeId === c.id) activeId = ''
        return false
      }
      return true
    })
    if (list.length !== beforeLen) needSave = true

    // ④ 确保免费模型存在（所有用户都有）
    this.FREE_MODELS.forEach((freeCfg, idx) => {
      const exists = list.some((c) => c.id === freeCfg.id)
      if (!exists) {
        list.splice(idx, 0, { ...freeCfg, createdAt: Date.now() + idx })
        needSave = true
      }
    })

    // ⑤ 如果旧的默认 DeepSeek 模型还在且用户没改过，替换为第一个免费模型
    const oldDeepSeekIdx = list.findIndex((c) => c.id === 'cfg_default_deepseek_v4')
    if (oldDeepSeekIdx >= 0) {
      // 用第一个免费模型替换旧 DeepSeek（保留位置）
      list[oldDeepSeekIdx] = { ...this.FREE_MODELS[0], createdAt: list[oldDeepSeekIdx].createdAt }
      if (activeId === 'cfg_default_deepseek_v4') {
        activeId = this.FREE_MODELS[0].id
      }
      needSave = true
    }

    this.modelConfigs = list
    // 激活ID必须存在于列表中，否则回落第一个免费模型
    const exists = list.some((c) => c.id === activeId)
    this.activeConfigId = exists ? activeId : (list[0] && list[0].id) || ''

    if (needSave) {
      this.saveModelConfigs()
      this.saveActiveConfigId()
    }
  },

  saveServerUrl() {
    uni.setStorageSync(KEY_SERVER, this.serverUrl)
  },

  saveModelConfigs() {
    uni.setStorageSync(KEY_MODEL_CONFIGS, this.modelConfigs.slice())
  },

  saveActiveConfigId() {
    uni.setStorageSync(KEY_ACTIVE_CONFIG_ID, this.activeConfigId)
  },

  /* ============ 多配置操作 ============ */
  /** 新增或更新一套配置（有 id 就更新，没有就新增） */
  upsertConfig(cfg) {
    if (!cfg || !cfg.apiKey || !String(cfg.apiKey).trim()) {
      throw new Error('API Key 不能为空')
    }
    if (!cfg || !cfg.model || !String(cfg.model).trim()) {
      throw new Error('模型不能为空')
    }
    const clean = {
      id: cfg.id || ('cfg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)),
      name: String(cfg.name || '').trim() || (PROVIDER_NAME_MAP[cfg.provider] + ' ' + (cfg.model || '').slice(0, 10)),
      provider: cfg.provider || 'openai',
      apiFormat: cfg.apiFormat || 'chat',
      baseUrl: String(cfg.baseUrl || '').trim(),
      customPath: String(cfg.customPath || '').trim(),
      apiKey: String(cfg.apiKey).trim(),
      model: String(cfg.model).trim(),
      imageInput: cfg.imageInput || 'auto',
      createdAt: cfg.createdAt || Date.now(),
    }
    const idx = this.modelConfigs.findIndex((c) => c.id === clean.id)
    if (idx >= 0) {
      this.modelConfigs.splice(idx, 1, clean)
    } else {
      this.modelConfigs.push(clean)
    }
    // 第一套 / 当前没激活的 → 自动激活它
    if (!this.activeConfigId || this.modelConfigs.length === 1) {
      this.activeConfigId = clean.id
      this.saveActiveConfigId()
    }
    this.saveModelConfigs()
    return clean.id
  },

  /** 删除一套配置 */
  deleteConfig(id) {
    const idx = this.modelConfigs.findIndex((c) => c.id === id)
    if (idx < 0) return
    if (this.modelConfigs[idx].free) return // 内置免费模型不可删除
    this.modelConfigs.splice(idx, 1)
    this.saveModelConfigs()
    if (this.activeConfigId === id) {
      this.activeConfigId = this.modelConfigs.length ? this.modelConfigs[0].id : ''
      this.saveActiveConfigId()
    }
  },

  /** 设为当前（创作前选择） */
  setActive(id) {
    const ok = this.modelConfigs.some((c) => c.id === id)
    if (!ok) return
    this.activeConfigId = id
    this.saveActiveConfigId()
  },

  /** 拿到当前配置对象 */
  getActiveConfig() {
    if (!this.activeConfigId) return null
    return this.modelConfigs.find((c) => c.id === this.activeConfigId) || null
  },

  /* ============ 提供给老代码的兼容字段：当前激活的 provider ============ */
  get provider() {
    const cfg = this.getActiveConfig()
    if (!cfg) return { provider: 'openai', baseUrl: '', apiKey: '', model: '', imageInput: 'auto' }
    return cfg
  },
  /** 兼容：老代码写 store.provider.xxx = v 的形式会触发不到 setter，
   *  但新的创作页全部用 getActiveConfig() / upsertConfig，
   *  这里提供 setter 以防残留老代码造成异常崩溃。 */
  set provider(_v) {},

  providerLabel() {
    const cfg = this.getActiveConfig()
    if (!cfg) return '尚未接入模型'
    return PROVIDER_NAME_MAP[cfg.provider] || cfg.provider
  },

  providerConfigured() {
    const cfg = this.getActiveConfig()
    return !!(cfg && cfg.apiKey && cfg.apiKey.trim())
  },

  /** 创作页选择器显示的简短模型名 */
  activeModelLabel() {
    const cfg = this.getActiveConfig()
    if (!cfg) return '尚未接入模型'
    return `${cfg.name} · ${PROVIDER_NAME_MAP[cfg.provider] || cfg.provider} · ${cfg.model || '未设模型'}`
  },

  /** 拼接服务器资源完整地址 */
  fullUrl(path) {
    if (!path) return ''
    if (/^https?:\/\//i.test(path)) return path
    return this.serverUrl.replace(/\/+$/, '') + path
  },

  /* ============ 历史记录 ============ */

  /** 保存一条历史记录 */
  addHistory(item) {
    if (!item || (!item.frontUrl && !item.backUrl)) return
    const payload = {
      id: item.id || `history_${Date.now()}`,
      frontUrl: item.frontUrl || '',
      backUrl: item.backUrl || null,
      thumbUrl: item.thumbUrl || item.frontUrl || '',
      style: item.style || '手绘水彩',
      styleName: item.styleName || item.style || '手绘水彩',
      ratio: item.ratio || { width: 3, height: 2 },
      mode: item.mode || 'POSTCARD',
      sides: item.sides || 'FRONT_BACK',
      title: item.title || '',
      location: item.location || '',
      date: item.date || '',
      backMessage: item.backMessage || '',
      modelName: item.provider || '',
      createdAt: item.createdAt || Date.now(),
    }
    // 本地兜底缓存
    const local = uni.getStorageSync('zine_local_history') || []
    const localItem = { ...payload, localId: payload.id }
    const li = local.findIndex((x) => x.id === payload.id)
    if (li >= 0) local.splice(li, 1)
    local.unshift(localItem)
    uni.setStorageSync('zine_local_history', local.slice(0, 50))

    // 异步同步到服务器，失败不阻断主流程
    uni.request({
      url: this.serverUrl.replace(/\/+$/, '') + '/api/history',
      method: 'POST',
      header: { 'Content-Type': 'application/json' },
      data: payload,
      success: () => {},
      fail: () => {},
    })
  },

  /** 删除一条历史 */
  removeHistory(id) {
    if (!id) return
    const local = uni.getStorageSync('zine_local_history') || []
    uni.setStorageSync('zine_local_history', local.filter((x) => x.id !== id))
    uni.request({
      url: this.serverUrl.replace(/\/+$/, '') + '/api/history/' + id,
      method: 'DELETE',
      success: () => {},
      fail: () => {},
    })
  },

  /* ============ 隐私协议 ============ */
  agreePrivacy() {
    this.privacyAgreed = true
    this.firstOpen = false
    uni.setStorageSync(KEY_PRIVACY_AGREED, '1')
    uni.setStorageSync(KEY_FIRST_OPEN, '1')
  },

  declinePrivacy() {
    uni.setStorageSync(KEY_PRIVACY_AGREED, '0')
    this.privacyAgreed = false
  },

  markFirstOpenSeen() {
    this.firstOpen = false
    uni.setStorageSync(KEY_FIRST_OPEN, '1')
  },
})

export default store
