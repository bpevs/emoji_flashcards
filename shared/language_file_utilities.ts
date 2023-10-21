import type {
  CompactLanguageFile,
  LanguageFile,
  TranslationData,
} from './interfaces.ts'

export function fromCompactLanguageFile(
  compactFile: CompactLanguageFile,
): LanguageFile {
  const data: TranslationData = {}

  const categoryNames = Object.keys(compactFile.data)
  categoryNames.forEach((category) => {
    const emojis = Object.keys(compactFile.data[category])
    emojis.forEach((emoji) => {
      data[emoji] = { category, text: compactFile.data[category][emoji][0] }
      compactFile.columns.forEach((column, index) => {
        data[emoji][column] = compactFile.data[category][emoji][index]
      })
    })
  })

  return {
    name: compactFile.name,
    strings: compactFile.strings,
    data,
  }
}

export function toCompactLanguageFile(
  languageFile: LanguageFile,
): CompactLanguageFile {
  const columns = Object.keys(languageFile.data['🐶'])
    .filter((key) => key !== 'category' && key !== 'text') || []

  const data: {
    [category: string]: {
      [emoji: string]: string[]
    }
  } = {}

  for (const emoji in languageFile.data) {
    const item = languageFile.data[emoji]
    const values = columns.map((column) => item[column])
    values.unshift(item.text)
    if (!data[item.category]) data[item.category] = {}
    data[item.category][emoji] = values
  }

  return {
    name: languageFile.name,
    strings: languageFile.strings,
    columns: ['text', ...columns],
    data,
  }
}

// deno-lint-ignore no-explicit-any
const replacer = (_: any, v: any) =>
  (v instanceof Array) ? JSON.stringify(v) : v

export function prettyPrintCompactFile(json: CompactLanguageFile): string {
  if (typeof json === 'string') json = JSON.parse(json)

  return JSON.stringify(json, replacer, 2)
    .replace(/\\/g, '')
    .replace(/\"\[/g, '[')
    .replace(/\]\"/g, ']')
    .replace(/\"\{/g, '{')
    .replace(/\}\"/g, '}')
}
