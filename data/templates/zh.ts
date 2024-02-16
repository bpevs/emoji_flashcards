import Template from 'flashcards/models/template.ts'
import { hintButton, hintDisplay } from './default.js'

const pinyinButton = hintButton.replace(/{{hint}}/g, '{{pinyin}}')
const pinyinDisplay = hintDisplay.replace(/{{hint}}/g, '{{pinyin}}')

export default [
  new Template(
    'Listening',
    `{{audio}}<br>${pinyinButton}${pinyinDisplay}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{text}} ({{pinyin}})`,
  ),
  new Template(
    'Reading',
    `{{text}}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{audio}}<br>{{pinyin}}`,
  ),
  new Template(
    'Speaking',
    `<h1>{{emoji}}</h1>`,
    `{{FrontSide}}<hr id=answer>{{audio}}<br>${pinyinButton}<br>{{text}} ({{pinyin}})`,
  ),
]
