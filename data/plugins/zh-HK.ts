import Note from 'flashcards/models/note.ts'
import Plugin from '@/shared/plugin.ts'
import CantoJpMin from './utilities/cantojpmin/mod.ts'

const cantoJpMin = new CantoJpMin()

export default new Plugin({
  post(next: Note): Note {
    next.content.jyutping = cantoJpMin.toJyutping(next.content.text) || ''
    return next
  },
})
