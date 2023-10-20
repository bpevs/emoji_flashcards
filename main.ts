import { Application, Router, send } from 'oak'
import { Handlebars } from 'handlebars'
import { resolve } from 'std/path/mod.ts'
import * as esbuild from 'esbuild'
import { denoPlugins } from 'esbuild-deno-loader'
import { solidPlugin } from 'npm:esbuild-plugin-solid'

const STATIC_DIR_PATH = '/'
const STATIC_DIR = './www'
const DATA_DIR_PATH = '/data'
const DATA_DIR = './data'

const [denoResolver, denoLoader] = [...denoPlugins({
  nodeModulesDir: true,
  configPath: resolve('./deno.json'),
})]

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
  await esbuild.build({
    plugins: [
      denoResolver,
      solidPlugin({
        solid: { moduleName: 'npm:solid-js/web' },
      }),
      denoLoader,
    ],
    entryPoints: ['./www/index.tsx'],
    outfile: './www/index.js',
    bundle: true,
    platform: 'browser',
    format: 'esm',
    target: ['chrome99', 'safari15'],
    treeShaking: true,
  })
  await esbuild.stop()
  context.response.body = await Deno.readTextFile('./www/index.js')
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
