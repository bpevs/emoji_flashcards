import Deck from 'flashcards/models/deck.ts'
import Note from 'flashcards/models/note.ts'
import { API, translate } from '@/shared/translate.ts'
import type { SourceFile } from '@/shared/types.ts'

export interface SourceRow {
  category: string
  text_en: string
  pos: string
}

export interface TargetRow {
  prev?: Note
  props: {
    emoji: string
    category: string
    text: string | Promise<string>
    [name: string]: string | Promise<string>
  }
}

type SourceDataMap = {
  [emojiKey: string]: SourceRow
}

// Helps build language files
export default class Plugin {
  toTranslate: { [text_en: string]: (translated: string) => void } = {}

  constructor(props?: {
    pre?: (key: string, source: SourceRow, prev: Note) => TargetRow
    post?: (note: Note, prev?: Note) => Note | Promise<Note>
  }) {
    if (props?.pre) this.pre = props.pre
    if (props?.post) this.post = props.post
  }

  // Complete any queued translations, and return completed rows
  async getTranslations(sourceFile: SourceFile, deck: Deck): Promise<Deck> {
    const sourceRowsMap: SourceDataMap = getSourceDataMap(sourceFile)
    const rows: TargetRow[] = [] // All rows, with inserted promises for translation

    for (const key in sourceRowsMap) {
      const note = deck.notes.find((note: Note) => note.content.emoji === key)
      rows.push(this.pre(key, sourceRowsMap[key], note))
    }

    const { locale_code, locale_code_azure, locale_code_deepl } = deck?.meta || {}

    const translationAPI = locale_code_deepl ? API.DEEPL : API.AZURE
    const translationCode = locale_code_deepl ?? locale_code_azure ?? locale_code

    if (
      !translationCode ||
      typeof translationCode !== 'string' // @todo: fix Deck.meta typing
    ) throw new Error('No locale to translate')
    await this.resolveTranslations(translationCode, translationAPI)

    for (const index in rows) {
      const { prev, props } = rows[index]
      const { emoji, category, text, ...other } = props

      const content: Record<string, string> = { category, emoji, text: await text }

      for (const otherKey in other) {
        content[otherKey] = await other[otherKey]
      }
      const noteId = `${deck.id}_${emoji}`
      const nextNote = await this.post(new Note({ id: noteId, content }), prev)

      const existingIndex = deck.notes
        .findIndex((note: Note) => note.content.emoji === nextNote.content.emoji)
      if (existingIndex != -1) deck.notes[existingIndex] = nextNote
      else deck.notes.push(nextNote)
    }

    return deck
  }

  queueTranslation(text_en: string): Promise<string> {
    let timer: number | null
    return Promise.race<string>([
      new Promise((resolve) => {
        this.toTranslate[text_en] = (text: string) => {
          if (timer) clearTimeout(timer)
          resolve(text)
        }
      }),
      new Promise((resolve) => {
        timer = setTimeout(() => {
          console.warn('Translation timed out!', text_en)
          resolve('')
        }, 5000)
      }),
    ])
  }

  async resolveTranslations(
    translation_language: string,
    translation_api: API,
  ) {
    const resolves = Object.keys(this.toTranslate)
    if (!resolves.length) return

    const translated = await translate(
      resolves,
      translation_language,
      translation_api,
    )

    translated.forEach((text: string, index: number) => {
      const key = resolves[index]
      if (this.toTranslate[key]) this.toTranslate[key](text)
      else console.warn(`Missing translate resolver for ${text}`)
    })
  }

  // Runs prior to translation; this is for if we want to modify the text
  // that will be translated.
  pre(emoji: string, source: SourceRow, prev?: Note): TargetRow {
    if (prev?.content?.text) {
      return {
        prev,
        props: {
          emoji,
          category: prev.content.category,
          text: prev.content.text,
        },
      }
    }
    return {
      prev,
      props: {
        emoji,
        category: source.category,
        text: this.queueTranslation(source.text_en),
      },
    }
  }

  // For plugins that require the translated text to generate;
  // Basically, for creating hints.
  post(note: Note, _prev?: Note): Note | Promise<Note> {
    return note
  }
}

function getSourceDataMap({ notes }: SourceFile): SourceDataMap {
  const emojiMap: SourceDataMap = {}
  Object.keys(notes).forEach((category) => {
    // @todo: fix Deck.meta typing
    // deno-lint-ignore no-explicit-any
    Object.keys(notes[category]).forEach((key: any) => {
      emojiMap[key] = {
        category,
        text_en: notes[category][key][0],
        pos: notes[category][key][1],
      }
    })
  })
  return emojiMap
}
