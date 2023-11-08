import { listLanguages, readLanguageFile } from '../utilities/data_access.ts'
import {
  getAudioFilename,
  getEmojiDataMap,
} from '../utilities/data_access_utilities.ts'

const emojiMaps = {}
const languageNames = await listLanguages()
await Promise.all(languageNames
  .map(async (languageName) => {
    const languageFile = await readLanguageFile(languageName)
    emojiMaps[languageName] = getEmojiDataMap(languageFile)
  }))

const lang = 'zh-CN'
const emojis = Object.keys(emojiMaps[lang])

await Promise.all(emojis.map(async (key) => {
  const toName = getAudioFilename(lang, key, emojiMaps[lang][key].text)
  const fromName = getOldAudioFilename(lang, emojiMaps[lang][key].text)
  try {
    await Deno.copyFile(
      `data/gen/${lang}/audio/${fromName}`,
      `data/gen/${lang}/rename/${toName}`,
    )
  } catch { /* blah */ }
}))

function getOldAudioFilename(language: string, text: string) {
  return `emoji_${language}_${text.replace(/\s/g, '-')}.mp3`.normalize('NFC')
}
