import type { TranslatedSourceData } from '../../shared/interfaces.ts'
import { translate } from '../../shared/translate.ts'

interface LangData {
  text: string
  category: string
  hint: string
}

export default async function (
  { text, translatedText, category, pos }: TranslatedSourceData,
  existing: LangData,
): Promise<LangData | null> {
  if (existing) return null

  let hint = ''
  let nextText = translatedText

  if (
    pos === 'noun' &&
    !['number', 'days_of_the_week', 'months', 'seasons', 'time']
      .includes(category)
  ) {
    nextText = (await translate(['the ' + text], 'es'))[0]
  } else if (!hint && pos === 'verb') {
    const [nextTextResp, hintResp] = await translate([
      `(to) ${text}`,
      `I ${text}, you ${text}, he ${text}`,
    ], 'es')
    nextText = nextTextResp.replace(/\(.*\)\s/, '')
    hint = hintResp || ''
  }

  return { text: nextText, category, hint }
}
