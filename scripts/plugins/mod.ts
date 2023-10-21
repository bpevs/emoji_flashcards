import { TranslatedSourceData } from '../../shared/interfaces.ts'

import es from './es.ts'
import ja from './ja.ts'
import zh from './zh.ts'

interface Plugins {
  // deno-lint-ignore no-explicit-any
  [key: string]: (source: TranslatedSourceData, existing: any) => any
}

const plugins: Plugins = {
  es,
  ja,
  zh,
}

export default plugins
