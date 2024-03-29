import { Note } from '@flashcard/core'
import Plugin, { SourceRow, TargetRow } from '@/shared/plugin.ts'

export default new Plugin({
  pre(
    this: Plugin,
    emoji: string,
    { category, text_en, pos }: SourceRow,
    prev: Note,
  ): TargetRow {
    if (pos === 'verb' && !prev?.content?.hint) {
      return {
        prev,
        props: {
          emoji: String(emoji),
          category: String(category),
          text: this
            .queueTranslation(`(to) ${text_en}`)
            .then((text: string) => text.replace(/\(.*\)\s/, '')),
          hint: this
            .queueTranslation(`I ${text_en}, you ${text_en}, he ${text_en}`),
        },
      }
    }

    if (prev?.content?.text && prev?.content?.category) {
      return {
        prev,
        props: {
          emoji,
          category: String(prev.content.category),
          text: String(prev.content.text),
          hint: String(prev.content.hint || ''),
        },
      }
    }

    const text = this.queueTranslation(text_en)
    return { prev, props: { emoji, text, category, hint: '' } }
  },
})
