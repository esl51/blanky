export default class Nav {
  constructor (elem) {
    this.headerElem = elem
    this.scrolledClass = 'is-scrolled'
  }

  windowScroll () {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    if (scrollTop > 100 && !this.headerElem.classList.contains(this.scrolledClass)) {
      this.headerElem.classList.add(this.scrolledClass)
    } else if (scrollTop <= 100 && this.headerElem.classList.contains(this.scrolledClass)) {
      this.headerElem.classList.remove(this.scrolledClass)
    }
  }

  mount () {
    this._windowScrollHandler = this.windowScroll.bind(this)
    this._windowLoadHandler = this.windowScroll.bind(this)
    window.addEventListener('scroll', this._windowScrollHandler)
    window.addEventListener('DOMContentLoaded', this._windowScrollHandler)
  }

  unmount () {
    window.removeEventListener('scroll', this._windowScrollHandler)
    window.removeEventListener('DOMContentLoaded', this._windowScrollHandler)
  }

  destroy () {
    this.unmount()
  }
}
