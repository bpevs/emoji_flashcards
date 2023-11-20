import { Application, Router, send } from 'oak'
import { Handlebars } from 'handlebars'
import { load } from 'std/dotenv/mod.ts'
import build from './utilities/build.ts'
import select from './www/helpers/select.ts'
import { LanguageDataMap } from './utilities/types.ts'
import { readLanguageFile } from './utilities/data_access.ts'
import { DATA_DIR, STATIC_DIR } from './utilities/constants_server.ts'
import {
  DATA_PATH,
  DEFAULT_LANG,
  NOTE_PARAM,
  STATIC_PATH,
  USER_PARAM,
} from './utilities/constants_shared.ts'
import locales from './data/locales.js'

const port = 8000
const router = new Router()
const handle = new Handlebars({ baseDir: 'www/views', helpers: { select } })

async function getWebsiteData(userLangParam, noteLangParam): {
  categories: string[]
  userLangParam: string
  noteLangParam: string
  flag: string
  strings: { [name: string]: string }
  data: LanguageDataMap
  locales: Array<{
    language_code: string
    locale_code: string
    native_name: string
    locale_flag: string
  }>
} {
  const userLangCode = userLangParam || DEFAULT_LANG
  const noteLangCode = noteLangParam || DEFAULT_LANG

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

router.get('/', async (context) => {
  const params = context.request.url.searchParams
  const data = await getWebsiteData(
    params.get(USER_PARAM),
    params.get(NOTE_PARAM),
  )

  context.response.body = await handle.renderView('index', data)
})

router.get('/about', async (context) => {
  const params = context.request.url.searchParams
  const data = await getWebsiteData(
    params.get(USER_PARAM),
    params.get(NOTE_PARAM),
  )

  context.response.body = await handle.renderView('about', data)
})

router.get('/index.js', async (context) => {
  const env = await load({ allowEmptyValues: true })
  context.response.headers.append('Content-Type', 'application/javascript')
  context.response.body = env['LOCAL']
    ? await build(false)
    : await Deno.readTextFile('./www/index.js')
})

// Data required to run www demo
router.get(`/api/user/:${USER_PARAM}/note/:${NOTE_PARAM}`, async (ctx) => {
  const data = await getWebsiteData(
    ctx.params[USER_PARAM],
    ctx.params[NOTE_PARAM],
  )
  ctx.response.body = JSON.stringify(data)
})

const app = new Application()

app.use(router.routes())
app.use(router.allowedMethods())
app.use(async (ctx) => {
  const pathname = ctx.request.url.pathname
  const isDataPath = pathname.toLowerCase().startsWith(DATA_PATH)
  await send(
    ctx,
    pathname.replace(isDataPath ? DATA_PATH : STATIC_PATH, ''),
    { root: isDataPath ? DATA_DIR : STATIC_DIR },
  )
})

console.log(`localhost:${port}`)
await app.listen({ port })
