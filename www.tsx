/** @jsx jsx **/
import { Hono } from 'hono'
import { jsx, logger, poweredBy, serveStatic } from 'hono/middleware.ts'
import locales from '@/data/locales.js'
import { LANGUAGES_DIR, STRINGS_DIR } from '@/shared/paths.ts'
import { UserLanguageMeta } from '@/shared/types.ts'
import Html from '@/www/components/html.tsx'

const DEFAULT_LANG = 'en-US'

const app = new Hono()

app.use('*', logger(), poweredBy())
app.use('/static/*', serveStatic({ root: './www/' }))

app.get('/', async (c) => {
  const { user = DEFAULT_LANG, note = DEFAULT_LANG } = c.req.query()
  const data = await getWebsiteData(user, note)
  return c.html(<Html data={data} />)
})

app.get('/api/data', async (c) => {
  const { user = DEFAULT_LANG, note = DEFAULT_LANG } = c.req.query()
  return c.json(await getWebsiteData(user, note))
})

Deno.serve(app.fetch)

export async function getWebsiteData(
  userLangCode: string,
  noteLangCode: string,
): Promise<UserLanguageMeta> {
  const [stringsResp, userResp, noteResp] = await Promise.all([
    Deno.readTextFile(`${STRINGS_DIR}/${userLangCode}.json`),
    Deno.readTextFile(`${LANGUAGES_DIR}/${userLangCode}.json`),
    Deno.readTextFile(`${LANGUAGES_DIR}/${noteLangCode}.json`),
  ])
  const note = JSON.parse(noteResp)

  return {
    userLangCode,
    noteLangCode,
    strings: JSON.parse(stringsResp),
    rtl: Boolean(JSON.parse(userResp).meta.rtl),
    data: note,
    locales: locales
      .sort((a, b) => {
        if (a.locale_code < b.locale_code) return -1
        if (a.locale_code > b.locale_code) return 1
        return 0
      }),
  }
}
