import { assertSpyCallAsync, assertSpyCalls, Stub, stub } from 'std/testing/mock.ts'
import { assertEquals } from 'std/assert/mod.ts'
import { afterEach, beforeEach, it } from 'std/testing/bdd.ts'
import { SourceFile } from '@/shared/types.ts'
import { _internals } from '@/shared/translate.ts'
import Plugin, { SourceRow, TargetRow } from '../plugin.ts'
import Deck from 'flashcards/models/deck.ts'

const baseSourceFile: SourceFile = Object.freeze({
  version: '0.1.1',
  columns: ['text', 'hint'],
  notes: {
    animal: { '🐶': ['dog', 'noun'], '🐈': ['cat', 'noun'] },
    body: { '🦷': ['tooth', 'noun'], '🧠': ['brain', 'noun'] },
    verbs: { '🏃‍♂️🏃‍♀️': ['run', 'verb'] },
  },
})

const emptyDeck: Deck = new Deck({
  name: 'UWU lang',
  meta: {
    name_en: 'UWU lang',
    lang_code: 'uwu',
    locale_code: 'uwu-UWU',
    locale_code_deepl: 'uwu',
    locale_flag: '🏳️‍🌈',
  },
})

let translateStub: Stub

beforeEach(() => {
  translateStub = stub(_internals, 'translateDeepl', (texts, locale) => {
    return Promise.resolve(texts.map((text: string) => text + '-' + locale))
  })
})

afterEach(() => translateStub.restore())

it('Runs with default pre/post', async () => {
  const plugin = new Plugin()
  const rows = await plugin.getTranslations(baseSourceFile, emptyDeck)

  assertEquals(rows, {
    '🐶': { category: 'animal', text: 'dog-uwu' },
    '🐈': { category: 'animal', text: 'cat-uwu' },
    '🦷': { category: 'body', text: 'tooth-uwu' },
    '🧠': { category: 'body', text: 'brain-uwu' },
    '🏃‍♂️🏃‍♀️': { category: 'verbs', text: 'run-uwu' },
  })
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
      if (prev?.content?.text) {
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

  const rows = await plugin.getTranslations(baseSourceFile, emptyDeck)
  assertEquals(rows, {
    '🐶': { category: 'animal', text: 'dog-uwu', hint: '' },
    '🐈': { category: 'animal', text: 'cat-uwu', hint: '' },
    '🦷': { category: 'body', text: 'tooth-uwu', hint: '' },
    '🧠': { category: 'body', text: 'brain-uwu', hint: '' },
    '🏃‍♂️🏃‍♀️': {
      category: 'verbs',
      text: 'run-uwu',
      hint: 'I run, you run, he run-uwu',
    },
  })

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
    async post(
      this: Plugin,
      key: string,
      { category, text }: TargetRow,
      prev: TargetRow,
    ) {
      if (prev) return prev
      return { key, text, category, hint: await createHintUwu(key) }
    },
  })

  const rows = await plugin.getTranslations(baseSourceFile, emptyDeck)

  assertEquals(rows, {
    '🐶': { category: 'animal', text: 'dog-uwu', hint: '🐶 UWU' },
    '🐈': { category: 'animal', text: 'cat-uwu', hint: '🐈 UWU' },
    '🦷': { category: 'body', text: 'tooth-uwu', hint: '🦷 UWU' },
    '🧠': { category: 'body', text: 'brain-uwu', hint: '🧠 UWU' },
    '🏃‍♂️🏃‍♀️': { category: 'verbs', text: 'run-uwu', hint: '🏃‍♂️🏃‍♀️ UWU' },
  })

  const textEn: string[] = ['dog', 'cat', 'tooth', 'brain', 'run']

  assertSpyCallAsync(translateStub, 0, {
    args: [textEn, 'uwu'],
    returned: textEn.map((text: string) => text + '-uwu'),
  })
  assertSpyCalls(translateStub, 1)
})
