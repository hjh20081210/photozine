<template>
  <view class="page paper-bg">
    <!-- 顶部栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </view>
      <text class="nav-head serif-title">修改密码</text>
      <view class="nav-right-placeholder" />
    </view>

    <scroll-view scroll-y class="body">
      <view class="form-card">
        <!-- 原密码 -->
        <view class="form-item">
          <text class="form-label">原密码</text>
          <input
            class="form-input"
            type="password"
            v-model="oldPassword"
            placeholder="请输入原密码"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="divider-h" />

        <!-- 新密码 -->
        <view class="form-item">
          <text class="form-label">新密码</text>
          <input
            class="form-input"
            type="password"
            v-model="newPassword"
            placeholder="请输入新密码（至少6位）"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="divider-h" />

        <!-- 确认新密码 -->
        <view class="form-item">
          <text class="form-label">确认新密码</text>
          <input
            class="form-input"
            type="password"
            v-model="confirmPassword"
            placeholder="请再次输入新密码"
            placeholder-class="input-placeholder"
          />
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-section">
        <view
          :class="['submit-btn', { disabled: loading || !canSubmit }]"
          @click="onSubmit"
        >
          <text v-if="loading" class="submit-text">修改中…</text>
          <text v-else class="submit-text">确认修改</text>
        </view>
        <text class="submit-tip">密码修改成功后将自动退出登录，请用新密码重新登录</text>
      </view>

      <view class="foot-space" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { request } from '@/utils/request.js'
import store from '@/store/index.js'

const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const loading = ref(false)

const canSubmit = computed(() => {
  return oldPassword.value.length > 0
    && newPassword.value.length >= 6
    && confirmPassword.value.length >= 6
})

function goBack() {
  uni.navigateBack()
}

async function onSubmit() {
  if (loading.value || !canSubmit.value) return
  if (newPassword.value !== confirmPassword.value) {
    uni.showToast({ title: '两次输入的新密码不一致', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const res = await request('/api/auth/change-password', {
      method: 'POST',
      timeout: 10000,
      data: {
        oldPassword: oldPassword.value,
        newPassword: newPassword.value,
        confirmPassword: confirmPassword.value,
      },
    })
    if (res.code === 200) {
      uni.showToast({ title: '密码修改成功', icon: 'success' })
      // 清除本地登录态
      store.clearAuth()
      setTimeout(() => {
        uni.reLaunch({ url: '/pages/login/login' })
      }, 1200)
    } else {
      uni.showToast({ title: res.msg || '修改失败', icon: 'none' })
    }
  } catch (e) {
    const msg = e.message || '修改失败'
    if (msg.includes('401') || msg.includes('原密码错误')) {
      uni.showToast({ title: '原密码错误', icon: 'none' })
    } else {
      uni.showToast({ title: msg, icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx 24rpx;
}
.nav-back {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: flex-start;
}
.nav-head { font-size: 40rpx; font-weight: 700; }
.nav-right-placeholder { width: 72rpx; height: 72rpx; }

.body {
  height: calc(100vh - 120rpx);
  box-sizing: border-box;
  padding: 0 32rpx;
}

.form-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 0 32rpx;
  box-shadow: var(--shadow-soft);
  border: 1rpx solid rgba(255,255,255,0.8);
  margin-bottom: 40rpx;
}

.form-item {
  display: flex;
  flex-direction: column;
  padding: 28rpx 0;
  gap: 12rpx;
}

.form-label {
  font-size: 26rpx;
  color: var(--ink-3);
  font-weight: 500;
}

.form-input {
  font-size: 30rpx;
  color: var(--ink);
  width: 100%;
  padding: 8rpx 0;
}

.input-placeholder {
  color: #B8B0A5;
  font-size: 28rpx;
}

.divider-h {
  height: 1rpx;
  background: var(--line);
  margin: 0;
}

.submit-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  margin-top: 20rpx;
}

.submit-btn {
  width: 100%;
  height: 96rpx;
  border-radius: 48rpx;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(193, 88, 55, 0.35);
  transition: all 0.2s;
}

.submit-btn:active {
  transform: scale(0.98);
}

.submit-btn.disabled {
  background: linear-gradient(135deg, #c9b9a8 0%, #a89888 100%);
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}

.submit-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #fff;
  letter-spacing: 2rpx;
}

.submit-tip {
  font-size: 22rpx;
  color: var(--ink-3);
  opacity: 0.7;
}

.foot-space { height: 60rpx; }
</style>
