import Note from 'flashcards/models/note.ts'
import Plugin, { SourceRow, TargetRow } from '@/shared/plugin.ts'

export default new Plugin({
  pre(this: Plugin, emoji: string, source: SourceRow, prev: Note): TargetRow {
    const alreadyExists = Boolean(prev?.content?.text)
    return {
      emoji,
      category: alreadyExists ? prev.content.category : source.category,
      text: alreadyExists ? prev.content.text : source.text_en,
      prev,
    }
  },
})
