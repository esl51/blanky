export default class XSlider {
  constructor(elem, options) {
    this.settings = {
      loop: false,
      autoSize: false,
      startAt: 0,
      perSlide: 1,
      autoplay: 0,
      autoplayVisible: true,
      autoplayThreshold: 0.5,
      lazyLoad: 2,
      pauseOnHover: false,
      disableButtons: true,
      disableButtonsPerView: true,
      threshold: 50,
      moveToFirst: false,
      movingClass: 'is-moving',
      disabledClass: 'is-disabled',
      preCurrentClass: 'is-pre-current',
      currentClass: 'is-current',
      activeClass: 'is-active',
      mountedClass: 'is-mounted',
      hiddenClass: 'is-hidden',
      forwardClass: 'is-forward',
      backwardClass: 'is-backward',
      cloneClass: 'is-clone',
      itemSelector: '*',
      bulletTag: 'li',
      bulletsPerView: true,
      hideControls: true,
      wheel: false,
      wheelSensitivity: 25,
      muteVideos: true,
      sync: null,
    }
    for (const attrname in options) {
      this.settings[attrname] = options[attrname]
    }
    this.slider = elem
    for (const attrname in this.settings) {
      if (this.slider.dataset[attrname] !== undefined) {
        if (this.slider.dataset[attrname] === 'true') {
          this.settings[attrname] = true
        } else if (this.slider.dataset[attrname] === 'false') {
          this.settings[attrname] = false
        } else if (!isNaN(this.slider.dataset[attrname])) {
          this.settings[attrname] = parseFloat(this.slider.dataset[attrname])
        } else {
          this.settings[attrname] = this.slider.dataset[attrname]
        }
      }
    }

    this.viewport = this.slider.querySelector('[data-viewport]')
    this.track = this.viewport.querySelector('[data-track]')
    this.bulletsContainer = this.slider.querySelector('[data-bullets]')
    this.bullets = this.bulletsContainer ? this.bulletsContainer.children : []
    this.thumbsContainer = this.slider.querySelector('[data-thumbs]')
    this.thumbs = this.thumbsContainer ? this.thumbsContainer.children : []
    this.prevButtons = this.slider.querySelectorAll('[data-prev]')
    this.nextButtons = this.slider.querySelectorAll('[data-next]')
    this.firstButtons = this.slider.querySelectorAll('[data-first]')
    this.lastButtons = this.slider.querySelectorAll('[data-last]')
    this.progressBars = this.slider.querySelectorAll('[data-progress]')
    this.counterCurrents = this.slider.querySelectorAll('[data-current]')
    this.counterCounts = this.slider.querySelectorAll('[data-count]')
    this.goTos = this.slider.querySelectorAll('[data-goto]')

    this.syncSlider = null
    if (this.settings.sync) {
      this.syncSlider = document.querySelector(this.settings.sync)
    }

    this.current = 0
    this.loopCurrent = 0
    this.autoplayPosition = 0
    this.prev = null
    this.inTransition = false
    this.activeItems = []

    this.prevClones = []
    this.nextClones = []

    this.isMoving = false

    elem.xSlider = this
  }

  toggleEvent(name) {
    const event = new Event(name)
    this.slider.dispatchEvent(event)
  }

  getTransitionDuration(elem) {
    if (!elem) return null
    const cStyle = window.getComputedStyle(elem)
    const value = cStyle.getPropertyValue('transition-duration')
    const isMs = value.indexOf('ms') >= 0
    const duration = parseFloat(value)
    return isMs ? duration : duration * 1000
  }

  getFlexBasis(elem) {
    if (!elem) return null
    const cStyle = window.getComputedStyle(elem)
    return cStyle.getPropertyValue('flex-basis')
  }

  getFlexDirection(elem) {
    if (!elem) return null
    const cStyle = window.getComputedStyle(elem)
    return cStyle.getPropertyValue('flex-direction')
  }

  loadItems() {
    this.items = this.track.querySelectorAll(
      ':scope > ' +
        this.settings.itemSelector +
        ':not(.' +
        this.settings.cloneClass +
        ')',
    )
  }

  mod(index, total) {
    return ((index % total) + total) % total
  }

  goTo(index, preventSync) {
    if (this.items.length < 1) return

    if (preventSync === undefined) {
      preventSync = false
    }

    // prevent fast click
    if (
      this.settings.loop &&
      this.inTransition &&
      (index <= this.minLoopActive || index >= this.maxLoopActive)
    ) {
      return
    }

    if (!this.settings.loop && index < this.minCurrent) {
      index = this.minCurrent
    }
    if (!this.settings.loop && index > this.maxCurrent) {
      index = this.maxCurrent
    }

    this.loopCurrent = index
    this.current = this.mod(index, this.items.length)

    if (!preventSync && this.syncSlider && this.syncSlider.xSlider) {
      this.syncSlider.xSlider.goTo(index, true)
    }

    return this.reposition()
  }

  goToPrev() {
    const index = this.settings.loop ? this.loopCurrent : this.current
    return this.goTo(index - this.settings.perSlide)
  }

  goToNext() {
    const index = this.settings.loop ? this.loopCurrent : this.current
    return this.goTo(index + this.settings.perSlide)
  }

  goToFirst() {
    return this.goTo(this.minCurrent)
  }

  goToLast() {
    return this.goTo(this.maxCurrent)
  }

  goToLastView() {
    return this.goTo(this.maxActive)
  }

  recalc() {
    this.loadItems()
    this.duration = this.getTransitionDuration(this.track)
    this.type = 'horizontal'
    if (this.getFlexDirection(this.track) === 'column') {
      this.type = 'vertical'
    }
    if (
      this.settings.autoplay > 0 &&
      this.duration &&
      this.settings.autoplay < this.duration
    ) {
      this.settings.autoplay = this.duration
    }
    this.flexBasis = this.getFlexBasis(this.items[0])
    if (this.flexBasis && this.flexBasis.indexOf('%') < 0) {
      this.flexBasis = 'auto'
    }
    this.itemSize = 100
    let size = 0
    this.items.forEach((item) => {
      item.style.flexBasis = ''
    })
    if (this.flexBasis === 'auto') {
      let viewportSize = this.viewport.offsetWidth
      let elemSize = this.items[0].offsetWidth
      if (this.type === 'vertical') {
        viewportSize = this.viewport.offsetHeight
        elemSize = this.items[0].offsetHeight
      }
      this.perView = Math.floor(viewportSize / elemSize)
      size = 100 / this.perView
    } else {
      size = parseFloat(this.flexBasis)
      this.perView = Math.floor(100 / size)
    }
    if (this.perView < 1) {
      this.perView = 1
    }
    if (this.perView > this.items.length) {
      this.perView = this.items.length
    }
    if (size > 0 && size <= 100) {
      this.itemSize = size
    }
    if (this.flexBasis === 'auto') {
      this.items.forEach((item) => {
        item.style.flexBasis = this.itemSize + '%'
      })
    }

    if (this.settings.perSlide === 'auto') {
      this.settings.perSlide = this.perView
    }

    this.nextClonesCount = this.settings.loop
      ? this.settings.perSlide + this.perView
      : 0
    this.prevClonesCount = this.settings.loop
      ? this.settings.perSlide + this.perView
      : 0

    Array.from(this.nextClones).forEach((clone) => {
      clone.remove()
    })
    Array.from(this.prevClones).forEach((clone) => {
      clone.remove()
    })

    this.items.forEach((item) => {
      item.dataset.id = Array.from(this.items).indexOf(item)
    })
    if (this.settings.loop) {
      this.items.forEach((item) => {
        item.dataset.loopId = Array.from(this.items).indexOf(item)
      })
      for (let i = 0; i < this.nextClonesCount; i++) {
        const id = this.mod(i, this.items.length)
        const clone = this.items[id].cloneNode(true)
        clone.classList.add(this.settings.cloneClass)
        clone.dataset.id = Array.from(this.items).indexOf(this.items[id])
        clone.dataset.loopId = i + this.items.length
        this.nextClones.push(clone)
        this.track.appendChild(clone)
      }

      for (
        let i = this.items.length - this.prevClonesCount;
        i < this.items.length;
        i++
      ) {
        const id = this.mod(i, this.items.length)
        const clone = this.items[id].cloneNode(true)
        clone.classList.add(this.settings.cloneClass)
        clone.dataset.id = Array.from(this.items).indexOf(this.items[id])
        clone.dataset.loopId = i - this.items.length
        this.prevClones.push(clone)
        this.track.insertBefore(clone, this.items[0])
      }
    }

    this.minCurrent = 0
    this.maxCurrent = this.items.length - 1
    this.minActive = 0
    this.minLoopActive = this.settings.loop
      ? this.minActive - this.prevClonesCount
      : this.minActive
    this.maxActive = this.items.length - this.perView
    this.maxLoopActive = this.settings.loop
      ? this.maxActive + this.nextClonesCount
      : this.maxActive

    this.initBullets()

    return this
  }

  reposition() {
    let first = this.settings.loop ? this.loopCurrent : this.current
    if (first < this.minLoopActive) {
      first = this.minLoopActive
    }
    if (first > this.maxLoopActive) {
      first = this.maxLoopActive
    }

    this.refreshButtonsState()
    this.refreshCounter()
    this.handleBullets()
    this.handleThumbs()
    this.handleLazyLoad(first)

    this.items.forEach((item) => {
      item.classList.remove(this.settings.preCurrentClass)
      item.classList.remove(this.settings.currentClass)
      item.classList.remove(this.settings.activeClass)
    })
    if (this.settings.loop) {
      this.prevClones.forEach((item) => {
        item.classList.remove(this.settings.preCurrentClass)
        item.classList.remove(this.settings.currentClass)
        item.classList.remove(this.settings.activeClass)
      })
      this.nextClones.forEach((item) => {
        item.classList.remove(this.settings.preCurrentClass)
        item.classList.remove(this.settings.currentClass)
        item.classList.remove(this.settings.activeClass)
      })
    }

    let maxHeight = 0
    let maxWidth = 0
    if (this.type === 'horizontal') {
      this.track.style.width = ''
      this.track.style.height = 'auto'
    } else if (this.type === 'vertical') {
      this.track.style.height = ''
      this.track.style.width = 'auto'
    }
    let activeStart = this.current
    if (activeStart < this.minActive) {
      activeStart = this.minActive
    }
    if (activeStart > this.maxActive) {
      activeStart = this.maxActive
    }
    this.activeItems = Array.from(this.items).slice(
      activeStart,
      activeStart + this.perView,
    )

    this.items[this.current].classList.add(this.settings.preCurrentClass)
    const prevCurrentClones = this.prevClones.filter(
      (c) => parseInt(c.dataset.id) === this.current,
    )
    prevCurrentClones.forEach((clone) => {
      clone.classList.add(this.settings.preCurrentClass)
    })
    const nextCurrentClones = this.nextClones.filter(
      (c) => parseInt(c.dataset.id) === this.current,
    )
    nextCurrentClones.forEach((clone) => {
      clone.classList.add(this.settings.preCurrentClass)
    })

    this.activeItems.forEach((item) => {
      item.classList.add(this.settings.activeClass)
      if (this.settings.loop) {
        const index = Array.from(this.items).indexOf(item)
        const prevClones = this.prevClones.filter(
          (c) => parseInt(c.dataset.id) === index,
        )
        prevClones.forEach((clone) => {
          clone.classList.add(this.settings.activeClass)
        })
        const nextClones = this.nextClones.filter(
          (c) => parseInt(c.dataset.id) === index,
        )
        nextClones.forEach((clone) => {
          clone.classList.add(this.settings.activeClass)
        })
      }
      if (item.offsetHeight > maxHeight) {
        maxHeight = item.offsetHeight
      }
      if (item.offsetWidth > maxWidth) {
        maxWidth = item.offsetWidth
      }
    })

    this.distance = -1 * (first + this.prevClonesCount) * this.itemSize
    this.inTransition = true
    this.currentTransform = this._getTransform(this.distance, '%')
    this.track.style.transition = ''
    this.track.style.transform = this.currentTransform
    if (this.settings.autoSize) {
      if (this.type === 'horizontal') {
        this.track.style.height = maxHeight + 'px'
      } else if (this.type === 'vertical') {
        this.track.style.width = maxWidth + 'px'
      }
    }

    if (this.loopCurrent > this.prev) {
      this.slider.classList.remove(this.settings.backwardClass)
      this.slider.classList.add(this.settings.forwardClass)
    } else {
      this.slider.classList.remove(this.settings.forwardClass)
      this.slider.classList.add(this.settings.backwardClass)
    }
    let change = false
    if (this.current !== this.prev) {
      change = true
      this.toggleEvent('beforeChange')
      this.prev = this.current
    }
    this.pauseAutoplay()
    clearInterval(this.autoplayPositionInterval)
    this.updateAutoplayPosition(0)
    this.pauseVideos(true)
    clearTimeout(this.durationTimeout)
    this.durationTimeout = setTimeout(() => {
      if (this.settings.loop) {
        if (this.loopCurrent !== this.current) {
          this.loopCurrent = this.current
          this.distance =
            -1 * (this.loopCurrent + this.prevClonesCount) * this.itemSize
          this.currentTransform = this._getTransform(this.distance, '%')
          this.track.style.transition = 'none'
          this.track.style.transform = this.currentTransform
        }
        const prevCurrentClones = this.prevClones.filter(
          (c) => parseInt(c.dataset.id) === this.current,
        )
        prevCurrentClones.forEach((clone) => {
          clone.classList.remove(this.settings.preCurrentClass)
          clone.classList.add(this.settings.currentClass)
        })
        const nextCurrentClones = this.nextClones.filter(
          (c) => parseInt(c.dataset.id) === this.current,
        )
        nextCurrentClones.forEach((clone) => {
          clone.classList.remove(this.settings.preCurrentClass)
          clone.classList.add(this.settings.currentClass)
        })
      }
      this.items[this.current].classList.remove(this.settings.preCurrentClass)
      this.items[this.current].classList.add(this.settings.currentClass)
      this.inTransition = false
      this.viewport.removeEventListener('click', this._click)
      this.track.classList.remove(this.settings.movingClass)
      if (change) {
        this.toggleEvent('change')
        this.prev = this.current
      }
      this.playCurrentVideo(true)
      this.startAutoplay()
    }, this.duration)

    return this
  }

  refreshButtonsState() {
    if (!this.settings.loop && this.settings.disableButtons) {
      const buttons = []
      const disabledButtons = []
      if (this.items.length <= this.perView) {
        disabledButtons.push(...this.prevButtons)
        disabledButtons.push(...this.firstButtons)
        disabledButtons.push(...this.nextButtons)
        disabledButtons.push(...this.lastButtons)
      } else if (this.current === this.minCurrent) {
        buttons.push(...this.nextButtons)
        buttons.push(...this.lastButtons)
        disabledButtons.push(...this.prevButtons)
        disabledButtons.push(...this.firstButtons)
      } else if (
        (this.settings.disableButtonsPerView &&
          this.current >= this.maxActive) ||
        this.current >= this.maxCurrent
      ) {
        buttons.push(...this.prevButtons)
        buttons.push(...this.firstButtons)
        disabledButtons.push(...this.nextButtons)
        disabledButtons.push(...this.lastButtons)
      } else {
        buttons.push(...this.prevButtons)
        buttons.push(...this.firstButtons)
        buttons.push(...this.nextButtons)
        buttons.push(...this.lastButtons)
      }
      disabledButtons.forEach((item) => {
        item.disabled = true
        item.tabindex = -1
        item.classList.add(this.settings.disabledClass)
      })
      buttons.forEach((item) => {
        item.disabled = false
        item.removeAttribute('tabindex')
        item.classList.remove(this.settings.disabledClass)
      })
      if (this.settings.hideControls && buttons.length === 0) {
        disabledButtons.forEach((button) => {
          button.classList.add(this.settings.hiddenClass)
        })
      }
    }
  }

  refreshCounter() {
    this.counterCurrents.forEach((current) => {
      current.innerText = this.current + 1
    })
    this.counterCounts.forEach((count) => {
      count.innerText = this.items.length
    })
  }

  initBullets() {
    if (this.bulletsContainer) {
      while (this.bulletsContainer.firstChild) {
        this.bulletsContainer.removeChild(this.bulletsContainer.firstChild)
      }
      let bulletsCount = this.items.length
      if (this.settings.bulletsPerView && this.settings.loop) {
        this.settings.bulletsPerView = false
      }
      if (this.settings.bulletsPerView) {
        bulletsCount = this.items.length - this.perView + 1
      }
      for (let i = 0; i < bulletsCount; i++) {
        const bulletBtn = Object.assign(document.createElement('button'), {
          type: 'button',
        })
        bulletBtn.addEventListener('click', () => {
          const idx = Array.from(this.bullets).indexOf(bullet)
          this.goTo(idx)
        })
        const bullet = Object.assign(
          document.createElement(this.settings.bulletTag),
          {
            className: 'xslider__bullet',
          },
        )
        bullet.appendChild(bulletBtn)
        this.bulletsContainer.appendChild(bullet)
      }
      this.bullets = Array.from(this.bulletsContainer.children)
      if (this.settings.hideControls && bulletsCount === 1) {
        this.bulletsContainer.classList.add(this.settings.hiddenClass)
      } else {
        this.bulletsContainer.classList.remove(this.settings.hiddenClass)
      }
    }
  }

  handleBullets() {
    if (this.bulletsContainer) {
      this.bullets.forEach((bullet) => {
        bullet.classList.remove(this.settings.activeClass)
      })
      const maxActive = this.settings.bulletsPerView
        ? this.maxActive
        : this.maxCurrent
      if (this.current < this.minCurrent) {
        this.bullets[0].classList.add(this.settings.activeClass)
      } else if (this.current <= maxActive) {
        this.bullets[this.current].classList.add(this.settings.activeClass)
      } else {
        this.bullets[maxActive].classList.add(this.settings.activeClass)
      }
    }
  }

  lazyLoadItem(item) {
    const lazyLoadObjects = item.querySelectorAll('[data-src]')
    lazyLoadObjects.forEach((obj) => {
      obj.src = obj.dataset.src
      delete obj.dataset.src
    })
  }

  handleLazyLoad(first) {
    const index = this.mod(first, this.items.length)
    const count = this.settings.perSlide * this.settings.lazyLoad * 2
    let minIndex = index - count
    const maxIndex = index + count + 1
    const lazyLoadItems = []
    if (minIndex < this.minActive) {
      minIndex = this.items.length + minIndex
      lazyLoadItems.push(...Array.from(this.items).slice(minIndex))
    }
    lazyLoadItems.push(...Array.from(this.items).slice(index, maxIndex))

    const ids = []
    lazyLoadItems.forEach((item) => {
      if (!ids.includes(item.dataset.id)) {
        ids.push(item.dataset.id)
      }
      this.lazyLoadItem(item)
    })

    if (this.settings.loop) {
      const cloneItems = [...this.prevClones, ...this.nextClones]
      cloneItems.forEach((clone) => {
        if (ids.includes(clone.dataset.id)) {
          this.lazyLoadItem(clone)
        }
      })
    }
  }

  handleThumbs() {
    if (this.thumbsContainer) {
      this.thumbs.forEach((thumb) => {
        thumb.classList.remove(this.settings.activeClass)
      })
      this.thumbs[this.current].classList.add(this.settings.activeClass)
    }
  }

  playCurrentVideo(reset) {
    const video = this.items[this.current].querySelector('video')
    if (video && video.readyState >= 2) {
      if (reset === true) {
        video.currentTime = 0
      }
      video.play()
    }
  }

  pauseVideos(reset) {
    this.videos.forEach((video) => {
      video.pause()
      if (reset === true) {
        video.currentTime = 0
      }
    })
  }

  getAutoplayDuration() {
    const video = this.items[this.current].querySelector('video')
    if (video && video.dataset.duration) {
      return video.dataset.duration
    }
    return this.settings.autoplay
  }

  pauseAutoplay() {
    clearTimeout(this.autoplayTimeout)
    clearInterval(this.autoplayPositionInterval)
    return this
  }

  updateAutoplayPosition(position) {
    this.autoplayPosition = position
    this.progressBars.forEach((progress) => {
      if (progress.dataset.progress === 'width') {
        progress.style.width = this.getAutoplayProgress(position) + '%'
      } else {
        progress.style.setProperty(
          '--value',
          this.getAutoplayProgress(position),
        )
      }
    })
  }

  getAutoplayProgress(position) {
    return Math.min(
      Math.round((position / this.getAutoplayDuration()) * 100),
      100,
    )
  }

  startAutoplay() {
    if (this.settings.autoplay > 0) {
      this.pauseAutoplay()
      const video = this.items[this.current].querySelector('video')
      if (this.settings.autoplay > 0) {
        this.autoplayPositionInterval = setInterval(() => {
          if (video && video.dataset.duration) {
            this.autoplayPosition = Math.round(video.currentTime * 1000)
          } else {
            this.autoplayPosition = this.autoplayPosition + 100
          }
          this.updateAutoplayPosition(this.autoplayPosition)
        }, 100)
      }
      this.autoplayTimeout = setInterval(() => {
        if (!this.settings.loop && this.current === this.maxCurrent) {
          this.pauseVideos()
          this.pauseAutoplay()
          return this
        }
        this.goToNext()
      }, this.getAutoplayDuration() - this.autoplayPosition)
    }
    return this
  }

  _getMoveTo() {
    const vRect = this.viewport.getBoundingClientRect()
    const tRect = this.track.getBoundingClientRect()
    let moveTo = -1
    const allItems = [...this.prevClones, ...this.items, ...this.nextClones]
    let offset = tRect.left - vRect.left
    let offsetProp = 'offsetLeft'
    if (this.type === 'vertical') {
      offset = tRect.top - vRect.top
      offsetProp = 'offsetTop'
    }
    allItems.forEach((item) => {
      if (item[offsetProp] < offset * -1) {
        const index = Array.from(allItems).indexOf(item)
        const id = parseInt(
          this.settings.loop ? item.dataset.loopId : item.dataset.id,
        )
        const nextItem = allItems[index + 1]
        if (nextItem && nextItem[offsetProp] > offset * -1) {
          moveTo = this.moveDirection === 'prev' ? id : id + 1
        } else if (!nextItem) {
          moveTo = id
        }
      }
    })
    return moveTo
  }

  _getTransform(value, units) {
    if (!units) {
      units = 'px'
    }
    if (this.type === 'horizontal') {
      return 'translate3d(' + value + units + ',0,0)'
    } else if (this.type === 'vertical') {
      return 'translate3d(0,' + value + units + ',0)'
    }
  }

  _click(e) {
    e.preventDefault()
  }

  _dragSwipe(e, type) {
    e.stopPropagation()
    if (!this.isMoving || !this.xDown || !this.yDown) {
      return
    }
    this.track.classList.add(this.settings.movingClass)
    this.xUp = type === 'drag' ? e.clientX : e.touches[0].clientX
    this.yUp = type === 'drag' ? e.clientY : e.touches[0].clientY
    if (this.type === 'horizontal') {
      if (this.xDown > this.xUp) {
        this.moveDirection = 'next'
      } else {
        this.moveDirection = 'prev'
      }
    } else if (this.type === 'vertical') {
      if (this.yDown > this.yUp) {
        this.moveDirection = 'next'
      } else {
        this.moveDirection = 'prev'
      }
    }
    this.xDiff = this.xDown - this.xUp
    this.yDiff = this.yDown - this.yUp

    let diff = null
    if (
      this.type === 'horizontal' &&
      Math.abs(this.xDiff) > Math.abs(this.yDiff)
    ) {
      diff = this.xDiff
    } else if (
      this.type === 'vertical' &&
      Math.abs(this.yDiff) > Math.abs(this.xDiff)
    ) {
      diff = this.yDiff
    }
    if (diff !== null) {
      if (e.cancelable) {
        e.preventDefault()
      }
      const transform = this._getTransform(diff * -1)
      let canMove = true
      if (
        !this.settings.loop &&
        ((this.current === this.maxCurrent && diff > 0) ||
          (this.current === this.minCurrent && diff < 0))
      ) {
        canMove = false
      }
      if (canMove) {
        this.track.style.transition = 'none'
        this.track.style.transform = this.currentTransform + ' ' + transform
      }
    }
    this.viewport.addEventListener('click', this._click)
  }

  _dragSwipeEnd(e) {
    e.stopPropagation()
    const xDiff = Math.abs(this.xDiff)
    const yDiff = Math.abs(this.yDiff)
    let moveTo

    let diff = null
    if (
      this.type === 'horizontal' &&
      xDiff > yDiff &&
      xDiff > this.settings.threshold
    ) {
      diff = this.xDiff
    } else if (
      this.type === 'vertical' &&
      yDiff > xDiff &&
      yDiff > this.settings.threshold
    ) {
      diff = this.yDiff
    }
    if (diff !== null) {
      if (this.settings.moveToFirst) {
        moveTo = this._getMoveTo()
      }
      if (moveTo > -1) {
        this.goTo(moveTo)
      } else if (moveTo === -1) {
        this.goToFirst()
      } else if (diff > 0) {
        this.goToNext()
      } else {
        this.goToPrev()
      }
    } else {
      this.reposition()
    }
    this.xDown = 0
    this.yDown = 0
    this.xDiff = 0
    this.yDiff = 0
    this.viewport.removeEventListener('mousemove', this._dragHandler, false)
    this.viewport.removeEventListener('touchmove', this._swipeHandler, false)
    this.isMoving = false
  }

  _dragLeave() {
    if (this.isMoving) {
      this.reposition()
      this.xDown = 0
      this.yDown = 0
      this.viewport.removeEventListener('mousemove', this._dragHandler, false)
      this.viewport.removeEventListener('touchmove', this._swipeHandler, false)
      this.viewport.removeEventListener('click', this._click)
      this.isMoving = false
    }
  }

  _dragEnd(e) {
    return this._dragSwipeEnd(e, 'drag')
  }

  _swipeEnd(e) {
    return this._dragSwipeEnd(e, 'swipe')
  }

  _drag(e) {
    return this._dragSwipe(e, 'drag')
  }

  _swipe(e) {
    return this._dragSwipe(e, 'swipe')
  }

  _wheel(e) {
    e.stopPropagation()
    if (this.xDiff === undefined) {
      this.xDiff = 0
    }
    if (this.yDiff === undefined) {
      this.yDiff = 0
    }
    this.xDiff += e.deltaX
    this.yDiff += e.deltaY
    if (this.xDiff > 0) {
      this.moveDirection = 'next'
    } else {
      this.moveDirection = 'prev'
    }
    if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) {
      this.isMoving = true
      this.track.classList.add(this.settings.movingClass)
      if (e.cancelable) {
        e.preventDefault()
      }
      const transform = this._getTransform(
        this.xDiff * -(this.settings.wheelSensitivity / 100),
      )
      this.track.style.transform = this.currentTransform + ' ' + transform
      let canMove = true
      if (
        !this.settings.loop &&
        ((this.current === this.maxCurrent && this.xDiff > 0) ||
          (this.current === this.minCurrent && this.xDiff < 0))
      ) {
        canMove = false
      }
      if (canMove) {
        this.track.style.transition = 'none'
        this.track.style.transform = this.currentTransform + ' ' + transform
      }
      clearTimeout(this.wheelTimeout)
      this.wheelTimeout = setTimeout(() => {
        const xDiff = Math.abs(this.xDiff)
        const yDiff = Math.abs(this.yDiff)
        let moveTo
        if (xDiff > yDiff) {
          if (this.settings.moveToFirst) {
            moveTo = this._getMoveTo()
          }
          if (moveTo > -1) {
            this.goTo(moveTo)
          } else if (moveTo === -1) {
            this.goToFirst()
          } else if (this.xDiff > 0) {
            this.goToNext()
          } else {
            this.goToPrev()
          }
        } else {
          this.reposition()
        }
        this.xDiff = 0
        this.yDiff = 0
        this.isMoving = false
        this.track.classList.remove(this.settings.movingClass)
      }, 250)
    }
  }

  mount() {
    this.recalc()

    window.addEventListener('resize', () => {
      clearTimeout(this.resizeTimer)
      this.resizeTimer = setTimeout(() => {
        this.recalc()
        this.reposition()
      }, 250)
    })

    if (this.settings.autoplay > 0 && this.settings.pauseOnHover) {
      this.viewport.addEventListener('mouseenter', () => {
        this.pauseAutoplay()
      })
      this.viewport.addEventListener('mouseleave', () => {
        this.startAutoplay()
      })
    }

    this.videos = this.track.querySelectorAll('video')

    this.videos.forEach((video) => {
      video.playsinline = true
      video.loop = true
      if (this.settings.muteVideos) {
        video.muted = true
      }
      if (video.duration) {
        video.dataset.duration = Math.floor(video.duration * 1000)
      }
      if (!video.dataset.duration) {
        video.addEventListener('loadedmetadata', () => {
          video.dataset.duration = Math.floor(video.duration * 1000)
        })
      }
      if (this.settings.autoplay > 0) {
        video.addEventListener('waiting', () => {
          this.pauseAutoplay()
        })
        video.addEventListener('playing', () => {
          this.startAutoplay()
        })
      }
      video.addEventListener('contextmenu', (e) => {
        e.preventDefault()
      })
    })

    if (
      this.settings.autoplay > 0 &&
      this.settings.autoplayVisible &&
      window.IntersectionObserver
    ) {
      this.autoplayObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio < this.settings.autoplayThreshold) {
              this.pauseVideos()
              this.pauseAutoplay()
            } else {
              this.playCurrentVideo()
              this.startAutoplay()
            }
          })
        },
        {
          threshold: this.settings.autoplayThreshold,
        },
      )
      this.autoplayObserver.observe(this.viewport)
    }

    this._dragHandler = this._drag.bind(this)
    this._dragEndHandler = this._dragEnd.bind(this)
    this._dragLeaveHandler = this._dragLeave.bind(this)
    this._wheelHandler = this._wheel.bind(this)

    if (this.thumbsContainer) {
      this.thumbs = Array.from(this.thumbsContainer.children)
    }

    this.thumbs.forEach((thumb) => {
      const btn = thumb.querySelector('button')
      btn.addEventListener('click', () => {
        const idx = Array.from(this.thumbs).indexOf(thumb)
        this.goTo(idx)
      })
    })

    this.goTos.forEach((goTo) => {
      goTo.addEventListener('click', () => {
        const idx = goTo.dataset.goto
        if (idx) {
          this.goTo(idx)
        }
      })
    })

    this.viewport.addEventListener('mousedown', (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.xDown = e.clientX
      this.yDown = e.clientY
      this.isMoving = true
      this.viewport.addEventListener('mousemove', this._dragHandler, false)
      this.viewport.addEventListener('mouseup', this._dragEndHandler, false)
      this.viewport.addEventListener(
        'mouseleave',
        this._dragLeaveHandler,
        false,
      )
    })

    if (this.settings.wheel) {
      this.viewport.addEventListener('wheel', this._wheelHandler, false)
    }

    this._swipeHandler = this._swipe.bind(this)
    this._swipeEndHandler = this._swipeEnd.bind(this)

    this.viewport.addEventListener('touchstart', (e) => {
      e.stopPropagation()
      this.xDown = e.touches[0].clientX
      this.yDown = e.touches[0].clientY
      this.isMoving = true
      this.viewport.addEventListener('touchmove', this._swipeHandler, false)
      this.viewport.addEventListener('touchend', this._swipeEndHandler, false)
    })

    this.prevButtons.forEach((item) => {
      item.addEventListener('click', () => {
        this.goToPrev()
      })
    })
    this.nextButtons.forEach((item) => {
      item.addEventListener('click', () => {
        this.goToNext()
      })
    })
    this.firstButtons.forEach((item) => {
      item.addEventListener('click', () => {
        this.goToFirst()
      })
    })
    this.lastButtons.forEach((item) => {
      item.addEventListener('click', () => {
        this.goToLast()
      })
    })

    this.goTo(this.settings.startAt)
    this.startAutoplay()

    this.slider.classList.add(this.settings.mountedClass)

    this.toggleEvent('mount')
  }

  unmount() {
    this.track.style = ''
    this.slider.classList.remove(this.settings.mountedClass)
    const clone = this.slider.cloneNode(true)
    this.slider.parentNode.replaceChild(clone, this.slider)
  }

  destroy() {
    this.unmount()
    delete this.slider.xSlider
  }
}
