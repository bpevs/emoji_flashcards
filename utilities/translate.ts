import { load } from 'std/dotenv/mod.ts'

const env = await load()

const DEEPL_API_ENDPOINT = 'https://api-free.deepl.com/v2/translate'
const AZURE_API_ENDPOINT =
  'https://api.cognitive.microsofttranslator.com/translate'

async function translateAzure(
  texts: string[],
  targetLanguage: string,
): Promise<string[]> {
  const text = texts.join('\n')
  const url = new URL(AZURE_API_ENDPOINT)
  url.search = new URLSearchParams({
    'api-version': '3.0',
    from: 'en',
    to: JSON.stringify([targetLanguage]),
  }).toString()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env['AZURE_TRANSLATE_KEY'],
      'Ocp-Apim-Subscription-Region': env['AZURE_TRANSLATE_LOCATION'],
      'Content-type': 'application/json',
      'X-ClientTraceId': crypto.randomUUID(),
    },
    body: JSON.stringify([{ text }]),
  })

  const result = await response.json()
  return result.translations[0].text.split('\n')
}

async function translateDeepl(
  texts: string[],
  target_lang: string,
): Promise<string[]> {
  const text = texts.join('\n')
  const response = await fetch(DEEPL_API_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: env['DEEPL_API_KEY'],
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, target_lang }),
  })

  const result = await response.json()
  return result.translations[0].text.split('\n')
}

export const _internals = { translateAzure, translateDeepl }

export const translate = (
  texts: string[],
  targetLanguage: string,
  api = 'DEEPL',
): Promise<string[]> => {
  if (api === 'AZURE') return _internals.translateAzure(texts, targetLanguage)
  if (api === 'DEEPL') return _internals.translateDeepl(texts, targetLanguage)
  else throw new Error(`Does not support the transation api ${api}`)
}
