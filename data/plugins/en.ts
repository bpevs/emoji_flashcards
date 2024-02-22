import { Note } from '@flashcard/core'
import Plugin, { SourceRow, TargetRow } from '@/shared/plugin.ts'

export default new Plugin({
  pre(this: Plugin, emoji: string, source: SourceRow, prev?: Note): TargetRow {
    if (
      (typeof prev?.content?.text === 'string') &&
      (typeof prev?.content?.category === 'string')
    ) {
      const { text, category } = prev.content
      return { prev, props: { emoji, category, text } }
    }
    return {
      prev,
      props: {
        emoji,
        category: String(source.category),
        text: source.text_en,
      },
    }
  },
})
