import { render } from 'solid-js/web'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { onKeyStroke, useNavigatorLanguage } from 'solidjs-use'
import {
  DEFAULT_LANG,
  NOTE_PARAM,
  USER_PARAM,
} from '../utilities/constants_shared.ts'
import locales from '../data/locales.js'
import { getAudioFilename } from '../utilities/data_access_utilities.ts'

const touchDevice = 'ontouchstart' in document.documentElement
const navigator = useNavigatorLanguage()

const browserLang = () =>
  locales.find((locale) => locale.locale_code === navigator.language())

const params = (new URL(document.location.toString())).searchParams
const [userLangCode, setUserLangCode] = createSignal(
  params.get(USER_PARAM) || browserLang()?.locale_code || DEFAULT_LANG,
)

const randomLang = () => {
  const noUserLang = locales.filter((l) => l.locale_code !== userLangCode())
  return noUserLang[Math.floor(Math.random() * noUserLang.length)]
}

const [noteLangCode, setNoteLangCode] = createSignal(
  params.get(NOTE_PARAM) || randomLang().locale_code,
)

function setParam(key: string, value: string) {
  const goto = new URL(document.location.toString())
  goto.searchParams.set(key, value)
  window.history.replaceState(null, '', goto)
}

const noteSelector = document.getElementById('note-lang')
if (noteSelector) {
  noteSelector.onchange = function () {
    const selector = (this as HTMLSelectElement).value
    if (selector) setNoteLangCode(selector)
  }
}

const userSelector = document.getElementById('user-lang')
if (userSelector) {
  userSelector.onchange = function () {
    const selector = (this as HTMLSelectElement).value
    if (selector) {
      const goto = new URL(document.location.toString())
      goto.searchParams.set(USER_PARAM, selector)
      window.location.assign(goto)
    }
  }
}

createEffect(() => {
  if (noteSelector) {
    ;(noteSelector as HTMLSelectElement).value = noteLangCode()
  }
  setParam(NOTE_PARAM, noteLangCode())
})

const initialIndex = parseInt(params.get('i') || '0')

const [data] = createResource(
  () => [userLangCode(), noteLangCode()],
  async ([userLang, noteLang]) => {
    const response = await fetch(`/api/user/${userLang}/note/${noteLang}`)
    return response.json()
  },
  { initialValue: { strings: {}, notes: [] } },
)

const flagIconElements = document.getElementsByClassName('flag-icon')
const downloadLink = document.getElementById(
  'download-link',
) as HTMLAnchorElement

createEffect(() => {
  if (data().flag && flagIconElements.length) {
    Array.prototype.forEach.call(
      flagIconElements,
      (el) => el.innerHTML = data().flag,
    )
  }

  if (noteLangCode() && downloadLink) {
    downloadLink.href =
      `https://static.bpev.me/flashcards/${noteLangCode()}/emoji-flashcards-${noteLangCode()}.apkg`
  }
})

function App() {
  let audioPlayer: HTMLAudioElement
  const [currIndex, setCurrIndex] = createSignal(initialIndex || 0)
  const [isFlipped, setFlipped] = createSignal(false)

  const currEmoji = () => data().notes[currIndex()]?.[0]
  const currAnswer = () => data().notes[currIndex()]?.[2]
  const currHints = () => (data().notes[currIndex()] || []).slice(3)
  const hasHints = () =>
    currHints()
      .filter((item: string) => item?.length).length
  const hintComponents = () =>
    currHints()
      .map((item: string) => <h2>{item}</h2>)

  const goPrevIndex = (e: Event) => {
    e.preventDefault()
    setCurrIndex(() => Math.max(0, currIndex() - 1))
  }

  const goNextIndex = (e: Event) => {
    e.preventDefault()
    const nextIndex = Math.min(data().notes.length, currIndex() + 1)
    if (nextIndex >= data().notes.length) return
    if (isFlipped()) {
      setCurrIndex(nextIndex)
    } else if (audioPlayer) audioPlayer.play()
    setFlipped(!isFlipped())
  }

  onKeyStroke(['ArrowLeft'], goPrevIndex, { dedupe: true })
  onKeyStroke(['ArrowRight', ' '], goNextIndex, { dedupe: true })

  createEffect(() => {
    setParam('i', String(currIndex() || 0))
  })

  const showOnFlip = () => `visibility: ${isFlipped() ? 'visible' : 'hidden'}`
  const hideOnFlip = () => `visibility: ${isFlipped() ? 'hidden' : 'visible'}`

  return (
    <>
      <div class='note-wrapper'>
        <div class='note' onClick={goNextIndex}>
          <h1 class='question'>{currEmoji()}</h1>
          <div>
            <Show when={noteLangCode() && currAnswer()}>
              <audio
                ref={(ref) => audioPlayer = ref}
                src={`https://static.bpev.me/flashcards/${noteLangCode()}/audio/${
                  getAudioFilename(noteLangCode(), currEmoji(), currAnswer())
                }`}
              />
            </Show>
            <div class='answer'>
              <h3 class='show-answer-tag' style={hideOnFlip()}>
                {data().strings['show-answer']}
              </h3>
              <h1 style={showOnFlip()}>{currAnswer()}</h1>
              <Show when={hasHints()}>
                <div style={showOnFlip()}>{hintComponents()}</div>
              </Show>
            </div>
          </div>
        </div>
      </div>

      <div style='text-align: center; padding: 10px;'>
        <Show when={data().notes.length}>
          <select
            name='current-note'
            value={currIndex()}
            onChange={(e) => {
              const index = parseInt(e.currentTarget.value)
              if (index >= 0 && index < data().notes.length) {
                setCurrIndex(index)
                setFlipped(false)
              }
            }}
          >
            <For each={data().categories}>
              {(category, index) => {
                type Emoji = { row: string[]; index: number }
                const options = () =>
                  data().notes
                    // map first to use original index
                    .map((row: string[], index: number) => ({ row, index }))
                    .filter(({ row }: Emoji) => (row[1] === category))
                return (
                  <optgroup label={category}>
                    <For each={options()}>
                      {(d) => <option value={d.index}>{d.row[0]}</option>}
                    </For>
                  </optgroup>
                )
              }}
            </For>
          </select>
        </Show>
      </div>
    </>
  )
}

const app = document.getElementById('app')
if (app) {
  app.innerHTML = ''
  render(() => <App />, app)
}

// If back button exists with js, use history for back to retain params
const buttons = document.getElementsByClassName('internal-link')
if (buttons.length) {
  Array.prototype.forEach.call(
    buttons,
    (button) => {
      button.onclick = (e: Event) => {
        e.preventDefault()
        window.location.href = button.href + '?' + params.toString()
      }
    },
  )
}
