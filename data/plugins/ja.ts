import Kuroshiro from 'kuroshiro'
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji'
import Plugin, { TargetRow } from '@/shared/plugin.ts'

const kuroshiro = new (Kuroshiro.default)()
await kuroshiro.init(new KuromojiAnalyzer())

export default new Plugin({
  async post(
    this: Plugin,
    key: string,
    { category, text }: TargetRow,
    prev: TargetRow,
  ) {
    if (prev) return prev
    const romaji = (await kuroshiro.convert(text, { to: 'romaji' })) || ''
    return { key, text, category, romaji }
  },
})
