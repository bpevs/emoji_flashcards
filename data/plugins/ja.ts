import type { TranslatedSourceData } from '../../utilities/interfaces.ts'

import Kuroshiro from 'kuroshiro'
import KuromojiAnalyzer from 'kuroshiro-analyzer-kuromoji'

const kuroshiro = new (Kuroshiro.default)()
await kuroshiro.init(new KuromojiAnalyzer())

interface LangData {
  text: string
  category: string
  romaji: string
}

export default async function (
  { translatedText, category }: TranslatedSourceData,
  existing: LangData,
): Promise<LangData | null> {
  if (existing) return null
  return {
    text: translatedText,
    category,
    romaji: (await kuroshiro.convert(translatedText, { to: 'romaji' })) || '',
  }
}
