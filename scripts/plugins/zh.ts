import pinyin from 'npm:chinese-to-pinyin'

interface Response {
  text: string
  category: string
  pinyin: string
}

export default function ({ text, category }: {
  text: string
  category: string
}): Response {
  const data: Response = { text, category, pinyin: '' }
  return {
    ...data,
    pinyin: pinyin(text) || '',
  }
}
