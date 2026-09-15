<template>
  <view class="login-page">
    <view class="paper">
      <view class="brand">
        <view class="brand-mark"></view>
        <text class="brand-name">旅信 · Zine</text>
      </view>

      <view class="tabs">
        <view :class="['tab', mode === 'login' && 'active']" @tap="switchMode('login')">登 录</view>
        <view :class="['tab', mode === 'register' && 'active']" @tap="switchMode('register')">注 册</view>
      </view>

      <view class="form">
        <!-- 登录：用户名/邮箱通用输入 -->
        <view class="field" v-if="mode === 'login'">
          <text class="label">用户名 / 邮箱</text>
          <input class="input" v-model="username" placeholder="请输入用户名或邮箱" placeholder-class="ph" />
        </view>

        <!-- 注册：用户名 -->
        <view class="field" v-if="mode === 'register'">
          <text class="label">昵称 / 用户名</text>
          <input class="input" v-model="username" placeholder="给自己起个名字" placeholder-class="ph" />
        </view>

        <!-- 注册：邮箱 -->
        <view class="field" v-if="mode === 'register'">
          <text class="label">邮箱</text>
          <input class="input" v-model="email" type="text" placeholder="请输入邮箱地址" placeholder-class="ph" />
        </view>

        <view class="field">
          <text class="label">密 码</text>
          <input class="input" v-model="password" :password="!showPwd" :placeholder="mode === 'register' ? '至少 6 位' : '请输入密码'" placeholder-class="ph" />
          <text class="pwd-toggle" @tap="showPwd = !showPwd">{{ showPwd ? '隐藏' : '显示' }}</text>
        </view>
      </view>

      <view class="primary-btn" :class="{ loading: loading }" @tap="submit">
        <text>{{ loading ? '请稍候…' : mode === 'login' ? '进入旅信' : '创建账号' }}</text>
      </view>

      <view class="divider"><view class="line"></view><text class="divider-text">或</text><view class="line"></view></view>

      <view class="github-btn" :class="{ loading: loading }" @tap="githubLogin">
        <svg class="gh-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <text>GitHub 快捷登录</text>
      </view>

      <view class="tips" v-if="msg">{{ msg }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import store from '@/store';
import { request } from '@/utils/request';
import { onLoad } from '@dcloudio/uni-app';
const mode = ref('login');
const username = ref('');
const email = ref('');
const password = ref('');
const showPwd = ref(false);
const loading = ref(false);
const msg = ref('');

onLoad((opt) => {
  if (opt && opt.mode === 'register') mode.value = 'register';
});

function switchMode(m) {
  mode.value = m;
  msg.value = '';
}

async function submit() {
  if (!username.value.trim() || !password.value) {
    msg.value = '请填写完整';
    return;
  }
  if (mode.value === 'register') {
    if (!email.value.trim()) {
      msg.value = '请输入邮箱';
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim())) {
      msg.value = '邮箱格式不正确';
      return;
    }
    if (password.value.length < 6) {
      msg.value = '密码至少 6 位';
      return;
    }
  }
  loading.value = true;
  msg.value = '';
  try {
    const url = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register';
    const data = mode.value === 'login'
      ? { username: username.value.trim(), password: password.value }
      : { username: username.value.trim(), email: email.value.trim(), password: password.value };
    const res = await request(url, { method: 'POST', data });
    if (res.code === 200) {
      store.login(res.data);
      uni.showToast({ title: mode.value === 'login' ? '欢迎回来' : '注册成功', icon: 'success' });
      setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 600);
    } else {
      msg.value = res.msg || '操作失败';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
  } finally {
    loading.value = false;
  }
}

async function githubLogin() {
  loading.value = true;
  msg.value = '';
  try {
    // GitHub OAuth 后端入口（固定生产地址）
    const backendUrl = 'https://api.photozine.coze.site';
    // 跳转到后端 GitHub OAuth 入口
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = `${backendUrl}/api/auth/github`;
    } else {
      msg.value = '当前环境不支持 GitHub 登录';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
    loading.value = false;
  }
}

