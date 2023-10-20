import { Application, Router, send } from 'oak'
import { Handlebars } from 'handlebars'
import { load } from 'std/dotenv/mod.ts'
import build from './shared/build.ts'

const STATIC_DIR_PATH = '/'
const STATIC_DIR = './www'
const DATA_DIR_PATH = '/data'
const DATA_DIR = './data'

const handle = new Handlebars({
  helpers: {
    select: function (selected, options) {
      return options.fn(this).replace(
        new RegExp(' value="' + selected + '"'),
        '$& selected="selected"',
      )
    },
  },
})
const router = new Router()

const langMap = {
  'ja': 'ja-JP',
  'en': 'en-US',
  'es': 'es-ES',
  'zh': 'zh-CN',
}

router.get('/', async (context) => {
  const langParam = context.request.url.searchParams.get('lang')
  const langCode = langMap[langParam] || langMap['en']
  const langURL = `data/languages/${langCode}.json`
  const langFile = JSON.parse(await Deno.readTextFile(langURL))

  const cardLang = context.request.url.searchParams.get('card')
  const cardLangCode = langMap[cardLang] || langMap['en']
  const lang = langCode.split('-')[0]
  const cardDisplayLang = langFile.strings[cardLangCode]

  context.response.body = await handle.renderView('index', {
    lang,
    langCode,
    cardLangCode,
    cardDisplayLang,
    ...langFile.strings,
  })
})

router.get('/index.js', async (context) => {
  const env = await load({ allowEmptyValues: true })
  if (env['LOCAL']) {
    context.response.body = await build(false)
  } else {
    context.response.body = await Deno.readTextFile('./www/index.js')
  }
})

const app = new Application()

app.use(router.routes())
app.use(router.allowedMethods())

app.use(async (ctx) => {
  const pathname = ctx.request.url.pathname
  if (pathname.toLowerCase().startsWith(DATA_DIR_PATH)) {
    const filePath = pathname.replace(DATA_DIR_PATH, '')
    await send(ctx, filePath, { root: DATA_DIR })
  } else {
    const filePath = pathname.replace(STATIC_DIR_PATH, '')
    await send(ctx, filePath, { root: STATIC_DIR })
  }
})

console.log('localhost:8000')
await app.listen({ port: 8000 })
