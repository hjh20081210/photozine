/**
 * 图片选择 + 上传（参考 RuoYi-SpringBoot3-UniApp 的 chooseAndUploadImage 设计）
 *
 * 三端统一策略：全部走 uni.chooseImage / uni.chooseMedia 原生 API。
 * UniApp H5 模式下 uni.chooseImage 已内置浏览器兼容处理（包括 iOS Safari），
 * 不需要自己写 input ref 桥接。
 *
 * 用户取消统一抛 { message: 'CANCEL' }，上层静默不打扰。
 */

const PICK_TIMEOUT_MS = 60000

/**
 * 选择图片
 * @param {Object} options
 * @param {Array<'album'|'camera'>} [options.sourceType] - 期望来源
 * @param {number} [options.count=1] - 最多选几张
 * @returns {Promise<{path:string, size:number, mime:string, file?:File}>}
 */
export function chooseImage(options = {}) {
  return new Promise((resolve, reject) => {
    const sourceType = (Array.isArray(options.sourceType) && options.sourceType.length)
      ? options.sourceType
      : ['album', 'camera']
    const count = options.count || 1
    let settled = false
    const timer = setTimeout(() => {
      if (!settled) { settled = true; reject(new Error('TIMEOUT')) }
    }, PICK_TIMEOUT_MS)

    // 优先用 chooseMedia（较新，支持 count 等参数）
    if (typeof uni.chooseMedia === 'function') {
      uni.chooseMedia({
        count,
        mediaType: ['image'],
        sourceType,
        sizeType: ['original', 'compressed'],
        success(res) {
          if (settled) return; settled = true; clearTimeout(timer)
          const tf = res.tempFiles && res.tempFiles[0]
          if (!tf) { reject(new Error('CANCEL')); return }
          resolve({
            path: tf.tempFilePath || tf.path,
            size: tf.size,
            mime: 'image/jpeg',
            file: null,
          })
        },
        fail(err) {
          if (settled) return; settled = true; clearTimeout(timer)
          if (isCancelErr(err)) { reject(new Error('CANCEL')); return }
          reject(new Error((err && err.errMsg) || '选择图片失败'))
        },
      })
    } else if (typeof uni.chooseImage === 'function') {
      uni.chooseImage({
        count,
        sizeType: ['original', 'compressed'],
        sourceType,
        success(res) {
          if (settled) return; settled = true; clearTimeout(timer)
          const path = (res.tempFilePaths && res.tempFilePaths[0])
            || (res.tempFiles && res.tempFiles[0] && (res.tempFiles[0].path || res.tempFiles[0].tempFilePath))
          const size = res.tempFiles && res.tempFiles[0] && res.tempFiles[0].size
          if (!path) { reject(new Error('CANCEL')); return }
          resolve({ path, size, mime: 'image/jpeg', file: null })
        },
        fail(err) {
          if (settled) return; settled = true; clearTimeout(timer)
          if (isCancelErr(err)) { reject(new Error('CANCEL')); return }
          reject(new Error((err && err.errMsg) || '选择图片失败'))
        },
      })
    } else {
      clearTimeout(timer)
      reject(new Error('当前环境不支持选择图片'))
    }
  })
}

/**
 * 选择 + 上传 一站式
 */
export function chooseAndUploadImage(options) {
  const { uploadUrl, onProgress, sourceType, name = 'file', header, formData } = options
  return new Promise((resolve, reject) => {
    let timer = setTimeout(() => reject(new Error('TIMEOUT')), PICK_TIMEOUT_MS)
    chooseImage({ sourceType })
      .then((fileObj) => {
        if (!fileObj) { clearTimeout(timer); reject(new Error('CANCEL')); return }
        return doUpload({ file: fileObj, uploadUrl, header, formData, name, onProgress })
      })
      .then((res) => { clearTimeout(timer); resolve(res) })
      .catch((e) => { clearTimeout(timer); reject(e) })
  })
}

function isCancelErr(err) {
  return err && typeof err.errMsg === 'string' && /cancel|abort/i.test(err.errMsg)
}

// =================== 上传 ===================
function doUpload({ file, uploadUrl, header, formData, name, onProgress }) {
  if (file && file.path) {
    return uploadByUni({ filePath: file.path, uploadUrl, header, formData, name, onProgress })
  }
  if (file && file.file) {
    return uploadByFormData({ fileObj: file.file, uploadUrl, header, formData, name, onProgress })
  }
  return Promise.reject(new Error('无可上传的文件'))
}

function uploadByFormData({ fileObj, uploadUrl, header, formData, name, onProgress }) {
  return new Promise((resolve, reject) => {
    const fd = new FormData()
    fd.append(name, fileObj)
    if (formData) {
      Object.keys(formData).forEach((k) => fd.append(k, formData[k]))
    }
    const xhr = new XMLHttpRequest()
    xhr.open('POST', uploadUrl)
    if (header) {
      Object.keys(header).forEach((k) => xhr.setRequestHeader(k, header[k]))
    }
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText)
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ url: data.url || data.data || '', raw: data })
        } else {
          reject(new Error((data && data.msg) || `上传失败 (${xhr.status})`))
        }
      } catch (e) {
        reject(new Error('解析响应失败'))
      }
    }
    xhr.onerror = () => reject(new Error('网络错误'))
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
      }
    }
    xhr.send(fd)
  })
}

function uploadByUni({ filePath, uploadUrl, header, formData, name, onProgress }) {
  return new Promise((resolve, reject) => {
    const task = uni.uploadFile({
      url: uploadUrl,
      filePath,
      name,
      header,
      formData,
      success(res) {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ url: data.url || data.data || '', raw: data })
          } else {
            reject(new Error((data && data.msg) || `上传失败 (${res.statusCode})`))
          }
        } catch (e) {
          reject(new Error('解析响应失败'))
        }
      },
      fail(err) {
        reject(new Error((err && err.errMsg) || '上传失败'))
      },
    })
    if (task && task.onProgressUpdate && onProgress) {
      task.onProgressUpdate((res) => onProgress(res.progress))
    }
  })
}