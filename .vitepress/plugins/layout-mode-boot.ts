import type { Plugin } from 'vite'
import { LAYOUT_MODE_BOOT_SCRIPT } from '../theme/layout-mode-boot'

/** 首屏 HTML 绘制前写入 Teek layout-mode / 宽度变量，避免刷新残影 */
export const layoutModeBoot = (): Plugin => ({
  name: 'layout-mode-boot',
  transformIndexHtml(html) {
    if (html.includes('data-layout-mode-boot')) return html
    return html.replace(
      /<head[^>]*>/i,
      (open) =>
        `${open}\n    <script data-layout-mode-boot>${LAYOUT_MODE_BOOT_SCRIPT}</script>`,
    )
  },
})
