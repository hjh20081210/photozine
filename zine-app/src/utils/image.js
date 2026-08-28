/**
 * 图片选择与 Base64 转换（跨 iOS / Android / HarmonyOS / H5 / 小程序）。
 * 返回 Promise<{ base64, mime, size }>，base64 为完整 data URI。
 *
 * 各平台策略（已修复「一直显示正在打开」卡死问题）：
 *  - H5         ：原生 <input type="file">（100% 可用，相册+相机都通过浏览器原生菜单）
 *                 → 加 30s 超时兜底，避免 loading 永远不消失
 *  - App(iOS/安卓/鸿蒙)：
 *      ✓ 不再预先串行 uni.authorize（部分真机回调链会断，导致 Promise 永久挂起）
 *      ✓ 直接调用 uni.chooseImage → uni-app 自己会在需要时弹系统授权弹窗
 *      ✓ 用户点"允许"后直接弹出相册/相机选择器
 *      ✓ 如果 chooseImage 自己报 auth deny，再弹引导去设置页
 *      ✓ 全局 30s 超时：不论哪里卡住，自动关闭 loading + 告诉用户取消重试
 *  - 小程序  ：前置 authorize + chooseMedia 双保险
 *
 * 任何平台，用户取消选择统一抛 { message: 'CANCEL' }，上层静默不打扰。
 */

const PICK_TIMEOUT_MS = 30000

export function pickImage(options = {}) {
  const preferredSource = options && options.sourceType ? options.sourceType : null
  return new Promise((resolve, reject) => {
    let settled = false
    let timer = null
    const done = (fn, arg) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      try { uni.hideLoading() } catch (e) {}
      fn(arg)
    }
    // ========== 超时兜底：30s 还不返回就取消，避免 loading 永远卡着 ==========
    timer = setTimeout(() => {
      done(reject, new Error('TIMEOUT'))
    }, PICK_TIMEOUT_MS)

    // #ifdef H5
    pickImageH5(
      (r) => done(resolve, r),
      (e) => done(reject, e),
      preferredSource,
    )
    // #endif

    // #ifndef H5
    pickImageNative(
      (r) => done(resolve, r),
      (e) => done(reject, e),
      preferredSource,
    )
    // #endif
  })
}

// ========== H5：原生 <input type="file"> ==========
// #ifdef H5
function pickImageH5(resolve, reject, preferredSource) {
  if (typeof document === 'undefined') {
    pickImageUni(resolve, reject, preferredSource)
    return
  }
  const isCamera = Array.isArray(preferredSource) && preferredSource[0] === 'camera'

  const trigger = () => {
    let input
    try {
      input = document.createElement('input')
      input.type = 'file'
      input.accept = 'image/*'
      input.multiple = false
      if (isCamera) {
        // iOS Safari / 部分安卓 WebView 必需用 capture 属性 + capture 属性能唤起相机
        input.setAttribute('capture', 'environment')
        try { input.capture = 'environment' } catch (e) {}
      }
      // album 模式：不设 capture，让浏览器弹出「相册/文件/相机」选择菜单
    } catch (e) {
      // 构造 input 失败 → 走 uni 兜底
      pickImageUni(resolve, reject, preferredSource)
      return
    }

    let handled = false
    const cleanup = () => {
      if (handled) return
      handled = true
      try { if (input && input.parentNode) input.parentNode.removeChild(input) } catch (e) {}
    }

    input.addEventListener('change', (ev) => {
      const file = (ev.target && ev.target.files && ev.target.files[0]) || null
      if (!file) { cleanup(); reject(new Error('CANCEL')); return }
      cleanup()
      fileToResult(file).then(resolve).catch(reject)
    }, { once: true })

    try {
      input.addEventListener('cancel', () => { cleanup(); reject(new Error('CANCEL')) }, { once: true })
    } catch (e) {}

    // 关键：input 必须挂在 document.body 上，position 不能是 absolute off-screen（iOS 会拒）
    input.style.cssText = 'position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);width:1px;height:1px;opacity:0.001;z-index:9999;'
    document.body.appendChild(input)

    try {
      // 必须在用户手势的同步调用栈里 click()，否则被浏览器拦截
      input.click()
    } catch (e) {
      cleanup()
      pickImageUni(resolve, reject, preferredSource)
      return
    }

    // 60s 兜底
    setTimeout(() => {
      if (handled) return
      if (input && input.files && input.files[0]) {
        cleanup(); fileToResult(input.files[0]).then(resolve).catch(reject)
      } else {
        cleanup(); reject(new Error('CANCEL'))
      }
    }, 60000)
  }

  // ⚠️ 不能用 async/await —— 移动端浏览器必须保证 input.click()
  // 在用户手势同一同步调用栈中执行，否则会被浏览器安全策略拦截
  // 关闭弹窗会让 Vue 排一个微任务重新渲染，所以我们要等一帧再 click()，
  // 但又不能 setTimeout(0)（会丢用户激活态）。
  // 解法：用 requestAnimationFrame（保激活态）+ 立刻 attach input → click
  if (typeof window === 'undefined') {
    trigger()
  } else if (isCamera) {
    // 相机：直接同步 click，无需等弹窗关闭（用户激活态最稳）
    trigger()
  } else {
    // 相册：等弹窗关闭动画（rAF 一次）后再 click，仍然在激活态窗口内
    if (typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => trigger())
    } else {
      setTimeout(trigger, 16)
    }
  }
}

