<template>
  <view class="page paper-bg">
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrap">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#9B9485" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="search-icon">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          class="search-input"
          type="text"
          v-model="searchText"
          placeholder="搜索作品名称或日期"
          placeholder-class="search-placeholder"
          confirm-type="search"
          @confirm="onSearch"
        />
        <view v-if="searchText" class="search-clear" @click="onClearSearch">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#9B9485" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="body" :style="{ paddingBottom: '80rpx' }">
      <view v-if="loading" class="state">
        <view class="state-spinner" />
        <text class="caption">加载中…</text>
      </view>

      <view v-else-if="items.length === 0" class="state">
        <view class="state-icon">
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#9B9485" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
            <path d="M3.5 9h17" />
            <path d="M8 13.5h8" />
          </svg>
        </view>
        <text class="state-title">还没有作品</text>
        <text class="caption">去「创作」页生成你的第一张明信片吧</text>
        <NeoButton type="soft" size="md" class="state-btn" @click="goCreate">
          <text>去创作</text>
        </NeoButton>
      </view>

      <view v-else-if="filteredItems.length === 0" class="state">
        <view class="state-icon">
          <svg viewBox="0 0 24 24" width="52" height="52" fill="none" stroke="#9B9485" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
        </view>
        <text class="state-title">未找到匹配作品</text>
        <text class="caption">试试其他关键词</text>
      </view>

      <view v-else class="list">
        <view v-for="it in filteredItems" :key="it.id" class="item neo-card" @click="openItem(it)">
          <view class="thumb-wrap">
            <image v-if="it.frontUrl" :src="store.fullUrl(it.frontUrl)" mode="aspectFill" class="thumb" />
            <view v-else class="thumb thumb-empty">
              <text class="thumb-empty-txt">背面</text>
            </view>
          </view>
          <view class="item-txt">
            <text class="item-title">{{ it.title || it.styleName }}</text>
            <view class="tags">
              <text class="tag">{{ it.mode === 'POSTCARD' ? '明信片' : '海报' }}</text>
              <text class="tag">{{ it.sides === 'FRONT_BACK' ? '双面' : it.sides === 'FRONT_ONLY' ? '单面' : '仅背面' }}</text>
              <text class="tag">{{ it.ratioLabel }}</text>
            </view>
            <text class="item-date">{{ fmt(it.createdAt) }} · {{ it.provider }}</text>
          </view>
          <view class="item-del" @click.stop="del(it)">
            <text>✕</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import store from '@/store/index.js'
import { request } from '@/utils/request.js'
import NeoButton from '@/components/NeoButton.vue'

const items = ref([])
const loading = ref(true)
const searchText = ref('')

// 根据搜索关键词过滤作品（按标题或日期）
const filteredItems = computed(() => {
  const keyword = searchText.value.trim().toLowerCase()
  if (!keyword) return items.value
  return items.value.filter((it) => {
    const title = (it.title || it.styleName || '').toLowerCase()
    const dateStr = fmt(it.createdAt).toLowerCase()
    return title.includes(keyword) || dateStr.includes(keyword)
  })
})

function onSearch() {
  // 搜索逻辑已通过 computed 自动触发
}

function onClearSearch() {
  searchText.value = ''
}

async function load() {
  loading.value = true
  try {
    const res = await request('/api/history', { timeout: 8000 })
    const arr = (res && res.data) ? res.data : (Array.isArray(res) ? res : [])
    items.value = (Array.isArray(arr) ? arr : []).map((x) => ({
      ...x,
      ratioLabel: (x.ratio && x.ratio.width && x.ratio.height) ? `${x.ratio.width}:${x.ratio.height}` : '2:3',
      provider: x.modelName || x.provider || '',
    }))
  } catch (e) {
    // 兜底：读本地缓存
    const local = uni.getStorageSync('zine_local_history') || []
    if (local.length) {
      items.value = local
    } else {
      uni.showToast({ title: '无法连接服务器', icon: 'none' })
    }
  } finally {
    loading.value = false
  }
}

onShow(() => {
  load()
})

