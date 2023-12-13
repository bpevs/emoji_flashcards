import { Application, Context, Router, send } from 'oak'
import { load } from 'std/dotenv/mod.ts'
import build from './utilities/build.ts'
import { DATA_DIR, STATIC_DIR } from './utilities/constants_server.ts'
import { DATA_PATH, STATIC_PATH } from './utilities/constants_shared.ts'
import { getWebsiteData, pageHandler } from './utilities/server_helpers.ts'

const port = 8000
const router = new Router()

router.get('/', pageHandler('index'))
router.get('/about', pageHandler('about'))

router.get('/index.js', async function handleJS(ctx: Context) {
  const env = await load({ allowEmptyValues: true })
  ctx.response.headers.append('Content-Type', 'application/javascript')
  ctx.response.body = env['LOCAL']
    ? await build(false)
    : await Deno.readTextFile('./www/index.js')
})

// Data required to run www js demo
router.get(
  `/api/data`,
  async function handleJSON(ctx: Context) {
    const data = await getWebsiteData(ctx.request.url.searchParams)
    ctx.response.body = JSON.stringify(data)
  },
)

const app = new Application()

app.use(router.routes())
app.use(router.allowedMethods())
app.use(async (ctx: Context) => {
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
