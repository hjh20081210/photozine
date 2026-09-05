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
      <!-- 登录状态卡片 -->
      <view class="auth-card">
        <template v-if="user">
          <view class="auth-avatar">{{ (user.username || 'U').slice(0, 1) }}</view>
          <view class="auth-info">
            <text class="auth-name">{{ user.username }}</text>
            <text class="auth-role" :class="{ admin: user.isAdmin }">{{ user.isAdmin ? '管理员' : '普通用户' }}</text>
          </view>
          <view class="auth-points-mini">
            <text class="auth-points-num">{{ points }}</text>
            <text class="auth-points-label">积分</text>
          </view>
        </template>
        <template v-else>
          <view class="auth-avatar guest">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
            </svg>
          </view>
          <view class="auth-info">
            <text class="auth-name">未登录</text>
            <text class="auth-role">登录后同步作品与账号</text>
          </view>
          <view class="auth-login-btn" @click="goLogin">
            <text>登录 / 注册</text>
          </view>
        </template>
      </view>

      <!-- 积分卡片 + 签到 -->
      <view class="points-card neo-card">
        <view class="points-left">
          <view class="points-label">我的积分</view>
          <view class="points-value">
            <text class="points-num">{{ points }}</text>
            <text class="points-unit">分</text>
          </view>
          <view class="points-tip" v-if="user">
            <text v-if="checkedToday">今日已签到 ✓</text>
            <text v-else>每日签到 +{{ dailyReward }} 积分</text>
          </view>
          <view v-else class="points-tip">登录后查看积分</view>
        </view>
        <view
          :class="['check-in-btn', { disabled: !user || checkedToday || checkLoading, checked: checkedToday }]"
          @click="onCheckIn"
        >
          <text v-if="checkLoading" class="check-in-text">签到中...</text>
          <text v-else class="check-in-text">{{ !user ? '登录领' : (checkedToday ? '已签到' : '签到') }}</text>
        </view>
      </view>

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

      <!-- 意见反馈 -->
      <view class="line-item" @click="goSettings">
        <view class="li-left">
          <view class="li-ico settings-ico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68 1.65 1.65 0 0 0 10 3.17V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </view>
          <text class="li-txt serif">设置</text>
        </view>
        <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </view>

      <view class="line-item" @click="goFeedback">
        <view class="li-left">
          <view class="li-ico fb-ico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </view>
          <text class="li-txt serif">意见反馈</text>
        </view>
        <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </view>

      <!-- 管理员：用户管理 -->
      <view v-if="user && user.isAdmin" class="line-item" @click="goAdminUsers">
        <view class="li-left">
          <view class="li-ico admin-ico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </view>
          <text class="li-txt serif">用户管理</text>
        </view>
        <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
      </view>

      <!-- 管理员：免费模型管理 -->
      <view v-if="user && user.isAdmin" class="line-item" @click="goAdminFreeModels">
        <view class="li-left">
          <view class="li-ico admin-ico">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </view>
          <text class="li-txt serif">免费模型管理</text>
        </view>
        <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
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
const user = ref(null)
const points = ref(0)
const checkedToday = ref(false)
const dailyReward = ref(200)
const checkLoading = ref(false)

const displayList = computed(() => items.value)

onMounted(() => {
  loadHistory()
  syncUser()
})

function syncUser() {
  store.loadAuth()
  user.value = store.user
  if (store.user && store.token) {
    loadPoints()
  }
}

async function loadPoints() {
  if (!store.token) {
    store.loadAuth()
    if (!store.token) return
  }
  try {
    const data = await request('/api/points/status', { timeout: 6000 })
    points.value = data.points
    checkedToday.value = data.checkedToday
    dailyReward.value = data.dailyReward
  } catch (e) {
    const msg = e.message || ''
    if (msg.includes('401') || msg.includes('未登录') || msg.includes('令牌')) {
      // token 失效，清除本地登录态
      store.clearAuth()
      user.value = null
      points.value = 0
      checkedToday.value = false
    }
  }
}

async function onCheckIn() {
  if (!store.token || !user.value) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  if (checkedToday.value) return
  checkLoading.value = true
  try {
    const data = await request('/api/points/check-in', { method: 'POST', timeout: 8000 })
    if (data.checked) {
      points.value = data.points
      checkedToday.value = true
      uni.showToast({ title: `签到成功 +${data.reward} 积分`, icon: 'none' })
    } else {
      checkedToday.value = true
      uni.showToast({ title: '今日已签到', icon: 'none' })
    }
  } catch (e) {
    const msg = e.message || '签到失败'
    if (msg.includes('401') || msg.includes('未登录') || msg.includes('令牌')) {
      store.clearAuth()
      user.value = null
      points.value = 0
      checkedToday.value = false
      uni.navigateTo({ url: '/pages/login/login' })
    } else {
      uni.showToast({ title: msg, icon: 'none' })
    }
  } finally {
    checkLoading.value = false
  }
}

