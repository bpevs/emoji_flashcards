import * as PlayHT from 'npm:playht'
import { load } from 'std/dotenv/mod.ts'
import type { CompactLanguageFile, LanguageFile } from '../shared/interfaces.ts'
import { fromCompactLanguageFile } from '../shared/language_file_utilities.ts'

const env = await load()

const PLAYHT_API_KEY = env['PLAYHT_API_KEY']
const PLAYHT_USER_ID = env['PLAYHT_USER_ID']

const locale = 'zh-CN'
const languageRaw = await Deno.readTextFile(`./data/languages/${locale}.json`)
const compactLanguage: CompactLanguageFile = JSON.parse(languageRaw)
const language: LanguageFile = fromCompactLanguageFile(compactLanguage)

const animals = Object.keys(language.data)
  .filter((key) => language.data[key].category === 'animal')
  .map((key) => ({ key, ...language.data[key] }))

console.log(animals)

const translationString = animals.map((animal) => animal.text).join(', ')
console.log(translationString)

PlayHT.init({
  apiKey: PLAYHT_API_KEY,
  userId: PLAYHT_USER_ID,
})

const voices = await PlayHT.listVoices({
  gender: 'female',
  voiceEngine: ['Standard'],
  languageCode: 'zh-CN',
  ageGroup: 'adult',
})

const generated = await PlayHT.generate(translationString, {
  voiceEngine: voices[0].voiceEngine,
  voiceId: voices[0].id,
  speed: 1,
})

const { audioUrl } = generated

console.log('The url for the audio file is', audioUrl)
