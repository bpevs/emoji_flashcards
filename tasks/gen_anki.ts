import { GEN_DIR } from '../utilities/constants_server.ts'
import { Translation } from '../utilities/interfaces.ts'
import { listLanguages, readLanguageFile } from '../utilities/data_access.ts'
import { join } from 'std/path/mod.ts'
import { ankiHash, Deck, Model, Package } from '../utilities/genanki/mod.ts'
import templates from '../data/templates/mod.ts'
import {
  getAudioFilename,
  getEmojiDataMap,
} from '../utilities/data_access_utilities.ts'

listLanguages().forEach(async (langCode: string) => {
  const lang = await readLanguageFile(langCode, true)
  const hintColumnNames = lang.columns.slice(1)
  const fields = [
    { name: 'Emoji' },
    { name: 'Text' },
    { name: 'Audio' },
  ].concat(hintColumnNames.map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
  })))

  const model = new Model({
    name: `Emoji Flashcards (${lang.name})`,
    id: lang.model_id,
    did: lang.deck_id,
    flds: fields,
    req: [
      [0, 'all', [0]],
      [1, 'all', [0]],
      [2, 'all', [0]],
    ],
    tmpls: templates[lang.language_code] || [],
  })

  const deck = new Deck(lang.deck_id, `${lang.name} Emoji Flashcards`)
  const pkg = new Package()

  const emojiDataMap = getEmojiDataMap(lang)
  const notePromises = Object.keys(emojiDataMap)
    .map((key) => ({ ...emojiDataMap[key], key }))
    .map(async ({ category, key, text, ...other }: Translation) => {
      const audioFilename = getAudioFilename(langCode, text)

      const fieldValues = [key, text, `[sound:${audioFilename}]`]
        .concat(hintColumnNames.map((key: string) => other[key]))

      // Stable note guid based on locale + emoji
      const guid = ankiHash([langCode, key])
      deck.addNote(model.createNote(fieldValues, [category], guid))

      const audioLocation = join(GEN_DIR, langCode, 'audio', audioFilename)
      const fileBytes = await Deno.readFile(audioLocation)
      const blob = new Blob([fileBytes], { type: 'audio/mpeg' })

      pkg.addMedia(blob, audioFilename)
    })
  await Promise.all(notePromises)

  pkg.addDeck(deck)
  pkg.writeToFile(join(GEN_DIR, langCode, `${langCode}.apkg`))
})
