import { render } from 'solid-js/web'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { onKeyDown, onKeyStroke, onKeyUp } from 'solidjs-use'
import {
  DEFAULT_LANG,
  NOTE_PARAM,
  USER_PARAM,
} from '../utilities/constants_shared.ts'

const params = (new URL(document.location)).searchParams
const [userLangCode] = createSignal(params.get(USER_PARAM) || DEFAULT_LANG)
const [noteLangCode] = createSignal(params.get(NOTE_PARAM) || DEFAULT_LANG)
const initialIndex = parseInt(params.get('idx') || 0)

function setParam(key, value) {
  const goto = new URL(document.location)
  goto.searchParams.set(key, value)
  window.location = goto
}

document.getElementById('user-lang').onchange = function () {
  setParam(USER_PARAM, this.value)
}
document.getElementById('note-lang').onchange = function () {
  setParam(NOTE_PARAM, this.value)
}

const [data] = createResource(
  () => [userLangCode(), noteLangCode()],
  async ([userLang, noteLang]) => {
    const response = await fetch(`/api/user/${userLang}/note/${noteLang}`)
    return response.json()
  },
  { initialValue: { strings: {}, notes: [] } },
)

function App() {
  let audioPlayer
  const [currIndex, setCurrIndex] = createSignal(initialIndex || 0)
  const [isFlipped, setFlipped] = createSignal(false)

  const currEmoji = () => data().notes[currIndex()]?.[0]
  const currAnswer = () => data().notes[currIndex()]?.[2]
  const currHints = () => (data().notes[currIndex()] || []).slice(3)

  const goPrevIndex = (e) => {
    e.preventDefault()
    setCurrIndex(() => Math.max(0, currIndex() - 1))
  }

  const goNextIndex = (e) => {
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
        <div class='note' onClick={goNextIndex}>
          <h1 class='question'>{currEmoji()}</h1>
          <div>
            <Show when={noteLangCode() && currAnswer()}>
              <audio
                ref={audioPlayer}
                type='audio/mpeg'
                src={`https://static.bpev.me/flashcards/${noteLangCode()}/audio/emoji_${noteLangCode()}_${currAnswer()}.mp3`}
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
                <Show when={currHints().filter((item) => item?.length).length}>
                  {currHints().map((item) => <h2>{item}</h2>)}
                </Show>
              </div>
            </div>
          </div>
        </div>
      </div>

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
            {/*todo: <optgroup> */}
            <For each={data().notes}>
              {(emoji, index) => <option value={index()}>{emoji[0]}</option>}
            </For>
          </select>
        </Show>
      </div>
    </>
  )
}

const app = document.getElementById('app')
app.innerHTML = ''

render(() => <App />, document.getElementById('app'))
