import { getCookie, setCookie } from '../modules/utils'

export default class CookieConsent {
  constructor (elem) {
    this.cookieElem = elem
    this.submitClass = 'cookie__submit'

    this.submit = this.cookieElem.querySelector('.' + this.submitClass)
  }

  submitClick () {
    setCookie('cookieConsent', true, 365)
    this.cookieElem.style.display = 'none'
  }

  mount () {
    if (!getCookie('cookieConsent')) {
      this.cookieElem.style.display = ''
    }

    this._submitClickHandler = this.submitClick.bind(this)
    this.submit.addEventListener('click', this._submitClickHandler)
  }

  unmount () {
    window.removeEventListener('click', this._submitClickHandler)
  }

  destroy () {
    this.unmount()
  }
}
