<template>
  <view class="page">
    <view class="head">
      <text class="title">用户管理</text>
      <text class="sub">共 {{ userCount }} 位注册用户</text>
    </view>

    <view class="count-card">
      <text class="count-num">{{ userCount }}</text>
      <text class="count-label">注册用户数</text>
      <text class="count-admin">{{ adminCount }} 位管理员</text>
    </view>

    <view class="section-title">注册用户列表</view>
    <view class="list">
      <view class="row" v-for="u in users" :key="u.id">
        <view class="avatar">{{ u.username.slice(0, 1) }}</view>
        <view class="info">
          <text class="uname">{{ u.username }}</text>
          <text class="utime">注册于 {{ fmt(u.createdAt) }}</text>
        </view>
        <view class="tag" :class="{ admin: u.isAdmin }">{{ u.isAdmin ? '管理员' : '用户' }}</view>
      </view>
    </view>

    <view class="section-title">收到的反馈</view>
    <view class="fb-list" v-if="feedbacks.length">
      <view class="fb-item" v-for="f in feedbacks" :key="f.id">
        <text class="fb-text">{{ f.content }}</text>
        <view class="fb-meta">
          <text class="fb-user">{{ f.fromUser }} · {{ fmt(f.createdAt) }}</text>
          <text class="fb-contact" v-if="f.contact">{{ f.contact }}</text>
        </view>
      </view>
    </view>
    <view class="empty" v-else>暂无反馈</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { request } from '@/utils/request';

const users = ref([]);
const feedbacks = ref([]);
const userCount = computed(() => users.value.length);
const adminCount = computed(() => users.value.filter(u => u.isAdmin).length);

function fmt(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

onMounted(async () => {
  try {
    const r = await request('/api/auth/users', { method: 'GET' });
    if (r.code === 200) users.value = r.data.users || [];
  } catch (e) { /* 忽略 */ }
  try {
    const f = await request('/api/feedback', { method: 'GET' });
    if (f.code === 200) feedbacks.value = f.data || [];
  } catch (e) { /* 忽略 */ }
});
</script>

<style scoped>
.page { min-height: 100vh; background: #F3EAD9; padding: 96rpx 40rpx 60rpx; box-sizing: border-box; }
.head { margin-bottom: 32rpx; }
.title { font-size: 44rpx; color: #2C241E; display: block; font-family: 'LXGWWenKai-Regular', serif; }
.sub { font-size: 24rpx; color: #8A7B6A; margin-top: 10rpx; display: block; }
.count-card {
  background: #26364A; color: #FFF7EA; border-radius: 20rpx; padding: 40rpx; text-align: center; margin-bottom: 48rpx;
}
.count-num { font-size: 72rpx; font-weight: 700; display: block; font-family: 'LXGWWenKai-Regular', serif; }
.count-label { font-size: 24rpx; opacity: 0.8; display: block; margin-top: 8rpx; }
.count-admin { font-size: 22rpx; opacity: 0.7; display: block; margin-top: 12rpx; }
.section-title { font-size: 30rpx; color: #5A4B3C; font-weight: 600; margin: 36rpx 0 20rpx; }
.list, .fb-list { background: #FFFDF8; border-radius: 16rpx; overflow: hidden; }
.row { display: flex; align-items: center; padding: 26rpx 28rpx; border-bottom: 2rpx solid #F0E6D6; }
.avatar {
  width: 72rpx; height: 72rpx; border-radius: 50%; background: #E7D9C2; color: #7A5C3A;
  display: flex; align-items: center; justify-content: center; font-size: 32rpx; font-weight: 600; margin-right: 22rpx;
}
.info { flex: 1; }
.uname { font-size: 30rpx; color: #2C241E; display: block; }
.utime { font-size: 22rpx; color: #B0A28E; margin-top: 8rpx; display: block; }
.tag { font-size: 22rpx; color: #4A7A54; background: #E8F2EA; padding: 6rpx 18rpx; border-radius: 999rpx; }
.tag.admin { color: #8A5A2A; background: #F5E7D2; }
.fb-item { padding: 26rpx 28rpx; border-bottom: 2rpx solid #F0E6D6; }
.fb-text { font-size: 28rpx; color: #2C241E; display: block; line-height: 1.6; }
.fb-meta { margin-top: 12rpx; display: flex; justify-content: space-between; }
.fb-user { font-size: 22rpx; color: #B0A28E; }
.fb-contact { font-size: 22rpx; color: #7A9BB5; }
.empty { text-align: center; color: #C2B3A0; padding: 60rpx 0; font-size: 26rpx; }
</style>