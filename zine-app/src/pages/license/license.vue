<template>
  <view class="page paper-bg">
    <!-- 顶部栏 -->
    <view class="nav-bar">
      <view class="nav-back" @click="goBack">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2C241E" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </view>
      <text class="nav-title serif">MIT 开源协议</text>
      <view class="nav-placeholder" />
    </view>

    <scroll-view scroll-y class="body">
      <view class="content-card">
        <text class="license-title">MIT License</text>
        <text class="license-copy">Copyright (c) 2026 HeJiahao</text>
        <text class="license-body">
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
        </text>
      </view>

      <!-- 附录 -->
      <view class="appendix-block">
        <text class="appendix-title serif">附录：参考项目</text>
        <text class="appendix-desc">本应用在开发过程中参考了以下开源项目，特此致谢：</text>

        <view class="ref-item">
          <view class="ref-num">1</view>
          <view class="ref-info">
            <text class="ref-name">photo-to-zine-postcard</text>
            <text class="ref-author">作者：Whiplashzeb</text>
            <text class="ref-desc">照片转明信片生成工具，本应用的明信片/海报生成功能、正反面版面等核心设计参考了该项目</text>
            <view class="ref-link" @click="openLink('https://github.com/Whiplashzeb/photo-to-zine-postcard')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C15837" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 20c-1 1-2 0-2-2m12 2c1 1 2 0 2-2M3 13c1 1 2 1 3 0m12 0c-1 1-2 1-3 0M7 8c0-1 1-2 3-2h4c2 0 3 1 3 2v2a9 9 0 0 1-9 9M8 11v2m8-2v2" />
              </svg>
              <text>github.com/Whiplashzeb/photo-to-zine-postcard</text>
            </view>
          </view>
        </view>

        <view class="ref-item">
          <view class="ref-num">2</view>
          <view class="ref-info">
            <text class="ref-name">RuoYi-SpringBoot3-UniApp</text>
            <text class="ref-author">作者：undsky</text>
            <text class="ref-desc">H5/App/小程序三端图片上传解决方案，本应用的图片选择与上传功能参考了其 chooseAndUploadImage 设计</text>
            <view class="ref-link" @click="openLink('https://github.com/undsky/RuoYi-SpringBoot3-UniApp')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C15837" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 20c-1 1-2 0-2-2m12 2c1 1 2 0 2-2M3 13c1 1 2 1 3 0m12 0c-1 1-2 1-3 0M7 8c0-1 1-2 3-2h4c2 0 3 1 3 2v2a9 9 0 0 1-9 9M8 11v2m8-2v2" />
              </svg>
              <text>github.com/undsky/RuoYi-SpringBoot3-UniApp</text>
            </view>
          </view>
        </view>

        <view class="ref-item">
          <view class="ref-num">3</view>
          <view class="ref-info">
            <text class="ref-name">uni-app 官方框架</text>
            <text class="ref-author">作者：DCloud</text>
            <text class="ref-desc">跨平台应用开发框架，本应用基于 uni-app Vue3 构建，使用了其 H5/App 多端编译能力</text>
            <view class="ref-link" @click="openLink('https://uniapp.dcloud.net.cn/')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C15837" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 20c-1 1-2 0-2-2m12 2c1 1 2 0 2-2M3 13c1 1 2 1 3 0m12 0c-1 1-2 1-3 0M7 8c0-1 1-2 3-2h4c2 0 3 1 3 2v2a9 9 0 0 1-9 9M8 11v2m8-2v2" />
              </svg>
              <text>uniapp.dcloud.net.cn</text>
            </view>
          </view>
        </view>

        <view class="ref-item">
          <view class="ref-num">4</view>
          <view class="ref-info">
            <text class="ref-name">minimal-zine-poster-v01</text>
            <text class="ref-author">作者：LiamGvchi</text>
            <text class="ref-desc">极简 Zine 海报生成 Skill（图生图模式），本应用的海报风格化生成功能参考了该技能的设计</text>
            <view class="ref-link" @click="openLink('https://github.com/LiamGvchi/gc-minimal-zine-poster')">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#C15837" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 20c-1 1-2 0-2-2m12 2c1 1 2 0 2-2M3 13c1 1 2 1 3 0m12 0c-1 1-2 1-3 0M7 8c0-1 1-2 3-2h4c2 0 3 1 3 2v2a9 9 0 0 1-9 9M8 11v2m8-2v2" />
              </svg>
              <text>github.com/LiamGvchi/gc-minimal-zine-poster</text>
            </view>
          </view>
        </view>
      </view>

      <view class="foot-space" />
    </scroll-view>
  </view>
</template>

<script setup>
function goBack() {
  uni.navigateBack()
}

function openLink(url) {
  // #ifdef H5
  try { window.open(url, '_blank') } catch (e) { uni.showToast({ title: '链接已复制', icon: 'none' }) }
  // #endif
  // #ifndef H5
  uni.setClipboardData({ data: url, success: () => uni.showToast({ title: '链接已复制', icon: 'none' }) })
  // #endif
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }

/* 顶部栏 */
.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 32rpx;
}
.nav-back {
  width: 56rpx; height: 56rpx;
  border-radius: 50%;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  display: flex; align-items: center; justify-content: center;
}
.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--ink);
}
.nav-placeholder { width: 56rpx; }

/* 主体 */
.body {
  height: calc(100vh - 120rpx);
  box-sizing: border-box;
  padding: 0 32rpx;
}

/* 协议内容卡片 */
.content-card {
  background: var(--paper-surface);
  border-radius: 24rpx;
  padding: 36rpx 28rpx;
  box-shadow: var(--shadow-card);
  margin-bottom: 28rpx;
}
.license-title {
  font-size: 32rpx;
  font-weight: 700;
  color: var(--ink);
  display: block;
  margin-bottom: 12rpx;
}
.license-copy {
  font-size: 24rpx;
  color: var(--ink-2);
  display: block;
  margin-bottom: 24rpx;
}
.license-body {
  font-size: 22rpx;
  color: var(--ink-2);
  line-height: 1.8;
  white-space: pre-wrap;
  display: block;
}

/* 附录 */
.appendix-block {
  background: var(--paper-surface);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  box-shadow: var(--shadow-card);
  margin-bottom: 28rpx;
}
.appendix-title {
  font-size: 28rpx;
  font-weight: 700;
  color: var(--ink);
  display: block;
  margin-bottom: 12rpx;
}
.appendix-desc {
  font-size: 22rpx;
  color: var(--ink-3);
  display: block;
  margin-bottom: 28rpx;
  line-height: 1.6;
}

.ref-item {
  display: flex;
  gap: 18rpx;
  margin-bottom: 28rpx;
}
.ref-item:last-child { margin-bottom: 0; }

.ref-num {
  width: 44rpx; height: 44rpx;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  margin-top: 4rpx;
}
.ref-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.ref-name {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--ink);
}
.ref-author {
  font-size: 22rpx;
  color: var(--ink-3);
}
.ref-desc {
  font-size: 22rpx;
  color: var(--ink-2);
  line-height: 1.6;
}
.ref-link {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 6rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  background: var(--primary-soft);
  align-self: flex-start;
}
.ref-link text {
  font-size: 20rpx;
  color: var(--primary-deep);
  font-weight: 500;
}

.foot-space { height: 60rpx; }
</style>