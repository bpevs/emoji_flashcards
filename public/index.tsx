import { render } from 'solid-js/web'
import { createEffect, createResource, createSignal, For, Show } from 'solid-js'
import { onKeyStroke } from 'npm:solidjs-use'

const langMap = {
  'ja': 'ja-JP',
  'en': 'en-US',
  'es': 'es-ES',
  'zh': 'zh-CN',
}

const selectUserLanguage = document.getElementById('switch-user-language')
const selectCardLanguage = document.getElementById('switch-card-language')
const downloadButton = document.getElementById('download')

const cardLang = (new URL(document.location)).searchParams.get('card')

const [cardLangCode, setCardLangCode] = createSignal(
  langMap[cardLang] || cardLang || 'en-US',
)

const [lang, { refetch }] = createResource(
  cardLangCode,
  async (code) => (await fetchLanguage(code)),
)

const data = () => (lang() || {}).data
const columns = () => ((lang() || {})?.columns || [])

const emojis = () => {
  if (!data()) return []
  let categories = Object.keys(data()).sort()
  return categories.map((category) => {
    return Object.keys(data()[category])
      .map((emoji) => [emoji, category, ...(data()[category][emoji])])
  }).flat(1)
}

selectUserLanguage.onchange = function () {
  const lang = this.value

  const goto = new URL(document.location)
  goto.searchParams.set('lang', lang.split('-')[0])

  window.location = goto
}

selectCardLanguage.onchange = function () {
  const lang = this.value

  const goto = new URL(document.location)
  goto.searchParams.set('card', lang.split('-')[0])

  window.location = goto
}

downloadButton.onclick = function () {
  download(`${cardLangCode()}.tsv`, langToTSV())
}

function download(filename, text) {
  var element = document.createElement('a')
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
  )
  element.setAttribute('download', filename)

  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()

  document.body.removeChild(element)
}

function langToTSV() {
  let str = ['emoji', 'category', ...columns()].join('\t') + '\n'

  emojis().forEach((card) => {
    const [emoji, category, ...other] = card
    const sub = [
      emoji,
      category,
      ...other,
    ].join('\t')
    str += `${sub}\n`
  })
  return str
}

function formatLine(str: string): string {
  return str.replace(/\t/g, ' ').replace(/\n/g, ' <br/> ')
}

async function fetchLanguage(langCode = 'en-US') {
  return await (await fetch(`/data/languages/${langCode}.json`)).json()
}

function App() {
  const [currIndex, setCurrIndex] = createSignal(0)

  const currEmoji = () => emojis()[currIndex()]?.[0]
  const currAnswer = () => emojis()[currIndex()]?.[2]
  const currOther = () => (emojis()[currIndex()] || []).slice(3)

  const [isFlipped, setFlipped] = createSignal(true)
  const [showCards, setShowCards] = createSignal(false)

  createEffect(() => {
    data()
    setCurrIndex(0)
    setFlipped(true)
  })

  onKeyStroke(['ArrowLeft'], (e) => {
    e.preventDefault()
    setCurrIndex(Math.max(0, currIndex() - 1))
  })

  onKeyStroke(['ArrowRight', ' '], (e) => {
    e.preventDefault()
    if (isFlipped()) {
      setCurrIndex(Math.min(emojis().length, currIndex() + 1))
      setFlipped(false)
    } else {
      setFlipped(true)
    }
  })

  return (
    <div>
      <div class='card-wrapper'>
        <div class='card'>
          <h1>{currEmoji()}</h1>
          <div style={`visibility: ${isFlipped() ? 'visible' : 'hidden'}`}>
            <h1>{currAnswer()}</h1>
            {currOther().map((item) => <h2>{item}</h2>)}
          </div>
        </div>
        <button
          disabled={currIndex() === emojis().length}
          onClick={() => {
            if (isFlipped()) {
              setCurrIndex(Math.min(emojis().length, currIndex() + 1))
              setFlipped(false)
            } else {
              setFlipped(true)
            }
          }}
        >
          {isFlipped() ? 'next card' : 'show answer'}
        </button>
      </div>

      {
        /*      <div style="text-align:center;">
        <a style="cursor: pointer; text-decoration: underline;" onClick={() => setShowCards(!showCards())}>
          {showCards() ? "Hide" : "Show All Cards"}
        </a>
      </div>

      <Show when={showCards()}>
        <table>
          <Row>
            <For each={columns()}>
              {(col) => <th>{col}</th>}
            </For>
          </Row>
          {emojis().map(([emoji, ...other], index) => (
            <tr class={"emoji-row" + (index === currIndex() ? " selected" : "") } onClick={() => setCurrIndex(index)}>
              <td>{emoji}</td>
              {other.map(item => <td>{item}</td>)}
            </tr>
          ))}
        </table>
      </Show>*/
      }
    </div>
  )
}

// function Row({ children }) {
//   return <tr>{children}</tr>
// }

render(() => <App />, document.getElementById('app'))
