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
        <view class="field">
          <text class="label">昵称 / 用户名</text>
          <input class="input" v-model="username" :placeholder="mode === 'register' ? '给自己起个名字' : '请输入昵称'" placeholder-class="ph" />
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

      <view class="github-btn" @tap="githubLogin">
        <text class="gh-icon">&#xe600;</text>
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
  if (mode.value === 'register' && password.value.length < 6) {
    msg.value = '密码至少 6 位';
    return;
  }
  loading.value = true;
  msg.value = '';
  try {
    const url = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register';
    const res = await request(url, { method: 'POST', data: { username: username.value.trim(), password: password.value } });
    if (res.code === 200) {
      store.login(res.data);
      uni.showToast({ title: mode.value === 'login' ? '欢迎回来' : '注册成功', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 600);
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
    // 后端已适配：未配置 OAuth 时降级为本地体验账号，named 'GitHub 用户'
    const res = await request('/api/auth/github', { method: 'POST', data: { username: 'GitHub 用户' } });
    if (res.code === 200) {
      store.login(res.data);
      uni.showToast({ title: 'GitHub 快捷登录成功', icon: 'success' });
      setTimeout(() => uni.navigateBack(), 600);
    } else {
      msg.value = res.msg || '登录失败';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
  } finally {
    loading.value = false;
  }
}
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
}
.gh-icon { font-size: 30rpx; }
.tips { margin-top: 32rpx; text-align: center; font-size: 26rpx; color: #C0392B; }
</style>