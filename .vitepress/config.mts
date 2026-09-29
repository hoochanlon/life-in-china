import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitepress'
import { withMermaid } from 'vitepress-plugin-mermaid'
import { defineTeekConfig } from 'vitepress-theme-teek/config'
import { sidebarHotReload } from './plugins/sidebar-hot-reload'
import { buildSidebar } from './sidebar'

// Vite root = srcDir(docs/)；publicDir 相对 root，须绝对路径才能指回仓库根 public/
const rootPublicDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../public',
)

const teekConfig = defineTeekConfig({
  teekHome: false,
  vpHome: true,
  homeCardListPosition: false,
  sidebarTrigger: true,
  articleUpdate: {
    enabled: false,
  },
  toComment: {
    enabled: false,
  },
  themeEnhance: {
    layoutSwitch: {
      // 默认「全部展开」：侧栏 + 正文占满屏宽
      defaultMode: 'fullWidth',
      disableHelp: true,
      disableDocMaxWidthHelp: true,
      disablePageMaxWidthHelp: true,
    },
    themeColor: {
      disableHelp: true,
    },
    spotlight: {
      disableHelp: true,
    },
  },
  footerInfo: {
    copyright: {
      createYear: 2026,
      suffix: 'hoochanlon',
    },
  },
  codeBlock: {
    collapseHeight: 700,
  },
  articleAnalyze: {
    showAuthor: false,
    showCreateDate: true,
    showUpdateDate: false,
    dateFormat: 'yyyy-MM-dd',
  },
  docAnalysis: {
    wordCount: true,
    readingTime: true,
  },
  vitePlugins: {
    sidebar: false,
    permalink: false,
    mdH1: false,
  },
})

export default withMermaid(
  defineConfig({
    extends: teekConfig,
    title: "个体刻度：中国见闻录",
    description: "Observations of Life in China — 以有限个体，观测无限时代潮汐",
    lang: 'zh-CN',
    lastUpdated: true,
    // 正文与章节只放在 docs/；配置与主题仍在仓库根 .vitepress/
    srcDir: 'docs',
    // GitHub Pages 项目站：必须与仓库名一致，本地也要打开带 base 的路径
    base: '/life-in-china/',
    ignoreDeadLinks: true,

    vite: {
      // 默认 docs/public；改指仓库根 public/，与正文 docs/ 分离
      publicDir: rootPublicDir,
      plugins: [sidebarHotReload()],
    },

    themeConfig: {
      logo: '/icons/feather.svg',
      nav: [
        {
          text: '<span class="nav-home-icon" aria-hidden="true"></span><span class="visually-hidden">首页</span>',
          link: '/',
        },
      ],

      socialLinks: [
        { icon: 'github', link: 'https://github.com/hoochanlon/life-in-china' }
      ],

      // 每次 config 加载时重扫文档树（结构变更由 sidebar-hot-reload 触发 restart）
      sidebar: buildSidebar(),

      search: {
        provider: 'local',
        options: {
          translations: {
            button: {
              buttonText: '搜索',
              buttonAriaLabel: '搜索文档',
            },
          },
        },
      },

      lastUpdated: {
        text: '上次更新时间',
        formatOptions: {
          dateStyle: 'short',
          timeStyle: 'short',
        },
      },
      editLink: {
        // :path 相对 srcDir，GitHub 上真实路径在 docs/ 下
        pattern: 'https://github.com/hoochanlon/life-in-china/edit/main/docs/:path',
        text: '在 GitHub 上编辑此页',
      },
      docFooter: {
        prev: '上一页',
        next: '下一页',
      },
    },

    markdown: {
      lineNumbers: true
    },

    mermaid: {
    }
  }),
)
