import * as PlayHT from 'playht'
import { load } from 'std/dotenv/mod.ts'
import { listAudioFiles, readLanguageFile } from '../utilities/data_access.ts'
import { getAudioFilename } from '../utilities/data_access_utilities.ts'
import { GEN_DIR } from '../utilities/constants_server.ts'
import { join } from 'std/path/mod.ts'
import { writeAll } from 'std/streams/write_all.ts'
import poll from '../utilities/poll_url.ts'

const MAX_NOISE_LEVEL = -40
const SILENCE_SPLIT = 1
const SILENCE_REQUEST = 2
const DETECT_STR = `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${SILENCE_SPLIT}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

const env = await load()

const [language, inputCategoryId] = Deno.args

const lang = await readLanguageFile(language, true)
const { audio_id, columns, pronunciation_key } = lang
const pronunciationKeyIndex = columns.indexOf(pronunciation_key || '') || 0

const emojisByCategory = lang.data
const existingAudioFiles = listAudioFiles(language)

Object.keys(emojisByCategory).forEach((category) => {
  Object.keys(emojisByCategory[category])
    .forEach((emoji) => {
      const text = emojisByCategory[category][emoji][0]
      const fileName = getAudioFilename(language, text)
      const alreadyExists = existingAudioFiles.has(fileName)
      if (alreadyExists) delete emojisByCategory[category][emoji]
    })
  if (!Object.keys(emojisByCategory[category]).length) {
    delete emojisByCategory[category]
  }
})

console.log(language, audio_id, Object.keys(emojisByCategory))

const ids = await generateTranscriptionIds(language, emojisByCategory, audio_id)

console.log('source audio id: ', JSON.stringify(ids))

for (const idx in ids) {
  const { categoryId, transcriptionId } = ids[idx]
  const emojis = emojisByCategory[categoryId]
  const audioUrl = await downloadSourceFile(transcriptionId)
  console.log('source audio saved: ', audioUrl)
  await writeTranslationAudioFiles(audioUrl, language, emojis)
}

console.log('COMPLETE!')
Deno.exit(0)

async function generateTranscriptionIds(
  languageCode: string,
  emojisByCategory: { [category: string]: { [emojiKey: string]: string[] } },
  audio_id?: string,
): Promise<{ categoryId: string; transcriptionId: string }[]> {
  PlayHT.init({ apiKey: env['PLAYHT_API_KEY'], userId: env['PLAYHT_USER_ID'] })

  const voiceEngine: PlayHT.VoiceEngine[] = ['Standard']
  const settings = {
    quality: 'high',
    languageCode: [languageCode],
  }

  let voice: { id: string }

  if (audio_id) {
    const voices = await PlayHT.listVoices(settings)
    voice = voices.find(({ id }) => id === audio_id) || { id: '' }
  } else {
    const voices = await PlayHT.listVoices({ voiceEngine, ...settings })
    voice = voices[0] || { id: '' }
  }

  return await Promise.all(
    Object.keys(emojisByCategory)
      .filter((categoryId) => {
        if (inputCategoryId) return categoryId === inputCategoryId
        return true
      })
      .map(async (categoryId) => ({
        categoryId,
        transcriptionId: (await requestSSMLAudio(
          `<speak><p>${
            Object.keys(emojisByCategory[categoryId])
              .map((emojiId: string) => {
                const emoji = emojisByCategory[categoryId][emojiId]
                if (pronunciation_key) return emoji[pronunciationKeyIndex]
                return emoji[0]
              })
              .join(`, <break time="${SILENCE_REQUEST}s"/> `)
          }</p></speak>`,
          voice.id,
        )).transcriptionId,
      })),
  )
}

function requestSSMLAudio(ssml: string, voice: string) {
  return fetch('https://api.play.ht/api/v1/convert/', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      AUTHORIZATION: env['PLAYHT_API_KEY'],
      'X-USER-ID': env['PLAYHT_USER_ID'],
    },
    body: JSON.stringify({
      ssml: [ssml],
      voice,
    }),
  }).then((res) => res.json())
}

async function downloadSourceFile(transcriptionId: string) {
  const audioResults = await getAudioResults(transcriptionId)
  console.log(audioResults)
  const response = await fetch(audioResults.audioUrl)

  const filePath = join('./data/tmp', transcriptionId)

  const file = await Deno.open(filePath, { create: true, write: true })

  const arrayBuffer = new Uint8Array(await response.arrayBuffer())
  await writeAll(file, arrayBuffer)

  return filePath
}

function getAudioResults(transcriptionId: string) {
  return poll<{ audioUrl: string; converted: boolean }>(
    `https://api.play.ht/api/v1/articleStatus?transcriptionId=${transcriptionId}`,
    {
      method: 'GET',
      headers: {
        accept: 'application/json',
        AUTHORIZATION: env['PLAYHT_API_KEY'],
        'X-USER-ID': env['PLAYHT_USER_ID'],
      },
    },
    {
      retryLimit: 3,
      timeBetweenPolls: 10_000,
      predicate: ({ converted }) => converted, // "Transcription completed"
    },
  )
}

// /**
//  *  1. Splits a joined translation audio clip
//  *  2. Writes files for each translation, naming appropriately
//  */
async function writeTranslationAudioFiles(
  sourceURL: string,
  languageCode: string,
  emojis: { [emojiKey: string]: string[] },
) {
  const names = Object.keys(emojis)
    .map((emoji) => emojis[emoji][0])
  const audioDirLocation = join(GEN_DIR, languageCode, 'audio')

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

    // 0.1 is so we don't clip the beginning of the audio gen
    const nextSilenceEndMS = Math.round(
      1000 * (parseFloat(nextSilenceEndS) - 0.1),
    )

    console.log(emojis[count])

    const name = getAudioFilename(language, names[count])
    count = count + 1

    const outFile = join(audioDirLocation, name)
    const seek = Math.max(0, clipStartMS) + 'ms'

    // 0.1 to maintain length after shifting nextSilenceEndMS
    const len = nextSilenceStartMS - (clipStartMS + 0.1) + 'ms'

    const convert = new Deno.Command('ffmpeg', {
      stdout: 'piped',
      args: ['-ss', seek, '-t', len, '-i', sourceURL, '-c:a', 'copy', outFile],
    })
    await convert.output()
    clipStartMS = nextSilenceEndMS
    match = MATCH_SILENCE.exec(detectSilenceOutput)
  }

  // last file
  const name = getAudioFilename(language, names[count])
  count = count + 1

  const outFile = join(audioDirLocation, name)
  const seek = Math.max(0, clipStartMS) + 'ms'
  const convert = new Deno.Command('ffmpeg', {
    stdout: 'piped',
    args: ['-ss', seek, '-i', sourceURL, '-c:a', 'copy', outFile],
  })
  await convert.output()

  console.log(names.length, count)
}
