import { join } from 'std/path/mod.ts'
import fromJSON from 'flashcards/adapters/from_json.ts'
import Deck from 'flashcards/models/deck.ts'
import Note from 'flashcards/models/note.ts'
import type { ExtensionFile, SourceFile } from '@/shared/types.ts'
import { EXTENSIONS_DIR, GEN_DIR, LANGUAGES_DIR, SOURCE_FILE } from './paths.ts'

const LANGUAGE_FILE_REGEX = /^[a-z]{2,3}(-[A-Z]{2})?\.json$/
const AUDIO_FILE_REGEX = /.*\.mp3$/

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

export async function readDeck(
  locale: string,
  includeExtensions = false,
  includedExtNames: string[] = [],
): Promise<Deck> {
  const deckLocation = `${LANGUAGES_DIR}/${locale}.json`
  const deck = fromJSON(await Deno.readTextFile(deckLocation), { sortField: 'emoji' })
  const fields: string[] = deck.content.fields

  if (includeExtensions) {
    try {
      const text = await Deno.readTextFile(`${EXTENSIONS_DIR}/${locale}.json`)
      const extensionFile: ExtensionFile = JSON.parse(text)
      const extensions = [extensionFile.notes]
        .concat(includedExtNames.map((n) => extensionFile.extensions[n].notes))

      extensions.forEach((extension: Array<string[]>) => {
        extension.forEach((row) => {
          const emoji = row[1]
          const id = `${deck.id}_${emoji}`
          const content: { [key: string]: string } = {}
          fields.forEach((field, index) => content[field] = row[index])
          deck.addNote(new Note({ id, content }))
        })
      })
    } catch { /* No extension file */ }
  }
  return deck
}

export async function readSourceFile(): Promise<SourceFile> {
  const text = await Deno.readTextFile(SOURCE_FILE)
  const sourceFile: SourceFile = JSON.parse(text)
  return sourceFile
}

const illegalRe = /[\/\?<>\\:\*\|"]/g
// deno-lint-ignore no-control-regex
const controlRe = /[\x00-\x1f\x80-\x9f]/g
const reservedRe = /^\.+$/
const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i
const windowsTrailingRe = /[\. ]+$/

export function getAudioFilename(
  language: string,
  emoji: string,
  text: string,
) {
  const replacement = ''
  return `${language}_${emoji}_${text}.mp3`
    .toLowerCase()
    .normalize('NFC')
    .replace(illegalRe, replacement)
    .replace(controlRe, replacement)
    .replace(reservedRe, replacement)
    .replace(windowsReservedRe, replacement)
    .replace(windowsTrailingRe, replacement)
    .replace(/(\,|\;|\:|\s|\(|\))+/g, '-')
}
