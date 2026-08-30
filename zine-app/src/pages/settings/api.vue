<template>
  <view class="page paper-bg">
    <!-- 顶部栏 -->
    <view class="nav-bar" :style="{ paddingTop: headerPad }">
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </view>
      <text class="nav-head serif-title">我的模型</text>
      <view class="nav-right-placeholder" />
    </view>

    <scroll-view scroll-y class="body" :style="{ paddingBottom: '220rpx' }">
      <!-- 空状态（仅当没有用户自定义模型时） -->
      <view v-if="store.modelConfigs.filter(x => !x.free).length === 0" class="empty">
        <view class="empty-ico">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#8FA56F" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="4" width="18" height="14" rx="3" />
            <circle cx="12" cy="11" r="3.2" />
            <path d="M7 21h10" />
          </svg>
        </view>
        <text class="empty-title">没有已接入的模型</text>
        <text class="empty-sub">点击下方按钮，添加你自己的服务商与 API Key</text>
      </view>

      <!-- 模型列表（过滤掉内置免费模型，只显示用户自定义模型） -->
      <view v-else class="cfg-list">
        <view
          v-for="c in store.modelConfigs.filter(x => !x.free)"
          :key="c.id"
          class="cfg-item neo-card"
          @click="goEdit(c)"
        >
          <view class="cfg-ico-wrap" :class="c.provider">
            <text class="cfg-ico-txt">{{ shortName(c.provider) }}</text>
          </view>
          <view class="cfg-main">
            <text class="cfg-name">{{ c.name }}</text>
            <text class="cfg-sub">{{ c.model }}</text>
          </view>
          <view class="cfg-del" @click.stop="onDelete(c)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C26155" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </view>
          <view class="cfg-chev">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </view>
        </view>
      </view>
    </scroll-view>

    <!-- 底部添加按钮 -->
    <view class="bottom-bar">
      <view class="add-btn" @click="goAdd">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <text>添加模型</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import store from '@/store/index.js'

const headerPad = computed(() => {
  // #ifdef H5
  return '12rpx'
  // #endif
  // #ifndef H5
  return 'calc(' + 'env(safe-area-inset-top)' + ' + 12rpx)'
  // #endif
})

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

function goBack() {
  uni.navigateBack({ fail: () => { uni.switchTab({ url: '/pages/index/index' }) } })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/settings/add-model' })
}

function goEdit(c) {
  if (!c || !c.id) return
  uni.navigateTo({ url: '/pages/settings/add-model?id=' + c.id })
}

function onDelete(c) {
  uni.showModal({
    title: '删除模型？',
    content: `将会删除「${c.name}」，删除后需要重新填入才能再使用。`,
    confirmColor: '#C15837',
    success(r) {
      if (r.confirm) {
        store.deleteConfig(c.id)
        uni.showToast({ title: '已删除', icon: 'none' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }

/* ---------- 顶部栏 ---------- */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx 24rpx;
}
.nav-back {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  display: flex; align-items: center; justify-content: center;
}
.nav-head { font-size: 38rpx; font-weight: 700; letter-spacing: 0.5rpx; }
.nav-right-placeholder { width: 72rpx; height: 72rpx; }

/* ---------- 主体 ---------- */
.body {
  height: calc(100vh - 170rpx);
  box-sizing: border-box;
  padding: 8rpx 32rpx 0;
}

/* ---------- 空状态 ---------- */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18rpx;
  padding: 140rpx 40rpx;
  text-align: center;
}
.empty-ico {
  width: 140rpx; height: 140rpx;
  border-radius: 40rpx;
  background: var(--accent-green-soft);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20rpx;
}
.empty-title { font-size: 32rpx; font-weight: 700; color: var(--ink); }
.empty-sub { font-size: 26rpx; color: var(--ink-3); line-height: 1.7; max-width: 80%; }

/* ---------- 列表 ---------- */
.cfg-list { display: flex; flex-direction: column; gap: 18rpx; }
.cfg-item {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 26rpx 28rpx;
  border-radius: var(--radius);
  background: var(--paper-surface);
  box-shadow: var(--shadow-card);
  transition: transform 0.15s;
}
.cfg-item:active { transform: scale(0.99); }

.cfg-ico-wrap {
  width: 88rpx; height: 88rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: var(--shadow-soft);
}
.cfg-ico-wrap.openai    { background: #101827; }
.cfg-ico-wrap.dashscope { background: #FF6A00; }
.cfg-ico-wrap.ark       { background: #00B4FF; }
.cfg-ico-wrap.gemini    { background: linear-gradient(135deg, #4285F4 0%, #EA4335 100%); }
.cfg-ico-wrap.custom    { background: #8FA871; }
.cfg-ico-txt { color: #fff; font-size: 28rpx; font-weight: 800; letter-spacing: 0.5rpx; }

.cfg-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.cfg-name {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cfg-sub {
  font-size: 24rpx;
  color: var(--ink-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cfg-del {
  width: 64rpx; height: 64rpx;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--danger-soft);
  flex-shrink: 0;
  transition: transform 0.15s;
}
.cfg-del:active { transform: scale(0.92); }

.cfg-chev {
  width: 48rpx; height: 48rpx;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

/* ---------- 底部添加按钮 ---------- */
.bottom-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24rpx 32rpx;
  padding-bottom: calc(env(safe-area-inset-bottom) + 24rpx);
  background: linear-gradient(180deg, rgba(244, 239, 232, 0) 0%, var(--paper-bg) 40%);
  z-index: 20;
}
.add-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  height: 104rpx;
  border-radius: 999rpx;
  background: var(--accent-green);
  box-shadow: 0 10rpx 24rpx rgba(143, 165, 111, 0.35);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 1rpx;
  transition: transform 0.15s, box-shadow 0.15s;
}
.add-btn:active {
  transform: scale(0.98);
  background: #7C935E;
  box-shadow: 0 5rpx 14rpx rgba(143, 165, 111, 0.3);
}
</style>
