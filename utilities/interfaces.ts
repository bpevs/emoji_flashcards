export interface EmojiData {
  text: string
  category: string
  [name: string]: string
}

export interface EmojiDataMap {
  [emojiKey: string]: EmojiData
}

export interface SourceEmojiData {
  text_en: string
  category: string
  pos: string
}

export interface SourceEmojiDataMap {
  [emojiKey: string]: SourceEmojiData
}

export interface LanguageFileData {
  [category: string]: {
    [emoji: string]: string[]
  }
}

export interface LanguageFile {
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
      language: string
    }
    play_ht?: {
      locale: string
      voice_id: string
    }
  }
  strings: {
    [key: string]: string
  }
  columns: string[]
  data: LanguageFileData
}

export interface ExtensionFile {
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
