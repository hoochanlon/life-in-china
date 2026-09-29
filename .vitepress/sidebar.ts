import { generateSidebar } from 'vitepress-sidebar'

export type SidebarItem = {
  text?: string
  link?: string
  items?: SidebarItem[]
  [key: string]: unknown
}

// VitePress prev/next 依赖 isActive(relativePath, link)；link 必须带前导 /
const withLeadingSlash = (items: SidebarItem[]): SidebarItem[] =>
  items.map((item) => ({
    ...item,
    ...(item.link && !item.link.startsWith('/')
      ? { link: `/${item.link}` }
      : {}),
    ...(item.items ? { items: withLeadingSlash(item.items) } : {}),
  }))

/** 终章排序键：大于任意「第 N 章」，固定垫底 */
const CHAPTER_ORDER_LAST = 1_000_000

/** 中文数字 → 阿拉伯数字（仅覆盖章节常用范围；终 = 最后） */
const CN_DIGIT: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  终: CHAPTER_ORDER_LAST,
}

const cnNumeralToInt = (raw: string): number | null => {
  // 「终」「最终」→ 最后一章
  if (raw === '终' || raw === '最终') return CHAPTER_ORDER_LAST

  if (/^\d+$/.test(raw)) return Number(raw)
  if (raw === '十') return 10
  if (raw.length === 1 && raw in CN_DIGIT) return CN_DIGIT[raw]

  // 十一～十九
  if (raw.startsWith('十') && raw.length === 2) {
    const ones = CN_DIGIT[raw[1]]
    return ones == null ? null : 10 + ones
  }
  // 二十、二十一…
  if (raw.includes('十')) {
    const [tens, ones = ''] = raw.split('十')
    const t = tens ? CN_DIGIT[tens] : 1
    const o = ones ? CN_DIGIT[ones] : 0
    if (t == null || o == null) return null
    return t * 10 + o
  }
  return null
}

/**
 * 从标题/路径提取排序键：
 * - 「最终章」「终章」「第终章」→ 最后
 * - 「第N章」→ N
 * - 路径里的「01.xxx」→ 1
 * - 否则极大，排到后面再按文本
 */
const sortKey = (item: SidebarItem): [number, string] => {
  const label = item.text ?? item.link ?? ''

  // 最终章 / 终章 / 第终章（可无「第」）
  if (/(?:最终|终)章/.test(label)) {
    return [CHAPTER_ORDER_LAST, label]
  }

  const chapter = label.match(
    /第([一二三四五六七八九十百千零〇两终\d]+|最终)章/,
  )
  if (chapter) {
    const n = cnNumeralToInt(chapter[1])
    if (n != null) return [n, label]
  }

  const fromLink = (item.link ?? '').match(/(?:^|\/)(\d+)[.\-_]/)
  if (fromLink) return [Number(fromLink[1]), label]

  const fromText = label.match(/^(\d+)[.\-_\s]/)
  if (fromText) return [Number(fromText[1]), label]

  return [Number.MAX_SAFE_INTEGER, label]
}

const byChapterThenName = (a: SidebarItem, b: SidebarItem): number => {
  const [ka, sa] = sortKey(a)
  const [kb, sb] = sortKey(b)
  if (ka !== kb) return ka - kb
  return sa.localeCompare(sb, 'zh')
}

const sortSidebarTree = (items: SidebarItem[]): SidebarItem[] =>
  [...items]
    .map((item) => ({
      ...item,
      ...(item.items ? { items: sortSidebarTree(item.items) } : {}),
    }))
    .sort(byChapterThenName)

export const sidebarScanOptions = {
  // 只扫 docs/，侧边栏直接是「第 N 章」，不再多一层 docs
  documentRootPath: 'docs',
  scanStartPath: '',
  resolvePath: '/',
  useTitleFromFileHeading: true,
  useTitleFromFrontmatter: true,
  frontmatterTitleFieldName: 'title',
  useFolderTitleFromIndexFile: false,
  useFolderLinkFromIndexFile: false,
  hyphenToSpace: true,
  underscoreToSpace: true,
  // 空章节目录也要出现在侧边栏
  includeEmptyFolder: true,
  excludeByGlobPattern: ['index.md'],
  // 关闭库自带排序：中文「一/二/三」按拼音会变成 二→三→一
  sortMenusOrderNumericallyFromLink: false,
  sortMenusByName: false,
  sortMenusByFrontmatterOrder: false,
  sortMenusOrderByDescending: false,
  collapsed: false,
  capitalizeFirst: false,
  capitalizeEachWords: false,
} as const

export const buildSidebar = (): SidebarItem[] => {
  const raw = generateSidebar(sidebarScanOptions) as SidebarItem[]
  return sortSidebarTree(withLeadingSlash(raw))
}
