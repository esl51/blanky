import Noty from 'noty'

export default class XForm {
  constructor (elem, options) {
    this.settings = {
      submittingClass: 'xform--submitting',
      fieldClass: 'xform__field',
      fieldActivatedClass: 'xform__field--activated',
      inputClass: 'xform__input',
      fileClass: 'xform__file',
      fileValueClass: 'xform__file-value',
      fileValueActivatedClass: 'xform__file-value--activated',
      fileButtonClass: 'xform__file-button',
      errorClass: 'xform__error',
      securityClass: 'xform__security',
      resetOnSuccess: true,
      filePlaceholderText: '...',
      fileButtonText: '...',
      action: null,
      ajax: true
    }
    for (const attrname in options) {
      this.settings[attrname] = options[attrname]
    }

    this.form = elem
    for (const attrname in this.settings) {
      if (this.form.dataset[attrname] !== undefined) {
        if (this.form.dataset[attrname] === 'true') {
          this.settings[attrname] = true
        } else if (this.form.dataset[attrname] === 'false') {
          this.settings[attrname] = false
        } else {
          this.settings[attrname] = this.form.dataset[attrname]
        }
      }
    }

    if (this.settings.action == null) {
      this.settings.action = this.form.action
    }

    this.fields = this.form.querySelectorAll('.' + this.settings.fieldClass)
    this.inputs = this.form.querySelectorAll('.' + this.settings.inputClass)
    this.files = this.form.querySelectorAll('input[type=file]')
    this.submitButtons = this.form.querySelectorAll('button[type=submit]')

    this.fileApi = !!((window.File && window.FileReader && window.FileList && window.Blob))

    elem.xForm = this
  }

  toggleEvent (name) {
    const event = document.createEvent('CustomEvent')
    event.initEvent(name)
    this.form.dispatchEvent(event)
  }

  _inputChange (e) {
    const input = e.target
    const field = input.closest('.' + this.settings.fieldClass)
    if (input.value !== '' && !field.classList.contains(this.settings.fieldActivatedClass)) {
      field.classList.add(this.settings.fieldActivatedClass)
    } else if (input.value === '' && field.classList.contains(this.settings.fieldActivatedClass)) {
      field.classList.remove(this.settings.fieldActivatedClass)
    }
  }

  _fileChange (e) {
    const fileInput = e.target
    const fileWrapper = fileInput.closest('.' + this.settings.fileClass)
    const fileValue = fileWrapper.querySelector('.' + this.settings.fileValueClass)
    const fileButton = fileWrapper.querySelector('.' + this.settings.fileButtonClass)
    const field = fileInput.closest('.' + this.settings.fieldClass)
    let fileName
    if (this.fileApi && fileInput.files.length) {
      const files = fileInput.files
      const fileNames = []
      for (let i = 0; i < files.length; i++) {
        fileNames.push(fileInput.files[i].name)
      }
      fileName = fileNames.join(', ')
    } else {
      fileName = fileInput.value.replace('C:\\fakepath\\', '')
    }
    if (!fileName.length) {
      fileValue.innerText = this.filePlaceholderText
      fileValue.classList.remove(this.settings.fileValueActivatedClass)
      field.classList.remove(this.settings.fieldActivatedClass)
      return
    }
    if (fileValue.offsetWidth || fileValue.offsetHeight || fileValue.getClientRects().length) {
      fileValue.innerText = fileName
      fileValue.classList.add(this.settings.fileValueActivatedClass)
      field.classList.add(this.settings.fieldActivatedClass)
      fileButton.innerText = this.settings.fileButtonText
    } else {
      fileButton.innerText = fileName
    }
  }

  reset () {
    this.form.reset()
    this.inputs.forEach(input => {
      input.dispatchEvent(new CustomEvent('blur'))
    })
    this.files.forEach(fileInput => {
      fileInput.dispatchEvent(new CustomEvent('change'))
    })
  }

  submit () {
    return this._formSubmit()
  }

  getElementOffset (element) {
    const de = document.documentElement
    const box = element.getBoundingClientRect()
    const top = box.top + window.pageYOffset - de.clientTop
    const left = box.left + window.pageXOffset - de.clientLeft
    return { top: top, left: left }
  }

  readFiles (callback) {
    if (!this.fileApi) return null
    const rfiles = {}
    let filesCount = 0
    let filesReaded = 0
    this.files.forEach(fileInput => {
      const files = fileInput.files
      const curName = fileInput.name
      rfiles[curName] = []
      for (let i = 0; i < files.length; i++) {
        filesCount++
        const file = files[i]
        const reader = new FileReader()
        reader.file = {}
        reader.file.name = file.name
        reader.file.type = file.type
        reader.file.size = file.size
        reader.readAsDataURL(file)
        reader.onload = (event) => {
          rfiles[curName].push({
            name: event.target.file.name,
            type: event.target.file.type,
            size: event.target.file.size,
            data: event.target.result
          })
          filesReaded++
          if (filesReaded >= filesCount && typeof callback === 'function') {
            callback(rfiles)
          }
        }
      }
    })
    if (filesCount === 0 && typeof callback === 'function') {
      callback()
    }
  }

