import { load } from 'std/dotenv/mod.ts'

const env = await load()

export enum API {
  DEEPL = 0,
  AZURE,
}

const DEEPL_API_ENDPOINT = 'https://api-free.deepl.com/v2/translate'
const AZURE_API_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate'

async function translateAzure(
  texts: string[],
  targetLanguage: string,
): Promise<string[]> {
  const url = new URL(AZURE_API_ENDPOINT)
  url.search = new URLSearchParams({
    'api-version': '3.0',
    from: 'en',
    to: targetLanguage,
  }).toString()

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env['AZURE_TRANSLATE_KEY'],
      'Ocp-Apim-Subscription-Region': env['AZURE_TRANSLATE_REGION'],
      'Content-type': 'application/json',
      'X-ClientTraceId': crypto.randomUUID(),
    },
    body: JSON.stringify(texts.map((text) => ({ text }))),
  })
  return (await response.json())
    .map((
      { translations }: {
        translations: Array<{ text: 'string'; to: 'string' }>
      },
    ) => translations[0].text)
}

async function translateDeepl(
  texts: string[],
  target_lang: string,
): Promise<string[]> {
  const combinedText = texts.join('\n')
  const text = encodeURIComponent(combinedText)

  const response = await fetch(DEEPL_API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `auth_key=${env['DEEPL_API_KEY']}&text=${text}&target_lang=${target_lang}`,
  })

  const result = await response.json()
  console.log(result.translations[0].text.split('\n'))
  return result.translations[0].text.split('\n')
}

export const _internals = { translateAzure, translateDeepl }

export const translate = (
  texts: string[],
  targetLanguage: string,
  api = API.DEEPL,
): Promise<string[]> => {
  if (api === API.AZURE) return _internals.translateAzure(texts, targetLanguage)
  if (api === API.DEEPL) return _internals.translateDeepl(texts, targetLanguage)
  else throw new Error(`Does not support the transation api ${api}`)
}
