import { Template } from '@flashcard/core'

export const hintButton = `
<button class="button" type="button"  onclick="
if
(document.getElementById('HINT').style.display=='none')
{document.getElementById('HINT').style.display=''}
else
{document.getElementById('HINT').style.display='none'}">
Hint
</button>
`

export const hintDisplay = `
<span class="hint" id="HINT" style="display:none">
{{hint}}
</span>
`

export const nohint = [
  new Template(
    'Listening',
    `{{audio}}`,
    `{{FrontSide}}\n<hr id=answer>\n<h1>{{emoji}}</h1>\n<br>\n{{text}}`,
  ),
  new Template(
    'Reading',
    `{{text}}`,
    `{{FrontSide}}\n<hr id=answer>\n<h1>{{emoji}}</h1>\n<br>\n{{audio}}`,
  ),
  new Template(
    'Speaking',
    `<h1>{{emoji}}</h1>`,
    `{{FrontSide}}\n<hr id=answer>\n{{audio}}\n<br>\n{{text}}`,
  ),
]

export const hint = [
  new Template(
    'Listening',
    `{{audio}}<br>${hintButton}${hintDisplay}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{text}} ({{hint}})`,
  ),
  new Template(
    'Reading',
    `{{text}}`,
    `{{FrontSide}}<hr id=answer><h1>{{emoji}}</h1><br>{{audio}}<br>{{hint}}`,
  ),
  new Template(
    'Speaking',
    `<h1>{{emoji}}</h1>`,
    `{{FrontSide}}<hr id=answer>{{audio}}<br>${hintButton}<br>{{text}} ({{hint}})`,
  ),
]
