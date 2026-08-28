<template>
  <view class="page paper-bg">
    <!-- 顶部导航栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="onBack">
        <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </view>
      <text class="nav-title">添加模型</text>
      <view class="nav-right" />
    </view>

    <scroll-view scroll-y class="body">
      <!-- 接口格式 -->
      <view class="group">
        <text class="group-title">接口格式</text>
        <view class="neo-card pad">
          <view class="seg-wrap">
            <view class="seg">
              <view class="seg-thumb" :style="thumbStyle" />
              <view
                v-for="(f, i) in apiFormats"
                :key="f.value"
                class="seg-item"
                :class="{ on: form.apiFormat === f.value }"
                @click="form.apiFormat = f.value"
              >
                <text>{{ f.label }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 模型 API 地址 -->
      <view class="group">
        <text class="group-title">模型 API 地址</text>
        <view class="neo-card pad">
          <view class="neo-input-wrap">
            <input v-model="form.baseUrl" class="neo-input" :placeholder="baseUrlPlaceholder" />
          </view>
          <view v-if="form.baseUrl" class=" derived">
            <text class="derived-label">请求地址：</text>
            <text class="derived-url">{{ derivedUrl }}</text>
          </view>
          <text class="hint">从 {{ currentProvider.name }} 的控制台获取你的 API Base URL</text>
        </view>
      </view>

      <!-- API Token -->
      <view class="group">
        <text class="group-title">API Token <text class="req">*</text></text>
        <view class="neo-card pad">
          <view class="neo-input-wrap">
            <input
              v-model="form.apiKey"
              class="neo-input"
              :password="!showKey"
              placeholder="sk-... 或你的服务商密钥"
            />
            <view class="eye" @click="showKey = !showKey">
              <text>{{ showKey ? '🙈' : '👁' }}</text>
            </view>
          </view>
          <text class="hint">Token 仅保存在本机，不会上传到任何服务器</text>
        </view>
      </view>

      <!-- 模型名称 -->
      <view class="group">
        <text class="group-title">模型名称 <text class="req">*</text></text>
        <view class="neo-card pad">
          <view class="input-with-btn">
            <view class="neo-input-wrap flex-1">
              <input v-model="form.model" class="neo-input" placeholder="输入模型名称，如 gpt-image-1" />
            </view>
            <view class="fetch-btn" @click="onFetchList">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2v6h-6" />
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                <path d="M3 22v-6h6" />
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
              </svg>
              <text>拉取列表</text>
            </view>
          </view>
          <view v-if="currentProvider.models && currentProvider.models.length" class="model-chips">
            <view
              v-for="m in currentProvider.models"
              :key="m.key"
              class="model-chip"
              :class="{ on: form.model === m.key }"
              @click="form.model = m.key"
            >
              <text class="model-chip-txt">{{ m.label }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 备注（选填） -->
      <view class="group">
        <text class="group-title">备注（选填）</text>
        <view class="neo-card pad">
          <view class="neo-input-wrap">
            <input v-model="form.name" class="neo-input" placeholder="给这套配置起个好记的名字，如：我的通义万相-快速版" />
          </view>
          <text class="hint">显示在创作页的模型选择器里，方便你区分多套配置</text>
        </view>
      </view>

      <!-- 高级配置 -->
      <view class="group">
        <view class="advance-head" @click="showAdvanced = !showAdvanced">
          <text class="group-title">高级配置</text>
          <view class="advance-toggle">
            <text class="advance-arrow" :class="{ open: showAdvanced }">›</text>
          </view>
        </view>
        <view v-if="showAdvanced" class="neo-card pad col">
          <view class="field">
            <text class="label">原图输入方式</text>
            <view class="seg-wrap">
              <view class="seg">
                <view class="seg-thumb" :style="imageInputThumbStyle" />
                <view
                  v-for="opt in imageInputOptions"
                  :key="opt.value"
                  class="seg-item"
                  :class="{ on: form.imageInput === opt.value }"
                  @click="form.imageInput = opt.value"
                >
                  <text>{{ opt.label }}</text>
                </view>
              </view>
            </view>
            <text class="hint">{{ imageInputHint }}</text>
          </view>
          <view class="field">
            <text class="label">服务商类型</text>
            <view class="provider-grid">
              <view
                v-for="p in PROVIDERS"
                :key="p.key"
                class="provider-item"
                :class="{ on: form.provider === p.key }"
                @click="pickProvider(p.key)"
              >
                <view class="provider-ico-wrap" :class="p.key">
                  <text class="ico-txt">{{ shortName(p.key) }}</text>
                </view>
                <text class="provider-name">{{ p.name }}</text>
              </view>
            </view>
          </view>
          <view class="field">
            <text class="label">请求路径自定义（选填）</text>
            <view class="neo-input-wrap">
              <input v-model="form.customPath" class="neo-input" placeholder="留空使用默认路径，如 /chat/completions" />
            </view>
          </view>
        </view>
      </view>

      <!-- 底部按钮区 -->
      <view class="bottom-area">
        <view class="save-btn" :class="{ loading: saving }" @click="onSave">
          <view v-if="saving" class="spin" />
          <text v-else class="save-icon">✓</text>
          <text class="save-text">{{ editingId ? '检查并保存修改' : '检查并保存' }}</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import store from '@/store/index.js'
import { PROVIDERS } from '@/utils/constants.js'

const PROVIDER_NAME_MAP = {
  openai: 'OpenAI',
  dashscope: '通义万相',
  ark: '火山方舟/即梦',
  gemini: 'Gemini',
  custom: '自定义兼容',
}

const apiFormats = [
  { label: 'OpenAI Chat', value: 'chat' },
  { label: 'OpenAI Responses', value: 'responses' },
  { label: 'Anthropic', value: 'anthropic' },
]

const imageInputOptions = [
  { label: '自动', value: 'auto' },
  { label: '编辑', value: 'edit' },
  { label: '参考', value: 'ref' },
  { label: '不用', value: 'none' },
]

const form = reactive({
  id: '',
  apiFormat: 'chat',
  provider: 'openai',
  baseUrl: '',
  apiKey: '',
  model: '',
  name: '',
  imageInput: 'auto',
  customPath: '',
})

const showKey = ref(false)
const showAdvanced = ref(false)
const saving = ref(false)
const editingId = ref('')

const currentProvider = computed(() => {
  return PROVIDERS.find((p) => p.key === form.provider) || PROVIDERS[0]
})

const baseUrlPlaceholder = computed(() => {
  return currentProvider.value.baseUrl || 'https://api.example.com/v1'
})

const thumbStyle = computed(() => {
  const idx = apiFormats.findIndex((f) => f.value === form.apiFormat)
  const i = idx < 0 ? 0 : idx
  return {
    left: `calc(${i} * (100% / ${apiFormats.length}))`,
    width: `calc(100% / ${apiFormats.length})`,
  }
})

const imageInputThumbStyle = computed(() => {
  const idx = imageInputOptions.findIndex((o) => o.value === form.imageInput)
  const i = idx < 0 ? 0 : idx
  return {
    left: `calc(${i} * (100% / ${imageInputOptions.length}))`,
    width: `calc(100% / ${imageInputOptions.length})`,
  }
})

const imageInputHint = computed(() => {
  switch (form.imageInput) {
    case 'edit': return '把原图作为 input_images 传入（图生图编辑）'
    case 'ref': return '把原图作为 image 字段传入（参考图生图）'
    case 'none': return '不使用原图，纯文生图'
    default: return '自动：根据模型类型决定是否使用原图'
  }
})

const derivedUrl = computed(() => {
  const base = (form.baseUrl || '').trim()
  if (!base) return ''
  const pathMap = {
    chat: '/chat/completions',
    responses: '/responses',
    anthropic: '/messages',
  }
  const defaultPath = pathMap[form.apiFormat] || '/chat/completions'
  const customPath = (form.customPath || '').trim()
  const path = customPath || defaultPath
  const cleanBase = base.replace(/\/+$/, '')
  return cleanBase + path
})

function pickProvider(key) {
  const p = PROVIDERS.find((x) => x.key === key)
  if (!p) return
  form.provider = key
  if (key !== 'custom') {
    form.baseUrl = p.baseUrl
    if (!form.model || !p.models.some((m) => m.key === form.model)) {
      form.model = p.defaultModel
    }
  }
}

function shortName(key) {
  switch (key) {
    case 'openai': return 'OA'
    case 'dashscope': return 'TY'
    case 'ark': return 'JS'
    case 'gemini': return 'GM'
    case 'custom': return 'CZ'
    default: return '??'
  }
}

function loadConfig(id) {
  if (!id) return
  const cfg = store.modelConfigs.find((c) => c.id === id)
  if (!cfg) {
    uni.showToast({ title: '配置不存在', icon: 'none' })
    return
  }
  editingId.value = id
  form.id = cfg.id
  form.apiFormat = cfg.apiFormat || 'chat'
  form.provider = cfg.provider || 'openai'
  form.baseUrl = cfg.baseUrl || ''
  form.apiKey = cfg.apiKey || ''
  form.model = cfg.model || ''
  form.name = cfg.name || ''
  form.imageInput = cfg.imageInput || 'auto'
  form.customPath = cfg.customPath || ''
}

function onBack() {
  uni.navigateBack({ delta: 1 })
}

function onFetchList() {
  uni.showToast({ title: '功能即将上线', icon: 'none' })
}

function onSave() {
  if (!form.baseUrl || !form.baseUrl.trim()) {
    uni.showToast({ title: '请填写 API 地址', icon: 'none' })
    return
  }
  if (!form.apiKey || !form.apiKey.trim()) {
    uni.showToast({ title: '请填写 API Token', icon: 'none' })
    return
  }
  if (!form.model || !form.model.trim()) {
    uni.showToast({ title: '请填写模型名称', icon: 'none' })
    return
  }

  saving.value = true

  setTimeout(() => {
    try {
      const id = store.upsertConfig({
        id: form.id || undefined,
        name: form.name,
        provider: form.provider,
        baseUrl: form.baseUrl.trim(),
        apiKey: form.apiKey.trim(),
        model: form.model.trim(),
        imageInput: form.imageInput,
        apiFormat: form.apiFormat,
        customPath: form.customPath,
      })
      store.setActive(id)
      uni.showToast({
        title: editingId.value ? '修改已保存 ✓' : '添加成功 ✓',
        icon: 'success',
      })
      setTimeout(() => {
        uni.navigateBack({ delta: 1 })
      }, 600)
    } catch (e) {
      uni.showToast({ title: e.message || '保存失败', icon: 'none' })
    } finally {
      saving.value = false
    }
  }, 400)
}

onLoad((options) => {
  const id = options?.id
  if (id) {
    loadConfig(id)
  } else {
    form.baseUrl = currentProvider.value.baseUrl
    form.model = currentProvider.value.defaultModel
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 导航栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx 16rpx;
  padding-top: calc(20rpx + var(--status-bar-height, 44px));
  position: relative;
}
.nav-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink);
  border-radius: 50%;
  background: var(--paper-bg-soft);
  transition: all 0.15s;
}
.nav-back:active { transform: scale(0.92); background: var(--line); }
.nav-title {
  font-size: 34rpx;
  font-weight: 800;
  color: var(--ink);
  font-family: var(--font-serif);
  letter-spacing: 1rpx;
}
.nav-right { width: 64rpx; }

/* 滚动体 */
.body {
  flex: 1;
  padding: 0 32rpx 200rpx;
}

/* 分组 */
.group { margin-bottom: 32rpx; }
.group-title {
  font-size: 26rpx;
  letter-spacing: 2rpx;
  color: var(--ink-3);
  font-weight: 600;
  display: block;
  margin: 0 4rpx 14rpx;
  text-transform: uppercase;
}
.group-title .req { color: #C15837; margin-left: 4rpx; }
.pad { padding: 26rpx; }
.col { display: flex; flex-direction: column; gap: 24rpx; }
.field { display: flex; flex-direction: column; gap: 12rpx; }
.label { font-size: 26rpx; font-weight: 600; color: var(--ink-2); }
.hint { font-size: 22rpx; color: var(--ink-3); line-height: 1.6; margin-top: 12rpx; }

/* 分段控件 */
.seg-wrap { width: 100%; }
.seg {
  display: flex;
  padding: 8rpx;
  border-radius: 999rpx;
  background: var(--paper-bg-soft);
  position: relative;
  border: 1rpx solid var(--line);
}
.seg-thumb {
  position: absolute;
  top: 8rpx;
  bottom: 8rpx;
  border-radius: 999rpx;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1), width 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.seg-item {
  flex: 1;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  font-size: 24rpx;
  color: var(--ink-3);
  font-weight: 500;
  transition: color 0.2s;
}
.seg-item.on {
  color: var(--ink);
  font-weight: 700;
}

/* 输入框 */
.neo-input-wrap {
  border-radius: var(--radius-sm);
  background: var(--paper-bg-soft);
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border: 1rpx solid transparent;
}
.neo-input-wrap:focus-within {
  background: var(--paper-surface);
  border-color: var(--primary-line);
  box-shadow: 0 0 0 3rpx var(--primary-line), var(--shadow-soft);
}
.neo-input {
  flex: 1;
  height: 92rpx;
  font-size: 28rpx;
  color: var(--ink);
  background: transparent;
  font-weight: 500;
}
.flex-1 { flex: 1; }
.eye { padding: 0 8rpx; font-size: 30rpx; }

/* 请求地址 */
.derived {
  display: flex;
  align-items: baseline;
  gap: 8rpx;
  margin-top: 16rpx;
  padding: 16rpx 20rpx;
  border-radius: var(--radius-xs);
  background: var(--paper-bg-soft);
  border: 1rpx dashed var(--line-strong);
}
.derived-label {
  font-size: 22rpx;
  color: var(--ink-3);
  font-weight: 600;
  flex-shrink: 0;
}
.derived-url {
  font-size: 22rpx;
  color: var(--ink-2);
  font-weight: 500;
  word-break: break-all;
  font-family: 'SF Mono', 'Menlo', 'Consolas', monospace;
}

/* 模型列表拉取按钮 */
.input-with-btn {
  display: flex;
  gap: 14rpx;
  align-items: center;
}
.fetch-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 0 24rpx;
  height: 92rpx;
  border-radius: var(--radius-sm);
  background: var(--accent-green-soft);
  color: var(--accent-green);
  font-size: 24rpx;
  font-weight: 700;
  white-space: nowrap;
  transition: all 0.15s;
  flex-shrink: 0;
}
.fetch-btn:active { transform: scale(0.96); background: #D9E4C8; }

/* 模型 chips */
.model-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 18rpx;
}
.model-chip {
  padding: 14rpx 22rpx;
  border-radius: 20rpx;
  background: var(--paper-bg-soft);
  border: 1.5rpx solid var(--line);
  transition: all 0.2s;
}
.model-chip:active { transform: scale(0.96); }
.model-chip.on {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 4rpx 14rpx rgba(216, 106, 70, 0.3);
}
.model-chip-txt {
  font-size: 24rpx;
  color: var(--ink-2);
  font-weight: 600;
  white-space: nowrap;
}
.model-chip.on .model-chip-txt { color: #fff; }

/* 高级配置 */
.advance-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 4rpx 14rpx;
}
.advance-head .group-title { margin: 0; }
.advance-toggle {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--paper-bg-soft);
}
.advance-arrow {
  font-size: 40rpx;
  color: var(--ink-3);
  font-weight: 400;
  transition: transform 0.25s cubic-bezier(0.22, 1, 0.36, 1);
  display: inline-block;
  transform: rotate(0deg);
}
.advance-arrow.open { transform: rotate(90deg); color: var(--primary); }

/* 服务商选择 */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14rpx;
}
.provider-item {
  padding: 20rpx 10rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  border-radius: var(--radius-sm);
  background: var(--paper-bg-soft);
  border: 1.5rpx solid transparent;
  transition: all 0.2s;
}
.provider-item:active { transform: scale(0.96); }
.provider-item.on {
  background: var(--paper-surface);
  border-color: var(--primary);
  box-shadow: 0 4rpx 14rpx rgba(216, 106, 70, 0.2);
}
.provider-ico-wrap {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.provider-ico-wrap.openai   { background: #101827; }
.provider-ico-wrap.dashscope { background: #FF6A00; }
.provider-ico-wrap.ark       { background: #00B4FF; }
.provider-ico-wrap.gemini    { background: linear-gradient(135deg, #4285F4 0%, #EA4335 100%); }
.provider-ico-wrap.custom    { background: #8FA871; }
.ico-txt { color: #fff; font-size: 22rpx; font-weight: 800; }
.provider-name { font-size: 20rpx; color: var(--ink-2); font-weight: 600; text-align: center; }

/* 底部保存按钮 */
.bottom-area {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx calc(24rpx + env(safe-area-inset-bottom, 0px));
  background: linear-gradient(to top, var(--paper-bg) 60%, transparent);
  z-index: 100;
}
.save-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  height: 112rpx;
  border-radius: 999rpx;
  background: var(--accent-green);
  box-shadow: 0 12rpx 30rpx rgba(143, 165, 111, 0.38);
  transition: all 0.15s;
  font-weight: 700;
}
.save-btn:active {
  transform: scale(0.97);
  background: #7A915C;
}
.save-btn.loading { pointer-events: none; opacity: 0.8; }
.save-icon {
  font-size: 40rpx;
  color: #fff;
  font-weight: 800;
}
.save-text {
  font-size: 32rpx;
  color: #fff;
  font-weight: 800;
  letter-spacing: 1rpx;
}
.spin {
  width: 36rpx;
  height: 36rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 380px) {
  .provider-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
