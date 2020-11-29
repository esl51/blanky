import ymaps from 'ymaps'

export default class XMap {
  constructor (elem, options) {
    this.settings = {
      zoom: 15,
      lat: 37.618552,
      lng: 55.756895,
      markersSelector: null,
      autoHeight: true,
      icon: null,
      iconSize: null,
      iconOffset: null,
      language: 'en_US'
    }
    for (const attrname in options) {
      this.settings[attrname] = options[attrname]
    }

    this.container = elem
    for (const attrname in this.settings) {
      if (this.container.dataset[attrname] !== undefined) {
        if (this.container.dataset[attrname] === 'true') {
          this.settings[attrname] = true
        } else if (this.container.dataset[attrname] === 'false') {
          this.settings[attrname] = false
        } else if (attrname === 'iconSize' || attrname === 'iconOffset') {
          this.settings[attrname] = JSON.parse(this.container.dataset[attrname])
        } else {
          this.settings[attrname] = this.container.dataset[attrname]
        }
      }
    }

    this.markerElements = []
    if (this.settings.markersSelector) {
      this.markerElements = this.container.querySelectorAll(this.settings.markersSelector)
    } else {
      this.markerElements = this.container.children
    }

    this.markers = []

    elem.xMap = this
  }

  toggleEvent (name) {
    const event = document.createEvent('Event')
    event.initEvent(name, true, true)
    this.container.dispatchEvent(event)
  }

  loadMarkers () {
    [].forEach.call(this.markerElements, item => {
      const markerOptions = {}
      const icon = item.dataset.icon || this.settings.icon
      const iconSize = item.dataset.iconSize ? JSON.parse(item.dataset.iconSize) : this.settings.iconSize
      const iconOffset = item.dataset.iconOffset ? JSON.parse(item.dataset.iconOffset) : this.settings.iconOffset
      if (icon && iconSize && iconOffset) {
        markerOptions.iconLayout = 'default#image'
        markerOptions.iconImageHref = icon
        markerOptions.iconImageSize = iconSize
        markerOptions.iconImageOffset = iconOffset
      }
      const marker = new this.ymaps.Placemark([item.dataset.lat, item.dataset.lng], {
        hintContent: item.dataset.title,
        balloonContentBody: item.innerHTML,
        balloonContentHeader: item.dataset.title
      }, markerOptions)
      this.markers.push(marker)
      item.style.display = 'none'
    })
  }

  initMap () {
    this.ymap = new this.ymaps.Map(this.container.id, {
      center: [this.settings.lat, this.settings.lng],
      zoom: this.settings.zoom
    });
    [].forEach.call(this.markers, item => {
      this.ymap.geoObjects.add(item)
    })
    this.ymap.behaviors.disable('scrollZoom')
    this.ymap.controls.remove('trafficControl')
    this.ymap.controls.remove('searchControl')
    this.ymap.controls.remove('rulerControl')
    this.ymap.controls.remove('typeSelector')
  }

  refresh () {
    if (this.settings.autoHeight) {
      this.container.style.height = ''
      const maxHeight = Math.round(document.documentElement.clientHeight * 0.6)
      if (this.container.offsetHeight > maxHeight) {
        this.container.style.height = maxHeight + 'px'
      }
    }
    this.ymap.container.fitToViewport()
  }

  async mount () {
    this.container.id = this.container.id || 'map-' + Math.random().toString(36).substr(2, 10)
    this.toggleEvent('mount')
    this.resizeTimout = null
    this.ymaps = await ymaps.load('https://api-maps.yandex.ru/2.1/?lang=' + this.settings.language)
    this.loadMarkers()
    this.initMap()
    this.refresh()
    window.xMapInstance = this
  }

  unmount () {
    this.container.id = ''
    this.container.style.height = '';
    [].forEach.call(this.markerElements, item => {
      item.style.display = ''
    })
    this.ymap.destroy()
  }

  destroy () {
    this.unmount()
    delete (this.container.xMap)
  }
}
