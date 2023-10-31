import { join } from 'std/path/mod.ts'
import type {
  CompactLanguageFile,
  LanguageFile,
} from '../utilities/interfaces.ts'
import {
  fromCompactLanguageFile,
  prettyPrintCompactFile,
  toCompactLanguageFile,
} from '../utilities/data_access_utilities.ts'
import { GEN_DIR, LANGUAGES_DIR, SOURCE_FILE } from './constants_server.ts'

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

export function listAudioFiles(language: string): string[] {
  try {
    return Array.from(Deno.readDirSync(join(GEN_DIR, language, 'audio')))
      .filter(({ name }) => AUDIO_FILE_REGEX.test(name))
      .map((file) => file.name.replace('.mp3', ''))
  } catch {
    return []
  }
}

export async function readCompactLanguageFile(
  locale: string,
  extensionCodes: string[] = [],
): Promise<CompactLanguageFile> {
  const text = await Deno.readTextFile(`${LANGUAGES_DIR}/${locale}.json`)
  const compactLanguage: CompactLanguageFile = JSON.parse(text)
  if (extensionCodes.length) console.log('do extension stuff')
  return compactLanguage
}

export async function readLanguageFile(
  locale: string,
  extensionCodes: string[] = [],
): Promise<LanguageFile> {
  const text = await Deno.readTextFile(`${LANGUAGES_DIR}/${locale}.json`)
  const compactLanguage: CompactLanguageFile = JSON.parse(text)
  const languageFile = fromCompactLanguageFile(compactLanguage)
  if (!languageFile.data) languageFile.data = {}
  if (extensionCodes.length) console.log('do extension stuff')
  return languageFile
}

export async function readSourceFile(): Promise<LanguageFile> {
  const text = await Deno.readTextFile(SOURCE_FILE)
  const compactLanguage: CompactLanguageFile = JSON.parse(text)
  return fromCompactLanguageFile(compactLanguage)
}

export async function writeLanguageFile(
  locale: string,
  languageFile: LanguageFile,
): Promise<void> {
  const compactFile = toCompactLanguageFile(languageFile)
  const updatedLanguageJSON = prettyPrintCompactFile(compactFile)
  const filePath = `${LANGUAGES_DIR}/${locale}.json`
  await Deno.writeTextFile(filePath, updatedLanguageJSON)
}
