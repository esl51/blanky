/* Menu */
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.js-menu-toggle')
  const menu = document.querySelector('.js-menu')
  if (toggle && menu) {
    toggle.addEventListener('change', () => {
      if (toggle.checked) {
        menu.classList.add('is-active')
      } else {
        menu.classList.remove('is-active')
      }
    })
  }
})
