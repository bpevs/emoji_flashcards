import { load } from 'std/dotenv/mod.ts'

const env = await load()

const DEEPL_API_ENDPOINT = 'https://api-free.deepl.com/v2/translate'
const DEEPL_API_KEY = env['DEEPL_API_KEY']

async function translateDeepl(
  texts: string[],
  targetLanguage: string,
): Promise<string[]> {
  const combinedText = texts.join('\n')
  const text = encodeURIComponent(combinedText)
  const target_lang = targetLanguage.split('-')[0]

  const response = await fetch(DEEPL_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `auth_key=${DEEPL_API_KEY}&text=${text}&target_lang=${target_lang}`,
  })

  const result = await response.json()
  return result.translations[0].text.split('\n')
}

export const _internals = { translateDeepl }

export const translate = (
  texts: string[],
  targetLanguage: string,
): Promise<string[]> => {
  return _internals.translateDeepl(texts, targetLanguage)
}
