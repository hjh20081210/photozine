<template>
  <view class="fb-page">
    <view class="paper">
      <view class="head">
        <text class="head-title">意见反馈</text>
        <text class="head-sub">你的声音会被送达管理员 @何佳壕</text>
      </view>

      <view class="form">
        <view class="field">
          <text class="label">想说的话</text>
          <textarea class="textarea" v-model="content" placeholder="告诉我们哪里可以做得更好，或你的新想法…" placeholder-class="ph" :maxlength="500" />
        </view>

        <view class="field">
          <text class="label">联系方式（选填）</text>
          <input class="input" v-model="contact" placeholder="邮箱 / 手机号 / 微信号" placeholder-class="ph" />
        </view>
      </view>

      <view class="primary-btn" :class="{ loading: loading }" @tap="submit">
        <text>{{ loading ? '提交中…' : '提交反馈' }}</text>
      </view>

      <view class="tips" v-if="msg" :class="{ ok: ok }">{{ msg }}</view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { request } from '@/utils/request';

const content = ref('');
const contact = ref('');
const loading = ref(false);
const msg = ref('');
const ok = ref(false);

async function submit() {
  if (!content.value.trim()) {
    msg.value = '请先写下你的想法';
    ok.value = false;
    return;
  }
  loading.value = true;
  msg.value = '';
  ok.value = false;
  try {
    const res = await request('/api/feedback', { method: 'POST', data: { content: content.value.trim(), contact: contact.value.trim() } });
    if (res.code === 200) {
      ok.value = true;
      msg.value = '反馈已送达，感谢你的建议';
      content.value = '';
      contact.value = '';
    } else {
      msg.value = res.msg || '提交失败';
    }
  } catch (e) {
    msg.value = (e && e.message) || '网络异常';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.fb-page {
  min-height: 100vh;
  background: #F3EAD9;
  padding: 96rpx 48rpx;
  box-sizing: border-box;
}
.paper {
  background: #FFFDF8; border-radius: 24rpx; padding: 56rpx;
  box-shadow: 0 12rpx 40rpx rgba(44, 36, 30, 0.08);
}
.head { margin-bottom: 48rpx; }
.head-title { font-size: 42rpx; color: #2C241E; display: block; font-family: 'LXGWWenKai-Regular', serif; }
.head-sub { font-size: 24rpx; color: #8A7B6A; margin-top: 12rpx; display: block; }
.field { margin-bottom: 40rpx; }
.label { font-size: 24rpx; color: #8A7B6A; display: block; margin-bottom: 14rpx; }
.textarea {
  width: 100%; height: 280rpx; box-sizing: border-box;
  background: #F7F1E5; border-radius: 12rpx; padding: 24rpx;
  font-size: 30rpx; color: #2C241E; border: 2rpx solid #EEE4D2; line-height: 1.6;
}
.input {
  width: 100%; box-sizing: border-box;
  background: #F7F1E5; border-radius: 12rpx; padding: 22rpx 26rpx;
  font-size: 30rpx; color: #2C241E; border: 2rpx solid #EEE4D2;
}
.ph { color: #C2B3A0; }
.primary-btn {
  margin-top: 16rpx; background: #26364A; color: #FFF7EA; text-align: center;
  padding: 28rpx 0; border-radius: 12rpx; font-size: 30rpx; letter-spacing: 4rpx;
  font-family: 'LXGWWenKai-Regular', serif;
}
.primary-btn.loading { opacity: 0.6; }
.tips { margin-top: 32rpx; text-align: center; font-size: 26rpx; color: #C0392B; }
.tips.ok { color: #4A7A54; }
</style>