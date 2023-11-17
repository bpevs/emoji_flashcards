import { join } from 'std/path/mod.ts'
import { DATA_DIR } from '../utilities/constants_server.ts'
import { listLanguages, readLanguageFile } from '../utilities/data_access.ts'

const locales = await listLanguages()

const results = locales.sort().map(async (locale_code: string) => {
  const languageFile = await readLanguageFile(locale_code)

  return {
    language_code: languageFile.language_code,
    locale_code,
    locale_flag: languageFile.locale_flag,
    native_name: languageFile.name,
  }
})

Deno.writeTextFile(
  join(DATA_DIR, 'locales.js'),
  `export default ${JSON.stringify(await Promise.all(results), null, 2)}\n`,
)
