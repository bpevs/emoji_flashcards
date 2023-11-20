import Plugin from '../../utilities/plugin.ts'

import en from './en.ts'
import es from './es.ts'
import ja from './ja.ts'
import zh from './zh.ts'
import zhHK from './zh-HK.ts'

const plugins: {
  [key: string]: Plugin
} = {
  en,
  es,
  ja,
  zh,
  'zh-HK': zhHK,
}

export default plugins
