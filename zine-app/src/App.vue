<script>
import store from '@/store/index.js'

export default {
  onLaunch: function () {
    // 读取本地存储的服务商配置 / 服务器地址
    store.load()
    // 读取登录态（30 天免登录由后端 token 有效期保证）
    store.loadAuth && store.loadAuth()
    // 未登录：登录页作为第一个页面
    // 通过 setTimeout 延迟，避免与首页 onLoad 竞争
    setTimeout(() => {
      if (!store.token) {
        uni.reLaunch({ url: '/pages/login/login' })
      }
    }, 0)
  },
  onShow: function () {},
  onHide: function () {},
}
</script>

<style lang="scss">
@import '@/styles/theme.scss';

/* 全局基础滚动与页面背景 */
page {
  background-color: var(--bg);
}
</style>
