// ie 11 polyfills
import 'core-js/features/promise'
import 'element-closest-polyfill'
import 'element-qsa-scope'
import 'custom-event-polyfill'
import objectFitImages from 'object-fit-images'

import { scrollTo, detectIE, setCookie, getCookie } from './modules/utils'
import { initContent } from './modules/content'
import XLoader from './controls/xloader'
import Noty from 'noty'

document.addEventListener('DOMContentLoaded', () => {
  /* Noty defaults */
  Noty.overrideDefaults({
    layout: 'bottomRight',
    timeout: 7000
  })

  /* Scroll To */
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

  /* IE version */
  const ieVersion = detectIE()
  if (ieVersion) {
    document.querySelector('body').classList.add('ie', 'ie-' + ieVersion)
  }

  /* Init content */
  initContent()

  /* xLoaders */
  const xLoaders = document.querySelectorAll('.js-xloader')
  xLoaders.forEach(xloader => {
    new XLoader(xloader).mount()
  })

  /* Cookie */
  const cookieCloseBtn = document.querySelector('.js-cookie-close')
  const cookieContainer = document.querySelector('.js-cookie')
  if (cookieCloseBtn && cookieContainer) {
    cookieCloseBtn.addEventListener('click', () => {
      setCookie('cookieConsent', true, 365)
      cookieContainer.style.display = 'none'
    })
    if (!getCookie('cookieConsent')) {
      cookieContainer.style.display = null
    }
  }

  /* Object fit images */
  objectFitImages()
})