function openItem(it) {
  store.preview = {
    taskId: it.id,
    frontUrl: it.frontUrl,
    backUrl: it.backUrl,
    frontMime: 'image/png',
    backMime: 'image/png',
    ratio: { w: it.ratioLabel.split(':')[0], h: it.ratioLabel.split(':')[1] },
    styleName: it.styleName,
    sides: it.sides,
    mode: it.mode,
    title: it.title,
    location: it.location,
    date: it.date,
  }
  uni.navigateTo({ url: '/pages/result/result' })
}

function del(it) {
  uni.showModal({
    title: '删除记录',
    content: '确定删除这条历史记录吗？',
    success: async (r) => {
      if (!r.confirm) return
      try {
        await request('/api/history/' + it.id, { method: 'DELETE' })
        items.value = items.value.filter((x) => x.id !== it.id)
      } catch (e) {
        uni.showToast({ title: '删除失败', icon: 'none' })
      }
    },
  })
}

function fmt(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function goCreate() {
  uni.reLaunch({ url: '/pages/index/index' })
}

load()
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
}
.body {
  height: 100vh;
  padding-left: 32rpx;
  padding-right: 32rpx;
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
  gap: 18rpx;
}
.state-icon {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  background: var(--bg-deep);
  box-shadow: var(--shadow-in);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}
.state-title {
  font-size: 34rpx;
  font-weight: 700;
  color: var(--ink);
}
.state-spinner {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  border: 6rpx solid var(--accent-soft);
  border-top-color: var(--accent);
  animation: spin 0.9s linear infinite;
  margin-bottom: 12rpx;
}
.state-btn {
  margin-top: 16rpx;
  padding: 0 60rpx;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.list {
  padding-top: 20rpx;
}
.item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  margin-bottom: 22rpx;
}
.thumb-wrap {
  width: 120rpx;
  height: 150rpx;
  border-radius: var(--radius-xs);
  overflow: hidden;
  box-shadow: var(--shadow-out-sm);
  margin-right: 24rpx;
  flex-shrink: 0;
}
.thumb {
  width: 100%;
  height: 100%;
}
.thumb-empty {
  background: var(--bg-deep);
  display: flex;
  align-items: center;
  justify-content: center;
}
.thumb-empty-txt {
  font-size: 22rpx;
  color: var(--ink-3);
}
.item-txt {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.item-title {
  font-size: 30rpx;
  font-weight: 700;
  color: var(--ink);
}
.tags {
  display: flex;
  gap: 10rpx;
  margin-top: 12rpx;
}
.tag {
  font-size: 20rpx;
  color: var(--ink-2);
  padding: 4rpx 14rpx;
  border-radius: 999rpx;
  background: var(--bg-deep);
  box-shadow: var(--shadow-in-sm);
}
.item-date {
  font-size: 22rpx;
  color: var(--ink-3);
  margin-top: 12rpx;
}
.item-del {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: var(--bg-deep);
  box-shadow: var(--shadow-in-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ink-3);
  font-size: 24rpx;
  margin-left: 12rpx;
  flex-shrink: 0;
}

/* ---------- 搜索栏 ---------- */
.search-bar {
  position: sticky;
  top: 0;
  z-index: 100;
  padding: 20rpx 32rpx;
  background: linear-gradient(180deg, rgba(244,239,232,1) 0%, rgba(244,239,232,0.95) 100%);
  backdrop-filter: blur(12rpx);
}
.search-input-wrap {
  display: flex;
  align-items: center;
  background: var(--paper-surface);
  border-radius: 48rpx;
  padding: 16rpx 28rpx;
  box-shadow: var(--shadow-soft), 0 2rpx 8rpx rgba(0,0,0,0.02);
  border: 1rpx solid rgba(255,255,255,0.9);
  transition: all 0.25s ease;
}
.search-input-wrap:focus-within {
  box-shadow: var(--shadow-soft), 0 4rpx 16rpx rgba(216, 106, 70, 0.1);
  border-color: rgba(216, 106, 70, 0.2);
}
.search-icon {
  margin-right: 14rpx;
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  font-size: 28rpx;
  color: var(--ink);
  height: 50rpx;
  line-height: 50rpx;
  font-family: var(--font-sans);
}
.search-placeholder {
  color: var(--ink-3);
  font-size: 28rpx;
}
.search-clear {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: var(--bg-deep);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 12rpx;
  flex-shrink: 0;
  transition: background 0.2s;
}
.search-clear:active {
  background: #e0d8cc;
}
</style>
