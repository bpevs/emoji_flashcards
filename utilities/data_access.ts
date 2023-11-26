import { join } from 'std/path/mod.ts'
import type {
  ExtensionFile,
  LanguageFile,
  SourceFile,
} from '../utilities/types.ts'
import { prettyPrintCompactFile } from '../utilities/data_access_utilities.ts'
import {
  EXTENSIONS_DIR,
  GEN_DIR,
  LANGUAGES_DIR,
  SOURCE_FILE,
} from './constants_server.ts'

const LANGUAGE_FILE_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?\.json$/
const AUDIO_FILE_REGEX = /.*\.mp3$/

/**
 * For use in server and tasks, get and set data
 */
export function listLanguages(): string[] {
  try {
    return Array.from(Deno.readDirSync(LANGUAGES_DIR))
      .filter(({ name }) => LANGUAGE_FILE_REGEX.test(name))
      .map((file) => file.name.replace('.json', ''))
  } catch {
    return []
  }
}

export function listAudioFiles(language: string): Set<string> {
  const items: Set<string> = new Set()
  Array.from(Deno.readDirSync(join(GEN_DIR, language, 'audio')))
    .filter(({ name }) => AUDIO_FILE_REGEX.test(name))
    .forEach((file) => items.add(file.name.normalize('NFC')))
  return items
}

export async function readLanguageFile(
  locale: string,
  includeExtensions = false,
  extensionCodes: string[] = [],
): Promise<LanguageFile> {
  const text = await Deno.readTextFile(`${LANGUAGES_DIR}/${locale}.json`)
  const languageFile: LanguageFile = JSON.parse(text)
  if (includeExtensions) {
    try {
      const text = await Deno.readTextFile(`${EXTENSIONS_DIR}/${locale}.json`)
      const extensionFile: ExtensionFile = JSON.parse(text)
      const extensions = [extensionFile.data]
        .concat(extensionCodes.map((n) => extensionFile.extensions[n].data))

      extensions.forEach((extension) => {
        Object.keys(extension).forEach((categoryName) => {
          Object.keys(extensionFile.data[categoryName]).forEach((key) => {
            if (!languageFile.data[categoryName]) {
              languageFile.data[categoryName] = {}
            }
            languageFile.data[categoryName][key] = extension[categoryName][key]
          })
        })
      })
    } catch { /* No extension file */ }
  }
  return languageFile
}

export async function readSourceFile(): Promise<SourceFile> {
  const text = await Deno.readTextFile(SOURCE_FILE)
  const sourceFile: SourceFile = JSON.parse(text)
  return sourceFile
}

export async function writeLanguageFile(
  locale: string,
  languageFile: LanguageFile,
): Promise<void> {
  // Hackery for consistent category name write-order
  const data = languageFile.data
  const keys = Object.keys(data).sort()
  const newData: {
    [category: string]: {
      [emoji: string]: string[]
    }
  } = {}
  keys.forEach((key: string) => newData[key] = data[key])
  languageFile.data = newData

  await Deno.writeTextFile(
    `${LANGUAGES_DIR}/${locale}.json`,
    prettyPrintCompactFile(languageFile),
  )
}
