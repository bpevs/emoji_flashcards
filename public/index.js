console.log('js')

const selectEl = document.getElementById('switch-language')

selectEl.onchange = function () {
  const lang = this.value

  const goto = new URL(document.location)
  goto.searchParams.set('lang', lang.split('-')[0])

  window.location = goto
}
