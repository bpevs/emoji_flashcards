import {
  assertSpyCallAsync,
  assertSpyCalls,
  Stub,
  stub,
} from 'std/testing/mock.ts'
import { assertEquals } from 'std/assert/mod.ts'
import { afterEach, beforeEach, it } from 'std/testing/bdd.ts'
import { SourceEmojiDataMap } from '../interfaces.ts'
import { _internals } from '../translate.ts'
import Plugin, { ProcessingTargetRow, SourceRow, TargetRow } from '../plugin.ts'

const sourceEmojiDataMap: SourceEmojiDataMap = Object.freeze({
  '🐶': { text_en: 'dog', pos: 'noun', category: 'animal' },
  '🐈': { text_en: 'cat', pos: 'noun', category: 'animal' },
  '🦷': { text_en: 'tooth', pos: 'noun', category: 'body' },
  '🧠': { text_en: 'brain', pos: 'noun', category: 'body' },
  '🏃‍♂️🏃‍♀️': { text_en: 'run', pos: 'verb', category: 'verbs' },
})

let translateStub: Stub

beforeEach(() => {
  translateStub = stub(_internals, 'translateDeepl', (texts, locale) => {
    return Promise.resolve(texts.map((text: string) => text + '-' + locale))
  })
})

afterEach(() => translateStub.restore())

it('Runs with default pre/post', async () => {
  const plugin = new Plugin({ language: 'es' })
  const rows = await plugin.getLanguageFileRows(sourceEmojiDataMap, {})

  assertEquals(rows, {
    '🐈': { category: 'animal', text: 'cat-es' },
    '🐶': { category: 'animal', text: 'dog-es' },
    '🦷': { category: 'body', text: 'tooth-es' },
    '🧠': { category: 'body', text: 'brain-es' },
    '🏃‍♂️🏃‍♀️': { category: 'verbs', text: 'run-es' },
  })

  const textEn: string[] = Object.keys(sourceEmojiDataMap)
    .map((key) => sourceEmojiDataMap[key]?.text_en)

  assertSpyCallAsync(translateStub, 0, {
    args: [textEn, 'es'],
    returned: textEn.map((text: string) => text + '-es'),
  })
  assertSpyCalls(translateStub, 1)
})

it('Runs with custom pre plugin', async () => {
  const plugin = new Plugin({
    language: 'es',

    pre(
      this: Plugin,
      key: string,
      { category, text_en, pos }: SourceRow,
      prev: TargetRow,
    ): ProcessingTargetRow {
      if (prev?.text) return { key, ...prev }

      if (pos === 'verb') {
        return {
          key,
          category,
          hint: this
            .queueTranslation(`I ${text_en}, you ${text_en}, he ${text_en}`),
          text: this
            .queueTranslation(`(to) ${text_en}`)
            .then((text: string) => text.replace(/\(.*\)\s/, '')),
        }
      } else {
        const text = this.queueTranslation(text_en)
        return { key, text, category, hint: '' }
      }
    },
  })

  const rows = await plugin.getLanguageFileRows(sourceEmojiDataMap, {})
  assertEquals(rows, {
    '🐈': { category: 'animal', text: 'cat-es', hint: '' },
    '🐶': { category: 'animal', text: 'dog-es', hint: '' },
    '🦷': { category: 'body', text: 'tooth-es', hint: '' },
    '🧠': { category: 'body', text: 'brain-es', hint: '' },
    '🏃‍♂️🏃‍♀️': {
      category: 'verbs',
      text: 'run-es',
      hint: 'I run, you run, he run-es',
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
    args: [untranslated, 'es'],
    returned: untranslated.map((text_en) => text_en + '-es'),
  })
  assertSpyCalls(translateStub, 1)
})

it('Runs with custom post plugin', async () => {
  async function createHintUwu(text: string) {
    await Promise.resolve('blah')
    return text + ' UWU'
  }

  const plugin = new Plugin({
    language: 'uwu',

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

  const rows = await plugin.getLanguageFileRows(sourceEmojiDataMap, {})

  assertEquals(rows, {
    '🐈': { category: 'animal', text: 'cat-uwu', hint: '🐈 UWU' },
    '🐶': { category: 'animal', text: 'dog-uwu', hint: '🐶 UWU' },
    '🦷': { category: 'body', text: 'tooth-uwu', hint: '🦷 UWU' },
    '🧠': { category: 'body', text: 'brain-uwu', hint: '🧠 UWU' },
    '🏃‍♂️🏃‍♀️': { category: 'verbs', text: 'run-uwu', hint: '🏃‍♂️🏃‍♀️ UWU' },
  })

  const textEn: string[] = Object.keys(sourceEmojiDataMap)
    .map((key) => sourceEmojiDataMap[key]?.text_en)

  assertSpyCallAsync(translateStub, 0, {
    args: [textEn, 'uwu'],
    returned: textEn.map((text: string) => text + '-uwu'),
  })
  assertSpyCalls(translateStub, 1)
})
