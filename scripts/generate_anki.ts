import { GEN_DIR } from '../shared/constants_server.ts'
import {
  listLanguages,
  readCompactLanguageFile,
  readLanguageFile,
} from '../shared/data_access.ts'
import { join } from 'std/path/mod.ts'
import { Deck, Model, Package } from '../shared/genanki/mod.ts'
import templates from '../data/templates.ts'

listLanguages().forEach(async (lang: string) => {
  const languageFile = await readLanguageFile(lang)
  const { columns } = await readCompactLanguageFile(lang)
  const hintColumnNames = columns.slice(1)

  const fields = [
    { name: 'Category' },
    { name: 'Emoji' },
    { name: 'Text' },
    { name: 'Audio' },
  ].concat(hintColumnNames.map((name) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
  })))

  const model = new Model({
    name: 'Emoji',
    id: '2156341623643',
    flds: fields,
    req: [[0, 'all', [0]]],
    tmpls: templates,
  })

  const deck = new Deck(5132412341341234, `${languageFile.name} Emoji`)
  const pkg = new Package()

  const notePromises = Object.keys(languageFile.data)
    .map((key) => ({ ...languageFile.data[key], key }))
    .map(async ({ category, key, text, ...other }) => {
      const audioFilename = `emoji_${languageFile.name}_${text}.mp3`
      const fields = [
        category,
        key,
        text,
        `[sound:${audioFilename}]`,
      ].concat(hintColumnNames.map((key) => other[key]))

      deck.addNote(model.note(fields))

      const audioLocation = join(GEN_DIR, lang, 'audio', audioFilename)
      const fileBytes = await Deno.readFile(audioLocation)
      const blob = new Blob([fileBytes], { type: 'audio/mpeg' })

      pkg.addMedia(blob, audioFilename)
    })
  await Promise.all(notePromises)

  pkg.addDeck(deck)
  pkg.writeToFile(join(GEN_DIR, lang, 'deck.apkg'))
})

// function langToTSV(compactLanguageFile) {
//   const { name, columns, data = [] } = compactLanguageFile
//   const categories = Object.keys(data).sort()

//   const emojis = categories.map((category) => {
//     return Object.keys(data[category])
//       .map((emoji) => [emoji, category, ...(data[category][emoji])])
//   }).flat(1)

//   let str = ['emoji', 'category', 'audio', ...columns].join('\t') + '\n'
//   emojis.forEach(([emoji, category, text, ...other]) => {
//     const audio = `[sound:emoji_${name}_${text}.mp3]`
//     const sub = [emoji, category, audio, text, ...other].join('\t')
//     str += `${sub}\n`
//   })
//   return str
// }
