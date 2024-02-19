// Validate that there are no duplicate keys in source.json
import { readSourceFile } from '@/shared/data_access.ts'

const { notes } = await readSourceFile()

const emojisSet = new Set<string>()
const textsSet = new Set<string>()
const duplicates = new Set<string>()

Object.keys(notes).forEach((category) => {
  Object.keys(notes[category]).forEach((emojiKey) => {
    const text = notes[category][emojiKey][0]
    if (emojisSet.has(emojiKey)) {
      console.log(`duplicate emoji: ${emojiKey}`, text)
      duplicates.add(emojiKey)
    }
    if (textsSet.has(text)) {
      console.log(`duplicate text: ${text}`, emojiKey)
      duplicates.add(text)
    }
    textsSet.add(text)
    emojisSet.add(emojiKey)
  })
})

if (duplicates.size > 0) throw new Error('There are duplicates')
