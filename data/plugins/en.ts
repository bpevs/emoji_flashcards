import Note from 'flashcards/models/note.ts'
import Plugin, { SourceRow, TargetRow } from '@/shared/plugin.ts'

export default new Plugin({
  pre(this: Plugin, emoji: string, source: SourceRow, prev?: Note): TargetRow {
    if (prev?.content?.text && prev?.content?.category) {
      const { text, category } = prev.content
      return { prev, props: { emoji, category, text } }
    }
    return {
      prev,
      props: {
        emoji,
        category: source.category,
        text: source.text_en,
      },
    }
  },
})
