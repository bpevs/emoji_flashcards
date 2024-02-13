import { ensureDir } from 'std/fs/mod.ts'
import { load } from 'std/dotenv/mod.ts'
import { writeAll } from 'std/streams/write_all.ts'
import { join } from 'std/path/mod.ts'
import {
  listAudioFiles,
  listLanguages,
  readLanguageFile,
} from '@/shared/data_access.ts'
import { getAudioFilename } from '@/shared/data_access_helpers.ts'
import { GEN_DIR } from '@/shared/paths.ts'

const env = await load()

const MAX_NOISE_LEVEL = -40
const SILENCE_SPLIT = 1
const DETECT_STR = `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${SILENCE_SPLIT}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

const [locale_code, inputCategoryId] = Deno.args
if (!locale_code) {
  console.log('No language_code; These languages are missing files...')
  const data = await Promise.all(listLanguages().map(findMissingAudioFiles))
  const needFetch = data.filter((langData) => {
    for (const key in langData.emojisByCategory) {
      if (
        Object.prototype.hasOwnProperty.call(langData.emojisByCategory, key)
      ) return true
    }
    return false
  }).map((langData) => langData.locale_code)
  console.log(needFetch)

  for (const localeCode of needFetch) {
    await genAudio(localeCode)
  }

  console.log('COMPLETE')
  Deno.exit(0)
} else {
  await genAudio(locale_code)
  console.log('COMPLETE!')
  Deno.exit(0)
}

async function genAudio(locale_code: string) {
  await ensureDir('./tmp/audio')

  const { emojisByCategory, voice_id, pronunciationKeyIndex } =
    await findMissingAudioFiles(locale_code)

  console.log(locale_code, voice_id, Object.keys(emojisByCategory))

  const ttsResults = await ttsByCategory(
    locale_code,
    emojisByCategory,
    voice_id,
    pronunciationKeyIndex,
  )

  console.log('source audio id: ', JSON.stringify(ttsResults))

  for (const idx in ttsResults) {
    const { categoryId, fileName } = ttsResults[idx]
    if (!fileName) {
      console.warn(`Skipping category "${categoryId}": no fileName`)
      continue
    }
    const emojis = emojisByCategory[categoryId]
    console.log('source audio saved: ', fileName)
    const tempAudio = join('./tmp/audio', fileName)
    await writeTranslationAudioFiles(tempAudio, locale_code, emojis)
  }
}

async function findMissingAudioFiles(locale_code: string) {
  const lang = await readLanguageFile(locale_code, true)
  const { columns, pronunciation_key } = lang
  const voice_id = lang?.meta?.azure?.voice_id
  if (!voice_id) throw new Error(`${locale_code} does not have a voice_id`)

  const pronunciationKeyIndex = (pronunciation_key != null)
    ? columns.indexOf(pronunciation_key)
    : -1

  const emojisByCategory = lang.data
  await ensureDir(join(GEN_DIR, locale_code, 'audio'))
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

  return { emojisByCategory, locale_code, pronunciationKeyIndex, voice_id }
}

async function ttsByCategory(
  locale_code: string,
  emojisByCategory: { [category: string]: { [emojiKey: string]: string[] } },
  voice_id: string,
  pronunciationKeyIndex: number,
): Promise<{ categoryId: string; fileName: string | null }[]> {
  // todo: pool the tts requests
  return await Promise.all(
    Object.keys(emojisByCategory)
      .filter((catId) => !inputCategoryId || (catId === inputCategoryId))
      .map(async (categoryId) => {
        const texts = Object.keys(emojisByCategory[categoryId])
          .map((emojiId: string) => {
            const emoji = emojisByCategory[categoryId][emojiId]
            if (pronunciationKeyIndex >= 0) return emoji[pronunciationKeyIndex]
            return emoji[0]
          })
        const fileName = await ttsAzure(
          texts,
          voice_id,
          locale_code,
          categoryId,
        )
        return { categoryId, fileName }
      }),
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
    .map((key) => [key, emojis[key][0]])
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
  const [key, text] = names[count] || []
  if (!key || !text) {
    console.warn(`Careful about mismatching: ${sourceURL}`)
    return
  }
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

async function ttsAzure(
  texts: string[],
  voice_id: string,
  locale_code: string,
  category_id: string,
): Promise<string | null> {
  const SILENCE_REQUEST = 2
  const region = env['AZURE_SPEECH_REGION']
  const url = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': env['AZURE_SPEECH_KEY'],
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
  if (response.status > 399) {
    console.warn(response)
    return null
  }
  const fileName = `${locale_code}_${category_id}.mp3`
  const filePath = join('./tmp/audio', fileName)
  const file = await Deno.open(filePath, { create: true, write: true })
  const arrayBuffer = new Uint8Array(await response.arrayBuffer())
  await writeAll(file, arrayBuffer)
  return fileName
}
