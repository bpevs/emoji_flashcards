import Note from 'flashcards/models/note.ts'
import Kuroshiro from 'kuroshiro'
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji'
import Plugin from '@/shared/plugin.ts'

const kuroshiro = new (Kuroshiro.default)()
await kuroshiro.init(new KuromojiAnalyzer())

export default new Plugin({
  async post(next: Note) {
    const romaji = await kuroshiro.convert(next.content.text, { to: 'romaji' })
    next.content.romaji = romaji || ''
    return next
  },
})
