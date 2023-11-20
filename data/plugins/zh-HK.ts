import Plugin, { TargetRow } from '../../utilities/plugin.ts'
import CantoJpMin from './utilities/cantojpmin/mod.ts'

const cantoJpMin = new CantoJpMin()

export default new Plugin({
  post(
    this: Plugin,
    key: string,
    { category, text }: TargetRow,
    prev: TargetRow,
  ): TargetRow {
    if (prev) return prev
    return {
      key,
      text,
      category,
      jyutping: cantoJpMin.toJyutping(text) || '',
    }
  },
})
