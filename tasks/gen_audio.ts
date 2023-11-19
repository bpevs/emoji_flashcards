import { ensureDir } from 'std/fs/mod.ts'
import { listAudioFiles, readLanguageFile } from '../utilities/data_access.ts'
import { getAudioFilename } from '../utilities/data_access_utilities.ts'
import { GEN_DIR } from '../utilities/constants_server.ts'
import { join } from 'std/path/mod.ts'
import { tts } from '../utilities/tts.ts'

const MAX_NOISE_LEVEL = -40
const SILENCE_SPLIT = 1
const DETECT_STR = `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${SILENCE_SPLIT}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

const [locale_code, inputCategoryId] = Deno.args
if (!locale_code) throw new Error('Please supply language_code')

const lang = await readLanguageFile(locale_code, true)
const { columns, pronunciation_key } = lang
const voice_id = lang?.meta?.azure?.voice_id
if (!voice_id) throw new Error(`${locale_code} does not have a voice_id`)

const pronunciationKeyIndex = columns.indexOf(pronunciation_key || '') || 0

const emojisByCategory = lang.data
await ensureDir('./data/tmp')
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

console.log(locale_code, voice_id, Object.keys(emojisByCategory))

const ttsResults = await ttsByCategory(emojisByCategory, voice_id)

console.log('source audio id: ', JSON.stringify(ttsResults))

for (const idx in ttsResults) {
  const { categoryId, fileName } = ttsResults[idx]
  if (!fileName) {
    console.warn(`Skipping category "${categoryId}": no fileName`)
    continue
  }
  const emojis = emojisByCategory[categoryId]
  console.log('source audio saved: ', fileName)
  const tempAudio = join('./data/tmp', fileName)
  await writeTranslationAudioFiles(tempAudio, locale_code, emojis)
}

console.log('COMPLETE!')
Deno.exit(0)

async function ttsByCategory(
  emojisByCategory: { [category: string]: { [emojiKey: string]: string[] } },
  voice_id: string,
): Promise<{ categoryId: string; fileName: string | null }[]> {
  // todo: pool the tts requests
  return await Promise.all(
    Object.keys(emojisByCategory)
      .filter((catId) => !inputCategoryId || (catId === inputCategoryId))
      .map(async (categoryId) => {
        const texts = Object.keys(emojisByCategory[categoryId])
          .map((emojiId: string) => {
            const emoji = emojisByCategory[categoryId][emojiId]
            if (pronunciation_key) return emoji[pronunciationKeyIndex]
            return emoji[0]
          })
        const fileName = await tts(texts, voice_id, locale_code, categoryId)
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
