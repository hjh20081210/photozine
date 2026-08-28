<template>
  <view class="tab-bar" :class="{ paper: true }" :style="{ paddingBottom: safeBottomPad }">
    <view
      v-for="t in tabs"
      :key="t.key"
      class="tab-item"
      :class="{ on: t.key === current }"
      @click="onSelect(t)"
    >
      <view class="tab-ico-wrap">
        <view class="svg-box" v-html="iconSvg(t.key, t.key === current)"></view>
      </view>
      <text class="tab-label">{{ t.label }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ current: { type: String, default: 'index' } })
const emit = defineEmits(['update:current', 'change'])

const tabs = [
  { key: 'index', label: '创作', path: '/pages/index/index', isTab: true },
  { key: 'mine', label: '我的', path: '/pages/mine/mine', isTab: true },
]

const safeBottomPad = computed(() => {
  // #ifdef H5
  return '0'
  // #endif
  // #ifndef H5
  return 'calc(' + 'env(safe-area-inset-bottom)' + ' + 20rpx)'
  // #endif
})

function iconSvg(key, active) {
  const stroke = active ? '#FFFFFF' : '#6B5B4E'
  const c = stroke
  if (key === 'index') {
    // 创作页：画笔/创作图标（复古）
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17v3z" />
      <path d="M14 6l3 3" />
    </svg>`
  }
  if (key === 'mine') {
    // 我的：用户图标
    return `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="${c}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="8" r="3.4" />
      <path d="M4.5 20c1.6-3.5 4.3-5 7.5-5s5.9 1.5 7.5 5" stroke-linecap="round" />
    </svg>`
  }
  return ''
}

function onSelect(t) {
  if (t.key === props.current) return
  emit('update:current', t.key)
  emit('change', t.key)
  if (t.path) {
    if (t.isTab) uni.switchTab({ url: t.path, fail: () => uni.reLaunch({ url: t.path }) })
    else uni.navigateTo({ url: t.path })
  }
}
</script>

<style lang="scss" scoped>
/* 与参考图一致：极简圆角长条，两端创作/我的，没有中间+号按钮 */
.tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  padding: 12rpx 0;
  padding-bottom: calc(12rpx + env(safe-area-inset-bottom));
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: var(--paper-surface);
  border-top: 1rpx solid var(--line);
  z-index: 100;
}

.tab-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  flex: 1;
  padding: 4rpx 0;
  transition: transform 0.15s;
}
.tab-item:active { transform: scale(0.94); }

.tab-ico-wrap {
  width: 52rpx;
  height: 52rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  transition: all 0.22s;
}
.tab-item.on .tab-ico-wrap {
  background: var(--primary);
  box-shadow: 0 6rpx 18rpx rgba(216, 106, 70, 0.32);
}

.svg-box { display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; }

.tab-label {
  font-size: 18rpx;
  color: var(--ink-3);
  font-weight: 500;
  letter-spacing: 0.5rpx;
  font-family: var(--font-sans);
  transition: color 0.2s;
}
.tab-item.on .tab-label {
  color: var(--primary-deep);
  font-weight: 700;
}
</style>
