export default class Nav {
  constructor (elem, toggle) {
    this.navElem = elem
    this.navToggle = toggle
    this.activeClass = 'is-active'
    this.itemClass = 'nav__item'
    this.linkClass = 'nav__link'
    this.subClass = 'nav__sub'
    this.scoped = ':scope > '
    this.items = this.navElem.querySelectorAll('.' + this.itemClass)
    this.subs = this.navElem.querySelectorAll('.' + this.subClass)
    this.leaveTimeout = null
  }

  toggleClick () {
    const isActive = this.navElem.classList.contains(this.activeClass)
    this.navElem.classList.toggle(this.activeClass, !isActive)
    this.navToggle.classList.toggle(this.activeClass, !isActive)

    document.body.classList.toggle('is-nav-shown', !isActive)
    document.body.style.marginRight = isActive ? '' : this.getScrollbarWidth() + 'px'
    document.body.style.overflow = isActive ? '' : 'hidden'
  }

  linkMouseEnter (link) {
    clearTimeout(this.leaveTimeout)
    const item = link.closest('.' + this.itemClass)
    const siblings = item.parentNode.querySelectorAll(this.scoped + '.' + this.itemClass)
    siblings.forEach(item => {
      item.classList.remove(this.activeClass)
    })
    item.classList.add(this.activeClass)
  }

  linkTap (link, e) {
    const item = link.closest('.' + this.itemClass)
    const sub = item.querySelector(this.scoped + '.' + this.subClass)
    if (sub) {
      e.preventDefault()
      if (!item.classList.contains(this.activeClass)) {
        const siblings = item.parentNode.querySelectorAll(this.scoped + '.' + this.itemClass)
        siblings.forEach(item => {
          item.classList.remove(this.activeClass)
        })
        item.classList.add(this.activeClass)
      } else {
        item.classList.remove(this.activeClass)
      }
      return false
    }
  }

  subMouseEnter () {
    clearTimeout(this.leaveTimeout)
  }

  mouseLeave () {
    clearTimeout(this.leaveTimeout)
    this.leaveTimeout = setTimeout(() => {
      this.items.forEach(item => {
        item.classList.remove(this.activeClass)
      })
    }, 250)
  }

  getScrollbarWidth () {
    const outer = document.createElement('div')
    outer.style.visibility = 'hidden'
    outer.style.overflow = 'scroll'
    outer.style.msOverflowStyle = 'scrollbar'
    document.body.appendChild(outer)
    const inner = document.createElement('div')
    outer.appendChild(inner)
    const scrollbarWidth = (outer.offsetWidth - inner.offsetWidth)
    outer.parentNode.removeChild(outer)
    return scrollbarWidth
  }

  mount () {
    this._mouseLeaveHandler = this.mouseLeave.bind(this)
    this._toggleClickHandler = this.toggleClick.bind(this)
    this._subMouseEnterHandler = this.subMouseEnter.bind(this)
    this.navElem.addEventListener('mouseleave', this._mouseLeaveHandler)
    this.navToggle.addEventListener('click', this._toggleClickHandler)
    this.items.forEach(item => {
      const link = item.querySelector('.' + this.linkClass)
      link._linkMouseEnterHandler = this.linkMouseEnter.bind(this, link)
      link._linkTapHandler = this.linkTap.bind(this, link)
      link.addEventListener('mouseenter', link._linkMouseEnterHandler)
      link.addEventListener('touchend', link._linkTapHandler)
    })
    this.subs.forEach(sub => {
      sub.addEventListener('mouseenter', this._subMouseEnterHandler)
      sub.addEventListener('mouseleave', this._mouseLeaveHandler)
    })
  }

  unmount () {
    this.navElem.removeEventListener('mouseleave', this._mouseLeaveHandler)
    this.navToggle.removeEventListener('click', this._toggleClickHandler)
    this.items.forEach(item => {
      const link = item.querySelector('.' + this.linkClass)
      link.removeEventListener('mouseenter', link._linkMouseEnterHandler)
      delete link._linkMouseEnterHandler
      link.removeEventListener('touchend', link._linkTapHandler)
      delete link._linkTapHandler
    })
    this.subs.forEach(sub => {
      sub.removeEventListener('mouseenter', this._subMouseEnterHandler)
      sub.removeEventListener('mouseleave', this._mouseLeaveHandler)
    })
  }

  destroy () {
    this.unmount()
  }
}
