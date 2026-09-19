<template>
  <view class="page paper-bg">
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </view>
      <text class="nav-head serif-title">绑定邮箱</text>
      <view class="nav-right-placeholder" />
    </view>

    <scroll-view scroll-y class="body">
      <view class="hint" v-if="currentEmail">
        当前已绑定：<text class="hint-email">{{ currentEmail }}</text>
      </view>
      <view class="hint" v-else>绑定邮箱后可通过邮箱登录，建议绑定。</view>

      <view class="form-card">
        <view class="form-item">
          <text class="form-label">邮箱</text>
          <input
            class="form-input"
            type="text"
            v-model="email"
            placeholder="QQ 或 163 邮箱"
            placeholder-class="input-placeholder"
          />
        </view>

        <view class="divider-h" />

        <view class="form-item">
          <text class="form-label">验证码</text>
          <input
            class="form-input code-input"
            type="text"
            v-model="verifyCode"
            placeholder="6 位验证码"
            placeholder-class="input-placeholder"
            maxlength="6"
          />
          <view class="code-btn" :class="{ disabled: codeCountdown > 0 || sending }" @tap="sendCode">
            {{ sending ? '发送中…' : codeCountdown > 0 ? codeCountdown + 's' : '获取验证码' }}
          </view>
        </view>
      </view>

      <view class="submit-section">
        <view
          :class="['submit-btn', { disabled: loading || !canSubmit }]"
          @tap="onSubmit"
        >
          <text v-if="loading">绑定中…</text>
          <text v-else>确认绑定</text>
        </view>
      </view>

      <view class="error-tip" v-if="error">{{ error }}</view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { request } from '@/utils/request'
import store from '@/store/index.js'

const email = ref('')
const verifyCode = ref('')
const loading = ref(false)
const sending = ref(false)
const codeCountdown = ref(0)
const error = ref('')
const currentEmail = ref('')

const canSubmit = computed(() => {
  return email.value.trim() && verifyCode.value.length === 6
})

onMounted(() => {
  store.loadAuth()
  if (store.user?.email) {
    currentEmail.value = store.user.email
  }
})

function goBack() {
  uni.navigateBack()
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)
}

async function sendCode() {
  if (codeCountdown.value > 0 || sending.value) return
  const mail = email.value.trim()
  if (!mail) {
    error.value = '请输入邮箱'
    return
  }
  if (!isValidEmail(mail)) {
    error.value = '邮箱格式不正确'
    return
  }
  error.value = ''
  sending.value = true
  try {
    const res = await request('/api/auth/send-verify-code', {
      method: 'POST',
      data: { email: mail },
    })
    if (res.code === 200) {
      uni.showToast({ title: '验证码已发送', icon: 'success' })
      codeCountdown.value = 60
      const timer = setInterval(() => {
        codeCountdown.value--
        if (codeCountdown.value <= 0) clearInterval(timer)
      }, 1000)
    } else {
      error.value = res.msg || '发送失败'
    }
  } catch (e) {
    error.value = (e && e.message) || '网络异常'
  } finally {
    sending.value = false
  }
}

async function onSubmit() {
  if (loading.value || !canSubmit.value) return
  const mail = email.value.trim()
  if (!isValidEmail(mail)) {
    error.value = '邮箱格式不正确'
    return
  }
  error.value = ''
  loading.value = true
  try {
    const res = await request('/api/auth/bind-email', {
      method: 'POST',
      data: { email: mail, verifyCode: verifyCode.value },
    })
    if (res.code === 200) {
      uni.showToast({ title: '绑定成功', icon: 'success' })
      // 刷新用户信息
      if (store.user) {
        store.user.email = mail
      }
      setTimeout(() => uni.navigateBack(), 800)
    } else {
      error.value = res.msg || '绑定失败'
    }
  } catch (e) {
    error.value = (e && e.message) || '网络异常'
  } finally {
    loading.value = false
  }
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
.hint {
  font-size: 26rpx;
  color: var(--ink-2);
  padding: 20rpx 12rpx;
  line-height: 1.6;
}
.hint-email {
  color: var(--primary);
  font-weight: 600;
}
.form-card {
  background: var(--paper-surface);
  border-radius: 24rpx;
  box-shadow: var(--shadow-soft);
  border: 1rpx solid rgba(255,255,255,0.8);
  overflow: hidden;
}
.form-item {
  display: flex;
  align-items: center;
  padding: 28rpx 28rpx;
  position: relative;
  min-height: 40rpx;
}
.form-label {
  font-size: 28rpx;
  color: var(--ink-2);
  width: 160rpx;
  flex-shrink: 0;
  font-weight: 600;
}
.form-input {
  flex: 1;
  font-size: 30rpx;
  color: var(--ink);
  background: transparent;
}
.input-placeholder {
  color: var(--ink-3);
}
.code-input {
  padding-right: 160rpx;
}
.code-btn {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  padding: 16rpx 24rpx;
  background: var(--primary);
  color: #fff;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-weight: 600;
}
.code-btn.disabled {
  opacity: 0.5;
}
.divider-h {
  height: 1rpx;
  background: var(--line);
  margin-left: 28rpx;
}
.submit-section {
  margin-top: 48rpx;
  padding: 0 12rpx;
}
.submit-btn {
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: #fff;
  text-align: center;
  padding: 28rpx 0;
  border-radius: 16rpx;
  font-size: 32rpx;
  font-weight: 700;
  letter-spacing: 2rpx;
  box-shadow: 0 8rpx 24rpx rgba(var(--primary-rgb), 0.3);
  transition: all 0.2s;
}
.submit-btn.disabled {
  opacity: 0.5;
  box-shadow: none;
}
.error-tip {
  margin-top: 24rpx;
  text-align: center;
  font-size: 26rpx;
  color: var(--danger);
}
</style>