function goLogin() {
  uni.navigateTo({ url: '/pages/login/login' })
}
function goFeedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' })
}
function goSettings() {
  uni.navigateTo({ url: '/pages/settings/general' })
}
function goAdminUsers() {
  uni.navigateTo({ url: '/pages/admin-users/admin-users' })
}
function goAdminFreeModels() {
  uni.navigateTo({ url: '/pages/admin-free-models/admin-free-models' })
}

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
  // H5 下空 serverUrl 表示走相对路径，允许继续
  let skip = false
  // #ifdef H5
  if (store.serverUrl && /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(store.serverUrl)) {
    skip = true
  }
  // #endif
  // #ifndef H5
  if (!store.serverUrl || /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(store.serverUrl)) {
    skip = true
  }
  // #endif
  if (skip) {
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
    // 接口失败时用本地缓存兜底
    const local = uni.getStorageSync('zine_local_history') || []
    items.value = (Array.isArray(local) ? local : []).map((x) => ({
      ...x,
      createdAtShort: formatTime(x.createdAt),
      ratioText: (x.ratio && x.ratio.width && x.ratio.height) ? `${x.ratio.width}:${x.ratio.height}` : '2:3',
    }))
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

/* ---------- 登录状态卡片 ---------- */
.auth-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 28rpx;
  background: linear-gradient(135deg, #fff 0%, #faf6f0 100%);
  border-radius: 24rpx;
  box-shadow: var(--shadow-soft);
  border: 1rpx solid rgba(255,255,255,0.8);
}
.auth-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 4rpx 12rpx rgba(193, 88, 55, 0.3);
}
.auth-avatar.guest {
  background: linear-gradient(135deg, #c8b9a8 0%, #a89888 100%);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}
.auth-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  min-width: 0;
}
.auth-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--ink);
}
.auth-role {
  font-size: 22rpx;
  color: var(--ink-3);
}
.auth-role.admin {
  color: var(--primary-deep);
  font-weight: 600;
}
.auth-points-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  flex-shrink: 0;
}
.auth-points-num {
  font-size: 36rpx;
  font-weight: 800;
  color: var(--primary-deep);
  font-family: Georgia, 'Times New Roman', serif;
}
.auth-points-label {
  font-size: 20rpx;
  color: var(--ink-3);
}
.auth-login-btn {
  padding: 16rpx 32rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
  color: #fff;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(193, 88, 55, 0.3);
  transition: all 0.2s;
  flex-shrink: 0;
}
.auth-login-btn:active {
  transform: scale(0.96);
}

/* 设置图标颜色 */
.li-ico.settings-ico {
  background: linear-gradient(135deg, #8a9ece, #5a72b8);
  box-shadow: 0 4rpx 12rpx rgba(90, 114, 184, 0.3);
}

.foot-space { height: 40rpx; }

/* ---------- 积分卡片 ---------- */
.points-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 32rpx;
  margin-bottom: 28rpx;
  background: linear-gradient(135deg, #fff8f0 0%, #ffe8d8 50%, #ffd9c0 100%);
  border-radius: 24rpx;
  box-shadow: var(--shadow-soft), 0 4rpx 16rpx rgba(216, 106, 70, 0.12);
  border: 1rpx solid rgba(255,255,255,0.7);
  position: relative;
  overflow: hidden;
}
.points-card::before {
  content: '';
  position: absolute;
  top: -40rpx;
  right: -40rpx;
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  pointer-events: none;
}
.points-left {
  flex: 1;
  z-index: 1;
}
.points-label {
  font-size: 24rpx;
  color: #8b5e3c;
  font-weight: 500;
  margin-bottom: 8rpx;
  opacity: 0.85;
}
.points-value {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}
.points-num {
  font-size: 56rpx;
  font-weight: 800;
  color: var(--primary-deep);
  font-family: Georgia, 'Times New Roman', serif;
  letter-spacing: 2rpx;
  line-height: 1.1;
}
.points-unit {
  font-size: 24rpx;
  color: #a0603d;
  font-weight: 600;
  margin-left: 4rpx;
}
.points-tip {
  font-size: 22rpx;
  color: #9a6a48;
  margin-top: 10rpx;
  opacity: 0.8;
}
.check-in-btn {
  width: 140rpx;
  height: 72rpx;
  border-radius: 36rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 18rpx rgba(193, 88, 55, 0.35);
  transition: all 0.2s;
  flex-shrink: 0;
  z-index: 1;
}
.check-in-btn:active {
  transform: scale(0.96);
  box-shadow: 0 4rpx 12rpx rgba(193, 88, 55, 0.3);
}
.check-in-btn.disabled {
  background: linear-gradient(135deg, #c9b9a8 0%, #a89888 100%);
  box-shadow: 0 3rpx 10rpx rgba(0,0,0,0.15);
}
.check-in-btn.checked {
  background: linear-gradient(135deg, #7ab89a 0%, #5a987a 100%);
  box-shadow: 0 3rpx 10rpx rgba(90, 152, 122, 0.3);
}
.check-in-text {
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 1rpx;
}
</style>
