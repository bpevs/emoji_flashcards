import {
  Application,
  Router,
  send,
} from 'https://deno.land/x/oak@v11.1.0/mod.ts'
import { Handlebars } from 'https://deno.land/x/handlebars@v0.9.0/mod.ts'

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
  const lang = context.request.url.searchParams.get('lang')
  const langCode = langMap[lang] || langMap['en']
  const langURL = `data/languages/${langCode}.json`
  const langFile = JSON.parse(await Deno.readTextFile(langURL))

  const cardLang = context.request.url.searchParams.get('card')
  const cardLangCode = langMap[cardLang] || langMap['en']

  context.response.body = await handle.renderView('index', {
    lang: langCode.split('-')[0],
    langCode: langCode,
    cardLangCode: cardLangCode,
    ...langFile.strings,
  })
})

const app = new Application()

app.use(router.routes())
app.use(router.allowedMethods())

app.use(async (ctx, next) => {
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
