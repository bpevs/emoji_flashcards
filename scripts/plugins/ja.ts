import Kuroshiro from 'npm:kuroshiro'
import KuromojiAnalyzer from 'npm:kuroshiro-analyzer-kuromoji'

const kuroshiro = new (Kuroshiro.default)()
await kuroshiro.init(new KuromojiAnalyzer())

interface Response {
  text: string
  category: string
  romaji: string
}

export default async function ({ text, category }: {
  text: string
  category: string
}): Promise<Response> {
  const data: Response = { text, category, romaji: '' }
  return {
    ...data,
    romaji: (await kuroshiro.convert(text, { to: 'romaji' })) || '',
  }
}
