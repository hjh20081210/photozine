<script>
import store from '@/store/index.js'

export default {
  onLaunch: function () {
    // 读取本地存储的服务商配置 / 服务器地址
    store.load()
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
