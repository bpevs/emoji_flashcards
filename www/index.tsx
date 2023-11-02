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

  onKeyStroke(['ArrowLeft'], goPrevIndex, { dedupe: true })
  onKeyStroke(['ArrowRight', ' '], goNextIndex, { dedupe: true })

  onKeyDown(({ key }) => {
    const element = document.querySelector('[data-keyboard-key="' + key + '"]')
    if (element) element.classList.add('active')
  })

  onKeyUp(({ key }) => {
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
          <Show when={!isFlipped()}>
            <h1 style='position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);'>
              {currEmoji()}
            </h1>
          </Show>
          <div style={`visibility: ${isFlipped() ? 'visible' : 'hidden'}`}>
            <h1>{currEmoji()}</h1>
            <audio
              ref={audioPlayer}
              type='audio/mpeg'
              src={`https://static.bpev.me/flashcards/${noteLangCode()}/audio/emoji_${noteLangCode()}_${currAnswer()}.mp3`}
            />
            <h1>
              <span style='font-size: 0.5em; vertical-align: super; visibility: hidden; padding: 2px 6px 3px 6px;'>
                🔊
              </span>
              {currAnswer()}
              <Show when={isFlipped() && audioPlayer}>
                <button
                  style='border: 0; background: none; cursor: pointer; font-size: 0.5em; vertical-align: super;'
                  onClick={() => audioPlayer.play()}
                >
                  🔊
                </button>
              </Show>
            </h1>
            <Show when={currHints().filter((item) => item?.length).length}>
            </Show>
            {currHints().map((item) => <h2>{item}</h2>)}
          </div>
        </div>
      </div>

      <div style='text-align: center;'>
        <button
          class='kbc-button kbc-button-xs'
          data-keyboard-key='ArrowLeft'
          disabled={currIndex() === 0}
          onClick={goPrevIndex}
        >
          ◀︎
        </button>
        <button
          class='kbc-button kbc-button-xs'
          data-keyboard-key=' '
          disabled={currIndex() === emojis().length}
          onClick={goNextIndex}
        >
          {isFlipped() ? strings()?.next : strings()?.['show-answer']}
        </button>
        <button
          class='kbc-button kbc-button-xs'
          data-keyboard-key='ArrowRight'
          disabled={currIndex() === emojis().length}
          onClick={goNextIndex}
        >
          ▶︎
        </button>
      </div>
    </>
  )
}

render(() => <App />, document.getElementById('app'))
