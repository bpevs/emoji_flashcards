import Template from 'flashcards/models/template.ts'
import { hintButton, hintDisplay } from './default.js'

const romajiButton = hintButton.replace(/{{hint}}/g, '{{romaji}}')
const romajiDisplay = hintDisplay.replace(/{{hint}}/g, '{{romaji}}')

export default [
  new Template(
    'Listening',
    `{{audio}}<br>${romajiButton}${romajiDisplay}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{text}} ({{romaji}})`,
  ),
  new Template(
    'Reading',
    `{{text}}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{audio}}<br>{{romaji}}`,
  ),
  new Template(
    'Speaking',
    `<h1>{{emoji}}</h1>`,
    `{{FrontSide}}<hr id=answer>{{audio}}<br>${romajiButton}<br>{{text}} ({{romaji}})`,
  ),
]
