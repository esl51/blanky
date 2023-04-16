import { scrollTo } from './modules/utils'
import { initContent } from './modules/content'
import XLoader from './controls/xloader'

document.addEventListener('DOMContentLoaded', () => {
  // Scroll to

  document.addEventListener('click', e => {
    let target = e.target
    while (target && (!target.dataset || !target.dataset.scroll)) {
      target = target.parentNode
    }
    if (target && target.dataset && target.dataset.scroll) {
      e.preventDefault()
      scrollTo(target.dataset.scroll)
      return false
    }
  })

  // Init content

  initContent()

  // xLoaders

  const xLoaders = document.querySelectorAll('.js-xloader')
  xLoaders.forEach(xloader => {
    new XLoader(xloader).mount()
  })
})

window.addEventListener('load', () => {
  document.documentElement.classList.add('is-loaded')
})
