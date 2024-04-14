export default class Animator {
  constructor(elem, options) {
    this.settings = {
      children: false,
      baseClass: 'animator',
      activeClass: 'animator--active',
      childrenClass: 'animator--children',
      animationPrefix: 'animator--',
      animation: 'fade-in slide-up',
      ratio: 0.1,
      root: null,
      rootMargin: '0px 0px 0px 0px',
      once: true,
    }
    for (const attrName in options) {
      this.settings[attrName] = options[attrName]
    }
    this.elem = elem
    for (const attrName in this.settings) {
      if (this.elem.dataset[attrName] !== undefined) {
        if (this.elem.dataset[attrName] === 'true') {
          this.settings[attrName] = true
        } else if (this.elem.dataset[attrName] === 'false') {
          this.settings[attrName] = false
        } else if (!isNaN(this.elem.dataset[attrName])) {
          this.settings[attrName] = parseFloat(this.elem.dataset[attrName])
        } else {
          this.settings[attrName] = this.elem.dataset[attrName]
        }
      }
    }
  }

  toggleEvent(name) {
    const event = new Event(name)
    this.elem.dispatchEvent(event)
  }

  mount() {
    if (!window.IntersectionObserver) {
      console.error('Intersection observer not supported')
      return
    }
    if (this.settings.baseClass) {
      this.elem.classList.add(this.settings.baseClass)
    }
    if (this.settings.children) {
      this.elem.classList.add(this.settings.childrenClass)
    }
    if (this.settings.animation) {
      this.settings.animation.split(' ').forEach((animation) => {
        this.elem.classList.add(this.settings.animationPrefix + animation)
      })
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= this.settings.ratio) {
            this.toggleEvent('finish')
            this.elem.classList.add(this.settings.activeClass)
            if (this.settings.once) {
              this.toggleEvent('unobserve')
              this.observer.unobserve(this.elem)
            }
          } else if (!this.settings.once) {
            this.toggleEvent('refresh')
            this.elem.classList.remove(this.settings.activeClass)
          }
        })
      },
      {
        threshold: this.settings.ratio,
        root: null,
        rootMargin: this.settings.rootMargin,
      },
    )
    this.observer.observe(this.elem)
    this.toggleEvent('mount')

    return this
  }

  unmount() {
    if (this.settings.baseClass) {
      this.elem.classList.remove(this.settings.baseClass)
    }
    if (this.settings.animation) {
      this.settings.animation.split(' ').forEach((animation) => {
        this.elem.classList.remove(this.settings.animationPrefix + animation)
      })
    }
    delete this.observer
    this.toggleEvent('unmount')
  }
}
