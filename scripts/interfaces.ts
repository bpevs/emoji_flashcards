export interface Translation {
  text: string
  category: string
  [name: string]: string
}

export interface TranslationData {
  [emoji: string]: Translation
}

export interface InterfaceStrings {
  [key: string]: string
}

export interface LanguageFile {
  name: string
  strings: InterfaceStrings
  data: TranslationData
}

export interface CompactLanguageFile {
  name: string
  strings: InterfaceStrings
  columns: string[]
  data: {
    [category: string]: {
      [emoji: string]: string[]
    }
  }
}

export interface ExtensionFile {
  name: string
  data: TranslationData
  strings: InterfaceStrings
  extensions: {
    [extensionName: string]: {
      name: string
      description: string
      data: TranslationData
    }
  }
}

export interface SourceFile {
  strings: InterfaceStrings
  data: {
    [emoji: string]: {
      text: string
      pos: string
      category: string
    }
  }
}
