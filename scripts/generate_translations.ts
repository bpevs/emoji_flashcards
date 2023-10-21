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
import type { CompactLanguageFile, LanguageFile } from '../shared/interfaces.ts'
import {
  fromCompactLanguageFile,
  prettyPrintCompactFile,
  toCompactLanguageFile,
} from '../shared/language_file_utilities.ts'
import { translate } from '../shared/translate.ts'
import plugins from './plugins/mod.ts'

const SOURCE_JSON_PATH = 'data/source.json'
const LANGUAGES_DIR = 'data/languages'
const LANGUAGE_FILE_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?\.json$/

generateTranslations()

async function generateTranslations() {
  const sourceRaw = await Deno.readTextFile(SOURCE_JSON_PATH)
  const source: LanguageFile = fromCompactLanguageFile(JSON.parse(sourceRaw))

  const targetLanguages = Array.from(Deno.readDirSync(LANGUAGES_DIR))
    .filter(({ name }) => LANGUAGE_FILE_REGEX.test(name))
    .map((file) => file.name.replace('.json', ''))

  console.info('languages: ', targetLanguages)

  for (const targetLanguage of targetLanguages) {
    const languageFilePath = `${LANGUAGES_DIR}/${targetLanguage}.json`
    const languageRaw = await Deno.readTextFile(languageFilePath)
    const compactLanguage: CompactLanguageFile = JSON.parse(languageRaw)
    const language: LanguageFile = fromCompactLanguageFile(compactLanguage)

    if (!language.data) language.data = {}

    console.info(`Language (${targetLanguage}):`)

    const stringsToTranslate = []

    for (const stringKey in source.strings) {
      if (!language?.strings[stringKey]) {
        stringsToTranslate.push(source.strings[stringKey])
      }
    }

    console.info(`Website Strings to translate:`)
    console.info(stringsToTranslate)

    if (stringsToTranslate.length) {
      const translatedStrings = await translate(
        stringsToTranslate,
        targetLanguage,
      )
      let index = 0
      for (const [stringKey] of Object.entries(source.strings)) {
        if (!language.strings[stringKey]) {
          language.strings[stringKey] = translatedStrings[index]
          index++
        }
      }
    }

    // If translation doesn't exist in target language JSON, translate and add
    const textsToTranslate = []

    for (const emojiKey in source.data) {
      if (!language.data[emojiKey]) {
        textsToTranslate.push(source.data[emojiKey].text)
      }
    }

    console.info(`Texts to translate:`)
    console.info(textsToTranslate)

    if (textsToTranslate.length) {
      const translatedTexts = await translate(textsToTranslate, targetLanguage)

      let index = 0
      for (const [emojiKey, item] of Object.entries(source.data)) {
        const translatedData = {
          text: item.text,
          translatedText: translatedTexts[index],
          category: item.category,
          pos: item.pos,
        }

        const shortLang = targetLanguage.split('-')[0]
        const plugin = plugins[targetLanguage] || plugins[shortLang]

        if (plugin) {
          const next = await plugin(translatedData, language.data[emojiKey])
          if (next) {
            language.data[emojiKey] = next
            index++
          }
        } else if (!language.data[emojiKey]) {
          language.data[emojiKey] = {
            text: translatedData.translatedText,
            category: translatedData.category,
          }
          index++
        }
      }
    }

    // Delete keys from target JSON that do not exist in source.json
    for (const emojiKey in language.data) {
      if (!source.data[emojiKey]) {
        delete language.data[emojiKey]
      }
    }

    const compactFile = toCompactLanguageFile(language)
    const updatedLanguageJSON = prettyPrintCompactFile(compactFile)
    await Deno.writeTextFile(languageFilePath, updatedLanguageJSON)
  }
}