function fileToResult(file) {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('未获取到图片')); return }
    const fr = new FileReader()
    fr.onload = () => {
      const dataUrl = String(fr.result || '')
      const mime = file.type || guessMimeFromDataUrl(dataUrl) || 'image/jpeg'
      resolve({
        base64: dataUrl,
        mime,
        size: typeof file.size === 'number' ? file.size : 0,
      })
    }
    fr.onerror = () => reject(new Error('读取图片失败'))
    fr.readAsDataURL(file)
  })
}

function guessMimeFromDataUrl(dataUrl) {
  const m = String(dataUrl || '').match(/^data:([^;]+);base64,/)
  return m ? m[1] : ''
}
// #endif

// ========== 非 H5：App + 小程序 入口 ==========
// #ifndef H5
function pickImageNative(resolve, reject, preferredSource) {
  // App（iOS/安卓/鸿蒙）：不再 pre-authorize，直接 chooseImage
  // 预先 authorize 的串行回调在部分真机（特别是鸿蒙/旧安卓）上不稳定，会卡死
  // chooseImage 本身就会弹系统权限请求，用户点"允许"后直接进入相册选择
  // #ifdef APP-PLUS
  pickImageUni(resolve, reject, preferredSource)
  // #endif

  // 小程序：前置 authorize + chooseMedia 双保险
  // #ifdef MP
  requestPickPermissions()
    .then(() => pickImageUni(resolve, reject, preferredSource))
    .catch((err) => {
      if (err && err.message === 'CANCEL') {
        reject(new Error('CANCEL'))
      } else if (err && err.__permissionDenied) {
        showPermissionGuide(err.scope, err.title, err.tip, reject)
      } else {
        reject(err)
      }
    })
  // #endif
}

// ========== 仅小程序用：前置申请相册+相机权限 ==========
// #ifdef MP
function requestPickPermissions() {
  return new Promise((resolve, reject) => {
    const scopes = [
      { key: 'scope.camera', title: '相机权限', tip: '需要相机权限才能拍摄照片。' },
      { key: 'scope.writePhotosAlbum', title: '相册权限', tip: '需要相册权限才能选择照片。' },
    ]
    if (typeof uni.authorize !== 'function') { resolve(); return }
    runAuthorizeSeq(scopes, 0, resolve, reject)
  })
}

function runAuthorizeSeq(scopes, i, resolve, reject) {
  if (i >= scopes.length) { resolve(); return }
  const s = scopes[i]
  uni.authorize({
    scope: s.key,
    success() { runAuthorizeSeq(scopes, i + 1, resolve, reject) },
    fail(err) {
      const e = new Error('PERMISSION_DENIED')
      e.__permissionDenied = true
      e.scope = s.key
      e.title = s.title
      e.tip = s.tip
      reject(e)
    },
  })
}
// #endif

