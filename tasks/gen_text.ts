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
import { getDataAndColumns } from '../utilities/data_access_utilities.ts'
import { translate } from '../utilities/translate.ts'
import plugins from '../data/plugins/mod.ts'
import Plugin from '../utilities/plugin.ts'

await generateAllTranslations()
Deno.exit(0)

async function generateAllTranslations() {
  const sourceFile = await readSourceFile()
  const localeCodes = listLanguages()

  console.info('locale_codes: ', localeCodes)

  for (const localeCode of localeCodes) {
    const languageFile = await readLanguageFile(localeCode)
    if (!languageFile) {
      console.warn(`no language file for ${localeCode}`)
      continue
    }

    const { locale_code, language_code, strings } = languageFile

    console.info(`Language (${locale_code}):`)

    const stringsToTranslate = []

    for (const stringKey in sourceFile.strings) {
      if (!strings[stringKey]) {
        stringsToTranslate.push(sourceFile.strings[stringKey])
      }
    }

    console.info(`Website Strings to translate:`)
    console.info(stringsToTranslate)

    if (stringsToTranslate.length) {
      const deepl = languageFile?.meta?.deepl
      let translationCode = deepl?.language_code
      if (deepl?.locale_code) translationCode = deepl?.locale_code
      if (!translationCode) throw new Error('No locale to translate')

      const translatedStrings = await translate(
        stringsToTranslate,
        translationCode,
      )
      let index = 0
      for (const [stringKey] of Object.entries(sourceFile.strings)) {
        if (!languageFile.strings[stringKey]) {
          languageFile.strings[stringKey] = translatedStrings[index]
          index++
        }
      }
    }

    let plugin = plugins[locale_code] || plugins[language_code]
    if (!plugin) {
      console.warn(`No plugin for ${language_code}; using default`)
      plugin = new Plugin()
    }

    const rows = await plugin.getLanguageFileRows(sourceFile, languageFile)
    const [columns, data] = getDataAndColumns(rows)

    await writeLanguageFile(locale_code, {
      ...languageFile,
      columns,
      data,
    })
  }
}
