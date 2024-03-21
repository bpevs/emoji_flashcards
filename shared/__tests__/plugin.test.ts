import { Deck, Note } from '@flashcard/core'
import { assertSpyCallAsync, assertSpyCalls, Stub, stub } from 'std/testing/mock.ts'
import { assertEquals } from 'std/assert/mod.ts'
import { afterEach, beforeEach, it } from 'std/testing/bdd.ts'
import { SourceFile } from '@/shared/types.ts'
import { _internals } from '@/shared/translate.ts'
import Plugin, { SourceRow, TargetRow } from '../plugin.ts'

type Rows = Array<{ [key: string]: string | number }>

const baseSourceFile: SourceFile = Object.freeze({
  version: '0.1.1',
  fields: ['text', 'hint'],
  notes: {
    animal: { '🐶': ['dog', 'noun'], '🐈': ['cat', 'noun'] },
    body: { '🦷': ['tooth', 'noun'], '🧠': ['brain', 'noun'] },
    verbs: { '🏃‍♂️🏃‍♀️': ['run', 'verb'] },
  },
})

function createEmptyDeck(): Deck {
  return new Deck('uwu-UWU_🏳️‍🌈', {
    name: 'UWU lang',
    desc: 'The UWU Language',
    fields: ['emoji', 'category', 'text'],
    meta: {
      name_en: 'UWU lang',
      lang_code: 'uwu',
      locale_code: 'uwu-UWU',
      locale_code_deepl: 'uwu',
      locale_flag: '🏳️‍🌈',
    },
    notes: {},
  })
}

let translateStub: Stub

beforeEach(() => {
  translateStub = stub(_internals, 'translateDeepl', (texts, locale) => {
    return Promise.resolve(texts.map((text: string) => text + '-' + locale))
  })
})

afterEach(() => translateStub.restore())

it('Runs with default pre/post', async () => {
  const plugin = new Plugin()
  const deck = await plugin.getTranslations(baseSourceFile, createEmptyDeck())
  // deno-lint-ignore no-explicit-any
  const rows: Rows = Object.values(deck.notes).map(({ content }: any) => content)

  assertEquals(rows, [
    { emoji: '🐶', category: 'animal', text: 'dog-uwu' },
    { emoji: '🐈', category: 'animal', text: 'cat-uwu' },
    { emoji: '🦷', category: 'body', text: 'tooth-uwu' },
    { emoji: '🧠', category: 'body', text: 'brain-uwu' },
    { emoji: '🏃‍♂️🏃‍♀️', category: 'verbs', text: 'run-uwu' },
  ])
  const textEn: string[] = ['dog', 'cat', 'tooth', 'brain', 'run']

  assertSpyCallAsync(translateStub, 0, {
    args: [textEn, 'uwu'],
    returned: textEn.map((text: string) => text + '-uwu'),
  })
  assertSpyCalls(translateStub, 1)
})

it('Runs with custom pre plugin', async () => {
  const plugin = new Plugin({
    pre(
      this: Plugin,
      emoji: string,
      { category, text_en, pos }: SourceRow,
      prev: Note,
    ): TargetRow {
      if (
        typeof prev?.content?.text === 'string' &&
        typeof prev?.content?.category === 'string' &&
        typeof prev?.content?.hint === 'string'
      ) {
        const { text, category, hint } = prev.content
        return { prev, props: { emoji, text, category, hint } }
      }

      if (pos === 'verb') {
        return {
          prev,
          props: {
            emoji,
            category,
            hint: this
              .queueTranslation(`I ${text_en}, you ${text_en}, he ${text_en}`),
            text: this
              .queueTranslation(`(to) ${text_en}`)
              .then((text: string) => text.replace(/\(.*\)\s/, '')),
          },
        }
      } else {
        const text = this.queueTranslation(text_en)
        return { prev, props: { emoji, text, category, hint: '' } }
      }
    },
  })

  const deck = await plugin.getTranslations(baseSourceFile, createEmptyDeck())
  // deno-lint-ignore no-explicit-any
  const rows: Rows = Object.values(deck.notes).map(({ content }: any) => content)

  assertEquals(rows, [
    { emoji: '🐶', category: 'animal', text: 'dog-uwu', hint: '' },
    { emoji: '🐈', category: 'animal', text: 'cat-uwu', hint: '' },
    { emoji: '🦷', category: 'body', text: 'tooth-uwu', hint: '' },
    { emoji: '🧠', category: 'body', text: 'brain-uwu', hint: '' },
    { emoji: '🏃‍♂️🏃‍♀️', category: 'verbs', text: 'run-uwu', hint: 'I run, you run, he run-uwu' },
  ])

  const untranslated = [
    'dog',
    'cat',
    'tooth',
    'brain',
    'I run, you run, he run',
    '(to) run',
  ]
  assertSpyCallAsync(translateStub, 0, {
    args: [untranslated, 'uwu'],
    returned: untranslated.map((text_en) => text_en + '-uwu'),
  })
  assertSpyCalls(translateStub, 1)
})

it('Runs with custom post plugin', async () => {
  async function createHintUwu(text: string) {
    await Promise.resolve('blah')
    return text + ' UWU'
  }

  const plugin = new Plugin({
    async post(next: Note, prev?: Note) {
      if (prev) return prev
      next.content.hint = await createHintUwu(String(next.content.text))
      return next
    },
  })

  const deck = await plugin.getTranslations(baseSourceFile, createEmptyDeck())
  // deno-lint-ignore no-explicit-any
  const rows: Rows = Object.values(deck.notes).map(({ content }: any) => content)

  assertEquals(rows, [
    { emoji: '🐶', category: 'animal', text: 'dog-uwu', hint: 'dog-uwu UWU' },
    { emoji: '🐈', category: 'animal', text: 'cat-uwu', hint: 'cat-uwu UWU' },
    { emoji: '🦷', category: 'body', text: 'tooth-uwu', hint: 'tooth-uwu UWU' },
    { emoji: '🧠', category: 'body', text: 'brain-uwu', hint: 'brain-uwu UWU' },
    { emoji: '🏃‍♂️🏃‍♀️', category: 'verbs', text: 'run-uwu', hint: 'run-uwu UWU' },
  ])

  const textEn: string[] = ['dog', 'cat', 'tooth', 'brain', 'run']

  assertSpyCallAsync(translateStub, 0, {
    args: [textEn, 'uwu'],
    returned: textEn.map((text: string) => text + '-uwu'),
  })
  assertSpyCalls(translateStub, 1)
})
