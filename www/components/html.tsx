/** @jsx jsx **/
import { jsx } from 'hono/middleware.ts'
import { html, raw } from 'hono/helper.ts'
import type { UserLanguageMeta } from '@/shared/types.ts'

import UserLanguageSelector from './user_language_selector.tsx'
import App from './app.tsx'
import About from './about.tsx'
import locales from '@/data/locales.js'

export default function Html({ data }: { data: UserLanguageMeta }) {
  return html`
    <!DOCTYPE html>
    <html lang="${data.userLangCode}" ${data.rtl ? raw('dir="rtl"') : ''}>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta http-equiv="expires" content="43200" />
        <title>${data.strings.title}</title>

        <meta name="author" content="Ben Pevsner" />
        <meta name="description" content="${data.strings.description}" />

        <meta property="og:title" content="${data.strings.title}" />
        <meta property="og:url" content="https://flashcards.bpev.me" />
        <meta property="og:description" content="${data.strings.description}" />
        <meta property="og:image" content="/static/favicon.png" />

        <link rel="icon" type="image/png" href="/static/favicon.png">
        <link rel="apple-touch-icon" type="image/png" href="/static/favicon.png">
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
        <link rel="stylesheet" type="text/css" href="/static/index.css" />
      </head>
      <body class="no-script">
        ${<UserLanguageSelector {...data} />}
        <content id="wrapper">
          ${<App {...data} />}
          ${<About strings={data.strings} />}
        </content>

        <script>window.locales = ${raw(JSON.stringify(locales))}</script>
        <script type="module" src="/static/index.js"></script>
        <script>document.body.classList.remove('no-script');</script>
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
      </body>
    </html>
  `
}
