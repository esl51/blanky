import XForm from './../controls/xform'
import XMap from './../controls/xmap'
import XPopup from './../controls/xpopup'
import XSlider from './../controls/xslider'

/* Init content */
export function initContent (container) {
  if (!container) {
    container = document
  }

  /* Popups */
  const xPopups = container.querySelectorAll('.js-xpopup')
  xPopups.forEach(xpopup => {
    new XPopup(xpopup).mount()
  })

  /* Popup Forms */
  const xPopupForms = container.querySelectorAll('.js-xpopup-form')
  xPopupForms.forEach(xpopup => {
    xpopup.addEventListener('show', function () {
      const focusable = xpopup.querySelectorAll('input:not([type=hidden]), select, textarea')
      if (focusable.length) {
        setTimeout(function () {
          focusable[0].focus()
        }, 100)
      }
    })
    new XPopup(xpopup).mount()
  })

  /* Popup Iframes */
  const xPopupIframes = container.querySelectorAll('.js-xpopup-iframe')
  xPopupIframes.forEach(xpopup => {
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

  /* Popup Ajaxes */
  const xPopupAjaxes = container.querySelectorAll('.js-xpopup-ajax')
  xPopupAjaxes.forEach(xpopup => {
    const ajax = xpopup.querySelector('[data-ajax]')
    if (ajax) {
      xpopup.addEventListener('show', function () {
        ajax.xLoader.load()
      })
    }
    new XPopup(xpopup).mount()
  })

  /* Inline iframe */
  const inlineIframes = container.querySelectorAll('[data-iframe]')
  inlineIframes.forEach(iframe => {
    iframe.addEventListener('click', e => {
      e.preventDefault()
      const iframeElem = iframe.querySelector('iframe')
      iframeElem.src = iframeElem.dataset.src
      iframe.classList.add('is-active')
      return false
    })
  })

  /* Tables */
  const contentTables = container.querySelectorAll('.text table')
  contentTables.forEach(table => {
    const tableContainer = document.createElement('div')
    tableContainer.classList.add('table-container')
    table.parentNode.insertBefore(tableContainer, table)
    tableContainer.appendChild(table)
  })

  /* xForm */
  const xForms = container.querySelectorAll('.js-xform')
  xForms.forEach(xform => {
    new XForm(xform).mount()
  })

  /* xMap */
  const xMaps = container.querySelectorAll('.js-xmap')
  xMaps.forEach(xmap => {
    new XMap(xmap).mount()
  })

  /* xSlider */
  const xSliders = container.querySelectorAll('.js-xslider')
  xSliders.forEach(xslider => {
    new XSlider(xslider, {
      loop: true
    }).mount()
  })
}
