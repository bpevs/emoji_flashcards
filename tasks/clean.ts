import { ensureDir } from 'std/fs/mod.ts'
import { join } from 'std/path/mod.ts'
import {
  listAudioFiles,
  listLanguages,
  readLanguageFile,
} from '@/shared/data_access.ts'
import { getAudioFilename } from '@/shared/data_access_helpers.ts'
import { GEN_DIR } from '@/shared/paths.ts'

// Remote tmp
await Deno.remove('./tmp/audio', { recursive: true })

// Remove gen audio that is not in language file
for (const localeCode of await Promise.all(listLanguages())) {
  const languageFile = await readLanguageFile(localeCode, true)
  const emojisByCategory = languageFile.data
  const expectedNames = new Set()

  Object.keys(emojisByCategory).forEach((category) => {
    Object.keys(emojisByCategory[category])
      .forEach((key) => {
        const text = emojisByCategory[category][key][0]
        expectedNames.add(getAudioFilename(localeCode, key, text))
      })
  })

  await ensureDir(join(GEN_DIR, localeCode, 'audio'))
  for (const audioFileName of listAudioFiles(localeCode)) {
    if (!expectedNames.has(audioFileName)) {
      await Deno.remove(join(GEN_DIR, localeCode, 'audio', audioFileName))
    }
  }
}
