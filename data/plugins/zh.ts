import { Note } from '@flashcard/core'
import pinyin from 'chinese-to-pinyin'
import Plugin from '@/shared/plugin.ts'

export default new Plugin({
  post(next: Note): Note {
    next.content.pinyin = pinyin(next.content.text) || ''
    return next
  },
})
