// Read source.json as "source of truth" of emoji set
// For each source.json emoji (and temp cache the key as a set)

// For eacn other base file...
//...Loop through existing set
//......If a translation is pre-existing, skip
//......If a translation does not exist, translate via API
//......If key does not exist in en_US, delete
//...If base extension exist, append

import { readJson } from 'std/fs/mod.ts'
import type {
  CompactLanguageFile,
  ExtensionFile,
  LanguageFile,
  Source,
} from './interfaces.ts'
import { translate } from './translate.ts'
import plugins from './plugins/mod.ts'

const SOURCE_JSON_PATH = 'data/source.json'
const LANGUAGES_DIR = 'data/languages'
const LANGUAGE_FILE_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?\.json$/

generateTranslations()

async function generateTranslations() {
  const sourceRaw = await Deno.readTextFile(SOURCE_JSON_PATH)
  const source: Source = JSON.parse(sourceRaw)

  const targetLanguages = Array.from(Deno.readDirSync(LANGUAGES_DIR))
    .filter(({ name }) => LANGUAGE_FILE_REGEX.test(name))
    .map((file) => file.name.replace('.json', ''))

  console.info('languages: ', targetLanguages)

  for (const targetLanguage of targetLanguages) {
    const languageFilePath = `${LANGUAGES_DIR}/${targetLanguage}.json`
    const languageRaw = await Deno.readTextFile(languageFilePath)
    const compactLanguage: CompactLanguageFile = JSON.parse(languageRaw)
    const language = fromCompactLanguageFile(compactLanguage)

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
      for (const [emoji, item] of Object.entries(source.data)) {
        if (!language.data[emoji]) {
          const data = {
            text: translatedTexts[index],
            category: item.category,
          }
          if (plugins[targetLanguage]) {
            language.data[emoji] = await plugins[targetLanguage](data)
          } else if (plugins[targetLanguage.split('-')[0]]) {
            language.data[emoji] = await plugins[targetLanguage.split('-')[0]](
              data,
            )
          } else {
            language.data[emoji] = data
          }
          index++
        }
      }
    }

    if (stringsToTranslate.length) {
      const translatedStrings = await translate(stringsToTranslate, targetLanguage)
      let index = 0
      for (const [stringKey, item] of Object.entries(source.strings)) {
        if (!language.strings[stringKey]) {
          language.strings[stringKey] = translatedStrings[index]
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
    const updatedLanguageJSON = prettyPrintArray(compactFile, null, 2)
    await Deno.writeTextFile(languageFilePath, updatedLanguageJSON)
  }
}

function fromCompactLanguageFile(
  compactFile: CompactLanguageFile,
): LanguageFile {
  const data = {}

  const categoryNames = Object.keys(compactFile.data)
  categoryNames.forEach((category) => {
    const emojis = Object.keys(compactFile.data[category])
    emojis.forEach((emoji) => {
      data[emoji] = { category }
      compactFile.columns.forEach((column, index) => {
        data[emoji][column] = compactFile.data[category][emoji][index]
      })
    })
  })

  return {
    strings: compactFile.strings,
    data,
  }
}

function toCompactLanguageFile(
  languageFile: LanguageFile,
): CompactLanguageFile {
  const columns = Object.keys(languageFile.data['🐶'])
    .filter((key) => key !== 'category' && key !== 'text') || []

  const data = {}

  for (let emoji in languageFile.data) {
    const item = languageFile.data[emoji]
    const values = columns.map((column) => item[columns])
    values.unshift(item.text)
    if (!data[item.category]) data[item.category] = {}
    data[item.category][emoji] = values
  }

  return {
    strings: languageFile.strings,
    columns: ['text', ...columns],
    data,
  }
}

const replacer = (k, v) => (v instanceof Array) ? JSON.stringify(v) : v
function prettyPrintArray(json) {
  if (typeof json === 'string') json = JSON.parse(json)

  return JSON.stringify(json, replacer, 2)
    .replace(/\\/g, '')
    .replace(/\"\[/g, '[')
    .replace(/\]\"/g, ']')
    .replace(/\"\{/g, '{')
    .replace(/\}\"/g, '}')
}
