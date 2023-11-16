import { translate } from './translate.ts'

export type SourceRow = {
  category: string
  text_en: string
  pos: string
}

export type TargetRow = {
  category: string
  text: string
  [name: string]: string
}

export type ProcessingTargetRow = {
  key: string
  category: string
  text: string | Promise<string>
  [name: string]: string | Promise<string>
}

// Helps build language files
export default class Plugin {
  language: string
  toTranslate: {
    [text_en: string]: (translated: string) => void
  } = {}

  constructor(props: {
    language: string
    pre?: (
      key: string,
      source: SourceRow,
      target: TargetRow,
    ) => ProcessingTargetRow
    post?: (
      key: string,
      undecoratedTarget: TargetRow,
      target: TargetRow,
    ) => TargetRow | Promise<TargetRow>
  }) {
    this.language = props.language
    if (props.pre) this.pre = props.pre
    if (props.post) this.post = props.post
  }

  // Complete any queued translations, and return completed rows
  async getLanguageFileRows(
    sourceRowsMap: { [key: string]: SourceRow },
    targetRowsMap: { [key: string]: TargetRow },
  ): Promise<{ [key: string]: TargetRow }> {
    const rows: ProcessingTargetRow[] = []

    for (const key in sourceRowsMap) {
      rows.push(this.pre(key, sourceRowsMap[key], targetRowsMap[key]))
    }

    await this.resolveTranslations()

    const nextTargetRowsMap: { [key: string]: TargetRow } = {}

    for (const index in rows) {
      const { key, category, text, ...other } = rows[index]
      const undecoratedTarget: TargetRow = { key, category, text: await text }
      for (const otherKey in other) {
        undecoratedTarget[otherKey] = await other[otherKey]
      }

      nextTargetRowsMap[key] = await this.post(
        key,
        undecoratedTarget,
        targetRowsMap[key],
      )
      delete nextTargetRowsMap[key].key
    }

    return nextTargetRowsMap
  }

  queueTranslation(text_en: string): Promise<string> {
    return new Promise((resolve) => {
      this.toTranslate[text_en] = resolve
    })
  }

  async resolveTranslations() {
    const resolves = Object.keys(this.toTranslate)
    const translated = await translate(resolves, this.language)
    translated.filter(Boolean).forEach((text: string, index: number) => {
      const key = resolves[index]
      if (this.toTranslate[key]) this.toTranslate[key](text)
      else console.warn(`Missing translate resolver for ${text}`)
    })
  }

  // Runs prior to translation; this is for if we want to modify the text
  // that will be translated.
  pre(
    key: string,
    source: SourceRow,
    target: TargetRow,
  ): ProcessingTargetRow {
    if (target?.text) return { key, ...target }
    return {
      key,
      category: source.category,
      text: this.queueTranslation(source.text_en),
    }
  }

  // For plugins that require the translated text to generate;
  // Basically, for creating hints.
  post(
    _key: string,
    target: TargetRow,
    _prevTarget: TargetRow,
  ): TargetRow | Promise<TargetRow> {
    return target
  }
}
