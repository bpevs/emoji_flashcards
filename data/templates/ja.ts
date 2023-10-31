import { hintButton, hintDisplay } from './default.js'

const romajiButton = hintButton.replace(/{{Hint}}/g, '{{Romaji}}')
const romajiDisplay = hintDisplay.replace(/{{Hint}}/g, '{{Romaji}}')

export default [
  {
    name: 'Listening',
    qfmt: `{{Audio}}<br>${romajiButton}${romajiDisplay}`,
    afmt:
      `{{FrontSide}}<hr id=answer><h1>{{Emoji}}</h1><br>{{Text}} ({{Romaji}})`,
  },
  {
    name: 'Reading',
    qfmt: `{{Text}}`,
    afmt:
      `{{FrontSide}}<hr id=answer><h1>{{Emoji}}</h1><br>{{Audio}}<br>{{Romaji}}`,
  },
  {
    name: 'Speaking',
    qfmt: `<h1>{{Emoji}}</h1>`,
    afmt:
      `{{FrontSide}}<hr id=answer>{{Audio}}<br>${romajiButton}<br>{{Text}} ({{Romaji}})`,
  },
]
