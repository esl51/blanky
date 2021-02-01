import animateScrollTo from 'animated-scroll-to'

/* Scroll to target */
export function scrollTo (target, duration, callback) {
  if (typeof target === 'string') {
    target = document.querySelector(target)
  }
  if (!target) {
    return
  }
  if (typeof duration === 'function') {
    callback = duration
    duration = 300
  }
  if (typeof duration === 'undefined') {
    duration = 300
  }
  animateScrollTo(target, {
    speed: duration,
    // easeInOutQuad
    // https://gist.github.com/gre/1650294
    easing: t => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }).then(() => {
    if (typeof callback === 'function') {
      callback()
    }
  })
}

/* Show preloader */
export function showPreloader (duration, callback) {
  if (typeof duration === 'function') {
    callback = duration
    duration = 500
  }
  if (typeof duration === 'undefined') {
    duration = 500
  }
  const preloader = document.querySelector('.preloader')
  if (preloader) {
    if (typeof callback === 'function') {
      setTimeout(() => {
        callback()
      }, duration)
    }
    preloader.style.transition = 'opacity ' + duration + 'ms'
    preloader.style.opacity = '1'
  }
}

/* Hide preloader */
export function hidePreloader (duration, callback) {
  if (typeof duration === 'function') {
    callback = duration
    duration = 500
  }
  if (typeof duration === 'undefined') {
    duration = 500
  }
  const preloader = document.querySelector('.preloader')
  if (preloader) {
    if (typeof callback === 'function') {
      setTimeout(() => {
        callback()
      }, duration)
    }
    preloader.style.transition = 'opacity ' + duration + 'ms'
    preloader.style.opacity = '0'
  }
}

/* Detect IE */
export function detectIE () {
  const ua = window.navigator.userAgent

  const msie = ua.indexOf('MSIE ')
  if (msie > 0) {
    // IE 10 or older => return version number
    return parseInt(ua.substring(msie + 5, ua.indexOf('.', msie)), 10)
  }

  const trident = ua.indexOf('Trident/')
  if (trident > 0) {
    // IE 11 => return version number
    const rv = ua.indexOf('rv:')
    return parseInt(ua.substring(rv + 3, ua.indexOf('.', rv)), 10)
  }

  const edge = ua.indexOf('Edge/')
  if (edge > 0) {
    // Edge (IE 12+) => return version number
    return parseInt(ua.substring(edge + 5, ua.indexOf('.', edge)), 10)
  }

  // other browser
  return false
}

/* Generate ID */
export function makeId (length) {
  length = length === undefined ? 8 : length
  let text = ''
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length))
  }

  return text
}

/* Set cookie */
export function setCookie (name, value, days) {
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    expires = '; expires=' + date.toUTCString()
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/'
}

/* Get cookie */
export function getCookie (name) {
  const nameEQ = name + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === ' ') {
      c = c.substring(1, c.length)
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length)
    }
  }
  return null
}

/* Erase cookie */
export function eraseCookie (name) {
  document.cookie = name + '=; Max-Age=-99999999;'
}