  sendForm (formData) {
    const errored = this.form.querySelectorAll('.' + this.settings.errorClass)
    errored.forEach(err => {
      err.remove()
    })

    const xhr = new XMLHttpRequest()
    xhr.open('post', this.settings.action)
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
    xhr.responseType = 'json'

    xhr.onload = () => {
      const data = xhr.response
      const error = data.error
      const errors = data.errors
      const hasErrors = (error && error.length) || (errors && Object.keys(errors).length > 0)
      if (hasErrors) {
        if (error && error.length) {
          new Noty({
            type: 'error',
            text: error
          }).show()
        }
        if (errors && Object.keys(errors).length > 0) {
          for (const field in errors) {
            if (Object.prototype.hasOwnProperty.call(errors, field)) {
              const input = this.form.querySelector('[name=' + field + ']')
              if (input) {
                errors[field].forEach(err => {
                  const errElem = document.createElement('div')
                  errElem.classList.add(this.settings.errorClass)
                  errElem.innerText = err
                  input.closest('.' + this.settings.fieldClass).appendChild(errElem)
                })
              }
            }
          }
          let fieldElem
          const errElem = this.form.querySelector('.' + this.settings.errorClass)
          if (errElem) {
            fieldElem = errElem.closest('.' + this.settings.fieldClass)
          }
          if (fieldElem) {
            const fieldOffsetTop = this.getElementOffset(fieldElem).top
            let scrollTop = fieldOffsetTop
            let scrollContainer = document.scrollingElement || document.documentElement
            const wrap = fieldElem.closest('.mfp-wrap')
            if (wrap) {
              const baseScrollTop = scrollContainer.scrollTop
              scrollContainer = wrap
              scrollTop = scrollContainer.scrollTop + fieldOffsetTop - baseScrollTop
            }
            //animatedScrollTo(scrollContainer, scrollTop, 300)
          }
        }
        this.toggleEvent('error')
      } else {
        const success = data.success
        if (this.settings.resetOnSuccess) {
          this.reset()
        }
        if (success) {
          new Noty({
            type: 'success',
            text: success
          }).show()
        }
        this.toggleEvent('success')
      }
    }

    xhr.onloadend = () => {
      if (this.securityInput) {
        this.securityInput.remove()
      }
      this.submitButtons.forEach(button => {
        button.disabled = false
      })
      this.form.classList.remove(this.settings.submittingClass)
      this.toggleEvent('complete')
    }

    xhr.onerror = () => {
      this.toggleEvent('error')
    }

    xhr.send(formData)
  }

  _formSubmit (e) {
    if (e && this.settings.ajax) {
      e.preventDefault()
    }
    const xform = this.form.querySelector('[name=xform]')
    if (!xform) {
      console.error('[xForm] input[name="xform"] not found')
    }

    this.securityInput = document.createElement('input')
    this.securityInput.classList.add(this.settings.securityClass)
    this.securityInput.type = 'hidden'
    this.securityInput.name = 'security'
    this.securityInput.value = '1'
    this.form.appendChild(this.securityInput)

    this.submitButtons.forEach(button => {
      button.disabled = true
    })

    this.toggleEvent('beforesubmit')
    this.form.classList.add(this.settings.submittingClass)

    if (this.settings.ajax) {
      const formData = new FormData(this.form)

      this.readFiles(files => {
        if (files !== undefined) {
          formData.append('files', JSON.stringify(files))
        }
        this.sendForm(formData)
      })

      return false
    }
  }

  mount () {
    this._inputChangeHandler = this._inputChange.bind(this)
    this._fileChangeHandler = this._fileChange.bind(this)
    this.inputs.forEach(input => {
      input.addEventListener('change', this._inputChangeHandler)
      input.addEventListener('input', this._inputChangeHandler)
      input.addEventListener('blur', this._inputChangeHandler)
      input.dispatchEvent(new CustomEvent('change'))
    })

    /* File inputs */
    this.files.forEach(fileInput => {
      const fileWrapper = document.createElement('div')
      fileWrapper.classList.add(this.settings.fileClass)
      fileInput.parentNode.insertBefore(fileWrapper, fileInput)

      const fileValue = document.createElement('span')
      fileValue.classList.add(this.settings.fileValueClass)
      fileValue.innerText = this.settings.filePlaceholderText
      fileWrapper.appendChild(fileValue)

      const fileButton = document.createElement('span')
      fileButton.classList.add(this.settings.fileButtonClass)
      fileButton.innerText = this.settings.fileButtonText
      fileWrapper.appendChild(fileButton)

      fileWrapper.appendChild(fileInput)

      fileInput.addEventListener('change', this._fileChangeHandler)
      fileInput.dispatchEvent(new CustomEvent('change'))
    })

    this._formSubmitHandler = this._formSubmit.bind(this)
    this.form.addEventListener('submit', this._formSubmitHandler)
    this.toggleEvent('mount')
  }

  unmount () {
    this.inputs.forEach(input => {
      input.removeEventListener('change', this._inputChangeHandler)
      input.removeEventListener('input', this._inputChangeHandler)
      input.removeEventListener('blur', this._inputChangeHandler)
    })
    this.files.forEach(fileInput => {
      fileInput.removeEventListener('change', this._fileChangeHandler)
      const fileWrapper = fileInput.closest('.' + this.settings.fileClass)
      const initialParent = fileInput.parentNode.parentNode
      initialParent.appendChild(fileInput)
      fileWrapper.remove()
    })
    this.fields.forEach(field => {
      field.classList.remove(this.settings.fieldActivatedClass)
    })
    this.form.removeEventListener('submit', this._formSubmitHandler)
  }

  destroy () {
    this.unmount()
    delete (this.form.xForm)
  }
}
