export const listeningQuestion = `
{{Audio}}

<br>

<button class="button" type="button"  onclick="
if
(document.getElementById('HINT').style.display=='none')
{document.getElementById('HINT').style.display=''}
else
{document.getElementById('HINT').style.display='none'}">
Hint
</button>

<div class="hint" id="HINT" style="display:none">
{{Hint}}
</div>
`

export const listeningAnswer = `
{{FrontSide}}

<hr id=answer>

<h1>{{Emoji}}</h1>

<br>

{{Text}} ({{Hint}})
`

export const readingQuestion = `
{{Text}}
`

export const readingAnswer = `
{{FrontSide}}

<hr id=answer>

<h1>{{Emoji}}</h1>

<br>

{{Audio}}

<br>

{{Hint}}
`

export const speakingQuestion = `
<h1>{{Emoji}}</h1>
`

export const speakingAnswer = `
{{FrontSide}}

<hr id=answer>

{{Audio}}

<br>

<button class="button" type="button"  onclick="
if
(document.getElementById('PRONUNCIATION').style.display=='none')
{document.getElementById('PRONUNCIATION').style.display=''}
else
{document.getElementById('PRONUNCIATION').style.display='none'}">
Pronunciation
</button>

<br>

{{Text}} ({{Hint}})
`

export default [
  {
    name: 'Emoji Listening Flashcard',
    qfmt: listeningQuestion,
    afmt: listeningAnswer,
  },
  {
    name: 'Emoji Reading Flashcard',
    qfmt: readingQuestion,
    afmt: readingAnswer,
  },
  {
    name: 'Emoji Speaking Flashcard',
    qfmt: speakingQuestion,
    afmt: speakingAnswer,
  },
]
