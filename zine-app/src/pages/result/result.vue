<template>
  <view class="page paper-bg">
    <!-- 顶部栏：与参考图右下角一致 - ←返回 「作品详情页」衬线大标题 + 右上橙棕分享图标 -->
    <view class="nav-bar" :style="{ paddingTop: headerPad }">
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </view>
      <text class="nav-head serif-title">作品详情页</text>
      <view class="ico-primary" @click="onShare">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      </view>
    </view>

    <scroll-view scroll-y class="body" :style="{ paddingBottom: bodyPad }">
      <template v-if="preview">
        <!-- 一排一个卡片：按实际正反面数量动态渲染（单面1张、双面2张） -->
        <view class="detail-list">
          <!-- 正面卡片 -->
          <view class="zine-card" @click="openPreview(full(preview.frontUrl))">
            <view class="cover">
              <image v-if="preview.frontUrl" :src="full(preview.frontUrl)" mode="aspectFit" class="cover-img" />
              <view v-else class="cover-ph">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#C8B9A8" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2" /></svg>
              </view>
            </view>
            <view class="foot">
              <text class="title">{{ preview.title || '正面' }}</text>
              <view class="meta">
                <text class="date">{{ formatTime() }}</text>
                <text class="size">{{ ratioText }}</text>
              </view>
            </view>
            <text class="badge">正</text>
          </view>

          <!-- 背面卡片：正反面模式下才展示 -->
          <view v-if="preview.sides === 'FRONT_BACK'" class="zine-card" @click="openPreview(full(preview.backUrl))">
            <view class="cover">
              <image v-if="preview.backUrl" :src="full(preview.backUrl)" mode="aspectFit" class="cover-img" />
              <view v-else class="cover-ph back-ph">
                <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#C8B9A8" stroke-width="1.5"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9h10M7 12h10M7 15h6" /></svg>
              </view>
            </view>
            <view class="foot">
              <text class="title">{{ preview.location || '背面' }}</text>
              <view class="meta">
                <text class="date">{{ sidesText }}</text>
                <text class="size">{{ styleText }}</text>
              </view>
            </view>
            <text class="badge">背</text>
          </view>
        </view>

        <view class="foot-note">
          <text class="caption">共 {{ preview.sides === 'FRONT_BACK' ? 2 : 1 }} 张面 · 点击卡片可放大查看</text>
        </view>
      </template>

      <view v-else class="state">
        <text class="state-title serif">没有可预览的作品</text>
        <view class="neo-btn neo-btn-ghost" style="padding: 0 50rpx;" @click="goCreate">
          <text>去创作</text>
        </view>
      </view>
    </scroll-view>

    <!-- 底部操作栏：与参考图一致 - 重出照片(ghost) + 保存到相册(primary橙棕) -->
    <view class="bottom-bar" :style="{ paddingBottom: safeBottomPad }">
      <view class="bottom-inner">
        <view class="neo-btn type-ghost size-lg left-btn" @click="goCreate">
          <text>重出照片</text>
        </view>
        <view class="neo-btn type-primary size-lg right-btn" @click="saveAll">
          <text>保存到相册</text>
        </view>
      </view>
    </view>

    <!-- 放大预览弹层：点击卡片时展示大图，可缩放/关闭/保存 -->
    <view v-if="previewImg" class="preview-mask" @click="previewImg = ''">
      <view class="preview-stage" @click.stop>
        <image :src="previewImg" mode="aspectFit" class="preview-img" />
        <view class="preview-actions">
          <view class="preview-btn" @click="saveSingle(previewImg)"><text>保存</text></view>
          <view class="preview-btn preview-close" @click="previewImg = ''"><text>关闭</text></view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import store from '@/store/index.js'

const preview = store.preview

// 放大预览
const previewImg = ref('')
function openPreview(url) {
  previewImg.value = url || ''
}
function closePreview() {
  previewImg.value = ''
}

function saveSingle() {
  if (previewImg.value) {
    saveImage(previewImg.value)
  }
}

