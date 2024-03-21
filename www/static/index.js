const params = (new URL(document.location.toString())).searchParams

let userLangCode = params.get('user')
let noteLangCode = params.get('note')

if (!noteLangCode) {
  const notUserLangs = window.locales.filter((l) => l.locale_code !== userLangCode)
  const randomLang = notUserLangs[Math.floor(Math.random() * notUserLangs.length)]
  noteLangCode = randomLang?.locale_code
  setParam('note', noteLangCode, 'assign')
}

if (!userLangCode) {
  const browserLang = window.locales
    .find((l) => l.locale_code === navigator.language)?.locale_code
  userLangCode = browserLang || 'en-US'
  setParam('user', userLangCode, 'replace')
}

document.getElementById('note-lang-selector').onchange = function () {
  setParam('note', this.value, 'assign')
}

document.getElementById('user-lang-selector').onchange = function () {
  setParam('user', this.value, 'assign')
}

let categories = []
;(async function () {
  let index = parseInt(params.get('i') || '0')
  let audioEl, answerEl
  const noteEl = document.getElementById('note-stack')
  const noteSelectorWrapperEl = document.getElementById('note-selector-wrapper')

  const { data } = await (await fetch(
    '/api/data?' + new URLSearchParams({
      user: userLangCode,
      note: noteLangCode,
    }),
  )).json()
  const { notes } = data
  const categoriesSet = new Set()
  notes.forEach(([category]) => categoriesSet.add(category))
  categories = Array.from(categoriesSet)

  setCard()
  setSelector()

  noteEl.onclick = () => {
    if (answerEl.className.includes('hidden')) {
      answerEl.className = 'answer'
      audioEl.play()
    } else {
      setParam('i', ++index, 'replace')
      setCard()
      setSelector()
    }
  }

  function setCard() {
    const [_category, emoji, text, hint] = notes[index]
    const filename = getAudioFilename(noteLangCode, emoji, text)
    const audioURL = `https://static.bpev.me/flashcards/${noteLangCode}/audio/${filename}`

    noteEl.innerHTML = `
      <h1 id="question" class="question">${emoji}</h1>
      <div id="answer" class="answer hidden">
        ${hint ? '<p>' + hint + '</p>' : ''}
        <h2>${text}</h2>
        <audio id="note-audio" src="${audioURL}" />
      </div>
    `
    audioEl = document.getElementById('note-audio')
    answerEl = document.getElementById('answer')
  }

  function setSelector() {
    const categoryEls = categories.map((category) => {
      const options = notes
        .map((row, i) => ({ row, index: i })) // Save index pre-filtering
        .filter(({ row }) => (row[0] === category))
        .map((d) => {
          const selected = (d.index == index) ? 'selected' : ''
          return `<option value="${d.index}" ${selected}>${d.row[1]}</option>`
        })
      return `<optgroup label="${category}">${options}</optgroup>`
    })
    noteSelectorWrapperEl.innerHTML = `<select id="note-selector" name='current-note'>${categoryEls}</select>`

    document.getElementById('note-selector').onchange = (e) => {
      const nextIndex = parseInt(e.currentTarget.value)
      if (nextIndex >= 0 && nextIndex < notes.length) {
        index = nextIndex
        setParam('i', nextIndex, 'replace')
        setCard()
        setSelector()
      }
    }
  }
})()

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
