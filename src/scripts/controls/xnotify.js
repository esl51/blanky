import { Notyf } from 'notyf'

export default class XNotify {
  constructor() {
    this.notyf = new Notyf({
      duration: 5000,
      dismissible: true,
      position: {
        x: 'center',
        y: 'top',
      },
      types: [
        {
          type: 'success',
          background: 'var(--success-color)',
          icon: {
            className: 'notyf__icon--success',
            tagName: 'i',
          },
        },
        {
          type: 'error',
          background: 'var(--danger-color)',
          icon: {
            className: 'notyf__icon--error',
            tagName: 'i',
          },
        },
        {
          type: 'warning',
          background: 'var(--orange-color)',
          icon: {
            className: 'notyf__icon--warning',
            tagName: 'i',
          },
        },
        {
          type: 'info',
          background: 'var(--info-color)',
          icon: {
            className: 'notyf__icon--info',
            tagName: 'i',
          },
        },
      ],
    })
  }

  success(message, duration) {
    this.notyf.open({
      type: 'success',
      message,
      duration,
    })
  }

  error(message, duration) {
    this.notyf.open({
      type: 'error',
      message,
      duration,
    })
  }

  warning(message, duration) {
    this.notyf.open({
      type: 'warning',
      message,
      duration,
    })
  }

  info(message, duration) {
    this.notyf.open({
      type: 'info',
      message,
      duration,
    })
  }

  dismissAll() {
    this.notyf.dismissAll()
  }
}

export const xnotify = new XNotify()
