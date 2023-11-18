export type LanguageData = {
  text: string
  category: string
  [name: string]: string
}

export type LanguageDataMap = {
  [emojiKey: string]: LanguageData
}

export type SourceDataRow = {
  text_en: string
  category: string
  pos: string
}

export type SourceDataMap = {
  [emojiKey: string]: SourceDataRow
}

export type LanguageFileData = {
  [category: string]: {
    [emoji: string]: string[]
  }
}

export type SourceFile = {
  version: string
  strings: {
    [key: string]: string
  }
  columns: string[]
  data: LanguageFileData
}

export type LanguageFile = SourceFile & {
  version: string
  name: string
  locale_code: string
  language_code: string
  locale_flag: string
  pronunciation_key?: string
  meta: {
    anki: {
      model_id: number
      deck_id: number
    }
    deepl?: {
      language_code: string
      locale_code?: string
    }
    play_ht?: {
      locale_code: string
      voice_id: string
    }
    azure?: {
      locale_code: string
      voice_id: string
    }
  }
}

export type ExtensionFile = {
  version: string
  name: string
  data: LanguageFileData
  strings: {
    [key: string]: string
  }
  extensions: {
    [extensionName: string]: {
      name: string
      description: string
      data: LanguageFileData
    }
  }
}
