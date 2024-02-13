import { UserLanguageMeta } from '../types.ts'
import { readLanguageFile } from './data_access.ts'
import locales from '../data/locales.js'

export default async function getWebsiteData(
  userLangCode: string,
  noteLangCode: string,
): Promise<UserLanguageMeta> {
  const { strings } = await readLanguageFile(userLangCode, false)
  const { data, locale_flag } = await readLanguageFile(noteLangCode, true)
  const categories = Object.keys(data).sort()
  const notes = categories.map((category: string) =>
    Object.keys(data[category])
      .map((emoji) => [emoji, category, ...(data[category][emoji])])
  ).flat(1)

  return {
    categories,
    userLangCode,
    noteLangCode,
    flag: locale_flag,
    strings,
    notes,
    locales: locales
      .map((localeData) => localeData)
      .sort((a, b) => {
        if (a.locale_code < b.locale_code) return -1
        if (a.locale_code > b.locale_code) return 1
        return 0
      }),
  }
}
