const selectUserLanguage = document.getElementById('switch-user-language')
const selectCardLanguage = document.getElementById('switch-card-language')
const cards = document.getElementById('cards')

const langMap = {
  'ja': 'ja-JP',
  'en': 'en-US',
  'es': 'es-ES',
  'zh': 'zh-CN',
}

selectUserLanguage.onchange = function () {
  const lang = this.value

  const goto = new URL(document.location)
  goto.searchParams.set('lang', lang.split('-')[0])

  window.location = goto
}

selectCardLanguage.onchange = function () {
  setCardsLanguage(this.value)
}

const currLang = (new URL(document.location)).searchParams.get('lang')
const currLangCode = langMap[currLang] || currLang || 'en-US'
setCardsLanguage(currLangCode)

async function fetchLanguage(langCode = 'en-US') {
  return await (await fetch(`/data/languages/${langCode}.json`)).json()
}

async function setCardsLanguage(lang = 'en-US') {
  const data = (await fetchLanguage(lang)).data
  const categories = Object.keys(data)
  const rows = []
  categories.forEach((category) => {
    const emojis = Object.keys(data[category])
    emojis.forEach((emoji) => {
      const translation = data[category][emoji][0]
      rows.push(`<tr><td>${emoji}</td><td>${translation}</td></tr>`)
    })
  })

  cards.innerHTML = `
    <table>
      <tr><th>emoji</th><th>translation</th></tr>
      ${rows.join('')}
    </table>
  `
}
