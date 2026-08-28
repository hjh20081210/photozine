<template>
  <view v-if="visible" class="cropper-mask" @click="onCancel">
    <view class="cropper-panel" @click.stop="">
      <text class="cropper-title">裁剪图片</text>
      <view class="cropper-stage">
        <image
          :src="src"
          mode="aspectFit"
          class="cropper-img"
          :style="imgStyle"
        />
      </view>
      <view class="cropper-ratio-bar">
        <text v-for="r in ratios" :key="r.label" class="ratio-chip" :class="{ on: currentRatio === r.value }" @click="currentRatio = r.value">{{ r.label }}</text>
      </view>
      <view class="cropper-actions">
        <view class="crop-btn ghost" @click="onCancel"><text>取消</text></view>
        <view class="crop-btn primary" @click="onConfirm"><text>确认</text></view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  src: { type: String, default: '' },
  ratio: { type: Number, default: 1 },
})
const emit = defineEmits(['cancel', 'confirm'])

const currentRatio = ref(props.ratio)
const ratios = [
  { label: '1:1', value: 1 },
  { label: '2:3', value: 2 / 3 },
  { label: '3:2', value: 3 / 2 },
  { label: '3:4', value: 3 / 4 },
  { label: '4:3', value: 4 / 3 },
]

const imgStyle = computed(() => {
  const r = currentRatio.value
  if (r >= 1) {
    return { width: '100%', maxHeight: `calc(100% / ${r})` }
  }
  return { height: '100%', maxWidth: `calc(100% * ${r})` }
})

function onCancel() {
  emit('cancel')
}
function onConfirm() {
  // H5 环境下直接返回原图路径（裁剪由服务端或后续处理）
  emit('confirm', { tempFilePath: props.src, ratio: currentRatio.value })
}
</script>

<style lang="scss" scoped>
.cropper-mask {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 48rpx;
}
.cropper-panel {
  width: 100%;
  max-width: 640rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}
.cropper-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #2C241E;
  text-align: center;
}
.cropper-stage {
  width: 100%;
  aspect-ratio: 1;
  background: #1a1a1a;
  border-radius: 16rpx;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.cropper-img {
  display: block;
}
.cropper-ratio-bar {
  display: flex;
  gap: 12rpx;
  justify-content: center;
  flex-wrap: wrap;
}
.ratio-chip {
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: #F4EFE8;
  font-size: 24rpx;
  color: #6B5B4E;
  font-weight: 500;
}
.ratio-chip.on {
  background: #C15837;
  color: #fff;
}
.cropper-actions {
  display: flex;
  gap: 18rpx;
}
.crop-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 999rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
}
.crop-btn.primary {
  background: #C15837;
  color: #fff;
}
.crop-btn.ghost {
  background: #F4EFE8;
  color: #6B5B4E;
}
.crop-btn:active { transform: scale(0.97); }
</style>