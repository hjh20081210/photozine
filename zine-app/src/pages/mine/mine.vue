<template>
  <view class="page paper-bg">
    <!-- 顶部栏：简洁标题，没有返回按钮（tab页不需要） -->
    <view class="nav-bar">
      <view class="nav-left-inner">
        <text class="nav-brand serif">Zine明信片创作</text>
        <text class="nav-head serif-title">我的明信片</text>
      </view>
      <view class="nav-right-placeholder" />
    </view>

    <scroll-view scroll-y class="body" :style="{ paddingBottom: '60rpx' }">
      <!-- 作品列表：2列网格 与参考图完全一致 -->
      <view class="zine-grid">
        <!-- 占位4张，展示网格样式 + 加载历史 -->
        <view
          v-for="(it, idx) in displayList"
          :key="it.id || idx"
          class="zine-card"
          @click="goDetail(it)"
        >
          <view class="cover">
            <image
              v-if="it.frontUrl"
              :src="it.frontUrl"
              mode="aspectFill"
              class="cover-img"
            />
            <view v-else class="cover-ph">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#C8B9A8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <circle cx="9" cy="10" r="1.6" />
                <path d="M4 18l5-5 3 3 2-2 6 6" />
              </svg>
            </view>
          </view>
          <view class="foot">
            <text class="title">{{ it.title || it.name || '未命名作品' }}</text>
            <view class="meta">
              <text class="date">{{ it.createdAtShort || formatTime(it.createdAt) }}</text>
              <text class="size">{{ it.ratioText || '2:3' }}</text>
            </view>
          </view>
          <text v-if="it.sides === 'FRONT_BACK'" class="badge">双</text>
          <text v-else class="badge single">单</text>
        </view>

        <!-- 空占位卡，让用户一进入就看到参考图的2列网格结构 -->
        <view v-if="!loading && items.length === 0" class="zine-card empty">
          <view class="cover cover-empty">
            <text class="empty-hint serif">还没有作品</text>
          </view>
          <view class="foot">
            <text class="title">去创作一张吧</text>
            <view class="meta">
              <text class="date">—</text>
              <text class="size">2:3</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 我的模型入口 -->
      <view class="divider" />
      <view class="line-item" @click="goModelSettings">
        <view class="li-left">
          <view class="li-ico model-ico">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="4" y="7" width="16" height="10" rx="2" />
              <circle cx="9" cy="12" r="1.5" />
              <circle cx="15" cy="12" r="1.5" />
            </svg>
          </view>
          <text class="li-txt serif">我的模型</text>
        </view>
        <view class="li-right">
          <text v-if="store.modelConfigs.length > 0" class="li-count">{{ store.modelConfigs.length }} 个已接入</text>
          <text v-else class="li-count empty">去接入</text>
          <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </view>
      </view>

      <!-- 草稿 / MIT / Github -->
      <view class="line-item" @click="toast('草稿')">
        <text class="li-txt serif">草稿</text>
        <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </view>
      <view class="line-item" @click="showLicense">
        <text class="li-txt serif">MIT开源协议</text>
        <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </view>
      <view class="line-item center" @click="openGithub">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6B5B4E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8rpx;">
          <path d="M6 20c-1 1-2 0-2-2m12 2c1 1 2 0 2-2M3 13c1 1 2 1 3 0m12 0c-1 1-2 1-3 0M7 8c0-1 1-2 3-2h4c2 0 3 1 3 2v2a9 9 0 0 1-9 9M8 11v2m8-2v2" />
        </svg>
        <text class="li-txt serif small">查看 Github 仓库</text>
        <text class="chev-down">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#6B5B4E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </text>
      </view>

      <view class="foot-space" />
    </scroll-view>

    <AppTabbar current="mine" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import store from '@/store/index.js'
import { request } from '@/utils/request.js'
import AppTabbar from '@/components/AppTabbar.vue'

const items = ref([])
const loading = ref(true)

const displayList = computed(() => items.value)

