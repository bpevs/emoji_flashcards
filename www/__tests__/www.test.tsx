/** @jsx jsx **/
import { raw } from 'hono/helper.ts'
import { jsx } from 'hono/middleware.ts'
import { assertEquals, assertExists } from 'std/assert/mod.ts'
import { assertSnapshot } from 'std/testing/snapshot.ts'
import { it } from 'std/testing/bdd.ts'
import { DOMParser } from 'deno-dom'

import { getWebsiteData } from '@/www.tsx'
import Html from '@/www/components/html.tsx'
import enUS from '@/data/languages/en-US.json' with { type: 'json' }
import esES from '@/data/languages/es-ES.json' with { type: 'json' }
import enStrings from '@/data/strings/en-US.json' with { type: 'json' }
import esStrings from '@/data/strings/es-ES.json' with { type: 'json' }

async function getDOM(urlStr: string) {
  const params = (new URL(urlStr)).searchParams
  const data = await getWebsiteData(
    params.get('user') || 'en-US',
    params.get('note') || 'en-US',
  )

  return new DOMParser()
    .parseFromString(raw(<Html data={data} />).toString(), 'text/html')
}

it('should render index page', async (t) => {
  const dom = await getDOM(`https://flashcards.bpev.me`)
  assertExists(dom)

  const userLangSelector = dom.getElementById('user-lang-selector')
  assertExists(userLangSelector)
  await assertSnapshot(t, userLangSelector.innerHTML)

  const noteLangSelector = dom.getElementById('note-lang-selector')
  assertExists(noteLangSelector)
  await assertSnapshot(t, noteLangSelector.innerHTML)
})

it('should render non-demo strings', async () => {
  const dom = await getDOM(`https://flashcards.bpev.me`)
  assertExists(dom)

  const title = dom.getElementById('title')
  assertEquals(title?.innerText, enStrings.title)

  const cardLabel = dom.getElementById('card-selector-label')
  assertEquals(cardLabel?.innerText, enStrings['card-selector-label'])

  const noJS = dom.getElementById('no-js')
  assertEquals((noJS?.innerText || '').trim(), enStrings['no-js'])

  const dl = dom.getElementById('download')
  assertEquals(dl?.innerText, enUS.meta.locale_flag + ' ' + enStrings['download'])

  const aboutTitle = dom.getElementById('about')
  assertEquals(aboutTitle?.innerText, enStrings.about)

  const aboutHelp = dom.getElementById('about-help-title')
  assertEquals(aboutHelp?.innerText, enStrings['about-help-title'])

  const abt1 = dom.getElementById('about-help-description-1')
  assertEquals(abt1?.innerText, enStrings['about-help-description-1'])

  const abt2 = dom.getElementById('about-help-description-2')
  assertEquals(abt2?.innerText, enStrings['about-help-description-2'])

  const sponsorTitle = dom.getElementById('about-sponsor-title')
  assertEquals(sponsorTitle?.innerText, enStrings['about-sponsor-title'])

  const sponsorDsc = dom.getElementById('about-sponsor-description')
  assertEquals(sponsorDsc?.innerText, enStrings['about-sponsor-description'])
})

it('should render non-demo strings in user-lang', async () => {
  const dom = await getDOM(`https://flashcards.bpev.me?user=es-ES`)
  assertExists(dom)

  const title = dom.getElementById('title')
  assertEquals(title?.innerText, esStrings.title)

  const cardLabel = dom.getElementById('card-selector-label')
  assertEquals(cardLabel?.innerText, esStrings['card-selector-label'])

  const noJS = dom.getElementById('no-js')
  assertEquals((noJS?.innerText || '').trim(), esStrings['no-js'])

  const aboutTitle = dom.getElementById('about')
  assertEquals(aboutTitle?.innerText, esStrings.about)

  const aboutHelp = dom.getElementById('about-help-title')
  assertEquals(aboutHelp?.innerText, esStrings['about-help-title'])

  const abt1 = dom.getElementById('about-help-description-1')
  assertEquals(abt1?.innerText, esStrings['about-help-description-1'])

  const abt2 = dom.getElementById('about-help-description-2')
  assertEquals(abt2?.innerText, esStrings['about-help-description-2'])

  const sponsorTitle = dom.getElementById('about-sponsor-title')
  assertEquals(sponsorTitle?.innerText, esStrings['about-sponsor-title'])

  const sponsorDsc = dom.getElementById('about-sponsor-description')
  assertEquals(sponsorDsc?.innerText, esStrings['about-sponsor-description'])
})

it('should render note selector in user language', async (t) => {
  const userLang = 'el-GR'
  const dom = await getDOM(`https://flashcards.bpev.me/?user=${userLang}`)
  assertExists(dom)

  const noteLangSelector = dom.getElementById('note-lang-selector')
  assertExists(noteLangSelector)
  await assertSnapshot(t, noteLangSelector.innerHTML)
})

it('should render download link with note-lang flag', async () => {
  const dom1 = await getDOM(`https://flashcards.bpev.me?note=en-US&user=es-ES`)
  assertExists(dom1)
  const text1 = dom1.getElementById('download')?.innerText
  assertEquals(text1, '🇺🇸 Descargar flashcards')

  const link1 = dom1.getElementById('download-link') as HTMLAnchorElement | null
  assertExists(link1)
  assertEquals(
    link1?.getAttribute('href'),
    'https://static.bpev.me/flashcards/en-US/emoji-flashcards-en-US.apkg',
  )

  const dom2 = await getDOM(`https://flashcards.bpev.me?note=es-ES&user=en-US`)
  assertExists(dom2)
  const text2 = dom2.getElementById('download')?.innerText
  assertEquals(text2, '🇪🇸 Download flashcards')

  const link2 = dom2.getElementById('download-link') as HTMLAnchorElement | null
  assertExists(link2)
  assertEquals(
    link2?.getAttribute('href'),
    'https://static.bpev.me/flashcards/es-ES/emoji-flashcards-es-ES.apkg',
  )
})
