/**
 * Read source.json as "source of truth" of emoji set
 * For each source.json emoji (and temp cache the key as a set)
 *
 * For eacn other base file...
 *   Loop through existing set
 *      If a translation is pre-existing, skip
 *      If a translation does not exist, translate via API
 *      If key does not exist in en_US, delete
 *   If base extension exist, append
 */
import {
  listLanguages,
  readLanguageFile,
  readSourceFile,
  writeLanguageFile,
} from '../shared/data_access.ts'
import { translate } from '../shared/translate.ts'
import plugins from '../data/plugins/mod.ts'

generateAllTranslations()

async function generateAllTranslations() {
  const sourceFile = await readSourceFile()
  const languages = listLanguages()

  console.info('languages: ', languages)

  for (const language of languages) {
    const languageFile = await readLanguageFile(language)

    console.info(`Language (${language}):`)

    const stringsToTranslate = []

    for (const stringKey in sourceFile.strings) {
      if (!languageFile?.strings[stringKey]) {
        stringsToTranslate.push(sourceFile.strings[stringKey])
      }
    }

    console.info(`Website Strings to translate:`)
    console.info(stringsToTranslate)

    if (stringsToTranslate.length) {
      const translatedStrings = await translate(
        stringsToTranslate,
        language,
      )
      let index = 0
      for (const [stringKey] of Object.entries(sourceFile.strings)) {
        if (!languageFile.strings[stringKey]) {
          languageFile.strings[stringKey] = translatedStrings[index]
          index++
        }
      }
    }

    // If translation doesn't exist in target languageFile JSON, translate and add
    const textsToTranslate = []

    for (const emojiKey in sourceFile.data) {
      if (!languageFile.data[emojiKey]) {
        textsToTranslate.push(sourceFile.data[emojiKey].text)
      }
    }

    console.info(`Texts to translate:`)
    console.info(textsToTranslate)

    if (textsToTranslate.length) {
      const translatedTexts = await translate(textsToTranslate, language)

      let index = 0
      for (const [emojiKey, item] of Object.entries(sourceFile.data)) {
        const translatedData = {
          text: item.text,
          translatedText: translatedTexts[index],
          category: item.category,
          pos: item.pos,
        }

        const shortLang = language.split('-')[0]
        const plugin = plugins[language] || plugins[shortLang]

        if (plugin) {
          const next = await plugin(translatedData, languageFile.data[emojiKey])
          if (next) {
            languageFile.data[emojiKey] = next
            index++
          }
        } else if (!languageFile.data[emojiKey]) {
          languageFile.data[emojiKey] = {
            text: translatedData.translatedText,
            category: translatedData.category,
          }
          index++
        }
      }
    }

    // Delete keys from target JSON that do not exist in source.json
    for (const emojiKey in languageFile.data) {
      if (!sourceFile.data[emojiKey]) {
        delete languageFile.data[emojiKey]
      }
    }

    await writeLanguageFile(language, languageFile)
  }
}
