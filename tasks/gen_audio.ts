import * as PlayHT from 'playht'
import { load } from 'std/dotenv/mod.ts'
import { ensureDir } from 'std/fs/mod.ts'
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

const [locale_code, inputCategoryId] = Deno.args
if (!locale_code) throw new Error('Please supply language_code')

const lang = await readLanguageFile(locale_code, true)
const { columns, pronunciation_key } = lang
const voice_id = lang?.meta?.play_ht?.voice_id
if (!voice_id) throw new Error(`${locale_code} does not have a voice_id`)

const pronunciationKeyIndex = columns.indexOf(pronunciation_key || '') || 0

const emojisByCategory = lang.data
ensureDir(join(GEN_DIR, locale_code, 'audio'))
const existingAudioFiles = listAudioFiles(locale_code)

Object.keys(emojisByCategory).forEach((category) => {
  Object.keys(emojisByCategory[category])
    .forEach((key) => {
      const text = emojisByCategory[category][key][0]
      const fileName = getAudioFilename(locale_code, key, text)
      const alreadyExists = existingAudioFiles.has(fileName)
      if (alreadyExists) delete emojisByCategory[category][key]
    })
  if (!Object.keys(emojisByCategory[category]).length) {
    delete emojisByCategory[category]
  }
})

console.log(locale_code, voice_id, Object.keys(emojisByCategory))

const ids = await generateTranscriptionIds(emojisByCategory, voice_id)

console.log('source audio id: ', JSON.stringify(ids))

for (const idx in ids) {
  const { categoryId, transcriptionId } = ids[idx]
  if (!transcriptionId) {
    console.warn(`Skipping category "${categoryId}": no transcriptionId`)
    continue
  }
  const emojis = emojisByCategory[categoryId]
  const audioUrl = await downloadSourceFile(transcriptionId)
  console.log('source audio saved: ', audioUrl)
  await writeTranslationAudioFiles(audioUrl, locale_code, emojis)
}

console.log('COMPLETE!')
Deno.exit(0)

async function generateTranscriptionIds(
  emojisByCategory: { [category: string]: { [emojiKey: string]: string[] } },
  voice_id: string,
): Promise<{ categoryId: string; transcriptionId: string }[]> {
  PlayHT.init({ apiKey: env['PLAYHT_API_KEY'], userId: env['PLAYHT_USER_ID'] })

  return await Promise.all(
    Object.keys(emojisByCategory)
      .filter((categoryId) => {
        if (inputCategoryId) return categoryId === inputCategoryId
        return true
      })
      .map(async (categoryId) => {
        const response = await requestSSMLAudio(
          `<speak><p>${
            Object.keys(emojisByCategory[categoryId])
              .map((emojiId: string) => {
                const emoji = emojisByCategory[categoryId][emojiId]
                if (pronunciation_key) return emoji[pronunciationKeyIndex]
                return emoji[0]
              })
              .join(`, <break time="${SILENCE_REQUEST}s"/> `)
          }</p></speak>`,
          voice_id,
        )
        if (!response.transcriptionId) console.error(response)
        return { categoryId, transcriptionId: response.transcriptionId }
      }),
  )
}

function requestSSMLAudio(ssml: string, voice: string) {
  try {
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
  } catch (e) {
    console.error(e)
  }
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
  locale_code: string,
  emojis: { [emojiKey: string]: string[] },
) {
  const names = Object.keys(emojis)
    .map((emoji) => [emoji, emojis[emoji][0]])
  const audioDirLocation = join(GEN_DIR, locale_code, 'audio')

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

    const [key, text] = names[count]
    console.log(key, text)
    const name = getAudioFilename(locale_code, key, text)
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
  const [key, text] = names[count]
  console.log(key, text)
  const name = getAudioFilename(locale_code, key, text)
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
