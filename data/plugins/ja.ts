import { Note } from '@flashcard/core'
import Kuroshiro from 'kuroshiro'
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji'
import Plugin from '@/shared/plugin.ts'

const kuroshiro = new (Kuroshiro.default)()
await kuroshiro.init(new KuromojiAnalyzer())

export default new Plugin({
  async post(next: Note) {
    const hiragana = await kuroshiro.convert(next.content.text, { to: 'hiragana' })
    next.content.hiragana = hiragana || ''
    return next
  },
})
