import XForm from './../controls/xform'
import XLightbox from './../controls/xlightbox'
import XMap from './../controls/xmap'
import XPopup from './../controls/xpopup'
import XSlider from './../controls/xslider'
import Header from './../controls/header'
import Nav from './../controls/nav'
import CookieConsent from '../controls/cookie-consent'
// import Animator from '../controls/animator'

// Init content

export function initContent(container) {
  if (!container) {
    container = document
  }

  // Popups

  const xPopups = container.querySelectorAll('.js-xpopup')
  xPopups.forEach((xpopup) => {
    new XPopup(xpopup).mount()
  })

  // Popup Forms

  const xPopupForms = container.querySelectorAll('.js-xpopup-form')
  xPopupForms.forEach((xpopup) => {
    xpopup.addEventListener('show', function () {
      const focusable = xpopup.querySelectorAll(
        'input:not([type=hidden]), select, textarea',
      )
      if (focusable.length) {
        setTimeout(function () {
          focusable[0].focus()
        }, 100)
      }
    })
    new XPopup(xpopup).mount()
  })

  // Popup Iframes

  const xPopupIframes = container.querySelectorAll('.js-xpopup-iframe')
  xPopupIframes.forEach((xpopup) => {
    const iframe = xpopup.querySelector('[data-iframe]')
    if (iframe) {
      xpopup.addEventListener('show', () => {
        iframe.click()
      })
      xpopup.addEventListener('hide', () => {
        const iframeElem = iframe.querySelector('iframe')
        if (iframeElem) {
          iframe.classList.remove('is-active')
          iframeElem.src = ''
        }
      })
    }
    new XPopup(xpopup).mount()
  })

  // Popup Ajaxes

  const xPopupAjaxes = container.querySelectorAll('.js-xpopup-ajax')
  xPopupAjaxes.forEach((xpopup) => {
    const ajax = xpopup.querySelector('[data-ajax]')
    if (ajax) {
      xpopup.addEventListener('show', function () {
        ajax.xLoader.load()
      })
    }
    new XPopup(xpopup).mount()
  })

  // Inline iframe

  const inlineIframes = container.querySelectorAll('[data-iframe]')
  inlineIframes.forEach((iframe) => {
    iframe.addEventListener('click', (e) => {
      e.preventDefault()
      const iframeElem = iframe.querySelector('iframe')
      iframeElem.src = iframeElem.dataset.src
      iframe.classList.add('is-active')
      return false
    })
  })

  // Tables

  const contentTables = container.querySelectorAll('.text table')
  contentTables.forEach((table) => {
    const tableContainer = document.createElement('div')
    tableContainer.classList.add('table-container')
    table.parentNode.insertBefore(tableContainer, table)
    tableContainer.appendChild(table)
  })

  // xForms

  const xForms = container.querySelectorAll('.js-xform')
  xForms.forEach((xform) => {
    xform.addEventListener('success', () => {
      const xpopup = xform.closest('.xpopup')
      if (xpopup && xpopup.xPopup && xpopup.classList.contains('is-active')) {
        xpopup.xPopup.hide()
      }
    })
    new XForm(xform).mount()
  })

  // xMaps

  const xMaps = container.querySelectorAll('.js-xmap')
  xMaps.forEach((xmap) => {
    new XMap(xmap).mount()
  })

  // xSliders

  const xSliders = container.querySelectorAll('.js-xslider')
  xSliders.forEach((xslider) => {
    new XSlider(xslider, {
      loop: true,
    }).mount()
  })

  // xLightboxes

  new XLightbox({
    selector:
      '.text a[href$=".jpg"], .text a[href$=".jpeg"], .text a[href$=".png"], .text a[href$=".gif"], .text a[href*="youtu"], .text a[href*=".mp4"]',
  }).mount()
  new XLightbox({
    selector: '.js-gallery-link',
  }).mount()

  // Header

  const header = container.querySelector('.js-header')
  if (header) {
    new Header(header).mount()
  }

  // Nav

  const nav = container.querySelector('.js-nav')
  const navToggle = container.querySelector('.js-nav-toggle')
  if (nav && navToggle) {
    new Nav(nav, navToggle).mount()
  }

  // Cookie consent

  const cookieConsent = container.querySelector('.js-cookie')
  if (cookieConsent) {
    new CookieConsent(cookieConsent).mount()
  }

  // Animator

//   const animators = container.querySelectorAll('.js-animator')
//   animators.forEach((animator) => {
//     new Animator(animator).mount()
//   })
//   const tableAnimators = container.querySelectorAll('.text tr')
//   tableAnimators.forEach((animator) => {
//     new Animator(animator, {
//       animation: 'fade-in',
//       once: false,
//     }).mount()
//   })
//   const listAnimators = container.querySelectorAll('.text li')
//   listAnimators.forEach((animator) => {
//     new Animator(animator, {
//       animation: 'fade-in slide-left',
//       once: false,
//     }).mount()
//   })
//   const textAnimators = container.querySelectorAll(
//     '.text > *:not(.table-container, table, ul, ol)',
//   )
//   textAnimators.forEach((animator) => {
//     new Animator(animator, {
//       once: false,
//     }).mount()
//   })
//   const fileAnimators = container.querySelectorAll('.files__item')
//   fileAnimators.forEach((animator) => {
//     animator.animator = new Animator(animator, {
//       once: false,
//     }).mount()
//   })
//   const blockAnimators = container.querySelectorAll('.block')
//   if (window.IntersectionObserver) {
//     blockAnimators.forEach((animator) => {
//       new Animator(animator, {
//         animation: false,
//         baseClass: '',
//         finishedClass: 'is-visible',
//         ratio: 0.25,
//         once: false,
//       }).mount()
//     })
//   }
// }
