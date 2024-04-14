export default class Header {
  constructor(elem) {
    this.headerElem = elem
    this.scrolledClass = 'is-scrolled'
    this.forwardClass = 'is-forward'
    this.backwardClass = 'is-backward'
    this.resizeTimeout = null

    this.scrollTop = 0
  }

  windowScroll() {
    const scrollTop =
      document.documentElement.scrollTop || document.body.scrollTop
    if (
      scrollTop > 100 &&
      !this.headerElem.classList.contains(this.scrolledClass)
    ) {
      this.headerElem.classList.add(this.scrolledClass)
    } else if (
      scrollTop <= 100 &&
      this.headerElem.classList.contains(this.scrolledClass)
    ) {
      this.headerElem.classList.remove(this.scrolledClass)
    }
    clearTimeout(this.resizeTimeout)
    this.resizeTimeout = setTimeout(() => {
      if (scrollTop === 0) {
        this.headerElem.classList.remove(this.backwardClass)
        this.headerElem.classList.remove(this.forwardClass)
      } else if (scrollTop > this.scrollTop) {
        this.headerElem.classList.remove(this.backwardClass)
        this.headerElem.classList.add(this.forwardClass)
      } else {
        this.headerElem.classList.remove(this.backwardClass)
        this.headerElem.classList.add(this.forwardClass)
        if (!document.documentElement.classList.contains('is-scrolling')) {
          this.headerElem.classList.remove(this.forwardClass)
          this.headerElem.classList.add(this.backwardClass)
        }
      }
      this.scrollTop = scrollTop
      this.setHeight()
    }, 100)
  }

  setHeight() {
    document.documentElement.style.setProperty(
      '--header-height',
      this.headerElem.offsetHeight + 'px',
    )
    document.documentElement.style.setProperty(
      '--header-offset',
      this.headerElem.offsetHeight + 'px',
    )
  }

  mount() {
    this._windowScrollHandler = this.windowScroll.bind(this)
    window.addEventListener('scroll', this._windowScrollHandler)
    window.addEventListener('DOMContentLoaded', this._windowScrollHandler)
    window.addEventListener('resize', this._windowScrollHandler)

    const sections = document.querySelectorAll(
      '.sections .section:not(.visually-hidden)',
    )
    if (
      !document.documentElement.classList.contains('has-light-top') &&
      sections.length &&
      !sections[0].classList.contains('section--dark')
    ) {
      document.documentElement.classList.add('has-light-top')
    }
  }

  unmount() {
    window.removeEventListener('scroll', this._windowScrollHandler)
    window.removeEventListener('DOMContentLoaded', this._windowScrollHandler)
    window.removeEventListener('resize', this._windowScrollHandler)
  }

  destroy() {
    this.unmount()
  }
}
