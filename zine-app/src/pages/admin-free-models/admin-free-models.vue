<template>
  <view class="page">
    <view class="head">
      <text class="title">默认免费模型管理</text>
      <text class="sub">所有用户免费使用，密钥仅存后端不公开</text>
    </view>

    <view class="list">
      <view class="row" v-for="m in models" :key="m.id">
        <view class="info">
          <text class="mname">{{ m.id }}</text>
          <text class="mmodel">模型: {{ m.model }}</text>
          <text class="mendpoint">{{ m.endpoint }}</text>
          <text class="mkind">类型: {{ m.kind }} · 密钥{{ m.hasKey ? '已配置' : '未配置' }}</text>
        </view>
        <view class="ops">
          <view class="op-btn" @tap="openEdit(m)">编辑</view>
          <view class="op-btn danger" @tap="remove(m)">删除</view>
        </view>
      </view>
    </view>

    <view class="empty" v-if="!models.length">暂无免费模型</view>

    <view class="add-btn" @tap="openAdd">+ 添加免费模型</view>

    <view class="mask" v-if="showForm" @tap="showForm = false">
      <view class="form" @tap.stop>
        <text class="form-title">{{ editing ? '编辑免费模型' : '添加免费模型' }}</text>
        <input class="input" v-model="form.id" placeholder="模型识别ID (如 rumeng-flash-3)" :disabled="editing" />
        <input class="input" v-model="form.model" placeholder="传给中转站的模型名 (如 入梦 Flash)" />
        <input class="input" v-model="form.endpoint" placeholder="完整请求地址 (含 /chat/completions)" />
        <input class="input" v-model="form.apiKey" placeholder="API 密钥 (编辑时留空=保持不变)" />
        <view class="kind-row">
          <view class="kind" :class="{ on: form.kind === 'image' }" @tap="form.kind = 'image'">生图 (image)</view>
          <view class="kind" :class="{ on: form.kind === 'chat' }" @tap="form.kind = 'chat'">对话 (chat)</view>
        </view>
        <view class="form-ops">
          <view class="f-btn" @tap="save">保存</view>
          <view class="f-btn cancel" @tap="showForm = false">取消</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { request } from '@/utils/request';

const models = ref([]);
const showForm = ref(false);
const editing = ref(false);
const form = reactive({ id: '', model: '', endpoint: '', apiKey: '', kind: 'image' });

async function load() {
  try {
    const r = await request('/api/free-models/', { method: 'GET' });
    if (r.code === 200) models.value = r.data.models || [];
  } catch (e) { uni.showToast({ title: '加载失败', icon: 'none' }); }
}

function openAdd() {
  editing.value = false;
  Object.assign(form, { id: '', model: '', endpoint: '', apiKey: '', kind: 'image' });
  showForm.value = true;
}

function openEdit(m) {
  editing.value = true;
  Object.assign(form, { id: m.id, model: m.model, endpoint: m.endpoint, apiKey: '', kind: m.kind || 'image' });
  showForm.value = true;
}

async function save() {
  if (!form.id || !form.model || !form.endpoint) {
    uni.showToast({ title: '请填写完整', icon: 'none' });
    return;
  }
  try {
    const url = editing.value ? `/api/free-models/${form.id}` : '/api/free-models/';
    const r = await request(url, {
      method: editing.value ? 'PUT' : 'POST',
      data: { id: form.id, model: form.model, endpoint: form.endpoint, apiKey: form.apiKey, kind: form.kind },
    });
    if (r.code === 200) {
      uni.showToast({ title: '已保存', icon: 'success' });
      showForm.value = false;
      load();
    } else {
      uni.showToast({ title: r.msg || '保存失败', icon: 'none' });
    }
  } catch (e) { uni.showToast({ title: '保存失败', icon: 'none' }); }
}

async function remove(m) {
  const ok = await new Promise(res => uni.showModal({
    title: '删除模型', content: `确认删除 ${m.id}？`, success: r => res(r.confirm),
  }));
  if (!ok) return;
  try {
    const r = await request(`/api/free-models/${m.id}`, { method: 'DELETE' });
    if (r.code === 200) { uni.showToast({ title: '已删除', icon: 'success' }); load(); }
    else uni.showToast({ title: r.msg || '删除失败', icon: 'none' });
  } catch (e) { uni.showToast({ title: '删除失败', icon: 'none' }); }
}

onMounted(load);
</script>

<style scoped>
.page { min-height: 100vh; background: #f6f1e8; padding: 30rpx; box-sizing: border-box; }
.head { margin-bottom: 30rpx; }
.title { font-size: 40rpx; font-weight: 700; color: #2c241e; }
.sub { font-size: 24rpx; color: #9b8b78; margin-top: 8rpx; display: block; }
.list { background: #fff; border-radius: 20rpx; padding: 8rpx 0; }
.row { display: flex; align-items: center; justify-content: space-between; padding: 24rpx 28rpx; border-bottom: 1rpx solid #f0e9dd; }
.info { flex: 1; min-width: 0; }
.mname { font-size: 30rpx; font-weight: 700; color: #2c241e; display: block; }
.mmodel { font-size: 24rpx; color: #5a5248; margin-top: 6rpx; display: block; }
.mendpoint { font-size: 20rpx; color: #9b8b78; margin-top: 4rpx; display: block; word-break: break-all; }
.mkind { font-size: 20rpx; color: #b08958; margin-top: 4rpx; display: block; }
.ops { display: flex; flex-direction: column; gap: 12rpx; }
.op-btn { padding: 10rpx 20rpx; background: #f3e9d2; color: #2c241e; border-radius: 10rpx; font-size: 24rpx; text-align: center; }
.op-btn.danger { background: #f6dcd4; color: #b5472f; }
.empty { text-align: center; color: #9b8b78; padding: 60rpx; }
.add-btn { margin-top: 30rpx; text-align: center; background: #c4622d; color: #fff; padding: 24rpx; border-radius: 16rpx; font-size: 30rpx; }
.mask { position: fixed; inset: 0; background: rgba(0,0,0,.45); display: flex; align-items: center; justify-content: center; z-index: 99; }
.form { width: 84%; background: #fff; border-radius: 24rpx; padding: 40rpx; box-sizing: border-box; }
.form-title { font-size: 34rpx; font-weight: 700; color: #2c241e; display: block; margin-bottom: 24rpx; }
.input { border: 1rpx solid #e5dccb; border-radius: 12rpx; padding: 20rpx; margin-bottom: 20rpx; font-size: 26rpx; color: #2c241e; }
.kind-row { display: flex; gap: 20rpx; margin-bottom: 24rpx; }
.kind { flex: 1; text-align: center; padding: 20rpx; border: 1rpx solid #e5dccb; border-radius: 12rpx; font-size: 26rpx; color: #2c241e; }
.kind.on { background: #c4622d; color: #fff; border-color: #c4622d; }
.form-ops { display: flex; gap: 20rpx; }
.f-btn { flex: 1; text-align: center; padding: 22rpx; background: #c4622d; color: #fff; border-radius: 12rpx; font-size: 28rpx; }
.f-btn.cancel { background: #eee; color: #2c241e; }
</style>
