import Note from 'flashcards/models/note.ts'
import pinyin from 'chinese-to-pinyin'
import Plugin from '@/shared/plugin.ts'

export default new Plugin({
  post(next: Note): Note {
    next.content.pinyin = pinyin(next.content.text) || ''
    return next
  },
})