/**
 * 权限被拒引导弹窗：告诉用户去设置页手动打开。
 * 设置页返回后直接 CANCEL，用户再次点击按钮自动重试。
 */
function showPermissionGuide(scope, title, tip, reject) {
  try {
    uni.showModal({
      title: `需要${title || '权限'}`,
      content: `${tip || '请开启对应权限以继续使用'}`,
      confirmText: '去设置',
      cancelText: '取消',
      success(r) {
        if (r.confirm && typeof uni.openSetting === 'function') {
          uni.openSetting({
            success() { reject(new Error('CANCEL')) },
            fail() { reject(new Error('CANCEL')) },
          })
        } else {
          reject(new Error('CANCEL'))
        }
      },
      fail() { reject(new Error('CANCEL')) },
    })
  } catch (e) {
    reject(new Error('CANCEL'))
  }
}
// #endif

// ========== uni 原生：chooseImage + chooseMedia 双保险 ==========
function pickImageUni(resolve, reject, preferredSource) {
  const sourceType = (Array.isArray(preferredSource) && preferredSource.length)
    ? preferredSource
    : ['album', 'camera']

  const onChosen = (path, size) => {
    if (!path) { reject(new Error('未获取到图片')); return }
    imageToBase64(path)
      .then((r) => {
        if (typeof size === 'number') r.size = size
        resolve(r)
      })
      .catch(reject)
  }

  const isCancel = (err) =>
    err && typeof err.errMsg === 'string' && /cancel|abort/i.test(err.errMsg)
  const isAuthErr = (err) =>
    err && typeof err.errMsg === 'string' && /(auth\s*deny|permission|权限|auth\s*fail|not\s*auth|denied)/i.test(err.errMsg)

  const tryChooseImage = (fallback) => {
    if (typeof uni.chooseImage !== 'function') return fallback && fallback()
    uni.chooseImage({
      count: 1,
      sizeType: ['original', 'compressed'],
      sourceType,
      success(res) {
        const path =
          (res.tempFilePaths && res.tempFilePaths[0]) ||
          (res.tempFiles && res.tempFiles[0] && (res.tempFiles[0].path || res.tempFiles[0].tempFilePath))
        const size = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].size
        onChosen(path, size)
      },
      fail(err) {
        if (isCancel(err)) { reject(new Error('CANCEL')); return }
        if (isAuthErr(err)) {
          // ⚠️ 权限被拒 → 弹引导去设置页
          const e = new Error('PERMISSION_DENIED')
          e.__permissionDenied = true
          e.scope = 'scope.photoLibrary'
          e.title = '相册或相机权限'
          e.tip = '需要相册与相机权限才能选择或拍摄照片。请到设置页手动开启。'
          // 直接走 showPermissionGuide（非H5才有）
          if (typeof showPermissionGuide === 'function') {
            showPermissionGuide(e.scope, e.title, e.tip, reject)
          } else {
            reject(e)
          }
          return
        }
        if (fallback) fallback()
        else reject(new Error('选择失败：' + (err && err.errMsg ? err.errMsg : '未知错误')))
      },
    })
  }

  const tryChooseMedia = () => {
    if (typeof uni.chooseMedia !== 'function') {
      reject(new Error('当前环境不支持选择图片'))
      return
    }
    uni.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType,
      success(res) {
        const tf = res.tempFiles && res.tempFiles[0]
        const path = tf ? (tf.tempFilePath || tf.path) : null
        onChosen(path, tf && tf.size)
      },
      fail(err) {
        if (isCancel(err)) reject(new Error('CANCEL'))
        else if (isAuthErr(err)) {
          const e = new Error('PERMISSION_DENIED')
          e.__permissionDenied = true
          e.scope = 'scope.photoLibrary'
          e.title = '相册或相机权限'
          e.tip = '需要相册与相机权限才能选择或拍摄照片。请到设置页手动开启。'
          if (typeof showPermissionGuide === 'function') {
            showPermissionGuide(e.scope, e.title, e.tip, reject)
          } else {
            reject(e)
          }
        } else reject(new Error('选择图片失败'))
      },
    })
  }

  tryChooseImage(tryChooseMedia)
}

