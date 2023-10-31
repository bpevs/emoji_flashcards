import { Template } from '../../utilities/genanki/mod.ts'

import en from './en.ts'
import es from './es.ts'
import ja from './ja.ts'
import zh from './zh.ts'

const templates: { [language_code: string]: Template[] } = {
  en,
  es,
  ja,
  zh,
}

export default templates
