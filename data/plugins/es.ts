import Plugin, {
  ProcessingTargetRow,
  SourceRow,
  TargetRow,
} from '../../utilities/plugin.ts'

export default new Plugin({
  pre(
    this: Plugin,
    key: string,
    { category, text_en, pos }: SourceRow,
    prev: TargetRow,
  ): ProcessingTargetRow {
    if (prev?.text) return { key, ...prev }

    if (pos === 'verb') {
      return {
        key,
        category,
        hint: this
          .queueTranslation(`I ${text_en}, you ${text_en}, he ${text_en}`),
        text: this
          .queueTranslation(`(to) ${text_en}`)
          .then((text: string) => text.replace(/\(.*\)\s/, '')),
      }
    } else {
      const text = this.queueTranslation(text_en)
      return { key, text, category, hint: '' }
    }
  },
})
