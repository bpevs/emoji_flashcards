import stringify from 'npm:json-stringify-pretty-compact'
import { join } from 'std/path/mod.ts'
import fromJSON from 'language_flashcards/adapters/from_json.ts'
import { DATA_DIR, LANGUAGES_DIR, STRINGS_DIR } from '@/shared/paths.ts'
import { listLanguages } from '@/shared/data_access.ts'
import { API, translate } from '@/shared/translate.ts'

const locales = (await listLanguages()).sort()

/**
 * Generates /data/strings files
 */
const stringsResults = locales.map(async (locale_code: string) => {
  const toTranslate = []
  const sourcePath = `${DATA_DIR}/strings.json`
  const targetPath = `${STRINGS_DIR}/${locale_code}.json`
  const source = JSON.parse(await Deno.readTextFile(sourcePath))
  const target = JSON.parse(await Deno.readTextFile(targetPath))

  for (const key in source) {
    if (!target[key]) toTranslate.push(source[key])
  }

  console.info(`Language (${locale_code}):`)
  console.info(`Website Strings to translate:`)
  console.info(toTranslate)
  if (toTranslate.length) {
    const translated = await translate(toTranslate, locale_code, API.AZURE)

    let index = 0
    for (const [stringKey] of Object.entries(source)) {
      if (!target[stringKey]) target[stringKey] = translated[index++]
    }
    await Deno.writeTextFile(targetPath, stringify(target))
  }
})

await Promise.all(stringsResults)

/**
 * Generates locales.js
 */
const localesResults = locales
  .map(async (locale_code: string) => {
    const text = await Deno.readTextFile(`${LANGUAGES_DIR}/${locale_code}.json`)
    const languageFile = fromJSON(text)

    return {
      lang_code: languageFile.meta.lang_code,
      locale_code: languageFile.meta.locale_code,
      locale_flag: languageFile.meta.locale_flag,
      native_name: languageFile.name,
    }
  })

Deno.writeTextFile(
  join(DATA_DIR, 'locales.js'),
  `export default ${JSON.stringify(await Promise.all(localesResults), null, 2)}\n`,
)
