export default class Nav {
  constructor (elem) {
    this.headerElem = elem
    this.scrolledClass = 'is-scrolled'
    this.resizeTimeout = null
  }

  windowScroll () {
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
    if (scrollTop > 100 && !this.headerElem.classList.contains(this.scrolledClass)) {
      this.headerElem.classList.add(this.scrolledClass)
    } else if (scrollTop <= 100 && this.headerElem.classList.contains(this.scrolledClass)) {
      this.headerElem.classList.remove(this.scrolledClass)
    }
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(() => {
      this.setHeight()
    }, 300)
  }

  setHeight () {
    document.documentElement.style.setProperty('--header-height', this.headerElem.offsetHeight + 'px')
  }

  mount () {
    this._windowScrollHandler = this.windowScroll.bind(this)
    window.addEventListener('scroll', this._windowScrollHandler)
    window.addEventListener('DOMContentLoaded', this._windowScrollHandler)
    window.addEventListener('resize', this._windowScrollHandler)
  }

  unmount () {
    window.removeEventListener('scroll', this._windowScrollHandler)
    window.removeEventListener('DOMContentLoaded', this._windowScrollHandler)
    window.removeEventListener('resize', this._windowScrollHandler)
  }

  destroy () {
    this.unmount()
  }
}
