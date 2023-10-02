import type { SourceData } from '../interfaces.ts'
import { translate } from '../translate.ts'

interface LangData {
  text: string
  category: string
  hint: string
}

export default async function (
  { text, category, pos }: SourceData,
  existing: LangData,
): Promise<LangData | null> {
  if (existing) return null

  let hint = ''
  let nextText = text

  if (
    pos === 'noun' &&
    !['number', 'days_of_the_week', 'months', 'seasons', 'time']
      .includes(category)
  ) {
    nextText = (await translate(['the ' + text], 'es'))[0]
  } else if (!hint && pos === 'verb') {
    const [nextTextResp, hintResp] = await translate([
      `(to) ${text}`,
      `${text}ing, I ${text}, you ${text}, he ${text}`,
    ], 'es')
    nextText = nextTextResp.replace(/\(.*\)\s/, '')
    hint = hintResp || ''
  }
  console.log({ text: nextText, category, hint })
  return { text: nextText, category, hint }
}
