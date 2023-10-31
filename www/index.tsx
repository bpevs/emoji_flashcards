import { render } from 'solid-js/web'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { onKeyDown, onKeyStroke, onKeyUp } from 'solidjs-use'
import {
  idxParam,
  noteLangCodeParam,
  setNoteLangCodeParam,
  setUserLangCodeParam,
  userLangCodeParam,
} from './utilities/params.ts'

const selectUserLanguage = document.getElementById('user-lang')
const selectNoteLanguage = document.getElementById('note-lang')

selectUserLanguage.onchange = setUserLangCodeParam
selectNoteLanguage.onchange = setNoteLangCodeParam

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

async function fetchLanguage(langCode = 'en-US') {
  return await (await fetch(`/data/languages/${langCode}.json`)).json()
}

function App() {
  let audioPlayer
  const [currIndex, setCurrIndex] = createSignal(idxParam || 0)
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

  onKeyStroke(['ArrowLeft'], goPrevIndex, { dedupe: false })
  onKeyStroke(['ArrowRight', ' '], goNextIndex, { dedupe: false })

  onKeyDown((ev) => {
    const key = ev.key
    const element = document.querySelector('[data-keyboard-key="' + key + '"]')
    if (element) element.classList.add('active')
  })

  onKeyUp((ev) => {
    const key = ev.key
    const element = document.querySelector('[data-keyboard-key="' + key + '"]')
    if (element) element.classList.remove('active')
  })

  createEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('idx', currIndex() || 0)
    window.history.replaceState(null, null, url)
  })

  return (
    <>
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
                🔊
              </button>
            </Show>
          </div>
        </div>
      </div>
      <link
        rel='stylesheet'
        href='https://unpkg.com/keyboard-css@1.2.4/dist/css/main.min.css'
      />
      <div style='text-align: center;'>
        <button class='kbc-button kbc-button-xs' data-keyboard-key=' '>
          space
        </button>
        <button class='kbc-button kbc-button-xs' data-keyboard-key='ArrowLeft'>
          ◀︎
        </button>
        <button class='kbc-button kbc-button-xs' data-keyboard-key='ArrowRight'>
          ▶︎
        </button>
      </div>
    </>
  )
}

render(() => <App />, document.getElementById('app'))
