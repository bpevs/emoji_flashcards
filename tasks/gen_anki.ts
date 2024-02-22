import { ensureDir, existsSync } from 'std/fs/mod.ts'
import { join } from 'std/path/mod.ts'
import { fromJSON, toAPKG } from '@flashcard/adapters'
import templates from '@/data/templates/mod.ts'

import { GEN_DIR, LANGUAGES_DIR } from '@/shared/paths.ts'
import { getAudioFilename, listLanguages } from '@/shared/data_access.ts'

listLanguages().map(async (locale: string) => {
  const langFile = await Deno.readTextFile(`${LANGUAGES_DIR}/${locale}.json`)
  const deck = fromJSON(langFile, { sortField: 'emoji' })
  const templatesArr = (deck.meta?.lang_code && templates[deck.meta.lang_code])
    ? (templates[deck.meta?.lang_code] || templates.nohint)
    : templates.nohint

  templatesArr.forEach((template) => deck.templates[template.id] = template)

  const media: Array<{ name: string; data: Blob }> = []
  const hasAudioDir = existsSync(join(GEN_DIR, locale, 'audio'), {
    isReadable: true,
    isDirectory: true,
  })

  if (hasAudioDir) {
    deck.fields.push('audio')

    await Promise.all(
      Object.values(deck.notes).map(async (note) => {
        const { emoji, text } = note.content
        const audioFilename = getAudioFilename(locale, String(emoji), String(text))
        const audioLocation = join(GEN_DIR, locale, 'audio', audioFilename)
        note.content.audio = `[sound:${audioFilename}]`

        try {
          const fileBytes = await Deno.readFile(audioLocation)
          const data = new Blob([fileBytes], { type: 'audio/mpeg' })
          media.push({ name: audioFilename, data })
        } catch {
          console.warn('Missing audio file: ', audioFilename)
        }
      }),
    )
  }

  await ensureDir(join(GEN_DIR, locale))
  const outputFileName = `emoji-flashcards-${locale}.apkg`
  const outputFilePath = join(GEN_DIR, locale, outputFileName)
  await Deno.writeFile(
    outputFilePath,
    await toAPKG(deck, { media, sortField: 'emoji' }),
  )
})
