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
  version: string
  name: string
  model_id: number
  deck_id: number
  locale_code: string
  language_code: string
  locale_flag: string
  pronunciation_key?: string
  audio_id: string
  strings: InterfaceStrings
  columns: string[]
  data: LanguageFileData
}

export interface ExtensionFile {
  version: string
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
