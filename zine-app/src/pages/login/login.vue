<template>
  <view class="login-page">
    <view class="paper">
      <view class="brand">
        <view class="brand-mark"></view>
        <text class="brand-name">旅信 · Zine</text>
      </view>

      <!-- 上方：e7dfd77 版本布局（用户名/邮箱 + 密码，登录/注册 tab） -->
      <view class="tabs">
        <view :class="['tab', mode === 'login' && 'active']" @tap="switchMode('login')">登 录</view>
        <view :class="['tab', mode === 'register' && 'active']" @tap="switchMode('register')">注 册</view>
      </view>

      <view class="form">
        <view class="field">
          <text class="label">{{ mode === 'login' ? '用户名 / 邮箱' : '昵称 / 用户名' }}</text>
          <input class="input" v-model="username" :placeholder="mode === 'register' ? '给自己起个名字' : '请输入用户名或邮箱'" placeholder-class="ph" />
        </view>

        <view class="field" v-if="mode === 'register'">
          <text class="label">邮 箱（选填）</text>
          <input class="input" v-model="regEmail" placeholder="QQ / 163 邮箱（选填）" placeholder-class="ph" />
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

      <!-- GitHub 快捷登录 -->
      <view class="github-btn" :class="{ loading: ghLoading }" @tap="githubLogin">
        <svg class="gh-icon" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        <text>GitHub 快捷登录</text>
      </view>

      <!-- GitHub 下方：邮箱注册入口 -->
      <view class="email-register-entry" @tap="switchEmailMode">
        <text class="entry-text">{{ showEmailRegister ? '← 返回账号登录' : '使用邮箱注册（验证码）' }}</text>
      </view>

      <!-- 邮箱注册表单（展开式） -->
      <view class="email-register-form" v-if="showEmailRegister">
        <view class="field">
          <text class="label">用 户 名</text>
          <input class="input" v-model="emailUsername" placeholder="给自己起个名字" placeholder-class="ph" />
        </view>
        <view class="field">
          <text class="label">邮 箱</text>
          <input class="input" v-model="email" placeholder="QQ 或 163 邮箱" placeholder-class="ph" />
        </view>
        <view class="field">
          <text class="label">邮 箱 验 证 码</text>
          <view class="verify-row">
            <input class="input verify-input" v-model="verifyCode" placeholder="6 位验证码" placeholder-class="ph" maxlength="6" />
            <view class="code-btn" :class="{ disabled: codeCountdown > 0 || sending }" @tap="sendCode">
              <text>{{ sending ? '发送中…' : codeCountdown > 0 ? codeCountdown + 's' : '获取验证码' }}</text>
            </view>
          </view>
        </view>
        <view class="field">
          <text class="label">密 码</text>
          <input class="input" v-model="emailPassword" :password="!showEmailPwd" placeholder="至少 6 位" placeholder-class="ph" />
          <text class="pwd-toggle" @tap="showEmailPwd = !showEmailPwd">{{ showEmailPwd ? '隐藏' : '显示' }}</text>
        </view>
        <view class="primary-btn" :class="{ loading: emailLoading }" @tap="emailRegister">
          <text>{{ emailLoading ? '注册中…' : '邮箱注册' }}</text>
        </view>
      </view>

      <view class="tips" v-if="msg">{{ msg }}</view>
    </view>

    <!-- 单账号限制弹窗 -->
    <view class="popup-mask" v-if="showExistPopup" @tap="closeExistPopup">
      <view class="popup-card" @tap.stop>
        <view class="popup-title">检测到已有账号</view>
        <view class="popup-desc">
          该系统支持单设备单账号。您的设备已注册过账号：
        </view>
        <view class="popup-user">
          <text class="pu-name">{{ existUser.username }}</text>
          <text class="pu-email" v-if="existUser.email">{{ existUser.email }}</text>
        </view>
        <view class="popup-desc small">
          您可以选择注销原账号后重新注册，或使用原账号登录。
        </view>
        <view class="popup-actions">
          <view class="popup-btn ghost" @tap="closeExistPopup">使用原账号登录</view>
          <view class="popup-btn danger" @tap="confirmDeleteAccount">注销原账号</view>
        </view>
      </view>
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
const regEmail = ref('');
const password = ref('');
const showPwd = ref(false);
const loading = ref(false);
const ghLoading = ref(false);
const msg = ref('');

