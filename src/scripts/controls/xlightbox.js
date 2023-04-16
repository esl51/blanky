import GLightbox from 'glightbox'

export default class XLightbox {
  constructor (options) {
    this.settings = {
      loop: true,
      autoplayVideos: true
    }
    for (const attrname in options) {
      this.settings[attrname] = options[attrname]
    }
  }

  mount () {
    this.lightbox = new GLightbox(this.settings)
  }
}
