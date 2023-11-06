/**
 * This script is for generating translations to new words: basically, it
 * pre-populates our `languages` files via translation APIs. It is expected
 * that some of the translations will be inaccurate, and will be corrected by
 * hand. Do not use this for extensions; those should be done purely by-hand,
 * since they should be used for individual translations anyways.
 *
 * Reads source.json as "source of truth" of emoji set.
 * For each `source.json`` emoji...
 *
 * Look at each language's base file...
 *   Loop through existing set
 *      If a translation is pre-existing, skip
 *      If a translation does not exist, translate via API
 *      If key does not exist in en_US, delete
 */
import {
  listLanguages,
  readLanguageFile,
  readSourceFile,
  writeLanguageFile,
} from '../utilities/data_access.ts'
import {
  getDataAndColumnsFromEmojiDataMap,
  getEmojiDataMap,
} from '../utilities/data_access_utilities.ts'
import { translate } from '../utilities/translate.ts'
import plugins from '../data/plugins/mod.ts'

await generateAllTranslations()
Deno.exit(0)

async function generateAllTranslations() {
  const sourceFile = await readSourceFile()
  const sourceEmojiDataMap = getEmojiDataMap(sourceFile)

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
    const textsToTranslate: string[] = []
    const emojiDataMap = getEmojiDataMap(languageFile)

    for (const emojiKey in sourceEmojiDataMap) {
      if (!emojiDataMap[emojiKey]) {
        textsToTranslate.push(sourceEmojiDataMap[emojiKey].text)
      }
    }

    console.info(`Texts to translate:`)
    console.info(textsToTranslate)

    if (textsToTranslate.length) {
      const translatedTexts = await translate(textsToTranslate, language)

      let index = 0
      for (const [emojiKey, item] of Object.entries(sourceEmojiDataMap)) {
        const translatedData = {
          text: item.text,
          translatedText: translatedTexts[index],
          category: item.category,
          pos: item.pos,
        }

        const shortLang = language.split('-')[0]
        const plugin = plugins[language] || plugins[shortLang]

        if (plugin) {
          const next = await plugin(translatedData, emojiDataMap[emojiKey])
          if (next) {
            emojiDataMap[emojiKey] = next
            index++
          }
        } else if (!emojiDataMap[emojiKey]) {
          emojiDataMap[emojiKey] = {
            text: translatedData.translatedText,
            category: translatedData.category,
          }
          index++
        }
      }
    }

    // Delete keys from target JSON that do not exist in source.json
    for (const emojiKey in emojiDataMap) {
      if (!sourceEmojiDataMap[emojiKey]) delete emojiDataMap[emojiKey]
    }

    const [columns, data] = getDataAndColumnsFromEmojiDataMap(emojiDataMap)
    await writeLanguageFile(language, {
      ...languageFile,
      columns,
      data,
    })
  }
}
