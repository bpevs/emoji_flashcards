interface Translation {
  text: string
  category: string
  hint?: string
}

interface TranslationData {
  [emoji: string]: Translation
}

interface InterfaceStrings {
  [key: string]: string
}

interface LanguageFile {
  name: string
  strings: InterfaceStrings
  data: TranslationData
}

interface CompactLanguageFile {
  name: string
  strings: InterfaceStrings
  columns: string[]
  data: {
    [category: string]: {
      [emoji: string]: string[]
    }
  }
}

interface ExtensionFile {
  strings: InterfaceStrings
  data: TranslationData
  [extensionName: string]: {
    name: string
    description: string
    data: TranslationData
  }
}

interface SourceFile {
  data: {
    [emoji: string]: {
      text: string
      pos: string
      category: string
    }
  }
}
