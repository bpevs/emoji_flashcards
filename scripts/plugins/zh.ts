import type { SourceData } from '../interfaces.ts'
import pinyin from 'npm:chinese-to-pinyin'

interface LangData {
  text: string
  category: string
  pinyin: string
}

export default function (
  { text, category }: SourceData,
  existing: LangData,
): LangData | null {
  if (existing) return null
  return {
    text,
    category,
    pinyin: pinyin(text) || '',
  }
}
