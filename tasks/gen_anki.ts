import { ensureDir, existsSync } from 'std/fs/mod.ts'
import { join } from 'std/path/mod.ts'
import fromJSON from 'flashcards/adapters/from_json.ts'
import toAPKG from 'flashcards/adapters/to_apkg.ts'
import Template from 'flashcards/models/template.ts'

import { GEN_DIR, LANGUAGES_DIR } from '@/shared/paths.ts'
import { listLanguages } from '@/shared/data_access.ts'
import { getAudioFilename } from '@/shared/data_access_helpers.ts'

// [[2, 'all', [0]], [1, 'all', [0]]]
// if (hasAudioDir) req.push([0, 'all', [0]])
// const guid = ankiHash([langCode, key])

const reading = new Template(
  'reading',
  '<h1>{{emoji}}</h1>',
  '{{FrontSide}}\n{{text}}{{audio}}',
)

const speaking = new Template(
  'speaking',
  '<h1>{{text}}</h1>',
  '{{FrontSide}}\n{{emoji}}{{audio}}',
)

const listening = new Template(
  'listening',
  '<h1>{{audio}}</h1>',
  '{{FrontSide}}\n{{emoji}}{{text}}',
)

listLanguages().map(async (locale: string) => {
  const langFileLocation = `${LANGUAGES_DIR}/${locale}.json`
  const deck = fromJSON(await Deno.readTextFile(langFileLocation))

  deck.notes.forEach((note) => {
    note.templates.push(reading)
    note.templates.push(speaking)
    note.templates.push(listening)
  })

  const media = []
  const hasAudioDir = existsSync(join(GEN_DIR, locale, 'audio'), {
    isReadable: true,
    isDirectory: true,
  })

  if (hasAudioDir) {
    await Promise.all(deck.notes.map(async (note) => {
      const { emoji, text } = note.content
      const audioFilename = getAudioFilename(locale, emoji, text)
      const audioLocation = join(GEN_DIR, locale, 'audio', audioFilename)
      note.content.audio = `[sound:${audioFilename}]`

      try {
        const fileBytes = await Deno.readFile(audioLocation)
        const data = new Blob([fileBytes], { type: 'audio/mpeg' })
        media.push({ name: audioFilename, data })
      } catch {
        console.warn('Missing audio file: ', audioFilename)
      }
    }))
  }

  await ensureDir(join(GEN_DIR, locale))
  const outputFileName = `emoji-flashcards-${locale}.apkg`
  const outputFilePath = join(GEN_DIR, locale, outputFileName)
  await Deno.writeFile(outputFilePath, await toAPKG(deck, media))
})
