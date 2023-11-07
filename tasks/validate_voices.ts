import * as PlayHT from 'playht'
import { load } from 'std/dotenv/mod.ts'

const env = await load()

const [languageCode] = Deno.args

PlayHT.init({ apiKey: env['PLAYHT_API_KEY'], userId: env['PLAYHT_USER_ID'] })

const settings = {
  quality: 'high',
  languageCode: [languageCode],
}

const voices = await PlayHT.listVoices({ ...settings })

voices.forEach((voice) => {
  console.log(`${voice.id}, ${voice.gender}, ${voice.voiceEngine}`)
  console.log(voice.sampleUrl)
  console.log('')
})

Deno.exit(0)
