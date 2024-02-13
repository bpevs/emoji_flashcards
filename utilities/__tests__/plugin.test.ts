import {
  assertSpyCallAsync,
  assertSpyCalls,
  Stub,
  stub,
} from 'std/testing/mock.ts'
import { assertEquals } from 'std/assert/mod.ts'
import { afterEach, beforeEach, it } from 'std/testing/bdd.ts'
import { LanguageFile, SourceFile } from '../../types.ts'
import { _internals } from '../translate.ts'
import Plugin, { ProcessingTargetRow, SourceRow, TargetRow } from '../plugin.ts'

const baseSourceFile: SourceFile = Object.freeze({
  version: '0.1.1',
  strings: {},
  columns: ['text', 'hint'],
  data: {
    animal: { '🐶': ['dog', 'noun'], '🐈': ['cat', 'noun'] },
    body: { '🦷': ['tooth', 'noun'], '🧠': ['brain', 'noun'] },
    verbs: { '🏃‍♂️🏃‍♀️': ['run', 'verb'] },
  },
})

const emptyTarget: LanguageFile = Object.freeze({
  version: '0.1.1',
  name: 'UWU lang',
  name_en: 'UWU lang',
  language_code: 'uwu',
  locale_code: 'uwu-UWU',
  locale_flag: '🏳️‍🌈',
  strings: {},
  columns: [],
  data: {},
  meta: {
    anki_id: 1,
    deepl: { language_code: 'uwu' },
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
  const rows = await plugin.getLanguageFileRows(baseSourceFile, emptyTarget)

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

  const rows = await plugin.getLanguageFileRows(baseSourceFile, emptyTarget)
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

  const rows = await plugin.getLanguageFileRows(baseSourceFile, emptyTarget)

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