const headerPad = computed(() => {
  // #ifdef H5
  return '12rpx'
  // #endif
  // #ifndef H5
  return 'calc(' + 'env(safe-area-inset-top)' + ' + 12rpx)'
  // #endif
})
const bodyPad = computed(() => '260rpx')
const safeBottomPad = computed(() => {
  // #ifdef H5
  return '24rpx'
  // #endif
  // #ifndef H5
  return 'calc(' + 'env(safe-area-inset-bottom)' + ' + 24rpx)'
  // #endif
})

const ratioText = computed(() => preview ? `${preview.ratio.w}:${preview.ratio.h}` : '2:3')
const styleText = computed(() => preview?.styleName || '手绘水彩')
const sidesText = computed(() => {
  if (!preview) return '正反面'
  return preview.sides === 'FRONT_BACK' ? '正反面' : '单面'
})

function full(u) { return store.fullUrl(u) }

// fetch + blob 下载（兼容跨域签名 URL，不用 <a download>）
function downloadBlob(url, filename) {
  return fetch(url)
    .then(r => { if (!r.ok) throw new Error('下载失败'); return r.blob() })
    .then(blob => {
      // #ifdef H5
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(a.href)
      // #endif
      // #ifndef H5
      const fs = uni.getFileSystemManager()
      const t = '/tmp/zine_' + Date.now() + '.jpg'
      const fr = new FileReader()
      fr.onload = () => {
        fs.writeFile({ filePath: t, data: fr.result, encoding: 'base64', success: () => {
          uni.saveImageToPhotosAlbum({ filePath: t, success: () => uni.showToast({ title: '已保存', icon: 'success' }), fail: () => uni.showToast({ title: '保存失败', icon: 'none' }) })
        }})
      }
      fr.readAsDataURL(blob)
      // #endif
    })
    .catch(err => {
      console.warn('download error', err)
      uni.showToast({ title: '保存失败', icon: 'none' })
    })
}

