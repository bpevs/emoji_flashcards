import type { TranslatedSourceData } from '../../utilities/interfaces.ts'
import pinyin from 'chinese-to-pinyin'

interface LangData {
  text: string
  category: string
  pinyin: string
}

export default function (
  { translatedText, category }: TranslatedSourceData,
  existing: LangData,
): LangData | null {
  if (existing) return null
  return {
    text: translatedText,
    category,
    pinyin: pinyin(translatedText) || '',
  }
}
