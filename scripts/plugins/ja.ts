import Kuroshiro from 'npm:kuroshiro'
import KuromojiAnalyzer from 'npm:kuroshiro-analyzer-kuromoji'

const kuroshiro = new (Kuroshiro.default)()
await kuroshiro.init(new KuromojiAnalyzer())

export default async function ({ text, category }): {
  text: string
  category: string
  romaji: string
} {
  const data = { text, category }
  data.romaji = await kuroshiro.convert(text, { to: 'romaji' })
  return data
}
