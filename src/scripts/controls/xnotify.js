import { Notyf } from 'notyf'

export default class XNotify {
  constructor () {
    this.notyf = new Notyf({
      duration: 5000,
      dismissible: true,
      position: {
        x: 'center',
        y: 'top'
      },
      types: [
        {
          type: 'info',
          background: 'lightskyblue',
          icon: {
            className: 'notyf__icon--info',
            tagName: 'i'
          }
        },
        {
          type: 'warning',
          background: 'orange',
          icon: {
            className: 'notyf__icon--warning',
            tagName: 'i'
          }
        }
      ]
    })
  }

  success (message) {
    this.notyf.success(message)
  }

  error (message) {
    this.notyf.error(message)
  }

  warning (message) {
    this.notyf.open({
      type: 'warning',
      message
    })
  }

  info (message) {
    this.notyf.open({
      type: 'info',
      message
    })
  }

  dismissAll () {
    this.notyf.dismissAll()
  }
}
