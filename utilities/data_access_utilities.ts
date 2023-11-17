import type {
  LanguageDataMap,
  LanguageFile,
  LanguageFileData,
  SourceDataMap,
  SourceFile,
} from './types.ts'

const illegalRe = /[\/\?<>\\:\*\|"]/g
// deno-lint-ignore no-control-regex
const controlRe = /[\x00-\x1f\x80-\x9f]/g
const reservedRe = /^\.+$/
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
const windowsTrailingRe = /[\. ]+$/

export function getAudioFilename(
  language: string,
  emoji: string,
  text: string,
) {
  const replacement = ''
  return `${language}_${emoji}_${text}.mp3`
    .toLowerCase()
    .normalize('NFC')
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement)
    .replace(/(\,|\;|\:|\s|\(|\))+/g, '-')
}

export function getSourceDataMap(
  { data }: SourceFile,
): SourceDataMap {
  const emojiMap: SourceDataMap = {}
  Object.keys(data).forEach((category) => {
    Object.keys(data[category]).forEach((emojiKey) => {
      emojiMap[emojiKey] = {
        category,
        text_en: data[category][emojiKey][0],
        pos: data[category][emojiKey][1],
      }
    })
  })
  return emojiMap
}

export function getLanguageDataMap(
  { columns, data }: LanguageFile,
): LanguageDataMap {
  const emojiMap: LanguageDataMap = {}
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

export function getDataAndColumns(
  dataMap: LanguageDataMap,
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
