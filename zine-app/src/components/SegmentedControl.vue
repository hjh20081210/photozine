<template>
  <view class="seg-wrap">
    <view class="seg">
      <view class="seg-thumb" :style="thumbStyle" />
      <view
        v-for="(o, i) in options"
        :key="o.value"
        class="seg-item"
        :class="{ on: o.value === modelValue }"
        @click="pick(o.value, i)"
      >
        <view v-if="o.icon" class="seg-ico">{{ o.icon }}</view>
        <text>{{ o.label }}</text>
      </view>
    </view>
    <!-- 右侧双圆开关指示器 与参考图创作页一致 -->
    <view v-if="withSwitchDots && options.length === 2" class="switch-dots">
      <view
        v-for="(o, i) in options"
        :key="'dot-' + o.value"
        class="dot"
        :class="{ on: o.value === modelValue }"
      />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  options: { type: Array, required: true }, // [{label, value, icon?}]
  modelValue: { type: [String, Number], required: true },
  withSwitchDots: { type: Boolean, default: true }, // 默认显示右侧双圆开关（与参考图一致）
})

const emit = defineEmits(['update:modelValue'])

const n = computed(() => props.options.length)
const thumbStyle = computed(() => {
  const idx = props.options.findIndex((o) => o.value === props.modelValue)
  const i = idx < 0 ? 0 : idx
  return {
    left: `calc(${i} * (100% / ${n.value}))`,
    width: `calc(100% / ${n.value})`,
  }
})

function pick(value) {
  emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
.seg-wrap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}
.seg {
  flex: 1;
  display: flex;
  padding: 8rpx;
  border-radius: 999rpx;
  background: var(--paper-bg-soft);
  position: relative;
  border: 1rpx solid var(--line);
}
.seg-thumb {
  position: absolute;
  top: 8rpx;
  bottom: 8rpx;
  border-radius: 999rpx;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  transition: left 0.28s cubic-bezier(0.22, 1, 0.36, 1), width 0.28s cubic-bezier(0.22, 1, 0.36, 1);
}
.seg-item {
  flex: 1;
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  padding: 20rpx 0;
  font-size: 26rpx;
  color: var(--ink-3);
  transition: color 0.2s;
  font-weight: 500;
}
.seg-item.on {
  color: var(--ink);
  font-weight: 700;
}
.seg-ico {
  font-size: 28rpx;
}

/* 右侧双圆开关指示器 - 与参考图创作页一致：两个并排小圆，高亮橙棕 */
.switch-dots {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 6rpx 8rpx;
  border-radius: 999rpx;
  background: var(--paper-bg-soft);
  border: 1rpx solid var(--line);
  flex-shrink: 0;
}
.dot {
  width: 22rpx;
  height: 22rpx;
  border-radius: 50%;
  background: #FFFFFF;
  box-shadow: inset 0 1rpx 3rpx rgba(44, 36, 30, 0.08);
  border: 1rpx solid var(--line);
  transition: all 0.25s;
}
.dot.on {
  background: var(--primary);
  border-color: var(--primary-deep);
  box-shadow: 0 2rpx 6rpx rgba(216, 106, 70, 0.4);
}
</style>
