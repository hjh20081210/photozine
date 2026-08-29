<template>
  <!-- 与参考图一致：4个纸纹色卡 + 右侧名称/时间描述 -->
  <view class="sp-wrap">
    <!-- 左侧：4个小色卡 -->
    <view class="paper-swatches">
      <view
        v-for="(p, i) in paper4"
        :key="p.key"
        class="swatch-item"
        :class="{ on: p.key === modelValue }"
        @click="emit('update:modelValue', p.key)"
      >
        <view class="swatch-box" :class="p.cls" />
        <view v-if="p.key === modelValue" class="swatch-check">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </view>
        <text class="swatch-label">{{ p.label }}</text>
      </view>
    </view>
    <!-- 右侧：当前选择的样式描述 + 时间戳 -->
    <view class="sp-desc">
      <text class="sp-name serif">{{ currentStyle?.name || '手绘水彩' }}</text>
      <text class="sp-time">{{ timeText }}</text>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  styles: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

// 参考图一致：纸纹风格 key 映射到 4 个色板 class（已按要求移除“纯黑”）
const paper4 = [
  { key: 'hand_drawn_watercolor', cls: 'sw-paper-1', label: '网格' },
  { key: 'minimal_woodblock',    cls: 'sw-paper-2', label: '斜纹' },
  { key: 'film_polaroid',       cls: 'sw-paper-4', label: '橙棕' },
]

const currentStyle = computed(() => props.styles.find((x) => x.key === props.modelValue))

// 参考图中右侧显示时间，如 "10月10日 3:15"
const timeText = computed(() => {
  const d = new Date()
  const m = d.getMonth() + 1
  const day = d.getDate()
  const h = d.getHours()
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${m}月${day}日 ${h}:${min}`
})
</script>

<style lang="scss" scoped>
.sp-wrap {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20rpx;
  padding: 4rpx;
}
.paper-swatches {
  display: flex;
  gap: 22rpx;
  align-items: flex-start;
}
.swatch-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  position: relative;
}
.swatch-box {
  width: 88rpx;
  height: 88rpx;
  border-radius: 24rpx;
  box-shadow: var(--shadow-soft);
  overflow: hidden;
  position: relative;
  transition: all 0.2s;
  border: 3rpx solid transparent;
}
.swatch-item.on .swatch-box {
  border-color: var(--primary);
  box-shadow: 0 6rpx 16rpx rgba(216, 106, 70, 0.28);
}
.swatch-check {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 34rpx;
  height: 34rpx;
  border-radius: 50%;
  background: var(--primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3rpx 8rpx rgba(216, 106, 70, 0.4);
}
/* 4种纸纹样式 */
.sw-paper-1 {
  background: #FFFFFF;
  background-image:
    linear-gradient(rgba(44, 36, 30, 0.12) 1rpx, transparent 1rpx),
    linear-gradient(90deg, rgba(44, 36, 30, 0.12) 1rpx, transparent 1rpx);
  background-size: 16rpx 16rpx;
}
.sw-paper-2 {
  background: #F8E9DA;
  background-image: repeating-linear-gradient(
    45deg,
    rgba(216, 106, 70, 0.35) 0rpx,
    rgba(216, 106, 70, 0.35) 1rpx,
    transparent 1rpx,
    transparent 12rpx
  );
}
.sw-paper-3 { background: #1E1A17; }
.sw-paper-4 { background: var(--primary); }

.swatch-label {
  font-size: 20rpx;
  color: var(--ink-3);
  font-weight: 500;
}
.swatch-item.on .swatch-label { color: var(--primary-deep); font-weight: 700; }

/* 右侧描述 */
.sp-desc {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: flex-start;
  gap: 6rpx;
  padding-top: 6rpx;
  flex-shrink: 0;
}
.sp-name {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.5rpx;
}
.sp-time {
  font-size: 20rpx;
  color: var(--ink-3);
  font-weight: 500;
}
</style>
