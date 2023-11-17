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
  getSourceEmojiDataMap,
} from '../utilities/data_access_utilities.ts'
import { translate } from '../utilities/translate.ts'
import plugins from '../data/plugins/mod.ts'
import Plugin from '../utilities/plugin.ts'
import { SourceEmojiDataMap } from '../utilities/interfaces.ts'

await generateAllTranslations()
Deno.exit(0)

async function generateAllTranslations() {
  const sourceFile = await readSourceFile()
  const sourceEmojiDataMap: SourceEmojiDataMap = getSourceEmojiDataMap(
    sourceFile,
  )

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

    const shortLang = language.split('-')[0]
    let plugin = plugins[language] || plugins[shortLang]
    if (!plugin) {
      console.warn(`No plugin for ${language}; using default`)
      plugin = new Plugin({ language: shortLang })
    }

    const targetRowsMap = getEmojiDataMap(languageFile)
    const rows = await plugin.getLanguageFileRows(
      sourceEmojiDataMap,
      targetRowsMap,
    )
    const [columns, data] = getDataAndColumnsFromEmojiDataMap(rows)

    await writeLanguageFile(language, {
      ...languageFile,
      columns,
      data,
    })
  }
}
