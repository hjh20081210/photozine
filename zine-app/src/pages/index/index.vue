<template>
  <view class="page paper-bg">

    <!-- 顶部栏：与参考图完全一致 - 左上「Zine明信片创作」小衬线，大字「创作页」，右上搜索 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarPad }">
      <view class="nav-left-inner">
        <text class="nav-brand serif">Zine明信片创作</text>
        <text class="nav-head serif-title">创作页</text>
      </view>
      <view class="nav-ico" @click="goSettings">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
      </view>
    </view>

    <scroll-view scroll-y class="body" :style="{ paddingBottom: bodyPad }">

      <!-- 1. 双预览卡片（与参考图一致：2列明信片预览） -->
      <view class="preview-row">
        <!-- 预览1（正面） -->
        <view class="preview-card zine-card">
          <view class="cover preview-cover">
            <image v-if="photo" :src="photo.base64" mode="aspectFill" class="preview-img" />
            <view v-else class="preview-placeholder">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#C8B9A8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </view>
          </view>
          <view class="foot">
            <text class="title">{{ title || '正面预览' }}</text>
            <view class="meta">
              <text class="date">{{ dateText }}</text>
              <text class="size">{{ ratioLabel }}</text>
            </view>
          </view>
          <text class="badge">正面</text>
          <!-- 右上角圆形删除按钮 -->
          <view v-if="photo" class="circle-btn" @click.stop="onRemoveImage">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#2C241E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </view>
        </view>

        <!-- 预览2（背面） -->
        <view class="preview-card zine-card">
          <view class="cover preview-cover back-cover">
            <view v-if="mode === 'POSTCARD' && sides === 'FRONT_BACK'" class="back-sim">
              <!-- 明信片背面：三栏地址 -->
              <view class="back-stamp">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#9A8877" stroke-width="1.5"><rect x="3" y="4" width="18" height="14" rx="1" /><path d="M7 9h10M7 12h10M7 15h6" /></svg>
              </view>
              <view class="back-lines">
                <view class="ln" v-for="i in 4" :key="i" />
              </view>
              <view class="back-msg-placeholder" v-if="backMessage">
                <text>{{ backMessage }}</text>
              </view>
              <view v-else class="back-msg-tip">
                <text>背面留言预览</text>
              </view>
            </view>
            <view v-else-if="photo" class="back-blank">
              <text class="back-blank-txt">{{ sides === 'SINGLE' ? '单面模式' : '海报预览' }}</text>
            </view>
            <view v-else class="preview-placeholder light">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#C8B9A8" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </view>
          </view>
          <view class="foot">
            <text class="title">{{ location || '背面 / 附言' }}</text>
            <view class="meta">
              <text class="date">{{ sidesLabel }}</text>
              <text class="size">{{ styleLabel }}</text>
            </view>
          </view>
          <text class="badge">{{ sides === 'FRONT_BACK' ? '背面' : '预览' }}</text>
        </view>
      </view>

      <!-- 2. 上传提示卡（没选图时显示，引导用户点击） -->
      <view v-if="!photo" class="upload-hint neo-card" @click="onPickImage">
        <view class="upload-hint-left">
          <view class="upload-ico">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#C15837" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z" />
              <circle cx="12" cy="13.5" r="3.6" />
            </svg>
          </view>
          <view class="upload-hint-txt">
            <text class="upload-hint-title serif">上传你的照片</text>
            <text class="upload-hint-sub">拍照或从相册选一张，生成专属明信片</text>
          </view>
        </view>
        <view class="pill-btn-primary" @click.stop="onPickImage">
          <text>选择照片</text>
        </view>
      </view>

      <!-- 3. 类型 + 比例 chip -->
      <view class="quick-line">
        <view class="chip" :class="{ on: mode === 'POSTCARD' }" @click="mode = 'POSTCARD'">
          <text class="chip-label">明信片</text>
        </view>
        <view class="chip" :class="{ on: mode === 'POSTER' }" @click="mode = 'POSTER'">
          <text class="chip-label">极简海报</text>
        </view>
        <view class="chip-divider" />
        <view v-for="(r, i) in ratioPresets" :key="i" class="chip mini" :class="{ on: ratio.w === r.w && ratio.h === r.h && !useCustomRatio }" @click="pickRatio(r)">
          <text class="chip-label">{{ r.w }}:{{ r.h }}</text>
        </view>
        <view class="chip mini" :class="{ on: useCustomRatio }" @click="toggleCustomRatio">
          <text class="chip-label">自定义</text>
        </view>
      </view>

      <!-- 海报明信片风格选择器（折叠卡片，点击展开/收起） -->
      <view class="style-fold-header" @click="showStylePicker = !showStylePicker">
        <view class="style-fold-left">
          <view class="style-fold-ico">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#C15837" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 16V4a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12" />
              <path d="M4 16h16" />
              <circle cx="8" cy="18" r="2" />
              <circle cx="16" cy="18" r="2" />
            </svg>
          </view>
          <view class="style-fold-txt">
            <text class="style-fold-label">风格选择</text>
            <text class="style-fold-current">{{ styleLabel }}</text>
          </view>
        </view>
        <view class="style-fold-right">
          <view class="style-fold-chip on" style="pointer-events:none;">
            <text>{{ styleLabel }}</text>
          </view>
          <text class="style-fold-toggle">{{ showStylePicker ? '收起' : '展开' }}</text>
        </view>
      </view>
      <view v-if="showStylePicker" class="style-fold-content">
        <view class="style-picker-grid">
          <view
            v-for="s in quickStyles"
            :key="s.key"
            class="style-grid-chip"
            :class="{ on: s.key === style }"
            @click="style = s.key"
          >
            <text>{{ s.name }}</text>
          </view>
        </view>
      </view>

      <!-- 自定义比例（展开时） -->
      <view v-if="useCustomRatio" class="custom-ratio neo-card">
        <view class="neo-input-wrap">
          <input v-model="customRatio.w" class="neo-input" type="number" placeholder="宽" />
        </view>
        <text class="colon">:</text>
        <view class="neo-input-wrap">
          <input v-model="customRatio.h" class="neo-input" type="number" placeholder="高" />
        </view>
        <view class="apply-btn neo-btn type-primary size-md" @click="applyCustomRatio"><text>应用</text></view>
      </view>

      <!-- 正反面（一行简洁） -->
      <view class="quick-line" style="margin-top: 12rpx;">
        <text class="section-title-sm serif">版面</text>
        <view class="sides-pick">
          <view v-for="(o, i) in SIDES_OPTIONS" :key="o.value" class="sides-chip" :class="{ on: sides === o.value }" @click="sides = o.value">
            <text>{{ o.label }}</text>
          </view>
        </view>
      </view>

      <!-- 4. 纸纹样式选择 - 参考图4色：网格 / 斜纹 / 纯黑 / 橙棕 -->
      <view class="sec-head">
        <text class="section-title-sm serif">纸纹质感</text>
        <text class="section-sub">{{ styleDesc }}</text>
      </view>
      <StylePicker :styles="paperStyles" v-model="style" />

      <!-- 纸张纹理选择 -->
      <view class="texture-block">
        <view class="sec-head">
          <text class="section-title-sm serif">纸张纹理</text>
          <text class="section-sub">{{ textureLabel }}</text>
        </view>
        <scroll-view class="texture-scroll" scroll-x :show-scrollbar="false">
          <view class="texture-inner">
            <view
              v-for="t in paperTextures"
              :key="t.key"
              class="texture-chip"
              :class="{ on: t.key === paperTexture }"
              @click="paperTexture = t.key"
            >
              <text class="texture-chip-txt">{{ t.name }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 6. 当前模型：创作前直接选择你已接入的模型 -->
      <view class="model-picker-block">
        <view class="mp-head">
          <view class="mp-title-row">
            <text class="mp-title serif">使用的模型</text>
            <text class="mp-sub">创作前直接切换模型，结果走这套配置</text>
          </view>
          <view class="mp-add" @click="goSettings">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#C15837" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <text>接入 / 管理</text>
          </view>
        </view>

        <!-- 空：没接入任何模型 -->
        <view v-if="store.modelConfigs.length === 0" class="mp-empty neo-card" @click="goSettings">
          <view class="mp-empty-ico">
            <svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#9A8877" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2" />
              <path d="M4 12h10M4 16h7" />
            </svg>
          </view>
          <view class="mp-empty-txt">
            <text class="mp-empty-title">还没接入你的模型</text>
            <text class="mp-empty-sub">点此填入 API Key，支持 OpenAI / 通义 / 即梦 / Gemini / 自定义</text>
          </view>
          <view class="mp-empty-btn">
            <text>去接入</text>
          </view>
        </view>

        <!-- 已接入：横向可滚动的模型选择器，选中橙棕色高亮 -->
        <scroll-view v-else class="mp-list" scroll-x :show-scrollbar="false">
          <view class="mp-list-inner">
            <view
              v-for="c in store.modelConfigs"
              :key="c.id"
              class="mp-item"
              :class="{ on: c.id === store.activeConfigId }"
              @click="store.setActive(c.id); showModelFlash(c.name);"
            >
              <view class="mp-ico-wrap" :class="c.provider">
                <text class="mp-ico-txt">{{ shortName(c.provider) }}</text>
              </view>
              <view class="mp-info">
                <text class="mp-name">{{ c.name }}</text>
                <text class="mp-model">{{ c.model }}</text>
              </view>
              <view v-if="c.id === store.activeConfigId" class="mp-check">
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M5 12l5 5L20 7" />
                </svg>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 5. 正面预览/背面预览 分段控件 + 橙棕生成明信片按钮（在白卡内，与参考图一致） -->
      <view class="generate-block">
        <view class="gen-top-row">
          <SegmentedControl :options="PREVIEW_OPTIONS" v-model="previewTab" />
        </view>
        <view class="gen-btn-wrap">
          <view
            class="gen-btn neo-btn type-primary"
            :class="{ disabled: !canGenerate }"
            @click="canGenerate && onGenerate()"
          >
            <view v-if="generating" class="btn-spin" />
            <text v-else>{{ generating ? genStatus : '生成明信片' }}</text>
          </view>
        </view>
      </view>

      <!-- 6. 文案 & 背面留言（折叠区） -->
      <view class="fold-block" @click="showMeta = !showMeta">
        <view class="fold-left">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6B5B4E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 7V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-2" />
            <path d="M4 12h10M4 16h7" />
          </svg>
          <text class="fold-label">添加标题 / 地点 / 日期</text>
        </view>
        <text class="fold-toggle">{{ showMeta ? '收起' : '展开' }}</text>
      </view>
      <view v-if="showMeta" class="fold-content neo-card">
        <view class="neo-input-wrap">
          <input v-model="title" class="neo-input" placeholder="标题，如：山谷中的蓝湖" />
        </view>
        <view class="neo-input-wrap">
          <input v-model="location" class="neo-input" placeholder="地点，如：青海 · 翡翠湖" />
        </view>
        <view class="neo-input-wrap">
          <input v-model="date" class="neo-input" placeholder="日期，如：2026.08" />
        </view>
      </view>

      <view class="fold-block" @click="showBack = !showBack">
        <view class="fold-left">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#6B5B4E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 6h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6z" />
            <path d="M3 7l9 6 9-6" />
          </svg>
          <text class="fold-label">背面留言</text>
        </view>
        <text class="fold-toggle">{{ showBack ? '收起' : '展开' }}</text>
      </view>
      <view v-if="showBack" class="fold-content neo-card">
        <textarea v-model="backMessage" class="back-ta" maxlength="120" placeholder="写在背面的短句，如：给远方的你，愿你也在这样的蓝里" placeholder-class="ph" />
        <view class="ta-count"><text>{{ backMessage.length }}/120</text></view>
      </view>

      <!-- 8. 作画风格 chip - 与参考图底部一致：原图保留 / 手绘二创 / 三色块采样 -->
      <view class="style-chips-block">
        <view class="style-chips">
          <view
            v-for="c in PAINT_CHIPS"
            :key="c.key"
            class="style-chip"
            :class="{ on: paintChip === c.key }"
            @click="paintChip = c.key"
          >
            <text class="style-chip-txt">{{ c.label }}</text>
          </view>
        </view>
      </view>

      <view class="foot-note">
        <text class="caption">密钥仅保存在本机，使用你自己的 API 服务</text>
      </view>
    </scroll-view>

    <!-- 生成中遮罩 -->
    <view v-if="generating" class="mask">
      <view class="gen-panel neo-card">
        <view class="gen-spinner-wrap">
          <view class="gen-spinner" />
        </view>
        <text class="gen-title serif">正在制作你的明信片</text>
        <text class="gen-status">{{ genStatus }}</text>
        <view class="gen-steps">
          <view class="gen-step" :class="{ done: genStep >= 1 }"><text class="step-label">构图</text></view>
          <view class="gen-step" :class="{ done: genStep >= 2 }"><text class="step-label">正面</text></view>
          <view class="gen-step" :class="{ done: genStep >= 3 }"><text class="step-label">完成</text></view>
        </view>
      </view>
    </view>

    <!-- 隐私政策弹窗（首次打开且未同意） -->
    <view v-if="showPrivacy" class="priv-mask" @click.self="onPrivacyDecline">
      <view class="priv-panel">
        <text class="priv-title serif">欢迎使用明信片工坊</text>
        <view class="priv-list">
          <view class="priv-item">
            <text class="priv-dot">·</text>
            <text class="priv-item-txt">我们会请求相机与相册权限，用于拍摄或选择你要制作明信片的照片。</text>
          </view>
          <view class="priv-item">
            <text class="priv-dot">·</text>
            <text class="priv-item-txt">你上传的照片仅用于生成当前明信片，不会在未经允许的情况下分享给第三方。</text>
          </view>
          <view class="priv-item">
            <text class="priv-dot">·</text>
            <text class="priv-item-txt">API Key 仅保存在本机本地存储，调用时直接发送到你选择的服务商。</text>
          </view>
          <view class="priv-item">
            <text class="priv-dot">·</text>
            <text class="priv-item-txt">生成的结果默认保存在你的设备本地，你可以随时删除。</text>
          </view>
          <view class="priv-item">
            <text class="priv-dot">·</text>
            <text class="priv-item-txt">本应用不会收集任何与明信片生成无关的个人信息。</text>
          </view>
        </view>
        <view class="priv-agree-row" @click="agreeChecked = !agreeChecked">
          <view class="priv-radio" :class="{ on: agreeChecked }">
            <view v-if="agreeChecked" class="priv-radio-dot" />
          </view>
          <text class="priv-agree-txt">我已阅读并同意隐私政策</text>
        </view>
        <view class="priv-btn-row">
          <view class="priv-btn ghost" @click="onPrivacyDecline">
            <text>不同意并退出</text>
          </view>
          <view class="priv-btn primary" :class="{ disabled: !agreeChecked }" @click="onPrivacyAgree">
            <text>同意并继续</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 图片选择底部弹窗 -->
    <view v-show="showPickerSheet" class="sheet-mask" @click="showPickerSheet = false">
      <view class="sheet-panel" @click.stop="">
        <view class="sheet-handle" />
        <text class="sheet-title serif">选择照片来源</text>
        <view class="sheet-btns">
          <!-- #ifdef H5 -->
          <!-- H5：JS 创建原生 input 并触发 click，避免 label/input 关联失效 -->
          <view class="sheet-btn" @click="onH5PickCamera">
            <view class="sheet-ico">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#C15837" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z" />
                <circle cx="12" cy="13.5" r="3.6" />
              </svg>
            </view>
            <text class="sheet-btn-txt">拍照</text>
          </view>
          <view class="sheet-btn" @click="onH5PickAlbum">
            <view class="sheet-ico">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#C15837" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </view>
            <text class="sheet-btn-txt">相册</text>
          </view>
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <!-- App/小程序：走 uni.chooseImage 原生API -->
          <view class="sheet-btn" @click="onPickFromCamera">
            <view class="sheet-ico">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#C15837" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 8h3l2-2.5h6L17 8h3a1.5 1.5 0 0 1 1.5 1.5V18a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9.5A1.5 1.5 0 0 1 4 8z" />
                <circle cx="12" cy="13.5" r="3.6" />
              </svg>
            </view>
            <text class="sheet-btn-txt">拍照</text>
          </view>
          <view class="sheet-btn" @click="onPickFromAlbum">
            <view class="sheet-ico">
              <svg viewBox="0 0 24 24" width="44" height="44" fill="none" stroke="#C15837" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </view>
            <text class="sheet-btn-txt">相册</text>
          </view>
          <!-- #endif -->
        </view>
        <view class="sheet-cancel" @click="showPickerSheet = false">
          <text>取消</text>
        </view>
      </view>
    </view>

    <!-- 裁剪组件 -->
    <ImageCropper
      :visible="showCropper"
      :src="tempImagePath"
      @cancel="showCropper = false"
      @confirm="onCropConfirm"
    />

    <AppTabbar current="index" />
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import store from '@/store/index.js'
import { request } from '@/utils/request.js'
import { STYLES, RATIOS, SIDES_OPTIONS, PAPER_TEXTURES } from '@/utils/constants.js'
import SegmentedControl from '@/components/SegmentedControl.vue'
import StylePicker from '@/components/StylePicker.vue'
import AppTabbar from '@/components/AppTabbar.vue'
import ImageCropper from '@/components/ImageCropper.vue'

const photo = ref(null)
const mode = ref('POSTCARD')
const sides = ref('FRONT_BACK')
const ratio = ref({ w: 2, h: 3 })
const useCustomRatio = ref(false)
const customRatio = ref({ w: '2', h: '3' })
const style = ref('hand_drawn_watercolor')
const paintChip = ref('tri_sample')
const paperTexture = ref('pure_white')
const paperTextures = ref(PAPER_TEXTURES)
const title = ref('')
const location = ref('')
const date = ref('')
const backMessage = ref('')
const showMeta = ref(false)
const showBack = ref(false)
const showStylePicker = ref(false)
const previewTab = ref('FRONT')
const generating = ref(false)
const genStatus = ref('')
const genStep = ref(0)
const styles = ref(STYLES)
const ratios = ref(RATIOS)

// 隐私弹窗状态
const agreeChecked = ref(false)
const showPrivacy = computed(() => !store.privacyAgreed && store.firstOpen)
const showPickerSheet = ref(false)
// 裁剪状态
const showCropper = ref(false)
const tempImagePath = ref('')

// 参考图一致：预览Tab = 正面预览 / 背面预览
const PREVIEW_OPTIONS = [
  { label: '正面预览', value: 'FRONT', icon: null },
  { label: '背面预览', value: 'BACK', icon: null },
]

// 参考图底部：作画风格 3 chip
const PAINT_CHIPS = [
  { key: 'original',     label: '原图保留' },
  { key: 'hand_draw_2',  label: '手绘二创' },
  { key: 'tri_sample',   label: '三色块采样' },
]

// 创作页"模型选择器"里显示服务商缩写（与设置页一致）
function shortName(key) {
  switch (key) {
    case 'openai': return 'OA'
    case 'dashscope': return 'TY'
    case 'ark': return 'JS'
    case 'gemini': return 'GM'
    case 'custom': return 'CZ'
    default: return '??'
  }
}
function showModelFlash(name) {
  uni.showToast({ title: `已切换：${name}`, icon: 'none', duration: 1200 })
}

// 参考图一致：4色纸纹风格优先展示
const paperStyles = computed(() => {
  const prefer = ['hand_drawn_watercolor', 'minimal_woodblock', 'retro_risograph', 'film_polaroid']
  const s = styles.value
  const list = []
  prefer.forEach((k) => {
    const found = s.find((x) => x.key === k)
    if (found) list.push(found)
  })
  s.forEach((x) => { if (!list.includes(x)) list.push(x) })
  return list
})
// 快速风格列表：显示在类型/比例下方供快速选择
const quickStyles = computed(() => {
  // 优先展示热门风格，最多 12 个
  const prefer = [
    'hand_drawn_watercolor', 'ink_line', 'gouache', 'cut_paper',
    'pencil_sketch', 'risograph', 'letterpress', 'vintage_film',
    'minimal_poster', 'woodblock_print', 'screen_print', 'collage',
  ]
  const s = styles.value
  const list = []
  prefer.forEach((k) => {
    const found = s.find((x) => x.key === k)
    if (found) list.push(found)
  })
  s.forEach((x) => { if (!list.includes(x) && list.length < 16) list.push(x) })
  return list
})

const statusBarPad = computed(() => {
  // #ifdef H5
  return '0rpx'
  // #endif
  // #ifndef H5
  return '0rpx'
  // #endif
})
const bodyPad = computed(() => '60rpx')

const ratioPresets = computed(() => ratios.value.slice(0, 4))
const ratioLabel = computed(() => `${ratio.value.w}:${ratio.value.h}`)
const sidesLabel = computed(() => {
  if (sides.value === 'FRONT_BACK') return '正反面'
  if (sides.value === 'FRONT_ONLY') return '正面'
  return '背面'
})
const styleLabel = computed(() => {
  const s = styles.value.find((x) => x.key === style.value)
  return s ? s.name : '手绘水彩'
})
const styleDesc = computed(() => {
  const s = styles.value.find((x) => x.key === style.value)
  return s ? s.desc : '温柔纸质纹理'
})
const textureLabel = computed(() => {
  const t = paperTextures.value.find((x) => x.key === paperTexture.value)
  return t ? t.desc : '无纹理'
})
const dateText = computed(() => date.value || formatDate())
const canGenerate = computed(() => {
  if (generating.value) return false
  if (mode.value === 'POSTCARD' && !photo.value) return false
  if (!store.providerConfigured()) return false  // 必须配置了API才能生成
  return true
})

function formatDate() {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${m}/${day}`
}

onMounted(() => {
  loadMeta()
  // #ifdef H5
  // H5 端：动态创建原生 input[type=file]，用于拍照/相册选择
  // UniApp 的 <input> 组件是自定义组件，不支持 type=file，必须用原生 DOM
  initH5FileInputs()
  // #endif
})

// H5 专用：创建两个原生 file input（拍照/相册分开，避免 iOS 兼容问题）
let h5CameraInput = null
let h5AlbumInput = null
function initH5FileInputs() {
  // #ifdef H5
  const createInput = (capture) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    if (capture) input.setAttribute('capture', 'environment')
    input.style.display = 'none'
    input.addEventListener('change', (e) => {
      const file = e.target.files?.[0]
      // 重置 input，支持重复选同一张图
      input.value = ''
      if (!file) return
      showPickerSheet.value = false
      handleH5SelectedFile(file)
    })
    document.body.appendChild(input)
    return input
  }
  h5CameraInput = createInput(true)  // 拍照
  h5AlbumInput = createInput(false)  // 相册
  // #endif
}

// H5 选图后处理：读取为本地路径 → 打开裁剪
function handleH5SelectedFile(file) {
  // #ifdef H5
  if (!file) return
  const reader = new FileReader()
  reader.onload = (e) => {
    const dataUrl = e.target?.result
    if (!dataUrl) {
      uni.showToast({ title: '读取图片失败', icon: 'none' })
      return
    }
    tempImagePath.value = dataUrl
    showCropper.value = true
  }
  reader.onerror = () => {
    uni.showToast({ title: '读取图片失败', icon: 'none' })
  }
  reader.readAsDataURL(file)
  // #endif
}

// H5：触发拍照
function onH5PickCamera() {
  // #ifdef H5
  if (showPrivacy.value) {
    uni.showToast({ title: '请先同意隐私政策', icon: 'none' })
    return
  }
  if (h5CameraInput) {
    h5CameraInput.click()
  }
  // #endif
}

// H5：触发相册
function onH5PickAlbum() {
  // #ifdef H5
  if (showPrivacy.value) {
    uni.showToast({ title: '请先同意隐私政策', icon: 'none' })
    return
  }
  if (h5AlbumInput) {
    h5AlbumInput.click()
  }
  // #endif
}

async function loadMeta() {
  // 没有后端时直接跳过，不阻塞 UI（默认 127.0.0.1:8080 大概率连不上）
  // H5 下空 serverUrl 表示走相对路径，允许继续
  // #ifdef H5
  if (!store.serverUrl) {
    // H5 下空 = 相对路径，继续执行
  } else if (/^https?:\/\/(127\.0\.0\.1|localhost)/i.test(store.serverUrl)) {
    return
  }
  // #endif
  // #ifndef H5
  if (!store.serverUrl || /^https?:\/\/(127\.0\.0\.1|localhost)/i.test(store.serverUrl)) {
    return
  }
  // #endif
  try {
    const meta = await request('/api/meta', { timeout: 5000 })
    store.meta = meta
    if (meta.styles && meta.styles.length) styles.value = meta.styles
    if (meta.ratios && meta.ratios.length) ratios.value = meta.ratios
  } catch (e) {}
}

// ------- 隐私政策操作 -------
function onPrivacyAgree() {
  if (!agreeChecked.value) return
  store.agreePrivacy()
  agreeChecked.value = false
}
function onPrivacyDecline() {
  uni.showToast({ title: '不同意将无法使用核心功能', icon: 'none' })
  setTimeout(() => {
    // #ifdef H5
    window.close()
    // #endif
    // #ifdef APP-PLUS
    if (typeof plus !== 'undefined' && plus.runtime && plus.runtime.quit) plus.runtime.quit()
    // #endif
    // #ifdef MP
    uni.navigateBack({ delta: 1 })
    // #endif
  }, 600)
}

// ------- 图片选择 -------

function onPickImage() {
  if (showPrivacy.value) {
    uni.showToast({ title: '请先同意隐私政策', icon: 'none' })
    return
  }
  showPickerSheet.value = true
}

// 拍照
function onPickFromCamera() {
  showPickerSheet.value = false
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['camera'],
    success: (res) => {
      tempImagePath.value = res.tempFilePaths[0]
      showCropper.value = true
    },
    fail: () => {},
  })
}

// 相册
function onPickFromAlbum() {
  showPickerSheet.value = false
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album'],
    success: (res) => {
      tempImagePath.value = res.tempFilePaths[0]
      showCropper.value = true
    },
    fail: () => {},
  })
}

// 裁剪确认：上传到后端 + 本地预览
function onCropConfirm(e) {
  showCropper.value = false
  const croppedPath = e.tempFilePath

  uni.showLoading({ title: '上传中...' })

  // 先读 base64 保证预览不依赖网络
  fileToResultByPath(croppedPath).then(img => {
    photo.value = { ...img, path: croppedPath }
  }).catch(() => {
    photo.value = { path: croppedPath, base64: '', mime: 'image/jpeg', size: 0 }
  })

  // 上传到后端
  uni.uploadFile({
    url: store.serverUrl + '/api/file/upload',
    filePath: croppedPath,
    name: 'file',
    success: (res) => {
      try {
        const data = JSON.parse(res.data)
        if (data.code === 200) {
          const fullUrl = store.serverUrl + data.data.url
          photo.value = { ...(photo.value || {}), url: fullUrl }
          uni.showToast({ title: '上传成功', icon: 'success' })
        } else {
          console.warn('上传失败', data.msg)
        }
      } catch (e) {
        console.warn('解析上传响应失败', e)
      }
    },
    fail: (err) => {
      console.error('上传网络异常', err)
      // 上传失败不影响本地预览
    },
    complete: () => {
      uni.hideLoading()
    }
  })
}

function fileToResult(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('未获取到图片')); return }
    const fr = new FileReader()
    fr.onload = () => {
      const dataUrl = String(fr.result || '')
      const mime = file.type || 'image/jpeg'
      resolve({ base64: dataUrl, mime, size: typeof file.size === 'number' ? file.size : 0 })
    }
    fr.onerror = () => reject(new Error('读取图片失败'))
    fr.readAsDataURL(file)
  })
}

// 通过临时路径读取图片（uni.chooseImage 返回的是路径，不是 File 对象）
function fileToResultByPath(filePath) {
  return new Promise((resolve, reject) => {
    if (!filePath) { reject(new Error('未获取到图片路径')); return }
    // #ifdef H5
    // H5 端 tempFilePath 是 blob URL，直接 fetch
    fetch(filePath)
      .then((res) => res.blob())
      .then((blob) => {
        const fr = new FileReader()
        fr.onload = () => {
          resolve({ base64: String(fr.result || ''), mime: blob.type || 'image/jpeg', size: blob.size })
        }
        fr.onerror = () => reject(new Error('读取图片失败'))
        fr.readAsDataURL(blob)
      })
      .catch(() => reject(new Error('读取图片失败')))
    // #endif
    // #ifndef H5
    // App/小程序端用 uni.getFileSystemManager 读取
    try {
      const fs = uni.getFileSystemManager()
      const base64 = fs.readFileSync(filePath, 'base64')
      const mime = filePath.match(/\.(png|jpg|jpeg|webp)/i)?.[0]?.replace('.', '') || 'jpeg'
      resolve({ base64: `data:image/${mime};base64,${base64}`, mime: `image/${mime}`, size: 0 })
    } catch (e) {
      reject(new Error('读取图片失败'))
    }
    // #endif
  })
}

function onRemoveImage() { photo.value = null }

function pickRatio(r) {
  useCustomRatio.value = false
  ratio.value = { w: r.w, h: r.h }
}
function toggleCustomRatio() { useCustomRatio.value = !useCustomRatio.value }
function applyCustomRatio() {
  const w = parseInt(customRatio.value.w, 10)
  const h = parseInt(customRatio.value.h, 10)
  if (!w || !h || w <= 0 || h <= 0) { uni.showToast({ title: '请输入有效的宽高比例', icon: 'none' }); return }
  ratio.value = { w, h }
  useCustomRatio.value = false
  uni.showToast({ title: `比例 ${w}:${h}`, icon: 'none' })
}

function goSettings() { uni.navigateTo({ url: '/pages/settings/api' }) }

async function onGenerate() {
  if (mode.value === 'POSTCARD' && !photo.value) {
    uni.showToast({ title: '明信片需要先上传一张照片', icon: 'none' })
    return
  }
  if (!store.providerConfigured()) {
    uni.showToast({ title: store.modelConfigs.length === 0 ? '请先接入你的模型和API Key' : '请选择一个模型', icon: 'none' })
    setTimeout(() => goSettings(), 650)
    return
  }
  // ★ 必须取当前激活配置对象，确保生成请求使用用户"创作前选择的那一套"
  const activeCfg = store.getActiveConfig()
  if (!activeCfg) {
    uni.showToast({ title: '请在创作前选择一个模型', icon: 'none' })
    return
  }
  generating.value = true
  genStatus.value = '正在提交…'
  genStep.value = 0
  try {
    const data = {
      imageBase64: photo.value ? photo.value.base64 : null,
      imageMime: photo.value ? photo.value.mime : null,
      mode: mode.value,
      sides: sides.value,
      ratio: { width: ratio.value.w, height: ratio.value.h },
      style: style.value,
      paintMode: paintChip.value,
      paperTexture: paperTexture.value,
      title: title.value || null,
      location: location.value || null,
      date: date.value || null,
      backMessage: backMessage.value || null,
      provider: {
        provider: activeCfg.provider,
        baseUrl: activeCfg.baseUrl,
        apiKey: activeCfg.apiKey,
        model: activeCfg.model,
        imageInput: activeCfg.imageInput,
      },
    }
    genStep.value = 1 // 正面生成中
    const resp = await request('/api/generation/', { method: 'POST', data, timeout: 120000 })
    genStep.value = 2 // 正面完成

    // 处理结果（兼容两种返回格式：直接返回 result 或包裹在 data 里）
    const result = resp.result || resp.data?.result
    if (!result || !result.frontUrl) {
      throw new Error((resp.msg || resp.message) || '生成失败，请重试')
    }

    // 保存到历史记录
    const historyItem = {
      id: `history_${Date.now()}`,
      type: mode.value,
      style: style.value,
      photo: photo.value,
      title: title.value,
      location: location.value,
      date: date.value,
      frontMessage: frontMessage.value,
      backMessage: backMessage.value,
      ratio: ratio.value,
      frontUrl: result.frontUrl,
      backUrl: result.backUrl || null,
      createdAt: Date.now(),
      provider: activeCfg.value?.name || '',
    }
    store.addHistory(historyItem)

    // 跳转到结果页
    genStep.value = 3
    store.preview = {
      frontUrl: result.frontUrl,
      backUrl: result.backUrl || null,
      ratio: ratio.value,
      styleName: styleLabel.value,
      sides: sides.value,
      mode: mode.value,
      title: title.value,
      location: location.value,
      date: date.value,
    }
    setTimeout(() => uni.navigateTo({ url: '/pages/result/result' }), 500)
  } catch (e) {
    genStep.value = 0
    uni.showToast({ title: e.message, icon: 'none' })
  } finally {
    generating.value = false
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; }

/* ---------- 顶部栏：Zine明信片创作 小衬线 + 创作页 大衬线 ---------- */
.nav-bar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0rpx 32rpx 0rpx;
}
.nav-left-inner { display: flex; flex-direction: column; gap: 0rpx; }
.nav-brand { font-size: 20rpx; color: var(--ink-2); font-weight: 600; letter-spacing: 0.5rpx; }
.nav-head { font-size: 32rpx; line-height: 1.1; }
.nav-ico {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-ico:active { transform: scale(0.95); }

/* ---------- 主体 ---------- */
.body {
  height: calc(100vh - 60rpx);
  box-sizing: border-box;
  padding: 0 32rpx;
}

/* ---------- 双预览卡 ---------- */
.preview-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24rpx;
  margin-bottom: 28rpx;
}
.preview-card { background: var(--paper-surface); border-radius: 28rpx; box-shadow: var(--shadow-card); overflow: hidden; transition: transform 0.2s; }
.preview-card:active { transform: scale(0.98); }
.preview-cover {
  width: 100%;
  aspect-ratio: 2 / 3;
  position: relative;
  overflow: hidden;
  background: var(--paper-bg-soft);
}
.preview-img { width: 100%; height: 100%; position: absolute; inset: 0; object-fit: cover; object-position: center; }
.preview-placeholder {
  width: 100%; height: 100%;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 14rpx;
  color: var(--ink-3);
}
.preview-placeholder.light { background: linear-gradient(180deg, #F9F5EE 0%, #F2EADB 100%); }
.preview-hint { font-size: 22rpx; color: var(--ink-3); font-weight: 500; }
.circle-btn {
  position: absolute;
  top: 18rpx;
  right: 18rpx;
  width: 44rpx; height: 44rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.88);
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-soft);
  z-index: 2;
}

/* 背面模拟 */
.back-cover {
  background: linear-gradient(180deg, #FDFAF4 0%, #F4EAD9 100%);
  padding: 24rpx;
  box-sizing: border-box;
  position: relative;
}
.back-sim { width: 100%; height: 100%; position: relative; }
.back-stamp {
  position: absolute; top: 0; right: 0;
  width: 64rpx; height: 48rpx;
  border: 1.5rpx dashed var(--ink-4);
  display: flex; align-items: center; justify-content: center;
  border-radius: 6rpx;
}
.back-lines {
  position: absolute;
  top: 40%;
  left: 18rpx; right: 18rpx;
  display: flex; flex-direction: column; gap: 14rpx;
}
.back-lines .ln {
  height: 1rpx; background: var(--ink-4);
}
.back-msg-placeholder {
  position: absolute;
  top: 12rpx;
  left: 0; right: 50%;
  padding: 0 14rpx;
  font-size: 20rpx;
  color: var(--ink-2);
  line-height: 1.5;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
}
.back-msg-tip {
  position: absolute;
  top: 12rpx; left: 0; right: 50%;
  padding: 0 14rpx;
  font-size: 20rpx; color: var(--ink-4);
}
.back-blank {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: var(--paper-bg-soft);
}
.back-blank-txt { font-size: 22rpx; color: var(--ink-3); }

/* ---------- 上传提示卡 ---------- */
.upload-hint {
  padding: 22rpx 26rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  margin-bottom: 24rpx;
  transition: transform 0.15s;
}
.upload-hint:active { transform: scale(0.99); }
.upload-hint-left { display: flex; align-items: center; gap: 18rpx; flex: 1; min-width: 0; }
.upload-ico {
  width: 72rpx; height: 72rpx;
  border-radius: 22rpx;
  background: var(--primary-soft);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.upload-hint-txt { display: flex; flex-direction: column; gap: 4rpx; min-width: 0; }
.upload-hint-title { font-size: 28rpx; font-weight: 700; color: var(--ink); }
.upload-hint-sub { font-size: 22rpx; color: var(--ink-3); }

.pill-btn-primary {
  height: 76rpx; padding: 0 30rpx; border-radius: 999rpx;
  background: var(--primary);
  color: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-btn);
  font-size: 25rpx; font-weight: 700;
  flex-shrink: 0;
}
.pill-btn-primary:active { background: var(--primary-deep); transform: scale(0.97); }

/* ---------- 类型/比例 快速chip行 ---------- */
.quick-line {
  display: flex; align-items: center; flex-wrap: wrap;
  gap: 14rpx;
  margin-bottom: 18rpx;
}
.chip {
  padding: 16rpx 24rpx;
  border-radius: 999rpx;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  transition: all 0.2s;
}
.chip.mini { padding: 12rpx 22rpx; }
.chip:active { transform: scale(0.96); }
.chip.on {
  background: var(--primary);
  box-shadow: 0 6rpx 16rpx rgba(216, 106, 70, 0.3);
}
.chip.on .chip-label { color: #fff; }
.chip-label { font-size: 26rpx; font-weight: 700; color: var(--ink-2); }
.chip.mini .chip-label { font-size: 24rpx; }
.chip-divider {
  width: 1rpx; height: 42rpx;
  background: var(--line);
  margin: 0 4rpx;
  align-self: center;
}
.section-title-sm { font-size: 26rpx; font-weight: 700; color: var(--ink); margin-right: 10rpx; }
/* 版面chip行：sides chip靠右 */
.sides-pick {
  display: flex;
  gap: 10rpx;
  flex: 1;
  justify-content: flex-end;
  flex-wrap: wrap;
}
.sides-chip {
  padding: 12rpx 20rpx;
  border-radius: 999rpx;
  background: var(--paper-bg-soft);
  border: 1rpx solid var(--line);
  font-size: 24rpx;
  color: var(--ink-2);
  font-weight: 500;
  transition: all 0.2s;
}
.sides-chip.on {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
  box-shadow: 0 4rpx 12rpx rgba(216, 106, 70, 0.28);
  font-weight: 700;
}

/* 自定义比例 */
.custom-ratio {
  display: flex; align-items: center;
  gap: 14rpx;
  padding: 20rpx 22rpx;
  margin-bottom: 18rpx;
}
.colon { font-size: 34rpx; color: var(--ink-3); font-weight: 700; }
.custom-ratio .neo-input-wrap { flex: 1; }
.apply-btn { flex-shrink: 0; padding: 0 28rpx; }

/* ---------- 段落头部 ---------- */
.sec-head {
  display: flex; align-items: baseline; justify-content: space-between;
  gap: 10rpx;
  margin: 28rpx 4rpx 16rpx;
}
.section-title-sm { font-size: 28rpx; font-weight: 700; color: var(--ink); }
.section-sub { font-size: 22rpx; color: var(--ink-3); }

/* ---------- 纸张纹理横向滚动选择 ---------- */
.texture-block { margin: 8rpx 0 4rpx; }
.texture-scroll { width: 100%; white-space: nowrap; }
.texture-inner {
  display: inline-flex;
  gap: 12rpx;
  padding: 8rpx 4rpx 16rpx;
}
.texture-chip {
  display: inline-flex;
  align-items: center;
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: var(--paper-surface);
  border: 1.5rpx solid var(--line);
  transition: all 0.2s;
  cursor: pointer;
}
.texture-chip:active { transform: scale(0.96); }
.texture-chip.on {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: 0 4rpx 12rpx rgba(216, 106, 70, 0.28);
}
.texture-chip-txt {
  font-size: 24rpx;
  font-weight: 600;
  color: var(--ink-2);
  white-space: nowrap;
}
.texture-chip.on .texture-chip-txt { color: #fff; }

/* ---------- 生成按钮块（含正/背面段控件）与参考图一致：分段控件 + 独立居中按钮 ---------- */
.generate-block {
  margin: 28rpx 0 18rpx;
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
.gen-top-row { width: 100%; }
.gen-btn-wrap {
  display: flex;
  justify-content: center;
  width: 100%;
}

/* 生成按钮（与参考图橙棕大按钮一致），用 disabled class 阻止点击 */
.gen-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  width: 100%;
  max-width: 520rpx;
  height: 108rpx;
  border-radius: 999rpx;
  padding: 0 44rpx;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: 0.5rpx;
  color: #fff;
  background: var(--primary);
  box-shadow: var(--shadow-btn);
  transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease;
  user-select: none;
  white-space: nowrap;
  font-family: var(--font-sans);
}
.gen-btn:active {
  transform: scale(0.97);
  background: var(--primary-deep);
  box-shadow: 0 5rpx 14rpx rgba(193, 88, 55, 0.3);
}
.gen-btn.disabled { opacity: 0.55; pointer-events: none; }
.btn-spin {
  width: 36rpx; height: 36rpx;
  border: 4rpx solid rgba(255,255,255,0.45);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.85s linear infinite;
}

/* 复用全局 neo-btn 样式 */
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
.size-md {
  height: 84rpx;
  padding: 0 36rpx;
  font-size: 28rpx;
}
.size-lg {
  height: 108rpx;
  padding: 0 44rpx;
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: 0.5rpx;
}

/* 输入框复用主题中 neo-input-wrap 样式 */
.neo-input-wrap {
  border-radius: 24rpx;
  background: var(--paper-bg-soft);
  padding: 0 28rpx;
  display: flex;
  align-items: center;
  transition: all 0.2s;
  border: 1rpx solid transparent;
}
.neo-input-wrap:focus-within {
  background: var(--paper-surface);
  border-color: var(--primary-line);
  box-shadow: 0 0 0 3rpx var(--primary-line), var(--shadow-soft);
}
.neo-input {
  flex: 1;
  height: 92rpx;
  font-size: 28rpx;
  color: var(--ink);
  background: transparent;
  font-weight: 500;
}

/* ---------- 折叠区（文案 / 背面留言） ---------- */
.fold-block {
  display: flex; align-items: center; justify-content: space-between;
  padding: 26rpx 10rpx 18rpx;
  transition: opacity 0.2s;
}
.fold-block:active { opacity: 0.7; }
.fold-left { display: flex; align-items: center; gap: 12rpx; }
.fold-label { font-size: 26rpx; color: var(--ink-2); font-weight: 600; }
.fold-toggle { font-size: 22rpx; color: var(--primary-deep); font-weight: 600; }

.fold-content {
  display: flex; flex-direction: column; gap: 16rpx;
  padding: 22rpx;
  margin-bottom: 8rpx;
}
.back-ta {
  width: 100%;
  height: 160rpx;
  font-size: 28rpx;
  color: var(--ink);
  line-height: 1.6;
  background: transparent;
}
:deep(.ph) { color: var(--ink-4); }
.ta-count { text-align: right; margin-top: 6rpx; font-size: 22rpx; color: var(--ink-3); font-weight: 500; }

/* ---------- 风格选择器（折叠卡片，明显可见） ---------- */
.style-fold-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 22rpx;
  margin: 16rpx 0 8rpx;
  border-radius: 24rpx;
  background: var(--paper-surface);
  box-shadow: var(--shadow-soft);
  transition: all 0.15s;
}
.style-fold-header:active { transform: scale(0.99); opacity: 0.85; }
.style-fold-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.style-fold-ico {
  width: 60rpx;
  height: 60rpx;
  border-radius: 18rpx;
  background: var(--primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.style-fold-txt {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}
.style-fold-label {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--ink);
}
.style-fold-current {
  font-size: 20rpx;
  color: var(--ink-3);
  font-weight: 500;
}
.style-fold-right {
  display: flex;
  align-items: center;
  gap: 12rpx;
  flex-shrink: 0;
}
.style-fold-chip {
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: var(--primary);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: 0 4rpx 10rpx rgba(216, 106, 70, 0.25);
}
.style-fold-toggle {
  font-size: 22rpx;
  color: var(--primary-deep);
  font-weight: 600;
}
.style-fold-content {
  padding: 12rpx 6rpx 4rpx;
  margin-bottom: 8rpx;
}

/* 展开后的风格网格 chip */
.style-picker-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
}
.style-grid-chip {
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: var(--paper-bg-soft);
  border: 1.5rpx solid var(--line);
  font-size: 24rpx;
  color: var(--ink-2);
  font-weight: 500;
  transition: all 0.2s;
}
.style-grid-chip:active { transform: scale(0.96); }
.style-grid-chip.on {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 4rpx 12rpx rgba(216, 106, 70, 0.28);
}

/* ---------- 模型选择器（生成按钮上方的主入口） ---------- */
.model-picker-block {
  margin: 20rpx 0 4rpx;
}
.mp-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14rpx;
  margin: 0 4rpx 10rpx;
}
.mp-title-row { display: flex; flex-direction: column; gap: 2rpx; }
.mp-title {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--ink);
  letter-spacing: 0.5rpx;
}
.mp-sub { font-size: 20rpx; color: var(--ink-3); }
.mp-add {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: var(--primary-soft);
  color: var(--primary-deep);
  font-size: 22rpx;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.15s;
}
.mp-add:active { transform: scale(0.96); background: var(--primary-line); }

/* 空状态 */
.mp-empty {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  transition: transform 0.15s;
}
.mp-empty:active { transform: scale(0.99); }
.mp-empty-ico {
  width: 88rpx; height: 88rpx;
  border-radius: 24rpx;
  background: var(--paper-bg-soft);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.mp-empty-txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6rpx; }
.mp-empty-title { font-size: 26rpx; font-weight: 700; color: var(--ink); }
.mp-empty-sub { font-size: 22rpx; color: var(--ink-3); line-height: 1.5; }
.mp-empty-btn {
  flex-shrink: 0;
  padding: 14rpx 24rpx;
  border-radius: 999rpx;
  background: var(--primary);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  box-shadow: var(--shadow-btn);
}
.mp-empty-btn:active { background: var(--primary-deep); }

/* 横向滚动模型卡列表 */
.mp-list { width: 100%; white-space: nowrap; }
.mp-list-inner {
  display: inline-flex;
  gap: 14rpx;
  padding: 6rpx 4rpx 12rpx;
}
.mp-item {
  display: inline-flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 18rpx;
  border-radius: 22rpx;
  background: var(--paper-surface);
  box-shadow: var(--shadow-card);
  transition: all 0.2s;
  min-width: 280rpx;
  position: relative;
}
.mp-item:active { transform: scale(0.97); }
.mp-item.on {
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
  box-shadow: 0 8rpx 24rpx rgba(216, 106, 70, 0.36);
}
.mp-ico-wrap {
  width: 60rpx; height: 60rpx;
  border-radius: 18rpx;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: var(--paper-bg-soft);
}
.mp-ico-wrap.openai   { background: #101827; }
.mp-ico-wrap.dashscope { background: #FF6A00; }
.mp-ico-wrap.ark       { background: #00B4FF; }
.mp-ico-wrap.gemini    { background: linear-gradient(135deg, #4285F4 0%, #EA4335 100%); }
.mp-ico-wrap.custom    { background: #8FA871; }
.mp-item.on .mp-ico-wrap { background: rgba(255,255,255,0.22); }
.mp-ico-txt { color: #fff; font-size: 22rpx; font-weight: 800; letter-spacing: 0.5rpx; }
.mp-item.on .mp-ico-txt { color: #fff; }
.mp-info {
  display: flex; flex-direction: column; gap: 4rpx;
  min-width: 0;
  flex: 1;
}
.mp-name {
  font-size: 24rpx;
  font-weight: 800;
  color: var(--ink);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 220rpx;
}
.mp-model {
  font-size: 20rpx;
  color: var(--ink-3);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  max-width: 220rpx;
}
.mp-item.on .mp-name { color: #fff; }
.mp-item.on .mp-model { color: rgba(255,255,255,0.85); }
.mp-check {
  flex-shrink: 0;
  width: 28rpx; height: 28rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  display: flex; align-items: center; justify-content: center;
}

/* ---------- 作画风格 chip 块 ---------- */
.style-chips-block {
  padding: 20rpx 0 12rpx;
}
.style-chips {
  display: flex;
  gap: 18rpx;
  flex-wrap: wrap;
  justify-content: center;
}
.style-chip {
  padding: 18rpx 34rpx;
  border-radius: 999rpx;
  background: var(--paper-surface);
  border: 1.5rpx solid var(--line);
  transition: all 0.2s;
}
.style-chip:active { transform: scale(0.96); }
.style-chip.on {
  background: var(--primary);
  border-color: var(--primary);
  box-shadow: var(--shadow-btn);
}
.style-chip-txt {
  font-size: 26rpx;
  font-weight: 700;
  color: var(--ink-2);
  letter-spacing: 0.5rpx;
}
.style-chip.on .style-chip-txt { color: #fff; }

.foot-note { text-align: center; padding: 12rpx 0 32rpx; }

/* ---------- 生成遮罩 ---------- */
.mask {
  position: fixed; inset: 0;
  background: rgba(44, 36, 30, 0.5);
  z-index: 9998;
  display: flex; align-items: center; justify-content: center;
}
.gen-panel {
  width: 540rpx;
  padding: 60rpx 44rpx 44rpx;
  display: flex; flex-direction: column; align-items: center;
  background: var(--paper-surface);
  border-radius: 32rpx;
  box-shadow: var(--shadow-card);
}
.gen-spinner-wrap { margin-bottom: 28rpx; }
.gen-spinner {
  width: 80rpx; height: 80rpx; border-radius: 50%;
  border: 6rpx solid var(--primary-soft);
  border-top-color: var(--primary);
  animation: spin 0.9s linear infinite;
}
.gen-title { font-size: 32rpx; color: var(--ink); }
.gen-status { font-size: 25rpx; color: var(--ink-3); margin-top: 12rpx; }
.gen-steps { display: flex; gap: 18rpx; margin-top: 32rpx; width: 100%; }
.gen-step {
  flex: 1; height: 70rpx; border-radius: 20rpx;
  background: var(--paper-bg-soft);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.step-label { font-size: 22rpx; color: var(--ink-3); font-weight: 600; }
.gen-step.done {
  background: var(--primary);
  box-shadow: 0 4rpx 14rpx rgba(216, 106, 70, 0.32);
}
.gen-step.done .step-label { color: #fff; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ---------- 隐私政策弹窗 ---------- */
.priv-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(44, 36, 30, 0.55);
  z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  padding: 48rpx;
  box-sizing: border-box;
}
.priv-panel {
  width: 100%;
  max-width: 600rpx;
  background: var(--paper-surface);
  border-radius: 32rpx;
  padding: 48rpx 40rpx 36rpx;
  display: flex; flex-direction: column;
  box-shadow: 0 16rpx 48rpx rgba(44, 36, 30, 0.22);
}
.priv-title {
  font-size: 36rpx;
  color: var(--ink);
  font-weight: 700;
  text-align: center;
  margin-bottom: 28rpx;
}
.priv-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding: 16rpx 20rpx;
  background: var(--paper-bg-soft);
  border-radius: 20rpx;
  margin-bottom: 28rpx;
}
.priv-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}
.priv-dot { color: var(--primary); font-size: 26rpx; line-height: 1.6; font-weight: 700; flex-shrink: 0; }
.priv-item-txt {
  font-size: 24rpx;
  color: var(--ink-2);
  line-height: 1.6;
  flex: 1;
}
.priv-agree-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 20rpx 0 24rpx;
}
.priv-radio {
  width: 40rpx; height: 40rpx;
  border-radius: 50%;
  border: 2rpx solid var(--ink-3);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
}
.priv-radio.on {
  border-color: var(--primary);
  background: var(--primary);
  box-shadow: 0 4rpx 12rpx rgba(216, 106, 70, 0.3);
}
.priv-radio-dot {
  width: 16rpx; height: 16rpx;
  border-radius: 50%;
  background: #fff;
}
.priv-agree-txt {
  font-size: 26rpx;
  color: var(--ink);
  font-weight: 600;
}
.priv-btn-row {
  display: flex;
  gap: 18rpx;
  margin-top: 8rpx;
}
.priv-btn {
  flex: 1;
  height: 88rpx;
  border-radius: 999rpx;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx;
  font-weight: 700;
  transition: all 0.2s;
}
.priv-btn.primary {
  background: var(--primary);
  color: #fff;
  box-shadow: var(--shadow-btn);
}
.priv-btn.primary.disabled {
  opacity: 0.45;
  pointer-events: none;
}
.priv-btn.primary:active {
  background: var(--primary-deep);
  transform: scale(0.97);
}
.priv-btn.ghost {
  background: transparent;
  color: var(--ink-2);
  border: 2rpx solid var(--line);
}
.priv-btn.ghost:active {
  background: var(--paper-bg-soft);
}

/* ---------- H5 隐藏 file input + label（常驻 DOM，iOS Safari 安全策略兼容） ---------- */
.zine-hidden-input {
  position: fixed;
  top: -100px;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
  z-index: -1;
}
.zine-file-label {
  position: fixed;
  top: -100px;
  left: 0;
  width: 1px;
  height: 1px;
  opacity: 0;
  z-index: -1;
}

/* ---------- 图片选择居中弹窗 ---------- */
.sheet-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(44, 36, 30, 0.45);
  z-index: 9998;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sheet-panel {
  position: relative;
  z-index: 9999;
  background: var(--paper-surface);
  border-radius: 32rpx;
  padding: 40rpx 36rpx 32rpx;
  width: 520rpx;
  max-width: 88vw;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
  box-shadow: 0 12rpx 48rpx rgba(44, 36, 30, 0.2);
}
.sheet-handle {
  width: 72rpx;
  height: 8rpx;
  border-radius: 999rpx;
  background: var(--line);
  margin: 0 auto 12rpx;
}
.sheet-title {
  font-size: 30rpx;
  color: var(--ink);
  font-weight: 700;
  text-align: center;
  margin-bottom: 4rpx;
}
.sheet-btns {
  display: flex;
  gap: 24rpx;
  padding: 12rpx 0 4rpx;
}
.sheet-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  padding: 36rpx 20rpx;
  border-radius: 32rpx;
  background: var(--paper-bg-soft);
  border: 2rpx solid var(--line);
  transition: all 0.15s;
}
.sheet-btn:active {
  transform: scale(0.97);
  background: var(--primary-soft);
  border-color: var(--primary-line);
}
.sheet-ico {
  width: 100rpx; height: 100rpx;
  border-radius: 50%;
  background: #fff;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow-soft);
}
.sheet-btn-txt {
  font-size: 28rpx;
  color: var(--ink);
  font-weight: 700;
}
.sheet-cancel {
  margin-top: 4rpx;
  height: 88rpx;
  border-radius: 999rpx;
  background: var(--paper-bg-soft);
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx;
  color: var(--ink-2);
  font-weight: 700;
  transition: all 0.15s;
}
.sheet-cancel:active {
  background: var(--line);
  color: #fff;
  transform: scale(0.98);
}
</style>
