import {
  Application,
  Router,
  send,
} from 'https://deno.land/x/oak@v11.1.0/mod.ts'
import { Handlebars } from 'https://deno.land/x/handlebars@v0.9.0/mod.ts'

import { resolve } from 'https://deno.land/std@0.200.0/path/mod.ts'
import * as esbuild from 'https://deno.land/x/esbuild@v0.14.51/mod.js'
import { denoPlugins } from 'https://deno.land/x/esbuild_deno_loader@0.8.1/mod.ts'
import { solidPlugin } from 'npm:esbuild-plugin-solid'

const STATIC_DIR_PATH = '/'
const STATIC_DIR = './public'
const DATA_DIR_PATH = '/data'
const DATA_DIR = './data'

const [denoResolver, denoLoader] = [...denoPlugins({
  importMapURL: new URL('file://' + resolve('./www_import_map.json')),
  nodeModulesDir: true,
})]

await esbuild.build({
  plugins: [
    denoResolver,
    solidPlugin({ solid: { moduleName: 'npm:solid-js/web' } }),
    denoLoader,
  ],
  entryPoints: ['./public/index.tsx'],
  outfile: './public/index.js',
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: ['chrome99', 'safari15'],
  treeShaking: true,
})
esbuild.stop()

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
