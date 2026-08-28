<template>
  <view class="btn" :class="[typeClass, sizeClass, { disabled, loading }]" hover-class="press">
    <view v-if="loading" class="spin" />
    <slot v-else />
  </view>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  type: { type: String, default: 'primary' }, // primary | soft | ghost | orange-line
  size: { type: String, default: 'md' },     // sm | md | lg | block
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})
const typeClass = computed(() => 'type-' + (props.type || 'primary'))
const sizeClass = computed(() => 'size-' + (props.size || 'md'))
</script>

<style lang="scss" scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999rpx;
  font-weight: 700;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  user-select: none;
  white-space: nowrap;
  font-family: var(--font-sans);
}
.btn.press { transform: scale(0.97); }

/* 类型：复古砖橙主按钮 */
.type-primary {
  color: #fff;
  background: var(--primary);
  box-shadow: var(--shadow-btn);
}
.type-primary.press { background: var(--primary-deep); box-shadow: 0 5rpx 14rpx rgba(193, 88, 55, 0.3); }

/* 类型：淡橙软按钮 */
.type-soft {
  color: var(--primary-deep);
  background: var(--primary-soft);
  box-shadow: none;
}
.type-soft.press { background: #EDCDB8; }

/* 类型：描边复古（白底 + 棕边） */
.type-ghost {
  color: var(--ink);
  background: #fff;
  border: 1.5rpx solid var(--line-strong);
  box-shadow: none;
}
.type-ghost.press { background: var(--paper-bg-soft); }

/* 尺寸 */
.size-sm   { height: 64rpx; padding: 0 26rpx; font-size: 24rpx; }
.size-md   { height: 84rpx; padding: 0 36rpx; font-size: 28rpx; }
.size-lg   { height: 108rpx; padding: 0 44rpx; font-size: 32rpx; font-weight: 800; letter-spacing: 0.5rpx; }
.size-block { height: 100rpx; padding: 0 40rpx; font-size: 30rpx; width: 100%; }

.btn.disabled { opacity: 0.52; pointer-events: none; }
.btn.loading  { pointer-events: none; }

.spin {
  width: 36rpx; height: 36rpx;
  border: 4rpx solid rgba(255,255,255,0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}
.type-ghost .spin,
.type-soft  .spin {
  border-color: rgba(216, 106, 70, 0.3);
  border-top-color: var(--primary);
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
