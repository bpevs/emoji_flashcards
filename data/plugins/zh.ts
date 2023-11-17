import pinyin from 'chinese-to-pinyin'
import Plugin, { TargetRow } from '../../utilities/plugin.ts'

export default new Plugin({
  post(
    this: Plugin,
    key: string,
    { category, text }: TargetRow,
    prev: TargetRow,
  ): TargetRow {
    if (prev) return prev
    return { key, text, category, pinyin: pinyin(text) || '' }
  },
})
