/** @jsx jsx **/
import { Hono } from 'hono'
import { jsx, logger, poweredBy, serveStatic } from 'hono/middleware.ts'
import { DEFAULT_LANG } from '@/shared/constants.ts'
import Html from '@/www/components/html.tsx'
import getWebsiteData from '@/shared/get_website_data.ts'

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
