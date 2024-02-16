import Note from 'flashcards/models/note.ts'
import Plugin, { SourceRow, TargetRow } from '@/shared/plugin.ts'

export default new Plugin({
  pre(
    this: Plugin,
    emoji: string,
    { category, text_en, pos }: SourceRow,
    prev: Note,
  ): TargetRow {
    if (prev?.content?.text) return { emoji, prev, ...prev.content }

    if (pos === 'verb') {
      return {
        emoji,
        category,
        text: this
          .queueTranslation(`(to) ${text_en}`)
          .then((text: string) => text.replace(/\(.*\)\s/, '')),
        hint: this
          .queueTranslation(`I ${text_en}, you ${text_en}, he ${text_en}`),
        prev,
      }
    }

    const text = this.queueTranslation(text_en)
    return { emoji, text, category, hint: '', prev }
  },
})
