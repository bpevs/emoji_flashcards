import type { TranslatedSourceData } from '../../utilities/interfaces.ts'
// import { translate } from '../../utilities/translate.ts'

interface LangData {
  text: string
  category: string
  hint: string
}

export default function (
  { translatedText, category }: TranslatedSourceData,
  existing: LangData,
): Promise<LangData | null> {
  if (existing) return Promise.resolve(null)

  const hint = ''
  const nextText = translatedText

  // if (!hint && pos === 'verb') {
  //   const [nextTextResp, hintResp] = await translate([
  //     `(to) ${text}`,
  //     `I ${text}, you ${text}, he ${text}`,
  //   ], 'es')
  //   nextText = nextTextResp.replace(/\(.*\)\s/, '')
  //   hint = hintResp || ''
  // }

  return Promise.resolve({ text: nextText, category, hint })
}
