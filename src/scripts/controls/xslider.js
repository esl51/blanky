export default class XSlider {
  constructor (elem, options) {
    this.settings = {
      loop: false,
      loopActive: true,
      autoHeight: false,
      startAt: 0,
      perSlide: 1,
      autoplay: 0,
      autoplayVisible: true,
      autoplayThreshold: 0.5,
      lazyLoad: 2,
      pauseOnHover: false,
      disableButtons: true,
      threshold: 50,
      moveToFirst: false,
      movingClass: 'is-moving',
      disabledClass: 'is-disabled',
      currentClass: 'is-current',
      activeClass: 'is-active',
      mountedClass: 'is-mounted',
      hiddenClass: 'is-hidden',
      forwardClass: 'is-forward',
      backwardClass: 'is-backward',
      itemSelector: '*',
      bulletTag: 'li',
      hideBullets: true,
      wheel: false,
      muteVideos: true
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

    this.current = 0
    this.autoplayPosition = 0
    this.prev = null
    this.inTransition = false
    this.activeItems = []

    this.isMoving = false

    elem.xSlider = this
  }

  toggleEvent (name) {
    const event = new Event(name)
    this.slider.dispatchEvent(event)
  }

  getTransitionDuration (elem) {
    if (!elem) return null
    const cStyle = window.getComputedStyle(elem)
    const value = cStyle.getPropertyValue('transition-duration')
    const isMs = value.indexOf('ms') >= 0
    const duration = parseFloat(value)
    return isMs ? duration : duration * 1000
  }

  getFlexBasis (elem) {
    if (!elem) return null
    const cStyle = window.getComputedStyle(elem)
    return cStyle.getPropertyValue('flex-basis')
  }

  loadItems () {
    this.items = this.track.querySelectorAll(':scope > ' + this.settings.itemSelector)
  }

  goTo (index) {
    if (this.items.length < 1) return
    if (index < 0) {
      if (!this.settings.loop) {
        this.current = 0
      } else {
        if (this.current < this.settings.perSlide && this.current > 0) {
          this.current = 0
        } else {
          if (this.settings.loopActive && (this.items.length + index) >= this.maxCurrent) {
            this.current = this.maxCurrent
          } else {
            this.current = this.items.length - 1
          }
        }
      }
    } else if (index > this.items.length - 1) {
      if (!this.settings.loop) {
        this.current = this.items.length - 1
      } else {
        this.current = 0
      }
    } else {
      if (!this.settings.loop) {
        this.current = index
      } else {
        if (this.settings.loopActive && index >= this.maxCurrent) {
          if (this.current < this.maxCurrent) {
            this.current = this.maxCurrent
          } else {
            this.current = 0
          }
        } else {
          this.current = index
        }
      }
    }

    return this.reposition()
  }

  recalc () {
    this.loadItems()
    this.duration = this.getTransitionDuration(this.track)
    if (this.settings.autoplay > 0 && this.duration && this.settings.autoplay < this.duration) {
      this.settings.autoplay = this.duration
    }
    this.flexBasis = this.getFlexBasis(this.items[0])
    if (this.flexBasis && this.flexBasis.indexOf('%') < 0) {
      this.flexBasis = 'auto'
    }
    this.itemWidth = 100
    let width = 0;
    [].forEach.call(this.items, item => {
      item.style.flexBasis = ''
    })
    if (this.flexBasis === 'auto') {
      const viewportWidth = this.viewport.offsetWidth
      const elemWidth = this.items[0].offsetWidth
      this.perView = Math.floor(viewportWidth / elemWidth)
      width = 100 / this.perView
    } else {
      width = parseFloat(this.flexBasis)
      this.perView = Math.floor(100 / width)
    }
    if (this.perView < 1) {
      this.perView = 1
    }
    if (this.perView > this.items.length) {
      this.perView = this.items.length
    }
    if (width > 0 && width <= 100) {
      this.itemWidth = width
    }
    if (this.flexBasis === 'auto') {
      [].forEach.call(this.items, item => {
        item.style.flexBasis = this.itemWidth + '%'
      })
    }

    if (this.settings.perSlide === 'auto') {
      this.settings.perSlide = this.perView
    }

    this.maxCurrent = this.items.length - this.perView

    return this
  }

  refreshButtonsState () {
    if (!this.settings.loop && this.settings.disableButtons) {
      const buttons = []
      const disabledButtons = []
      if (this.current === 0) {
        buttons.push.apply(buttons, this.nextButtons)
        buttons.push.apply(buttons, this.lastButtons)
        disabledButtons.push.apply(disabledButtons, this.prevButtons)
        disabledButtons.push.apply(disabledButtons, this.firstButtons)
      } else if (this.current >= this.maxCurrent) {
        buttons.push.apply(buttons, this.prevButtons)
        buttons.push.apply(buttons, this.firstButtons)
        disabledButtons.push.apply(disabledButtons, this.nextButtons)
        disabledButtons.push.apply(disabledButtons, this.lastButtons)
      } else {
        buttons.push.apply(buttons, this.prevButtons)
        buttons.push.apply(buttons, this.firstButtons)
        buttons.push.apply(buttons, this.nextButtons)
        buttons.push.apply(buttons, this.lastButtons)
      }
      disabledButtons.forEach(item => {
        item.disabled = true
        item.tabindex = -1
        item.classList.add(this.settings.disabledClass)
      })
      buttons.forEach(item => {
        item.disabled = false
        item.removeAttribute('tabindex')
        item.classList.remove(this.settings.disabledClass)
      })
    }
  }

  reposition () {
    let first = this.current
    if (first > this.maxCurrent) {
      first = this.maxCurrent
    }

    this.refreshButtonsState()

    if (this.bulletsContainer) {
      while (this.bulletsContainer.firstChild) {
        this.bulletsContainer.removeChild(this.bulletsContainer.firstChild)
      }
    }

    [].forEach.call(this.items, item => {
      item.classList.remove(this.settings.currentClass)
      item.classList.remove(this.settings.activeClass)
    })

    if (this.bulletsContainer) {
      const bulletsCount = this.items.length - this.perView + 1
      for (let i = 0; i < bulletsCount; i++) {
        this.bulletsContainer.insertAdjacentHTML('beforeend', '<' + this.settings.bulletTag + ' class="xslider__bullet"><button></button></' + this.settings.bulletTag + '>')
      }
      this.bullets = this.bulletsContainer.children
      if (this.settings.hideBullets && bulletsCount === 1) {
        this.bulletsContainer.classList.add(this.settings.hiddenClass)
      } else {
        this.bulletsContainer.classList.remove(this.settings.hiddenClass)
      }
    }

    if (this.thumbsContainer) {
      this.thumbs = this.thumbsContainer.children
    }

    [].forEach.call(this.bullets, bullet => {
      const btn = bullet.querySelector('button')
      btn.addEventListener('click', () => {
        const idx = [].indexOf.call(this.bullets, bullet)
        this.goTo(idx)
      })
    })

    const lazyLoadItems = [].slice.call(this.items, first, first + this.perView * (this.settings.lazyLoad + 1))
    let lazyLoadAdd = []
    if (first < this.perView) {
      lazyLoadAdd = [].slice.call(this.items, -1 * this.perView * (this.settings.lazyLoad + 1))
    } else {
      lazyLoadAdd = [].slice.call(this.items, first - this.perView * (this.settings.lazyLoad + 1), first)
    }
    lazyLoadAdd.forEach(item => {
      if (lazyLoadItems.indexOf(item) === -1) {
        lazyLoadItems.push(item)
      }
    })
    lazyLoadItems.forEach(item => {
      const lazyLoadObjects = item.querySelectorAll('[data-src]')
      lazyLoadObjects.forEach(obj => {
        obj.src = obj.dataset.src
        delete obj.dataset.src
      })
    })
    let maxHeight = 0
    this.track.style.height = 'auto'
    this.activeItems = [].slice.call(this.items, first, first + this.perView)
    this.activeItems.forEach(item => {
      item.classList.add(this.settings.activeClass)
      if (item.offsetHeight > maxHeight) {
        maxHeight = item.offsetHeight
      }
    })

    this.distance = -1 * first * this.itemWidth
    this.inTransition = true
    this.currentTransform = this._getTransform(this.distance, '%')
    this.track.style.transition = ''
    this.track.style.transform = this.currentTransform
    if (this.settings.autoHeight) {
      this.track.style.height = maxHeight + 'px'
    }

    if (this.bulletsContainer) {
      if (this.current < 0) {
        this.bullets[0].classList.add(this.settings.activeClass)
      } else if (this.current <= this.maxCurrent) {
        this.bullets[this.current].classList.add(this.settings.activeClass)
      } else {
        this.bullets[this.maxCurrent].classList.add(this.settings.activeClass)
      }
    }

    if (this.thumbsContainer) {
      [].forEach.call(this.thumbs, thumb => {
        thumb.classList.remove(this.settings.activeClass)
      })
      this.thumbs[this.current].classList.add(this.settings.activeClass)
    }

    clearTimeout(this.durationTimeout)
    if (this.current > this.prev) {
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
    this.durationTimeout = setTimeout(() => {
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

  goToPrev () {
    return this.goTo(this.current - this.settings.perSlide)
  }

  goToNext () {
    return this.goTo(this.current + this.settings.perSlide)
  }

  goToFirst () {
    return this.goTo(0)
  }

  goToLast () {
    return this.goTo(this.items.length - 1)
  }

  playCurrentVideo (reset) {
    const video = this.items[this.current].querySelector('video')
    if (video && video.readyState >= 2) {
      if (reset === true) {
        video.currentTime = 0
      }
      video.play()
    }
  }

  pauseVideos (reset) {
    [].forEach.call(this.videos, video => {
      video.pause()
      if (reset === true) {
        video.currentTime = 0
      }
    })
  }

  getAutoplayDuration () {
    const video = this.items[this.current].querySelector('video')
    if (video && video.dataset.duration) {
      return video.dataset.duration
    }
    return this.settings.autoplay
  }

  pauseAutoplay () {
    clearTimeout(this.autoplayTimeout)
    clearInterval(this.autoplayPositionInterval)
    return this
  }

  updateAutoplayPosition (position) {
    this.autoplayPosition = position;
    [].forEach.call(this.progressBars, (progress) => {
      if (progress.dataset.progress === 'width') {
        progress.style.width = this.getAutoplayProgress(position) + '%'
      } else {
        progress.style.setProperty('--value', this.getAutoplayProgress(position))
      }
    })
  }

  getAutoplayProgress (position) {
    return Math.min(Math.round(position / this.getAutoplayDuration() * 100), 100)
  }

  startAutoplay () {
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
        if (!this.settings.loop && this.current === this.items.length - 1) {
          this.pauseVideos()
          this.pauseAutoplay()
          return this
        }
        this.goToNext()
      }, this.getAutoplayDuration() - this.autoplayPosition)
    }
    return this
  }

  _getMoveTo () {
    const vRect = this.viewport.getBoundingClientRect()
    const tRect = this.track.getBoundingClientRect()
    const left = tRect.left - vRect.left
    let moveTo = -1;
    [].forEach.call(this.items, item => {
      const index = [].indexOf.call(this.items, item)
      if (item.offsetLeft < (left * -1)) {
        const nextItem = this.items[index + 1]
        if (nextItem && nextItem.offsetLeft > (left * -1)) {
          moveTo = this.moveDirection === 'prev' ? index : index + 1
        } else if (!nextItem) {
          moveTo = index
        }
      }
    })
    return moveTo
  }

  _getTransform (value, units) {
    if (!units) {
      units = 'px'
    }
    return 'translate3d(' + value + units + ',0,0)'
  }

  _click (e) {
    e.preventDefault()
  }

  _dragSwipe (e, type) {
    e.stopPropagation()
    if (!this.isMoving || !this.xDown || !this.yDown) {
      return
    }
    this.track.classList.add(this.settings.movingClass)
    this.xUp = type === 'drag' ? e.clientX : e.touches[0].clientX
    this.yUp = type === 'drag' ? e.clientY : e.touches[0].clientY
    if (this.xDown > this.xUp) {
      this.moveDirection = 'next'
    } else {
      this.moveDirection = 'prev'
    }
    this.xDiff = this.xDown - this.xUp
    this.yDiff = this.yDown - this.yUp
    if (Math.abs(this.xDiff) > Math.abs(this.yDiff)) {
      if (e.cancelable) {
        e.preventDefault()
      }
      const transform = this._getTransform(this.xDiff * -1)
      let canMove = true
      if (!this.settings.loop && ((this.current === this.items.length - 1 && this.xDiff > 0) || (this.current === 0 && this.xDiff < 0))) {
        canMove = false
      }
      if (canMove) {
        this.track.style.transition = 'none'
        this.track.style.transform = this.currentTransform + ' ' + transform
      }
    }
    this.viewport.addEventListener('click', this._click)
  }

  _dragSwipeEnd (e, type) {
    e.stopPropagation()
    const xDiff = Math.abs(this.xDiff)
    const yDiff = Math.abs(this.yDiff)
    let moveTo
    if (xDiff > yDiff && xDiff > this.settings.threshold) {
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
    this.xDown = 0
    this.yDown = 0
    this.xDiff = 0
    this.yDiff = 0
    this.viewport.removeEventListener('mousemove', this._dragHandler, false)
    this.viewport.removeEventListener('touchmove', this._swipeHandler, false)
    this.isMoving = false
  }

  _dragLeave (e) {
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

  _dragEnd (e) {
    return this._dragSwipeEnd(e, 'drag')
  }

  _swipeEnd (e) {
    return this._dragSwipeEnd(e, 'swipe')
  }

  _drag (e) {
    return this._dragSwipe(e, 'drag')
  }

  _swipe (e) {
    return this._dragSwipe(e, 'swipe')
  }

  _wheel (e) {
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
      const transform = this._getTransform(this.xDiff * -1)
      let canMove = true
      if (!this.settings.loop && ((this.current === this.items.length - 1 && this.xDiff > 0) || (this.current === 0 && this.xDiff < 0))) {
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

  mount () {
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

    this.videos = this.track.querySelectorAll('video');

    [].forEach.call(this.videos, video => {
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

    if (this.settings.autoplay > 0 && this.settings.autoplayVisible && window.IntersectionObserver) {
      this.autoplayObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
          if (entry.intersectionRatio < this.settings.autoplayThreshold) {
            this.pauseVideos()
            this.pauseAutoplay()
          } else {
            this.playCurrentVideo()
            this.startAutoplay()
          }
        })
      }, {
        threshold: this.settings.autoplayThreshold
      })
      this.autoplayObserver.observe(this.viewport)
    }

    [].forEach.call(this.thumbs, thumb => {
      const btn = thumb.querySelector('button')
      btn.addEventListener('click', () => {
        const idx = [].indexOf.call(this.thumbs, thumb)
        this.goTo(idx)
      })
    })

    this._dragHandler = this._drag.bind(this)
    this._dragEndHandler = this._dragEnd.bind(this)
    this._dragLeaveHandler = this._dragLeave.bind(this)
    this._wheelHandler = this._wheel.bind(this)

    this.viewport.addEventListener('mousedown', e => {
      e.preventDefault()
      e.stopPropagation()
      this.xDown = e.clientX
      this.yDown = e.clientY
      this.isMoving = true
      this.viewport.addEventListener('mousemove', this._dragHandler, false)
      this.viewport.addEventListener('mouseup', this._dragEndHandler, false)
      this.viewport.addEventListener('mouseleave', this._dragLeaveHandler, false)
    })

    if (this.settings.wheel) {
      this.viewport.addEventListener('wheel', this._wheelHandler, false)
    }

    this._swipeHandler = this._swipe.bind(this)
    this._swipeEndHandler = this._swipeEnd.bind(this)

    this.viewport.addEventListener('touchstart', e => {
      e.stopPropagation()
      this.xDown = e.touches[0].clientX
      this.yDown = e.touches[0].clientY
      this.isMoving = true
      this.viewport.addEventListener('touchmove', this._swipeHandler, false)
      this.viewport.addEventListener('touchend', this._swipeEndHandler, false)
    })

    this.prevButtons.forEach(item => {
      item.addEventListener('click', () => {
        this.goToPrev()
      })
    })
    this.nextButtons.forEach(item => {
      item.addEventListener('click', () => {
        this.goToNext()
      })
    })
    this.firstButtons.forEach(item => {
      item.addEventListener('click', () => {
        this.goToFirst()
      })
    })
    this.lastButtons.forEach(item => {
      item.addEventListener('click', () => {
        this.goToLast()
      })
    })

    this.goTo(this.settings.startAt)
    this.startAutoplay()

    this.slider.classList.add(this.settings.mountedClass)

    this.toggleEvent('mount')
  }

  unmount () {
    this.track.style = ''
    this.slider.classList.remove(this.settings.mountedClass)
    const clone = this.slider.cloneNode(true)
    this.slider.parentNode.replaceChild(clone, this.slider)
  }

  destroy () {
    this.unmount()
    delete (this.slider.xSlider)
  }
}