// 处理 GitHub 回调（从 URL 参数中提取 token）
function handleCallback() {
  if (typeof window === 'undefined' || !window.location) return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('github_token');
  const error = params.get('github_error');
  if (token) {
    // 清除 URL 参数
    window.history.replaceState({}, '', window.location.pathname);
    // 验证 token 并登录
    loading.value = true;
    verifyAndLogin(token);
  } else if (error) {
    window.history.replaceState({}, '', window.location.pathname);
    msg.value = `GitHub 登录失败：${error}`;
  }
}

async function verifyAndLogin(token) {
  try {
    const res = await request('/api/auth/me', {
      method: 'GET',
      headers: { 'x-session': token },
    });
    if (res.code === 200 && res.data && res.data.user) {
      store.login({ token, user: res.data.user });
      uni.showToast({ title: 'GitHub 登录成功', icon: 'success' });
      setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 600);
    } else {
      msg.value = 'GitHub 登录失败：验证失败';
      loading.value = false;
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
    loading.value = false;
  }
}

onLoad((opt) => {
  if (opt && opt.mode === 'register') mode.value = 'register';
  handleCallback();
});
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #F3EAD9;
  display: flex;
  justify-content: center;
  padding: 120rpx 48rpx;
  box-sizing: border-box;
}
.paper {
  width: 100%;
  max-width: 640rpx;
  background: #FFFDF8;
  border-radius: 24rpx;
  padding: 64rpx 56rpx;
  box-shadow: 0 12rpx 40rpx rgba(44, 36, 30, 0.08);
  box-sizing: border-box;
  height: fit-content;
}
.brand { display: flex; align-items: center; gap: 20rpx; margin-bottom: 48rpx; }
.brand-mark {
  width: 52rpx; height: 52rpx; border-radius: 14rpx;
  background: linear-gradient(135deg, #7A9BB5 0%, #26364A 100%);
  transform: rotate(-8deg);
}
.brand-name { font-size: 40rpx; color: #2C241E; font-family: 'LXGWWenKai-Regular', serif; }
.tabs { display: flex; justify-content: center; gap: 72rpx; margin-bottom: 48rpx; }
.tab { font-size: 30rpx; color: #8A7B6A; padding-bottom: 10rpx; position: relative; font-family: 'LXGWWenKai-Regular', serif; }
.tab.active { color: #2C241E; font-weight: 600; }
.tab.active::after {
  content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 4rpx;
  background: #26364A; border-radius: 4rpx;
}
.form .field { position: relative; margin-bottom: 40rpx; }
.label { font-size: 24rpx; color: #8A7B6A; display: block; margin-bottom: 14rpx; }
.input {
  background: #F7F1E5; border-radius: 12rpx; padding: 24rpx 28rpx;
  font-size: 30rpx; color: #2C241E; border: 2rpx solid #EEE4D2;
}
.ph { color: #C2B3A0; }
.pwd-toggle { position: absolute; right: 24rpx; bottom: 26rpx; font-size: 24rpx; color: #8A7B6A; }
.primary-btn {
  margin-top: 24rpx; background: #26364A; color: #FFF7EA; text-align: center;
  padding: 28rpx 0; border-radius: 12rpx; font-size: 30rpx; letter-spacing: 4rpx;
  font-family: 'LXGWWenKai-Regular', serif;
  transition: transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94), opacity 0.2s;
}
.primary-btn.loading { opacity: 0.6; }
.divider { display: flex; align-items: center; gap: 20rpx; margin: 48rpx 0 8rpx; }
.line { flex: 1; height: 2rpx; background: #EEE4D2; }
.divider-text { font-size: 24rpx; color: #B9A98F; }
.github-btn {
  margin-top: 28rpx; display: flex; align-items: center; justify-content: center; gap: 16rpx;
  border: 2rpx solid #D8CBB8; border-radius: 12rpx; padding: 24rpx 0;
  font-size: 28rpx; color: #2C241E; background: #FBF7ED;
  font-family: 'LXGWWenKai-Regular', serif;
  transition: all 0.2s;
}
.github-btn:active { background: #F0E8D8; transform: scale(0.98); }
.github-btn.loading { opacity: 0.6; pointer-events: none; }
.gh-icon { width: 32rpx; height: 32rpx; flex-shrink: 0; }
.tips { margin-top: 32rpx; text-align: center; font-size: 26rpx; color: #C0392B; }
</style>