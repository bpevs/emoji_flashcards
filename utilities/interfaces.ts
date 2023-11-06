export interface TranslatedSourceData {
  text: string
  translatedText: string
  category: string
  pos: string
}

export interface Translation {
  text: string
  category: string
  [name: string]: string
}

export interface EmojiDataMap {
  [emojiKey: string]: Translation
}

export interface InterfaceStrings {
  [key: string]: string
}

export interface LanguageFileData {
  [category: string]: {
    [emoji: string]: string[]
  }
}

export interface LanguageFile {
  name: string
  model_id: number
  deck_id: number
  locale_code: string
  language_code: string
  locale_flag?: string
  pronunciation_key?: string
  audio_id: string
  strings: InterfaceStrings
  columns: string[]
  data: LanguageFileData
}

export interface ExtendedLanguageFile {
  name: string
  strings: InterfaceStrings
  data: EmojiDataMap
  model_id: number
  deck_id: number
  locale_code: string
  language_code: string
  audio_id: string
  locale_flag?: string
  pronunciation_key?: string
}

export interface ExtensionFile {
  name: string
  data: LanguageFileData
  strings: InterfaceStrings
  extensions: {
    [extensionName: string]: {
      name: string
      description: string
      data: LanguageFileData
    }
  }
}
