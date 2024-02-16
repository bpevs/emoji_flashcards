import Note from 'flashcards/models/note.ts'
import { ensureDir } from 'std/fs/mod.ts'
import { load } from 'std/dotenv/mod.ts'
import { writeAll } from 'std/streams/write_all.ts'
import { join } from 'std/path/mod.ts'
import { getAudioFilename, listAudioFiles, listLanguages, readDeck } from '@/shared/data_access.ts'
import { GEN_DIR } from '@/shared/paths.ts'

const env = await load()

const MAX_NOISE_LEVEL = -40
const SILENCE_SPLIT = 1
const DETECT_STR = `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${SILENCE_SPLIT}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

const [locale_code, inputCategoryId] = Deno.args
if (!locale_code) {
  console.log('No lang_code; These languages are missing files...')
  const data = await Promise.all(listLanguages().map(findMissingAudioFiles))
  const needFetch = data.filter((langData) => {
    for (const key in langData.byCategory) {
      if (
        Object.prototype.hasOwnProperty.call(langData.byCategory, key)
      ) return true
    }
    return false
  }).map((langData) => langData.locale)
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

async function genAudio(locale: string) {
  await ensureDir('./tmp/audio')

  const { byCategory, voiceId } = await findMissingAudioFiles(locale)

  console.log(locale, voiceId, Object.keys(byCategory))

  const ttsResults = await ttsByCategory(
    locale,
    byCategory,
    voiceId,
  )

  console.log('source audio id: ', JSON.stringify(ttsResults))

  for (const idx in ttsResults) {
    const { categoryId, fileName } = ttsResults[idx]
    if (!fileName) {
      console.warn(`Skipping category "${categoryId}": no fileName`)
      continue
    }
    const emojis = byCategory[categoryId]
    console.log('source audio saved: ', fileName)
    const tempAudio = join('./tmp/audio', fileName)
    await writeTranslationAudioFiles(tempAudio, locale, emojis)
  }
}

async function findMissingAudioFiles(locale: string) {
  const deck = await readDeck(locale, true)
  const voiceId = deck?.meta?.voice_id_azure as string
  if (!voiceId) throw new Error(`${locale} does not have a voiceId`)

  await ensureDir(join(GEN_DIR, locale, 'audio'))
  const existingAudioFiles = listAudioFiles(locale)

  const byCategory: { [category: string]: { [emojiKey: string]: Note } } = {}
  deck.notes.forEach((note) => {
    const { emoji, text } = note.content
    const fileName = getAudioFilename(locale, emoji, text)
    const exists = existingAudioFiles.has(fileName)
    if (!exists) byCategory[note.content.category][note.content.emoji] = note
  })

  return { byCategory, locale, voiceId }
}

async function ttsByCategory(
  locale: string,
  byCategory: { [category: string]: { [emojiKey: string]: Note } },
  voiceId: string,
): Promise<{ categoryId: string; fileName: string | null }[]> {
  // todo: pool the tts requests
  return await Promise.all(
    Object.keys(byCategory)
      .filter((catId) => !inputCategoryId || (catId === inputCategoryId))
      .map(async (categoryId) => {
        const texts = Object.keys(byCategory[categoryId])
          .map((emoji: string) => byCategory[categoryId][emoji].content.text)
        const fileName = await ttsAzure(texts, voiceId, locale, categoryId)
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
  emojis: { [emojiKey: string]: Note },
) {
  const names = Object.keys(emojis)
    .map((key) => [key, emojis[key].content.text])
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
  voiceId: string,
  locale: string,
  categoryId: string,
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
      <speak version='1.0' xml:lang='${locale}'>
        <voice name='${voiceId}' xml:lang='${locale}'>
          ${texts.join(`, <break time="${SILENCE_REQUEST}s"/> `)}
        </voice>
      </speak>
    `,
  })
  if (response.status > 399) {
    console.warn(response)
    return null
  }
  const fileName = `${locale}_${categoryId}.mp3`
  const filePath = join('./tmp/audio', fileName)
  const file = await Deno.open(filePath, { create: true, write: true })
  const arrayBuffer = new Uint8Array(await response.arrayBuffer())
  await writeAll(file, arrayBuffer)
  return fileName
}
