import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin, ViteDevServer } from 'vite'

/**
 * 文档树结构变更 → 轻触 sidebar 模块，走 VitePress 官方重建链路：
 *   configDep change → disposeMdItInstance + clearCache + recreateServer()
 *
 * 不能用 server.restart()：MiniSearch 索引未 dispose，会报
 *   duplicate ID … / server restart failed
 * 导致侧边栏与序号永远不更新。
 *
 * 仅改 md 正文：VitePress 自带 HMR，本插件不介入。
 */
const STRUCTURAL_EVENTS = new Set([
  'add',
  'unlink',
  'addDir',
  'unlinkDir',
])

const IGNORED_SEGMENTS = new Set([
  'node_modules',
  '.git',
  '.vitepress',
  '.github',
  'public',
  'dist',
])

// 与 config.mts 同级的 sidebar 模块（已被 import，属于 configDeps）
const SIDEBAR_MODULE = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../sidebar.ts',
)

const isIgnoredRel = (rel: string): boolean => {
  if (!rel || rel.startsWith('..')) return true
  const parts = rel.split(path.sep)
  return parts.some((p) => IGNORED_SEGMENTS.has(p) || p === '.DS_Store')
}

const isStructureRelevant = (event: string, file: string): boolean => {
  if (!STRUCTURAL_EVENTS.has(event)) return false

  // 忽略我们自己 touch 的文件，防止递归
  if (path.resolve(file) === SIDEBAR_MODULE) return false

  if (event === 'addDir' || event === 'unlinkDir') return true
  return file.endsWith('.md')
}

/** 更新 mtime，触发 VitePress 对 configDep 的官方重建 */
const bumpSidebarModule = () => {
  const now = new Date()
  fs.utimesSync(SIDEBAR_MODULE, now, now)
}

export const sidebarHotReload = (): Plugin => {
  let timer: ReturnType<typeof setTimeout> | undefined
  let pending = false

  const schedule = (server: ViteDevServer, reason: string) => {
    clearTimeout(timer)
    // 批量重命名会连发 add/unlink，合并一次
    timer = setTimeout(() => {
      if (pending) return
      pending = true

      console.log(
        `\n[sidebar-hot-reload] ${reason} → 触发配置重建（刷新侧边栏）\n`,
      )

      try {
        bumpSidebarModule()
      } catch (err) {
        console.error('[sidebar-hot-reload] touch sidebar 失败：', err)
        server.config.logger.error(
          '请在终端按 r 手动重启，或重新执行 npm run docs:dev',
        )
      } finally {
        // 重建完成后才允许下一次；给 recreate 留时间
        setTimeout(() => {
          pending = false
        }, 2000)
      }
    }, 600)
  }

  return {
    name: 'sidebar-structure-hot-reload',
    apply: 'serve',
    configureServer(server) {
      const root = server.config.root

      // 确保 sidebar.ts 在 watcher 里（作为 configDep 本应已在，双保险）
      if (fs.existsSync(SIDEBAR_MODULE)) {
        server.watcher.add(SIDEBAR_MODULE)
      }

      server.watcher.on('all', (event, file) => {
        if (!isStructureRelevant(event, file)) return

        const rel = path.relative(root, file)
        if (isIgnoredRel(rel)) return

        schedule(server, `${event} ${rel}`)
      })
    },
  }
}