function formatTime() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}/${day}`
}

function goBack() {
  uni.navigateBack({ fail: () => uni.reLaunch({ url: '/pages/index/index' }) })
}
function goCreate() {
  uni.reLaunch({ url: '/pages/index/index' })
}
function onShare() {
  // #ifdef H5
  if (navigator.share) {
    navigator.share({ title: 'Zine明信片', url: window.location.href }).catch(() => {})
  } else {
    uni.setClipboardData({ data: window.location.href, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) })
  }
  // #endif
  // #ifndef H5
  uni.showToast({ title: '分享功能', icon: 'none' })
  // #endif
}

function saveAll() {
  if (!preview) return
  if (preview.backUrl && preview.sides === 'FRONT_BACK') {
    saveImage(preview.frontUrl)
    setTimeout(() => saveImage(preview.backUrl), 600)
  } else {
    saveImage(preview.frontUrl)
  }
}

function saveImage(url) {
  if (!url) {
    uni.showToast({ title: '没有可保存的图片', icon: 'none' })
    return
  }
  const fullUrl = store.fullUrl(url)
  // #ifdef H5
  // 跨域签名 URL 的 <a download> 会被浏览器忽略，必须 fetch + blob
  if (!fullUrl) { uni.showToast({ title: '没有可保存的图片', icon: 'none' }); return }
  uni.showLoading({ title: '下载中…' })
  fetch(fullUrl)
    .then((res) => {
      if (!res.ok) throw new Error('HTTP ' + res.status)
      return res.blob()
    })
    .then((blob) => {
      uni.hideLoading()
      const blobUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = 'zine-' + Date.now() + '.png'
      document.body.appendChild(link)
      link.click()
      window.URL.revokeObjectURL(blobUrl)
      link.remove()
      uni.showToast({ title: '已开始下载', icon: 'none' })
    })
    .catch((e) => {
      uni.hideLoading()
      console.error('下载失败，尝试降级打开', e)
      // 降级方案：跨域签名 URL 可能被 CORS 拦截，直接新开标签让用户长按/右键保存
      window.open(fullUrl, '_blank')
      uni.showToast({ title: '已打开大图，可长按保存', icon: 'none' })
    })
  // #endif
  // #ifndef H5
  uni.showLoading({ title: '保存中…' })
  uni.downloadFile({
    url: fullUrl,
    success: (r) => {
      if (r.statusCode !== 200) {
        uni.hideLoading()
        uni.showToast({ title: '下载失败', icon: 'none' })
        return
      }
      uni.saveImageToPhotosAlbum({
        filePath: r.tempFilePath,
        success: () => {
          uni.hideLoading()
          uni.showToast({ title: '已保存到相册', icon: 'success' })
        },
        fail: () => {
          uni.hideLoading()
          uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' })
        },
      })
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '下载失败', icon: 'none' })
    },
  })
  // #endif
}

</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }

/* ---------- 中文书法手写字体（马善政楷书） ---------- */
/* Google Fonts 中国大陆域名，需在 CSS 顶部引入避免 hydrate 问题 */
@import url('https://fonts.googleapis.cn/css2?family=Ma+Shan+Zheng&display=swap');

.calligraphy {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', '楷体', serif;
}

/* ---------- 顶部栏 ---------- */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx 28rpx;
}
.nav-back {
  width: 72rpx; height: 72rpx;
  border-radius: 50%;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  display: flex; align-items: center; justify-content: center;
}
.nav-head { font-size: 56rpx; line-height: 1.1; }

.ico-primary {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--primary);
  box-shadow: var(--shadow-btn);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.15s;
}
.ico-primary:active { background: var(--primary-deep); transform: scale(0.95); }

/* ---------- 主体 ---------- */
.body {
  height: calc(100vh - 170rpx);
  box-sizing: border-box;
  padding: 0 32rpx;
}

.cover { position: relative; }
.cover-img { width: 100%; height: 100%; }
.cover-ph {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: var(--paper-bg-soft);
}
.cover-ph.back-ph { background: linear-gradient(180deg, #FDFAF4 0%, #F4EAD9 100%); }

/* ---------- 背面书法留言层 ---------- */
.back-note {
  position: absolute;
  left: 0; right: 0; top: 0; bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12rpx;
  box-sizing: border-box;
  pointer-events: none;
}
.back-note-text {
  font-family: 'Ma Shan Zheng', 'STKaiti', 'KaiTi', '楷体', serif;
  font-size: 34rpx;
  line-height: 1.6;
  color: #4a3b2f;
  text-align: center;
  word-break: break-all;
  text-shadow: 0 1rpx 0 rgba(255,255,255,0.6);
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20rpx;
}

.foot-note { text-align: center; padding: 28rpx 0 12rpx; }

/* ---------- 空状态 ---------- */
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 260rpx;
  gap: 28rpx;
}
.state-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--ink-2);
  letter-spacing: 1rpx;
}

/* ---------- 底部操作栏 ---------- */
.bottom-bar {
  position: fixed;
  left: 0; right: 0;
  bottom: 0;
  z-index: 90;
  background: linear-gradient(180deg, rgba(244,239,232,0) 0%, rgba(244,239,232,0.9) 30%, rgba(244,239,232,1) 100%);
  padding: 20rpx 32rpx 24rpx;
}
.bottom-inner {
  display: flex;
  gap: 20rpx;
  align-items: center;
}
.left-btn {
  flex: 1;
}
.right-btn {
  flex: 1;
}

/* 复用主题中按钮的样式 */
.neo-btn {
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
.neo-btn:active { transform: scale(0.97); }
.type-primary {
  color: #fff;
  background: var(--primary);
  box-shadow: var(--shadow-btn);
}
.type-primary:active {
  background: var(--primary-deep);
  box-shadow: 0 5rpx 14rpx rgba(193, 88, 55, 0.3);
}
.type-ghost {
  color: var(--ink);
  background: #fff;
  border: 1.5rpx solid var(--line-strong);
  box-shadow: none;
}
.type-ghost:active { background: var(--paper-bg-soft); }
.size-lg {
  height: 108rpx;
  padding: 0 30rpx;
  font-size: 30rpx;
  font-weight: 800;
  letter-spacing: 0.5rpx;
}
</style>
