import type { Router } from 'vitepress'

const TITLE_SELECTOR = '[title], [data-tip]'
const OUTLINE_SELECTOR = '.VPDocAside, .VPDocOutlineItem, .outline-link, .tk-aside-outline-item'

const isOutline = (el: HTMLElement) => Boolean(el.closest(OUTLINE_SELECTOR))

const isTruncated = (el: HTMLElement) => el.scrollWidth - el.clientWidth > 1

const visibleText = (el: HTMLElement) => el.innerText.replace(/\s+/g, ' ').trim()

const stripEl = (el: HTMLElement) => {
  if (isOutline(el) && isTruncated(el)) {
    const text =
      el.getAttribute('title') || el.getAttribute('data-tip') || visibleText(el)
    if (text) {
      if (el.getAttribute('data-tip') !== text) el.setAttribute('data-tip', text)
      if (el.hasAttribute('title')) el.removeAttribute('title')
    }
    return
  }

  if (el.hasAttribute('title')) el.removeAttribute('title')
  if (el.hasAttribute('data-tip')) el.removeAttribute('data-tip')
}

const stripTitles = (root: ParentNode = document) => {
  if (root instanceof HTMLElement) stripEl(root)
  root.querySelectorAll<HTMLElement>(TITLE_SELECTOR).forEach(stripEl)
}

const createTipEl = () => {
  const el = document.createElement('div')
  el.className = 'wiki-tip'
  el.setAttribute('role', 'tooltip')
  document.body.appendChild(el)
  return el
}

const placeTip = (tip: HTMLElement, anchor: HTMLElement) => {
  const text = anchor.getAttribute('data-tip')
  if (!text) return

  tip.textContent = text
  tip.classList.add('is-show')

  const gap = 8
  const rect = anchor.getBoundingClientRect()
  const tipRect = tip.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight

  let top = rect.top - tipRect.height - gap
  let left = rect.left + rect.width / 2 - tipRect.width / 2

  if (top < gap) top = Math.min(rect.bottom + gap, vh - tipRect.height - gap)
  if (left < gap) left = gap
  if (left + tipRect.width > vw - gap) left = vw - tipRect.width - gap

  tip.style.top = `${Math.round(top)}px`
  tip.style.left = `${Math.round(left)}px`
}

export const setupStripNativeTitles = (router: Router) => {
  if (typeof window === 'undefined') return

  const tip = createTipEl()
  let active: HTMLElement | null = null
  let stripping = false

  const hide = () => {
    active = null
    tip.classList.remove('is-show')
  }

  const showOutlineTip = (anchor: HTMLElement) => {
    if (!isOutline(anchor) || !isTruncated(anchor) || !anchor.getAttribute('data-tip')) {
      hide()
      return
    }
    active = anchor
    placeTip(tip, anchor)
  }

  const run = () => {
    if (stripping) return
    requestAnimationFrame(() => {
      stripping = true
      stripTitles()
      stripping = false
    })
  }

  document.addEventListener(
    'mouseover',
    (event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.wiki-tip')) return

      const titled = target.closest(`${TITLE_SELECTOR}, ${OUTLINE_SELECTOR}`)
      if (!(titled instanceof HTMLElement)) return

      if (isOutline(titled)) {
        stripping = true
        stripEl(titled)
        stripping = false
        showOutlineTip(titled)
        return
      }

      titled.removeAttribute('title')
      titled.removeAttribute('data-tip')
      hide()
    },
    true,
  )

  document.addEventListener(
    'mouseout',
    (event) => {
      const next = event.relatedTarget
      if (next instanceof Node && tip.contains(next)) return
      if (active && next instanceof Node && active.contains(next)) return
      hide()
    },
    true,
  )

  document.addEventListener('scroll', hide, true)
  window.addEventListener('resize', hide)

  const observer = new MutationObserver(() => {
    if (!stripping) run()
  })
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['title', 'data-tip'],
  })

  run()
  const prev = router.onAfterRouteChange
  router.onAfterRouteChange = async (...args) => {
    await prev?.(...args)
    hide()
    run()
  }
}
