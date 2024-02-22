import { Template } from '@flashcard/core'
import { nohint } from './default.js'

import es from './es.ts'
import ja from './ja.ts'
import zh from './zh.ts'

const templates: { [lang_code: string]: Template[] } = {
  nohint,
  es,
  ja,
  zh,
}

export default templates
