import { Application, Router, send } from 'oak'
import { Handlebars } from 'handlebars'
import { load } from 'std/dotenv/mod.ts'
import build from './shared/build.ts'
import {
  DATA_PATH,
  DEFAULT_LANG,
  DEFAULT_LANG_MAP,
  NOTE_PARAM,
  STATIC_PATH,
  USER_PARAM,
} from './shared/constants_shared.ts'
import { DATA_DIR, STATIC_DIR } from './shared/constants_server.ts'

const router = new Router()
const handle = new Handlebars({
  baseDir: 'www/views',
  helpers: {
    select(selected, options) {
      const findOptionValue = new RegExp(' value="' + selected + '"')
      return options.fn(this).replace(findOptionValue, '$& selected="selected"')
    },
  },
})

router.get('/', async (context) => {
  const userLangParam = context.request.url.searchParams.get(USER_PARAM)
  const noteLangParam = context.request.url.searchParams.get(NOTE_PARAM)

  const userLangCode = DEFAULT_LANG_MAP[userLangParam] || DEFAULT_LANG
  const noteLangCode = DEFAULT_LANG_MAP[noteLangParam] || DEFAULT_LANG

  const userLangURL = `data/languages/${userLangCode}.json`
  const userLangFile = JSON.parse(await Deno.readTextFile(userLangURL))

  context.response.body = await handle.renderView('index', {
    userLangCode,
    noteLangCode,
    noteDisplayLangStr: userLangFile.strings[noteLangCode],
    ...userLangFile.strings,
  })
})

router.get('/index.js', async (context) => {
  const env = await load({ allowEmptyValues: true })
  context.response.body = env['LOCAL']
    ? await build(false)
    : await Deno.readTextFile('./www/index.js')
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

console.log('localhost:8000')
await app.listen({ port: 8000 })