// 邮箱注册
const showEmailRegister = ref(false);
const emailUsername = ref('');
const email = ref('');
const verifyCode = ref('');
const emailPassword = ref('');
const showEmailPwd = ref(false);
const emailLoading = ref(false);
const sending = ref(false);
const codeCountdown = ref(0);

// 单账号限制弹窗
const showExistPopup = ref(false);
const existUser = ref({ username: '', email: '' });

onLoad((opt) => {
  if (opt && opt.mode === 'register') mode.value = 'register';
  handleCallback();
});

function switchMode(m) {
  mode.value = m;
  msg.value = '';
  showEmailRegister.value = false;
}

function switchEmailMode() {
  showEmailRegister.value = !showEmailRegister.value;
  msg.value = '';
}

// 上方快速注册/登录
async function submit() {
  if (!username.value.trim() || !password.value) {
    msg.value = '请填写完整';
    return;
  }
  if (mode.value === 'register' && password.value.length < 6) {
    msg.value = '密码至少 6 位';
    return;
  }
  if (mode.value === 'register' && regEmail.value && !isValidEmail(regEmail.value)) {
    msg.value = '邮箱格式不正确';
    return;
  }
  loading.value = true;
  msg.value = '';
  try {
    const url = mode.value === 'login' ? '/api/auth/login' : '/api/auth/register';
    const data = mode.value === 'login'
      ? { username: username.value.trim(), password: password.value }
      : { username: username.value.trim(), email: regEmail.value.trim(), password: password.value };
    const res = await request(url, { method: 'POST', data });
    if (res.code === 200) {
      store.login(res.data);
      uni.showToast({ title: mode.value === 'login' ? '欢迎回来' : '注册成功', icon: 'success' });
      setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 600);
    } else if (res.code === 409) {
      // 单账号限制
      existUser.value = res.data || { username: '', email: '' };
      showExistPopup.value = true;
    } else {
      msg.value = res.msg || '操作失败';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
  } finally {
    loading.value = false;
  }
}

function closeExistPopup() {
  showExistPopup.value = false;
}

async function confirmDeleteAccount() {
  // 需要用户确认密码才能注销
  const pwd = await new Promise((resolve) => {
    uni.showModal({
      title: '注销账号',
      content: `请输入账号 "${existUser.value.username}" 的密码以确认注销。注销后所有数据将无法恢复。`,
      editable: true,
      placeholderText: '请输入原账号密码',
      success: (res) => {
        if (res.confirm) resolve(res.content || '');
        else resolve('');
      },
    });
  });
  if (!pwd) return;
  try {
    const res = await request('/api/auth/delete-account', {
      method: 'POST',
      data: { username: existUser.value.username, password: pwd },
    });
    if (res.code === 200) {
      uni.showToast({ title: '已注销', icon: 'success' });
      showExistPopup.value = false;
      // 清除本地 deviceId，允许重新注册
      uni.removeStorageSync('zine_device_id');
      // 清除登录态
      store.logout();
    } else {
      uni.showToast({ title: res.msg || '注销失败', icon: 'none' });
    }
  } catch (e) {
    uni.showToast({ title: '网络异常', icon: 'none' });
  }
}

// GitHub 登录
async function githubLogin() {
  ghLoading.value = true;
  msg.value = '';
  try {
    const backendUrl = 'https://api.photozine.coze.site';
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = `${backendUrl}/api/auth/github`;
    } else {
      msg.value = '当前环境不支持 GitHub 登录';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
    ghLoading.value = false;
  }
}

function handleCallback() {
  if (typeof window === 'undefined' || !window.location) return;
  const params = new URLSearchParams(window.location.search);
  const token = params.get('github_token');
  const error = params.get('github_error');
  if (token) {
    window.history.replaceState({}, '', window.location.pathname);
    ghLoading.value = true;
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
      ghLoading.value = false;
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
    ghLoading.value = false;
  }
}

// 邮箱注册
function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

