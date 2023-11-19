import { render } from 'solid-js/web'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import {
  onKeyDown,
  onKeyStroke,
  onKeyUp,
  useNavigatorLanguage,
} from 'solidjs-use'
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
  if (flagIconElements.length) {
    Array.prototype.forEach.call(
      flagIconElements,
      (el) => el.innerHTML = data().flag,
    )
  }

  if (downloadLink) {
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
  onKeyDown(true, ({ key }) => {
    const element = document.querySelector('[data-keyboard-key="' + key + '"]')
    if (element) element.classList.add('active')
  })
  onKeyUp(true, ({ key }) => {
    const element = document.querySelector('[data-keyboard-key="' + key + '"]')
    if (element) element.classList.remove('active')
  })

  createEffect(() => {
    setParam('i', String(currIndex() || 0))
  })

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
              <h3
                style={`
                visibility: ${isFlipped() ? 'hidden' : 'visible'};
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, 50%);
                opacity: 0.7;
                cursor: pointer;
              `}
              >
                {data().strings['show-answer']}
              </h3>
              <h1 style={`visibility: ${isFlipped() ? 'visible' : 'hidden'}`}>
                {currAnswer()}
              </h1>
              <div style={`visibility: ${isFlipped() ? 'visible' : 'hidden'}`}>
                <Show when={hasHints()}>{hintComponents()}</Show>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Touch device probably won't use keyboard? */}
      <Show when={!touchDevice}>
        <div style='text-align: center; user-select: none;'>
          <button
            class='kbc-button kbc-button-xs'
            data-keyboard-key='ArrowLeft'
            disabled={currIndex() <= 0}
            onClick={goPrevIndex}
          >
            ◀
          </button>
          <button
            class='kbc-button kbc-button-xs'
            data-keyboard-key=' '
            disabled={currIndex() >= (data().notes.length - 1)}
            onClick={goNextIndex}
          >
            space
          </button>
          <button
            class='kbc-button kbc-button-xs'
            data-keyboard-key='ArrowRight'
            disabled={currIndex() >= (data().notes.length - 1)}
            onClick={goNextIndex}
          >
            ▶
          </button>
        </div>
      </Show>
      <div style='text-align: center; padding-top: 10px;'>
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
                const options = () =>
                  data().notes
                    .map((emoji: string[], index: number) => ({ emoji, index }))
                    .filter((
                      { emoji }: { emoji: string[]; index: number },
                    ) => (emoji[1] === category))
                return (
                  <optgroup label={category}>
                    {
                      <For each={options()}>
                        {(data) => (
                          <option value={data.index}>{data.emoji[0]}</option>
                        )}
                      </For>
                    }
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
