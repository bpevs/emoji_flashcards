import Note from 'flashcards/models/note.ts'
import pinyin from 'chinese-to-pinyin'
import Plugin, { TargetRow } from '@/shared/plugin.ts'

export default new Plugin({
  post(next: Note, prev: Note): Note {
    next.content.pinyin = pinyin(next.content.text) || ''
    return next
  },
})