// ========== 工具函数 ==========
function guessMime(path, fallback) {
  const ext = (path || '').split('.').pop().toLowerCase()
  if (ext === 'png') return 'image/png'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'gif') return 'image/gif'
  if (ext === 'heic' || ext === 'heif') return 'image/heic'
  return fallback || 'image/jpeg'
}

function fromDataUrl(dataUrl, size) {
  const mime = ((dataUrl.split(';')[0] || 'image/jpeg').replace('data:', '') || 'image/jpeg')
  const r = { base64: dataUrl, mime }
  if (typeof size === 'number') r.size = size
  return r
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(fr.result)
    fr.onerror = () => reject(new Error('读取图片失败'))
    fr.readAsDataURL(blob)
  })
}

// ========== imageToBase64 各平台实现 ==========

// #ifdef H5
export function imageToBase64(path) {
  return new Promise((resolve, reject) => {
    if (typeof path === 'string' && path.indexOf('data:') === 0) {
      resolve(fromDataUrl(path)); return
    }
    fetch(path)
      .then((r) => r.blob())
      .then(readBlobAsDataUrl)
      .then((dataUrl) => resolve(fromDataUrl(dataUrl)))
      .catch(() => canvasToDataUrl(path).then(resolve).catch(reject))
  })
}
function canvasToDataUrl(path) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const MAX = 1600
        const scale = Math.min(1, MAX / Math.max(img.width, img.height))
        canvas.width = Math.max(1, Math.round(img.width * scale))
        canvas.height = Math.max(1, Math.round(img.height * scale))
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(fromDataUrl(canvas.toDataURL('image/jpeg', 0.85)))
      } catch (e) { reject(e) }
    }
    img.onerror = () => reject(new Error('读取图片失败'))
    img.src = path
  })
}
// #endif

// #ifdef APP-PLUS
export function imageToBase64(path) {
  return new Promise((resolve, reject) => {
    if (typeof plus !== 'undefined' && plus.io) {
      let p = path
      if (/^file:\/\//.test(p) && plus.io.convertLocalFileSystemURL) {
        try { p = plus.io.convertLocalFileSystemURL(p) } catch (e) {}
      }
      plus.io.resolveLocalFileSystemURL(
        p,
        (entry) => {
          entry.file(
            (file) => {
              const reader = new plus.io.FileReader()
              reader.onloadend = () => {
                const dataUrl = reader.result || ''
                const mime = (file && file.type) || guessMime(path, 'image/jpeg')
                resolve({
                  base64: dataUrl,
                  mime,
                  size: (file && typeof file.size === 'number') ? file.size : 0,
                })
              }
              reader.onerror = () => reject(new Error('读取图片失败'))
              try { reader.readAsDataURL(file) } catch (e) { reject(e) }
            },
            () => fsToDataUrl(path).then(resolve).catch(reject)
          )
        },
        () => fsToDataUrl(path).then(resolve).catch(reject)
      )
    } else if (typeof uni.getFileSystemManager === 'function') {
      fsToDataUrl(path).then(resolve).catch(reject)
    } else {
      reject(new Error('当前环境不支持读取图片'))
    }
  })
}
// #endif

// #ifndef H5
// #ifndef APP-PLUS
export function imageToBase64(path) {
  return fsToDataUrl(path)
}
// #endif
// #endif

function fsToDataUrl(path) {
  return new Promise((resolve, reject) => {
    const fsm = uni.getFileSystemManager && uni.getFileSystemManager()
    if (!fsm || typeof fsm.readFile !== 'function') {
      reject(new Error('当前环境不支持读取图片')); return
    }
    fsm.readFile({
      filePath: path,
      encoding: 'base64',
      success(r) {
        const mime = guessMime(path, 'image/jpeg')
        resolve({
          base64: 'data:' + mime + ';base64,' + (r.data || ''),
          mime,
        })
      },
      fail() { reject(new Error('读取图片失败')) },
    })
  })
}
