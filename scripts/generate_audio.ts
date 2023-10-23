import * as PlayHT from 'npm:playht'
import type { Translation } from '../shared/interfaces.ts'
import { load } from 'std/dotenv/mod.ts'
import { listAudioFiles, readLanguageFile } from '../shared/data_access.ts'
import { AUDIO_DIR } from '../shared/constants_server.ts'
import { join } from 'std/path/mod.ts'
import { writeAll } from 'std/streams/write_all.ts'

const MAX_NOISE_LEVEL = -40
const MIN_SILENCE_LENGTH = 0.1
const DETECT_STR =
  `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${MIN_SILENCE_LENGTH}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

const env = await load()

await generateAudioFiles('zh-CN')

async function generateAudioFiles(language: string) {
  const languageFile = await readLanguageFile(language)

  const existingAudioFiles = listAudioFiles(language)
  const translations = Object.keys(languageFile.data)
    .filter((key) => !existingAudioFiles.includes(key))
    .map((key) => ({ key, ...languageFile.data[key] }))

  const sourceURL = await generateSourceAudioFile(language, translations)

  console.log('source audio: ', sourceURL)

  const downloadedSourcePath = await downloadSourceFile(sourceURL)

  console.log('source audio saved: ', downloadedSourcePath)

  await writeTranslationAudioFiles(downloadedSourcePath, language, translations)
}

async function generateSourceAudioFile(
  languageCode: string,
  translations: Translation[],
) {
  PlayHT.init({ apiKey: env['PLAYHT_API_KEY'], userId: env['PLAYHT_USER_ID'] })

  const [voice] = await PlayHT.listVoices({
    gender: 'female',
    voiceEngine: ['Standard'],
    languageCode: [languageCode],
  })

  const translationString = translations.map(({ text }) => text).join(', ')

  const response = await PlayHT.generate(translationString, {
    voiceEngine: 'Standard', //voice.voiceEngine,
    voiceId: voice.id,
    speed: 1,
  })
  return response.audioUrl
}

async function downloadSourceFile(url: string) {
  const response = await fetch(url)

  const fileName = new URL(url).pathname.slice(1)
  const filePath = join('./data/tmp', fileName)

  const file = await Deno.open(filePath, { create: true, write: true })

  const arrayBuffer = new Uint8Array(await response.arrayBuffer())
  await writeAll(file, arrayBuffer)

  return filePath
}

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
    const nextSilenceStartMS = Math.round(1000 * parseFloat(nextSilenceStartS))
    const nextSilenceEndMS = Math.round(1000 * parseFloat(nextSilenceEndS))
    const name = translations[count].key
    count = count + 1

    const outFile = join(audioDirLocation, name + '.mp3')
    const seek = Math.max(0, clipStartMS) + 'ms'
    const len = nextSilenceStartMS - clipStartMS + 'ms'

    const convert = new Deno.Command('ffmpeg', {
      stdout: 'piped',
      args: ['-ss', seek, '-t', len, '-i', sourceURL, '-c:a', 'copy', outFile],
    })
    await convert.output()
    clipStartMS = nextSilenceEndMS
    match = MATCH_SILENCE.exec(detectSilenceOutput)
  }
  console.log(translations.length, count)
}
