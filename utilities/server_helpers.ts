import { Context } from 'oak'
import { readLanguageFile } from './data_access.ts'
import { Handlebars } from 'handlebars'
import locales from '../data/locales.js'
import { DEFAULT_LANG, NOTE_PARAM, USER_PARAM } from './constants_shared.ts'

const handle = new Handlebars({
  cachePartials: true,
  compilerOptions: undefined,
  defaultLayout: 'main',
  extname: '.hbs',
  baseDir: 'www/views',
  helpers: {
    // deno-lint-ignore no-explicit-any
    select(selected: string, options: { fn: any }) {
      const findOptionValue = new RegExp(' value="' + selected + '"')
      // @ts-ignore need to figure out handlebar helper option types
      return options.fn(this).replace(findOptionValue, '$& selected="selected"')
    },
  },
  layoutsDir: 'layouts/',
  partialsDir: 'partials/',
})

export function pageHandler(pageName: string) {
  return async (ctx: Context) => {
    const data = await getWebsiteData(ctx.request.url.searchParams)
    ctx.response.body = await handle.renderView(pageName, data)
  }
}

export async function getWebsiteData(params: URLSearchParams): Promise<{
  categories: string[]
  userLangCode: string
  noteLangCode: string
  flag: string
  strings: { [name: string]: string }
  notes: string[][]
  locales: Array<{
    language_code: string
    locale_code: string
    native_name: string
    locale_flag: string
  }>
}> {
  const userLangCode = params.get(USER_PARAM) || DEFAULT_LANG
  const noteLangCode = params.get(NOTE_PARAM) || DEFAULT_LANG

  const { strings } = await readLanguageFile(userLangCode, false)
  const { data, locale_flag } = await readLanguageFile(noteLangCode, true)

  const categories = Object.keys(data).sort()
  const notes = categories.map((category: string) => {
    const emojis = Object.keys(data[category])
    return emojis.map((emoji) => [emoji, category, ...(data[category][emoji])])
  }).flat(1)
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
