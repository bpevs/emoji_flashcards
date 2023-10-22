import * as PlayHT from 'npm:playht'
import type { Translation } from '../shared/interfaces.ts'
import { load } from 'std/dotenv/mod.ts'
import { listAudioFiles, readLanguageFile } from '../shared/data_access.ts'
import { AUDIO_DIR } from '../shared/constants_server.ts'
import { join } from 'std/path/mod.ts'

const env = await load()

generateAudioFiles('zh-CN')

async function generateAudioFiles(language) {
  const languageFile = await readLanguageFile(language)

  const existingAudioFiles = listAudioFiles(language)
  const translations = Object.keys(languageFile.data)
    .filter((key) => !existingAudioFiles.includes(key))
    .map((key) => ({ key, ...languageFile.data[key] }))

  const sourceURL = await generateSourceAudioFile(language, translations)

  console.log(sourceURL)

  await writeTranslationAudioFiles(sourceURL, language, translations)
}

async function generateSourceAudioFile(
  languageCode: string,
  translations: Translation[],
) {
  PlayHT.init({ apiKey: env['PLAYHT_API_KEY'], userId: env['PLAYHT_USER_ID'] })

  const [voice] = await PlayHT.listVoices({
    gender: 'female',
    voiceEngine: ['Standard'],
    ageGroup: 'adult',
    languageCode,
  })

  const translationString = translations.map(({ text }) => text).join(', ')

  const response = await PlayHT.generate(translationString, {
    voiceEngine: voice.voiceEngine,
    voiceId: voice.id,
    speed: 1,
  })
  return response.audioUrl
}

const MAX_NOISE_LEVEL = -40
const MIN_SILENCE_LENGTH = 0.1
const DETECT_STR =
  `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${MIN_SILENCE_LENGTH}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

/**
 *  1. Splits a joined translation audio clip
 *  2. Writes files for each translation, naming appropriately
 */
async function writeTranslationAudioFiles(
  sourceURL: string,
  languageCode: string,
  translations: Translation[],
) {
  const audioDirLocation = join(AUDIO_DIR, languageCode)

  try {
    await Deno.mkdir(audioDirLocation, { recursive: true })
  } catch { /* Dir Exists */ }

  const detectSilence = new Deno.Command('ffmpeg', {
    stdout: 'piped',
    args: ['-i', sourceURL, '-af', DETECT_STR, '-f', 'null', '-'],
  })

  const detectSilenceResult = (await detectSilence.output()).stderr
  const detectSilenceOutput = new TextDecoder().decode(detectSilenceResult)

  let match = MATCH_SILENCE.exec(detectSilenceOutput)
  let clipStartMS = 0
  let count = 0

  while (match) {
    const [_, nextSilenceStartS, nextSilenceEndS] = match
    const nextSilenceStartMS = parseInt(1000 * nextSilenceStartS)
    const nextSilenceEndMS = parseInt(1000 * nextSilenceEndS)
    count = count + 1
    const name = translations[count].key

    const outFile = join(audioDirLocation, name + '.mp3')
    const seek = Math.max(0, clipStartMS) + 'ms'
    const len = nextSilenceStartMS - clipStartMS + 'ms'

    const convert = new Deno.Command('ffmpeg', {
      stdout: 'piped',
      args: ['-ss', seek, '-t', len, '-i', SOURCE, '-c:a', 'copy', outFile],
    })
    await convert.output()
    clipStartMS = nextSilenceEndMS
    match = MATCH_SILENCE.exec(detectSilenceOutput)
  }
}
