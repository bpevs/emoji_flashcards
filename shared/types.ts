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
  name_en: string
  name_short?: string
  locale_code: string
  lang_code: string
  locale_flag: string
  pronunciation_key?: string
  rtl?: boolean
  meta: {
    anki_id: number
    deepl?: {
      lang_code: string
      locale_code?: string
    }
    azure?: {
      locale_code: string
      translation_locale?: string
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

export interface UserLanguageMeta {
  userLangCode: string
  noteLangCode: string
  rtl: boolean // based on user-locale
  strings: { [name: string]: string } // based on user-locale

  locales: Array<{
    lang_code: string
    locale_code: string
    native_name: string
    locale_flag: string
  }>

  // based on note-language
  data: {
    name: string
    meta: {
      name_en: string
      name_short?: string
      lang_code: string
      locale_code: string
      locale_code_azure?: string
      locale_code_deepl?: string
      locale_flag: string
      rtl?: boolean
      voice_id_azure: string
    }
    key: string
    columns: string[]
    notes: Array<string[]>
  }
}
