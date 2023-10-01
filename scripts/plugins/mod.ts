import ja from './ja.ts'
import zh from './zh.ts'

interface PluginInput {
  text: string
  category: string
}

interface PluginOutput {
  text: string
  category: string
  [key: string]: string
}

interface Plugins {
  // deno-lint-ignore no-explicit-any
  [key: string]: (p: PluginInput) => any
}

const plugins: Plugins = {
  ja,
  zh,
}

export default plugins
