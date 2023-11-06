import type {
  EmojiDataMap,
  LanguageFile,
  LanguageFileData,
} from './interfaces.ts'

export function getAudioFilename(language: string, text: string) {
  return `emoji_${language}_${text.replace(/\s/g, '-')}.mp3`.normalize('NFC')
}

export function getEmojiDataMap(
  { columns, data }: LanguageFile,
): EmojiDataMap {
  const emojiMap: EmojiDataMap = {}
  Object.keys(data).forEach((category) => {
    Object.keys(data[category]).forEach((emojiKey) => {
      emojiMap[emojiKey] = { category, text: data[category][emojiKey][0] }
      columns.forEach((column: string, colIndex) => {
        emojiMap[emojiKey][column] = data[category][emojiKey][colIndex]
      })
    })
  })
  return emojiMap
}

export function getDataAndColumnsFromEmojiDataMap(
  dataMap: EmojiDataMap,
): [string[], LanguageFileData] {
  const data: LanguageFileData = {}
  const columns = Object.keys(dataMap['🐶'])
    .filter((key) => key !== 'category' && key !== 'text') || []

  for (const emojiKey in dataMap) {
    const item = dataMap[emojiKey]
    const values = columns.map((column: string) => item[column])
    values.unshift(item.text)
    if (!data[item.category]) data[item.category] = {}
    data[item.category][emojiKey] = values
  }

  return [['text', ...columns], data]
}

// deno-lint-ignore no-explicit-any
const replacer = (_: any, v: any) =>
  (v instanceof Array) ? JSON.stringify(v) : v

export function prettyPrintCompactFile(json: LanguageFile): string {
  if (typeof json === 'string') json = JSON.parse(json)

  return JSON.stringify(json, replacer, 2)
    .replace(/\\/g, '')
    .replace(/\"\[/g, '[')
    .replace(/\]\"/g, ']')
    .replace(/\"\{/g, '{')
    .replace(/\}\"/g, '}')
}
