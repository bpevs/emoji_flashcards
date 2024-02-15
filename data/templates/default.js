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
{{Hint}}
</span>
`

export const nohint = [
  {
    name: 'Listening',
    qfmt: `{{Audio}}`,
    afmt: `{{FrontSide}}\n<hr id=answer>\n<h1>{{Emoji}}</h1>\n<br>\n{{Text}}`,
  },
  {
    name: 'Reading',
    qfmt: `{{Text}}`,
    afmt: `{{FrontSide}}\n<hr id=answer>\n<h1>{{Emoji}}</h1>\n<br>\n{{Audio}}`,
  },
  {
    name: 'Speaking',
    qfmt: `<h1>{{Emoji}}</h1>`,
    afmt: `{{FrontSide}}\n<hr id=answer>\n{{Audio}}\n<br>\n{{Text}}`,
  },
]

export const hint = [
  {
    name: 'Listening',
    qfmt: `{{Audio}}<br>${hintButton}${hintDisplay}`,
    afmt: `{{FrontSide}}<hr id=answer><h1>{{Emoji}}</h1><br>{{Text}} ({{Hint}})`,
  },
  {
    name: 'Reading',
    qfmt: `{{Text}}`,
    afmt: `{{FrontSide}}<hr id=answer><h1>{{Emoji}}</h1><br>{{Audio}}<br>{{Hint}}`,
  },
  {
    name: 'Speaking',
    qfmt: `<h1>{{Emoji}}</h1>`,
    afmt: `{{FrontSide}}<hr id=answer>{{Audio}}<br>${hintButton}<br>{{Text}} ({{Hint}})`,
  },
]
