const params = (new URL(document.location.toString())).searchParams
const index = parseInt(params.get('i') || '0')
const userLangCode = params.get('user') || browserLang()?.locale_code || 'en-US'
const noteLangCode = params.get('note') || randomLang().locale_code

const noteSelector = document.getElementById('note-lang-selector')
noteSelector.onchange = function () {
  setParam('note', this.value, 'assign')
}

const userSelector = document.getElementById('user-lang-selector')
userSelector.onchange = function () {
  setParam('user', this.value, 'assign')
}
;(async function () {
  const dataURL = '/api/data?' + new URLSearchParams({
    user: userLangCode,
    note: noteLangCode,
  })
  const data = await (await fetch(dataURL)).json()
  const [emoji, _translation, text] = data.notes[index]
  const filename = getAudioFilename(noteLangCode, emoji, text)
  const audioURL =
    `https://static.bpev.me/flashcards/${noteLangCode}/audio/${filename}`
  document.getElementById('note-stack').innerHTML = `
    <h1>${emoji}</h1>
    <h2>${text}</h2>
    <audio class="note-audio" autoplay controls src="${audioURL}"></audio>
    <button class="note-next">
      next
    </button>
  `
  document.getElementsByClassName('note-audio')[0].play()
  document.getElementsByClassName('note-next')[0].onclick = function () {
    setParam('i', index + 1, 'assign')
  }
})()

function browserLang() {
  return locales.find((locale) => locale.locale_code === navigator.language)
}

function randomLang() {
  const noUserLang = locales.filter((l) => l.locale_code !== userLangCode)
  return noUserLang[Math.floor(Math.random() * noUserLang.length)]
}

function setParam(key, value, method) {
  if (!value) return
  const goto = new URL(document.location.toString())
  goto.searchParams.set(key, value)
  if (method === 'replace') window.history.replaceState(null, '', goto)
  else if (method === 'assign') window.location.assign(goto)
}

function getAudioFilename(language, emoji, text) {
  const illegalRe = /[\/\?<>\\:\*\|"]/g
  // deno-lint-ignore no-control-regex
  const controlRe = /[\x00-\x1f\x80-\x9f]/g
  const reservedRe = /^\.+$/
  const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
  const windowsTrailingRe = /[\. ]+$/
  const replacement = ''
  return `${language}_${emoji}_${text}.mp3`
    .toLowerCase()
    .normalize('NFC')
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement)
    .replace(/(\,|\;|\:|\s|\(|\))+/g, '-')
}
