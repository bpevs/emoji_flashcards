import Plugin from '../../utilities/plugin.ts'

import es from './es.ts'
import ja from './ja.ts'
import zh from './zh.ts'

const plugins: {
  [key: string]: Plugin
} = {
  es,
  ja,
  zh,
}

export default plugins
