import pinyin from 'npm:chinese-to-pinyin'

export default function ({ text, category }): {
  text: string
  category: string
  pinyin: string
} {
  const data = { text, category }
  data.pinyin = pinyin(text)
  return data
}
