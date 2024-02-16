import { ensureDir } from 'std/fs/mod.ts'
import { join } from 'std/path/mod.ts'
import { getAudioFilename, listAudioFiles, listLanguages, readDeck } from '@/shared/data_access.ts'
import { GEN_DIR } from '@/shared/paths.ts'

// Remote tmp
await Deno.remove('./tmp/audio', { recursive: true })

// Remove gen audio that is not in language file
for (const locale of await Promise.all(listLanguages())) {
  const deck = await readDeck(locale, true)
  const expectedNames = new Set()

  deck.notes.forEach((note) => {
    expectedNames.add(getAudioFilename(locale, note.emoji, note.text))
  })

  await ensureDir(join(GEN_DIR, locale, 'audio'))

  for (const audioFileName of listAudioFiles(locale)) {
    if (!expectedNames.has(audioFileName)) {
      await Deno.remove(join(GEN_DIR, locale, 'audio', audioFileName))
    }
  }
}
