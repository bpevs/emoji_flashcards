import { load } from 'std/dotenv/mod.ts'
import { writeAll } from 'std/streams/write_all.ts'
import { join } from 'std/path/mod.ts'

const SILENCE_REQUEST = 2

const env = await load()

const url = `https://${
  env['AZURE_REGION']
}.tts.speech.microsoft.com/cognitiveservices/v1`

async function ttsAzure(
  texts: string[],
  voice_id: string,
  locale_code: string,
  category_id: string,
): Promise<string> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env['AZURE_KEY'],
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      'User-Agent': 'curl',
    },
    body: `
      <speak version='1.0' xml:lang='${locale_code}'>
        <voice name='${voice_id}' xml:lang='${locale_code}'>
          ${texts.join(`, <break time="${SILENCE_REQUEST}s"/> `)}
        </voice>
      </speak>
    `,
  })
  if (response.status > 200) console.warn(response)
  const fileName = `${locale_code}_${category_id}.mp3`
  const filePath = join('./data/tmp', fileName)
  const file = await Deno.open(filePath, { create: true, write: true })
  const arrayBuffer = new Uint8Array(await response.arrayBuffer())
  await writeAll(file, arrayBuffer)
  return fileName
}

export const _internals = { ttsAzure }

export const tts = (
  texts: string[],
  voice_id: string,
  locale_code: string,
  category_id: string,
): Promise<string> => {
  return _internals.ttsAzure(texts, voice_id, locale_code, category_id)
}