function formatTime(t) {
  if (!t) return '—'
  try {
    const d = new Date(t)
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${m}/${day}`
  } catch (e) { return '—' }
}

async function loadHistory() {
  // 没有后端时直接显示空状态，不阻塞
  if (!store.serverUrl || /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(store.serverUrl)) {
    items.value = []
    loading.value = false
    return
  }
  loading.value = true
  try {
    const arr = await request('/api/history', { timeout: 5000 })
    items.value = (arr || []).map((x) => ({
      ...x,
      createdAtShort: formatTime(x.createdAt),
      ratioText: (x.ratio && x.ratio.width && x.ratio.height) ? `${x.ratio.width}:${x.ratio.height}` : '2:3',
    }))
  } catch (e) {
    items.value = []
  } finally {
    loading.value = false
  }
}

function goModelSettings() { uni.navigateTo({ url: '/pages/settings/api' }) }
function goDetail(it) {
  if (!it || !it.id) {
    if (!it.frontUrl) { uni.switchTab({ url: '/pages/index/index' }); return }
  }
  // 跳结果页
  if (it.frontUrl) {
    store.preview = {
      taskId: it.id,
      frontUrl: it.frontUrl,
      backUrl: it.backUrl,
      ratio: (it.ratio && { w: it.ratio.width, h: it.ratio.height }) || { w: 2, h: 3 },
      styleName: it.style || '手绘水彩',
      sides: it.sides || 'FRONT_BACK',
      mode: it.mode || 'POSTCARD',
      title: it.title,
      location: it.location,
      date: it.date,
    }
    uni.navigateTo({ url: '/pages/result/result' })
  }
}
function toast(t) { uni.showToast({ title: t, icon: 'none' }) }
function showLicense() {
  uni.navigateTo({ url: '/pages/license/license' })
}
function openGithub() {
  const url = 'https://github.com/search?q=photo+to+zine+postcard&type=repositories'
  // #ifdef H5
  try { window.open(url, '_blank') } catch (e) { toast('Github') }
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url, success: () => toast('链接已复制') })
  // #endif
}

onMounted(loadHistory)
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }

/* ---------- 顶部栏 ---------- */
.nav-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 16rpx 32rpx 24rpx;
}
.nav-left-inner { display: flex; flex-direction: column; gap: 4rpx; }
.nav-brand { font-size: 24rpx; color: var(--ink-2); font-weight: 600; letter-spacing: 0.5rpx; }
.nav-head { font-size: 56rpx; line-height: 1.1; margin-top: 4rpx; }
.nav-right-placeholder { width: 72rpx; height: 72rpx; }

/* ---------- 主体 ---------- */
.body {
  height: calc(100vh - 220rpx);
  box-sizing: border-box;
  padding: 0 32rpx;
}

.cover-img { width: 100%; height: 100%; }
.cover-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: var(--paper-bg-soft);
}
.cover-empty {
  background: linear-gradient(180deg, #FAF5EC 0%, #EEE3CE 100%);
  display: flex; align-items: center; justify-content: center;
}
.empty-hint { font-size: 26rpx; color: var(--ink-3); letter-spacing: 1rpx; }
.zine-card.empty { opacity: 0.9; }
.badge.single { background: var(--accent-blue-soft); color: var(--accent-blue); }

/* ---------- 分割线 ---------- */
.divider {
  height: 1rpx;
  background: var(--line);
  margin: 40rpx 6rpx 22rpx;
}

/* ---------- 文字行：草稿 / MIT 协议 / Github ---------- */
.line-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 30rpx 14rpx;
  border-bottom: 1rpx solid var(--line);
  transition: opacity 0.15s;
}
.line-item:active { opacity: 0.7; }
.li-left { display: flex; align-items: center; gap: 18rpx; }
.li-ico {
  width: 56rpx; height: 56rpx;
  border-radius: 16rpx;
  display: flex; align-items: center; justify-content: center;
}
.li-ico.model-ico {
  background: var(--primary);
  box-shadow: 0 4rpx 12rpx rgba(216, 106, 70, 0.3);
}
.li-right { display: flex; align-items: center; gap: 10rpx; }
.li-count {
  font-size: 24rpx;
  color: var(--ink-2);
  font-weight: 500;
}
.li-count.empty { color: var(--primary-deep); font-weight: 600; }
.line-item.center {
  justify-content: center;
  gap: 8rpx;
  padding: 34rpx 14rpx;
  border-bottom: none;
  opacity: 0.85;
}
.li-txt {
  font-size: 28rpx;
  color: var(--ink-2);
  font-weight: 600;
  letter-spacing: 0.5rpx;
}
.li-txt.small { font-size: 24rpx; color: var(--ink-2); font-weight: 500; }
.chev-down { display: inline-flex; align-items: center; justify-content: center; }
.arrow { flex-shrink: 0; }

.foot-space { height: 40rpx; }
</style>
