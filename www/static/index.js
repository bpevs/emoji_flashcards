const params = (new URL(document.location.toString())).searchParams
const initialIndex = parseInt(params.get('i') || '0')
const userLangCode = params.get('user') || browserLang()?.locale_code || 'en-US'
const noteLangCode = params.get('note') || randomLang().locale_code

if (!params.get('user') || !params.get('note')) {
  setParam('user', userLangCode, 'replace')
  setParam('note', noteLangCode, 'assign')
}

const noteSelector = document.getElementById('note-lang-selector')
noteSelector.onchange = function () {
  setParam('note', this.value, 'assign')
}

const userSelector = document.getElementById('user-lang-selector')
userSelector.onchange = function () {
  setParam('user', this.value, 'assign')
}
;(async function () {
  let index = initialIndex
  let audioEl, answerEl
  const noteEl = document.getElementById('note-stack')
  const noteSelectorWrapperEl = document.getElementById('note-selector-wrapper')

  const data = await (await fetch(
    '/api/data?' + new URLSearchParams({
      user: userLangCode,
      note: noteLangCode,
    }),
  )).json()

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
    const [emoji, _translation, text, hint] = data.notes[index]
    const filename = getAudioFilename(noteLangCode, emoji, text)
    const audioURL = `https://static.bpev.me/flashcards/${noteLangCode}/audio/${filename}`

    noteEl.innerHTML = `
      <h1 id="question" class="question">${emoji}</h1>
      <div id="answer" class="answer hidden">
        <h2>${text}</h2>
        ${hint ? '<p>' + hint + '</p>' : ''}
        <audio id="note-audio" src="${audioURL}" />
      </div>
    `
    audioEl = document.getElementById('note-audio')
    answerEl = document.getElementById('answer')
  }

  function setSelector() {
    const categories = data.categories.map((category) => {
      const options = data.notes
        .map((row, i) => ({ row, index: i }))
        .filter(({ row }) => (row[1] === category))
        .map((d) => {
          const selected = (d.index == index) ? 'selected' : ''
          return `<option value="${d.index}" ${selected}>${d.row[0]}</option>`
        })
      return `<optgroup label="${category}">${options}</optgroup>`
    })
    noteSelectorWrapperEl.innerHTML = `<select id="note-selector" name='current-note'>${categories}</select>`

    document.getElementById('note-selector').onchange = (e) => {
      const nextIndex = parseInt(e.currentTarget.value)
      if (nextIndex >= 0 && nextIndex < data.notes.length) {
        index = nextIndex
        setParam('i', nextIndex, 'replace')
        setCard()
        setSelector()
      }
    }
  }
})()

function browserLang() {
  return window.locales.find((locale) => locale.locale_code === navigator.language)
}

function randomLang() {
  const noUserLang = window.locales.filter((l) => l.locale_code !== userLangCode)
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
