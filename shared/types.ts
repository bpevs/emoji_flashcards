export type LanguageFileData = {
  [category: string]: {
    [emoji: string]: string[]
  }
}

export type SourceFile = {
  version: string
  fields: string[]
  notes: {
    [category: string]: {
      [emoji: string]: string[]
    }
  }
}

export type ExtensionFile = {
  name: string
  notes: Array<string[]>
  extensions: {
    [extensionName: string]: {
      name: string
      description: string
      notes: Array<string[]>
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
    fields: string[]
    notes: Array<string[]>
  }
}
