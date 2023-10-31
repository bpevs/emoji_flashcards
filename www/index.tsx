import { render } from 'solid-js/web'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { onKeyStroke } from 'solidjs-use'
import {
  noteLangCodeParam,
  setNoteLangCodeParam,
  setUserLangCodeParam,
  userLangCodeParam,
} from './utilities/params.ts'
import downloadTSV from './utilities/download_tsv.ts'

const selectUserLanguage = document.getElementById('switch-user-language')
const selectNoteLanguage = document.getElementById('switch-note-language')
const downloadButton = document.getElementById('download')

selectUserLanguage.onchange = setUserLangCodeParam
selectNoteLanguage.onchange = setNoteLangCodeParam
downloadButton.onclick = () => downloadTSV(`${noteLangCode()}.tsv`, langToTSV())

const [noteLangCode] = createSignal(noteLangCodeParam)
const [userLangCode] = createSignal(userLangCodeParam)

const [noteLang] = createResource(noteLangCode, (code) => fetchLanguage(code))
const [userLang] = createResource(userLangCode, (code) => fetchLanguage(code))

const data = () => (noteLang() || {}).data
const columns = () => ((noteLang() || {})?.columns || [])
const strings = () => ((userLang() || {})?.strings || [])

const emojis = () => {
  if (!data()) return []
  const categories = Object.keys(data()).sort()
  return categories.map((category) => {
    return Object.keys(data()[category])
      .map((emoji) => [emoji, category, ...(data()[category][emoji])])
  }).flat(1)
}

function langToTSV() {
  let str = ['emoji', 'category', ...columns()].join('\t') + '\n'
  emojis().forEach(([emoji, category, ...other]) => {
    const sub = [emoji, category, ...other].join('\t')
    str += `${sub}\n`
  })
  return str
}

async function fetchLanguage(langCode = 'en-US') {
  return await (await fetch(`/data/languages/${langCode}.json`)).json()
}

function App() {
  let audioPlayer
  const [currIndex, setCurrIndex] = createSignal(0)
  const [isFlipped, setFlipped] = createSignal(false)

  const currEmoji = () => emojis()[currIndex()]?.[0]
  const currAnswer = () => emojis()[currIndex()]?.[2]
  const currHints = () => (emojis()[currIndex()] || []).slice(3)

  const goPrevIndex = (e) => {
    e.preventDefault()
    setCurrIndex(() => Math.max(0, currIndex() - 1))
  }

  const goNextIndex = (e) => {
    e.preventDefault()
    if (isFlipped()) setCurrIndex(Math.min(emojis().length, currIndex() + 1))
    else if (audioPlayer) audioPlayer.play()
    setFlipped(!isFlipped())
  }

  createEffect(function defaultState() {
    data()
    setCurrIndex(0)
  })

  onKeyStroke(['ArrowLeft'], goPrevIndex)
  onKeyStroke(['ArrowRight', ' '], goNextIndex)

  return (
    <div class='note-wrapper'>
      <div class='note'>
        <h1>{currEmoji()}</h1>
        <div style={`visibility: ${isFlipped() ? 'visible' : 'hidden'}`}>
          <audio
            ref={audioPlayer}
            type='audio/mpeg'
            src={`https://static.bpev.me/flashcards/${noteLangCode()}/audio/emoji_${noteLangCode()}_${currAnswer()}.mp3`}
          />
          <h1>
            {currAnswer()}
          </h1>
          {currHints().map((item) => <h2>{item}</h2>)}
        </div>
        <div style='position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%)'>
          <button
            disabled={currIndex() === emojis().length}
            onClick={goNextIndex}
          >
            {isFlipped() ? strings()?.next : strings()?.['show-answer']}
          </button>
          <Show when={isFlipped() && audioPlayer}>
            <button
              style='border: 0; background: none; cursor: pointer;'
              onClick={() => audioPlayer.play()}
            >
              🔉
            </button>
          </Show>
        </div>
      </div>
    </div>
  )
}

render(() => <App />, document.getElementById('app'))