async function sendCode() {
  if (codeCountdown.value > 0 || sending.value) return;
  if (!email.value.trim()) {
    msg.value = '请输入邮箱';
    return;
  }
  if (!isValidEmail(email.value)) {
    msg.value = '邮箱格式不正确';
    return;
  }
  sending.value = true;
  msg.value = '';
  try {
    const res = await request('/api/auth/send-verify-code', {
      method: 'POST',
      data: { email: email.value.trim() },
    });
    if (res.code === 200) {
      uni.showToast({ title: '验证码已发送', icon: 'success' });
      codeCountdown.value = 60;
      const timer = setInterval(() => {
        codeCountdown.value--;
        if (codeCountdown.value <= 0) clearInterval(timer);
      }, 1000);
    } else {
      msg.value = res.msg || '发送失败';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
  } finally {
    sending.value = false;
  }
}

async function emailRegister() {
  if (!emailUsername.value.trim() || !email.value.trim() || !verifyCode.value || !emailPassword.value) {
    msg.value = '请填写完整';
    return;
  }
  if (!isValidEmail(email.value)) {
    msg.value = '邮箱格式不正确';
    return;
  }
  if (verifyCode.value.length !== 6) {
    msg.value = '验证码为 6 位数字';
    return;
  }
  if (emailPassword.value.length < 6) {
    msg.value = '密码至少 6 位';
    return;
  }
  emailLoading.value = true;
  msg.value = '';
  try {
    const res = await request('/api/auth/register', {
      method: 'POST',
      data: {
        username: emailUsername.value.trim(),
        email: email.value.trim(),
        password: emailPassword.value,
        verifyCode: verifyCode.value,
      },
    });
    if (res.code === 200) {
      store.login(res.data);
      uni.showToast({ title: '注册成功', icon: 'success' });
      setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 600);
    } else if (res.code === 409) {
      existUser.value = res.data || { username: '', email: '' };
      showExistPopup.value = true;
    } else {
      msg.value = res.msg || '注册失败';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
  } finally {
    emailLoading.value = false;
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
  box-sizing: border-box;
  width: 100%;
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

/* 邮箱注册入口 */
.email-register-entry {
  margin-top: 24rpx; text-align: center;
}
.entry-text {
  font-size: 26rpx; color: #7A9BB5;
  font-family: 'LXGWWenKai-Regular', serif;
}

/* 邮箱注册表单 */
.email-register-form {
  margin-top: 32rpx;
  padding-top: 32rpx;
  border-top: 2rpx dashed #E0D6C2;
}
.verify-row { display: flex; gap: 20rpx; align-items: center; }
.verify-input { flex: 1; }
.code-btn {
  flex-shrink: 0;
  padding: 24rpx 28rpx;
  background: #7A9BB5;
  color: #FFF;
  border-radius: 12rpx;
  font-size: 26rpx;
  font-family: 'LXGWWenKai-Regular', serif;
  transition: all 0.2s;
}
.code-btn.disabled { opacity: 0.5; }

.tips { margin-top: 32rpx; text-align: center; font-size: 26rpx; color: #C0392B; }

/* 单账号限制弹窗 */
.popup-mask {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.popup-card {
  width: 80%; max-width: 600rpx;
  background: #FFFDF8; border-radius: 20rpx;
  padding: 48rpx 40rpx;
  box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.2);
}
.popup-title {
  font-size: 34rpx; color: #2C241E; font-weight: 600;
  font-family: 'LXGWWenKai-Regular', serif;
  text-align: center; margin-bottom: 24rpx;
}
.popup-desc {
  font-size: 26rpx; color: #6B5D4E;
  line-height: 1.6;
  margin-bottom: 16rpx;
}
.popup-desc.small { font-size: 24rpx; color: #8A7B6A; margin-top: 16rpx; }
.popup-user {
  background: #F7F1E5;
  border-radius: 12rpx;
  padding: 24rpx 28rpx;
  margin: 16rpx 0;
  display: flex; flex-direction: column; gap: 8rpx;
}
.pu-name { font-size: 28rpx; color: #2C241E; font-weight: 600; }
.pu-email { font-size: 24rpx; color: #8A7B6A; }
.popup-actions {
  display: flex; gap: 20rpx; margin-top: 32rpx;
}
.popup-btn {
  flex: 1; text-align: center;
  padding: 24rpx 0; border-radius: 12rpx;
  font-size: 28rpx;
  font-family: 'LXGWWenKai-Regular', serif;
}
.popup-btn.ghost {
  border: 2rpx solid #D8CBB8;
  color: #6B5D4E;
  background: #FBF7ED;
}
.popup-btn.danger {
  background: #C0392B;
  color: #FFF;
}
</style>
