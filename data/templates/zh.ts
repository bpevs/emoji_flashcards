import { hintButton, hintDisplay } from './default.js'

const pinyinButton = hintButton.replace(/{{Hint}}/g, '{{Pinyin}}')
const pinyinDisplay = hintDisplay.replace(/{{Hint}}/g, '{{Pinyin}}')

export default [
  {
    name: 'Listening',
    qfmt: `{{Audio}}<br>${pinyinButton}${pinyinDisplay}`,
    afmt:
      `{{FrontSide}}<hr id=answer><h1>{{Emoji}}</h1><br>{{Text}} ({{Pinyin}})`,
  },
  {
    name: 'Reading',
    qfmt: `{{Text}}`,
    afmt:
      `{{FrontSide}}<hr id=answer><h1>{{Emoji}}</h1><br>{{Audio}}<br>{{Pinyin}}`,
  },
  {
    name: 'Speaking',
    qfmt: `<h1>{{Emoji}}</h1>`,
    afmt:
      `{{FrontSide}}<hr id=answer>{{Audio}}<br>${pinyinButton}<br>{{Text}} ({{Pinyin}})`,
  },
]
