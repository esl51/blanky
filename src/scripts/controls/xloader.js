export default class XLoader {
  constructor (elem, options) {
    this.settings = {
      url: null,
      itemsSelector: null,
      toggleSelector: null,
      filterFormSelector: null,
      disableToggle: true,
      loadingClass: 'is-loading',
      finishedClass: 'is-finished',
      deletingClass: 'is-deleting',
      loadOnMount: true,
      clearAfterLoad: false,
      append: true
    }
    for (const attrname in options) {
      this.settings[attrname] = options[attrname]
    }

    if (!this.settings.url) {
      this.settings.url = location.href
    }

    this.container = elem
    for (const attrname in this.settings) {
      if (this.container.dataset[attrname] !== undefined) {
        if (this.container.dataset[attrname] === 'true') {
          this.settings[attrname] = true
        } else if (this.container.dataset[attrname] === 'false') {
          this.settings[attrname] = false
        } else {
          this.settings[attrname] = this.container.dataset[attrname]
        }
      }
    }

    if (this.container.dataset.items) {
      this.settings.itemsSelector = this.container.dataset.items
    }
    if (this.container.dataset.toggle) {
      this.settings.toggleSelector = this.container.dataset.toggle
    }
    if (this.container.dataset.filterForm) {
      this.settings.filterFormSelector = this.container.dataset.filterForm
    }

    elem.xLoader = this
  }

  refreshParams () {
    let params = {}
    if (this.container.dataset.params) {
      params = JSON.parse(this.container.dataset.params)
    }
    params.start = this.items ? this.items.length : 0
    this.params = Object.keys(params).map(k => {
      return encodeURIComponent(k) + '=' + encodeURIComponent(params[k])
    }).join('&')
    if (this.filterForm) {
      const formData = new FormData(this.filterForm)
      const filters = [...formData.entries()].map(k => {
        return encodeURIComponent(k[0]) + '=' + encodeURIComponent(k[1])
      }).join('&')
      if (filters) {
        this.params += '&' + filters
      }
    }
  }

  toggleEvent (name) {
    const event = document.createEvent('CustomEvent')
    event.initEvent(name, true, true)
    this.container.dispatchEvent(event)
  }

  loadItems () {
    if (this.settings.itemsSelector) {
      this.items = this.container.querySelectorAll(this.settings.itemsSelector)
    } else {
      this.items = this.container.querySelectorAll(':scope > *')
    }
  }

  markForClear () {
    this.loadItems();
    [].forEach.call(this.items, item => {
      item.classList.add(this.settings.deletingClass)
    })
  }

  clearMarked () {
    this.loadItems();
    [].forEach.call(this.items, item => {
      if (item.classList.contains(this.settings.deletingClass)) {
        item.remove()
      }
    })
    this.toggleEvent('clear')
  }

  clear () {
    this.loadItems();
    [].forEach.call(this.items, item => {
      item.remove()
    })
    this.toggleEvent('clear')
  }

  reload () {
    if (this.settings.clearAfterLoad) {
      this.markForClear()
    } else {
      this.clear()
    }
    this.load()
  }

  beforeLoad () {
    this.container.classList.remove(this.settings.finishedClass)
    this.container.classList.add(this.settings.loadingClass)
    if (this.filterForm) {
      this.filterForm.classList.add(this.settings.loadingClass)
    }
    this.toggles.forEach(item => {
      if (this.settings.disableToggle) {
        item.disabled = true
      }
      item.classList.add(this.settings.loadingClass)
    })
    this.toggleEvent('beforeLoad')
  }

  afterLoad () {
    this.container.classList.remove(this.settings.loadingClass)
    if (this.filterForm) {
      this.filterForm.classList.remove(this.settings.loadingClass)
    }
    this.toggles.forEach(item => {
      if (this.settings.disableToggle) {
        item.disabled = false
      }
      item.classList.remove(this.settings.loadingClass)
    })
    this.toggleEvent('afterLoad')
  }

  afterFinish () {
    this.container.classList.add(this.settings.finishedClass)
    if (this.filterForm) {
      this.filterForm.classList.add(this.settings.loadingClass)
    }
    this.toggles.forEach(item => {
      if (this.settings.disableToggle) {
        item.disabled = true
      }
      item.classList.add(this.settings.finishedClass)
    })
    this.toggleEvent('finish')
  }

  load () {
    this.loadItems()
    if (!this.settings.append) {
      if (this.settings.clearAfterLoad) {
        this.markForClear()
      } else {
        this.clear()
      }
    }

    this.refreshParams()

    let url = this.settings.url
    if (url.indexOf('?') > -1) {
      url += '&' + this.params
    } else {
      url += '?' + this.params
    }

    this.beforeLoad()

    const xhr = new XMLHttpRequest()
    xhr.open('get', url)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    xhr.responseType = 'json'

    xhr.onload = () => {
      const data = xhr.response
      if (data.html) {
        this.loadItems()
        if (this.items.length) {
          this.items[this.items.length - 1].insertAdjacentHTML('afterend', data.html)
        } else {
          this.container.insertAdjacentHTML('afterbegin', data.html)
        }
        this.toggleEvent('load')
      }
      if (!this.settings.append && this.settings.clearAfterLoad) {
        this.clearMarked()
      }
      this.afterLoad()
      if (data.last) {
        this.afterFinish()
      }
    }

    xhr.onerror = () => {
      this.toggleEvent('error')
    }

    xhr.send()

    return this
  }

  bind () {
    this.toggles = document.querySelectorAll(this.settings.toggleSelector)
    this.filterForm = document.querySelector(this.settings.filterFormSelector)

    this.toggles.forEach(item => {
      item.addEventListener('click', () => {
        this.load()
      })
    })

    if (this.filterForm) {
      this.filterForm.addEventListener('change', () => {
        this.reload()
      })
    }
  }

  mount () {
    this.toggleEvent('mount')
    this.bind()

    if (this.settings.loadOnMount) {
      this.load()
    }
  }
}
