import { Template } from '@flashcard/core'
import { hintButton, hintDisplay } from './default.js'

const hiraganaButton = hintButton.replace(/{{hint}}/g, '{{hiragana}}')
const hiraganaDisplay = hintDisplay.replace(/{{hint}}/g, '{{hiragana}}')

export default [
  new Template(
    'Listening',
    `{{audio}}<br>${hiraganaButton}${hiraganaDisplay}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{text}} ({{hiragana}})`,
  ),
  new Template(
    'Reading',
    `{{text}}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{audio}}<br>{{hiragana}}`,
  ),
  new Template(
    'Speaking',
    `<h1>{{emoji}}</h1>`,
    `{{FrontSide}}<hr id=answer>{{audio}}<br>${hiraganaButton}<br>{{text}} ({{hiragana}})`,
  ),
]
