import Plugin, {
  ProcessingTargetRow,
  SourceRow,
  TargetRow,
} from '../../utilities/plugin.ts'

export default new Plugin({
  language: 'en',
  pre(
    this: Plugin,
    key: string,
    { category, text_en }: SourceRow,
    prev: TargetRow,
  ): ProcessingTargetRow {
    if (prev?.text) return { key, ...prev }
    return { key, text: text_en, category }
  },
})
