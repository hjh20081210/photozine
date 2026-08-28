import store from '@/store/index.js'

/**
 * 轻量请求封装：以全局服务器地址为基址，JSON 收发。
 *
 * 静默策略：失败/超时只 reject，不在控制台刷错误，不弹任何 toast。
 * 因为默认 serverUrl 是 127.0.0.1:8080，没有后端时频繁报错会打扰用户。
 * 业务侧 try/catch 静默处理即可。
 */
export function request(path, { method = 'GET', data = null, timeout = 15000, silent = true } = {}) {
  return new Promise((resolve, reject) => {
    const base = (store.serverUrl || '').replace(/\/+$/, '')
    // #ifndef H5
    // 非 H5 端必须配置服务器地址
    if (!base) {
      reject(new Error('未配置服务器地址'))
      return
    }
    // #endif
    uni.request({
      url: base + path,
      method,
      data,
      timeout,
      header: { 'Content-Type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data)
        } else {
          reject(new Error(`请求失败 (${res.statusCode})`))
        }
      },
      fail() {
        // silent：连不上/超时一律静默 reject
        reject(new Error('OFFLINE'))
      },
    })
  })
}
