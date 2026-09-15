<template>
  <view class="page paper-bg">
    <!-- 顶部栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </view>
      <text class="nav-head serif-title">设置</text>
      <view class="nav-right-placeholder" />
    </view>

    <scroll-view scroll-y class="body">
      <!-- 账号信息 -->
      <view class="section-title">账号</view>
      <view class="panel">
        <view class="setting-item" @click="goChangePassword">
          <text class="si-txt">修改密码</text>
          <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </view>
      </view>

      <!-- 其他设置 -->
      <view class="section-title">其他</view>
      <view class="panel">
        <view class="setting-item" @click="goFeedback">
          <text class="si-txt">意见反馈</text>
          <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </view>

        <view class="divider-h" />

        <view class="setting-item" @click="showLicense">
          <text class="si-txt">MIT 开源协议</text>
          <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </view>

        <view class="divider-h" />

        <view class="setting-item" @click="openGithub">
          <text class="si-txt">查看 GitHub 仓库</text>
          <svg class="arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9A8877" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6" /></svg>
        </view>
      </view>

      <!-- 退出登录 -->
      <view v-if="user" class="logout-section">
        <view class="logout-btn" @click="onLogout">
          <text class="logout-text">退出登录</text>
        </view>
      </view>

      <view class="foot-space" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import store from '@/store/index.js'

const user = ref(null)

onMounted(() => {
  store.loadAuth()
  user.value = store.user
})

function goBack() {
  uni.navigateBack()
}

function goAccount() {
  uni.showToast({ title: '账号信息不可修改', icon: 'none' })
}

function goChangePassword() {
  uni.navigateTo({ url: '/pages/settings/password' })
}

function goFeedback() {
  uni.navigateTo({ url: '/pages/feedback/feedback' })
}

function showLicense() {
  uni.navigateTo({ url: '/pages/license/license' })
}

function openGithub() {
  // 复制 GitHub 链接
  uni.setClipboardData({
    data: 'https://github.com/hjh20081210/photozine',
    success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
  })
}

function onLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    success: (r) => {
      if (!r.confirm) return
      store.clearAuth()
      uni.reLaunch({ url: '/pages/index/index' })
    },
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
}
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: var(--paper-surface);
  border-bottom: 1rpx solid var(--line);
}
.nav-back {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.nav-back:active {
  background: var(--bg-deep);
}
.nav-head {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--ink);
}
.nav-right-placeholder {
  width: 64rpx;
}
.body {
  height: calc(100vh - 120rpx);
  padding: 24rpx 32rpx;
  box-sizing: border-box;
}

.section-title {
  font-size: 24rpx;
  color: var(--ink-3);
  font-weight: 600;
  margin: 28rpx 0 16rpx;
  padding-left: 8rpx;
  letter-spacing: 1rpx;
}

.panel {
  background: var(--paper-surface);
  border-radius: 24rpx;
  box-shadow: var(--shadow-soft), 0 2rpx 8rpx rgba(0,0,0,0.02);
  border: 1rpx solid rgba(255,255,255,0.8);
  overflow: hidden;
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx;
  transition: background 0.15s;
}
.setting-item:active {
  background: var(--paper-bg-soft);
}

.si-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex: 1;
  min-width: 0;
}

.si-ico {
  width: 56rpx;
  height: 56rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.account-ico { background: linear-gradient(135deg, #6ec8a0, #4aad85); }
.pwd-ico { background: linear-gradient(135deg, #e8a86c, #d4884a); }
.fb-ico { background: linear-gradient(135deg, #ec8a7a, #d4604a); }
.license-ico { background: linear-gradient(135deg, #8a9ece, #5a72b8); }
.github-ico { background: linear-gradient(135deg, #5a5a5a, #3a3a3a); }

.si-txt-wrap {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
  min-width: 0;
}
.si-txt {
  font-size: 28rpx;
  color: var(--ink);
  font-weight: 600;
}
.si-sub {
  font-size: 22rpx;
  color: var(--ink-3);
}

.divider-h {
  height: 1rpx;
  background: var(--line);
  margin-left: 104rpx;
}

.arrow {
  flex-shrink: 0;
}

/* 退出登录 */
.logout-section {
  margin-top: 48rpx;
}
.logout-btn {
  height: 96rpx;
  border-radius: 24rpx;
  background: #fff;
  border: 1.5rpx solid #e8a0a0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}
.logout-btn:active {
  background: #fff5f5;
  border-color: #d4604a;
}
.logout-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #c44030;
  letter-spacing: 2rpx;
}

.foot-space {
  height: 60rpx;
}
</style>
