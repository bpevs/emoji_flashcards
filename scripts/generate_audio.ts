// Probably this script will be run by a hook on pull request
// Generate audio from new data additions, and upload them.
import { readJson } from 'https://deno.land/std/fs/mod.ts'
import { readdirSync } from 'https://deno.land/std/fs/mod.ts'
import { exec } from 'https://deno.land/x/exec/mod.ts'

const LANGUAGES_DIR = './languages'
const EXTENSIONS_DIR = './extensions'

async function generateAudio(
  text: string,
  language: string,
  outputFile: string,
) {
  // Use the gcloud command to generate audio. Assumes gcloud SDK is installed.
  await exec(
    `gcloud ml text-to-speech synthesize "${text}" --language-code="${language}" --output="${outputFile}"`,
  )
}

async function processDirectory(dir: string) {
  const files = readdirSync(dir)

  for (const file of files) {
    const filePath = `${dir}/${file}`
    const languageData = await readJson(filePath)

    for (const emojiKey in languageData.data) {
      const text = languageData.data[emojiKey].text
      const audioFileName = `${dir}/${file.split('.')[0]}_${
        encodeURIComponent(emojiKey)
      }.mp3`
      await generateAudio(text, file.split('.')[0], audioFileName)
    }
  }
}

async function main() {
  await processDirectory(LANGUAGES_DIR)
  await processDirectory(EXTENSIONS_DIR)
}

import { readJson } from 'https://deno.land/std/fs/mod.ts'

const LANGUAGES_DIR = './languages'
const PAUSE_PHRASE = 'pause here'
const BATCH_SIZE = 10

async function fetchTTS(text: string, language: string): Promise<Uint8Array> {
  // Call Google TTS API here and return the audio data
  // Replace with your actual API call
  return new Uint8Array()
}

async function splitAudio(inputFile: string, outputPrefix: string) {
  const command =
    `ffmpeg -i ${inputFile} -af "silencedetect=n=-50dB:d=1" -f null - 2>&1`
  const result = await Deno.run({
    cmd: command.split(' '),
    stdout: 'piped',
    stderr: 'piped',
  }).output()

  const outputText = new TextDecoder().decode(result)
  const matches = [
    ...outputText.matchAll(/silencedetect.*? silence_end: (.*?) \|/g),
  ]

  let lastTime = 0
  matches.forEach((match, index) => {
    const time = parseFloat(match[1])
    const splitCommand =
      `ffmpeg -i ${inputFile} -ss ${lastTime} -to ${time} -c copy ${outputPrefix}_${index}.mp3`
    Deno.run({ cmd: splitCommand.split(' ') })
    lastTime = time
  })
}

async function processLanguageFile(file: string) {
  const path = `${LANGUAGES_DIR}/${file}`
  const data = await readJson(path)

  let batch = []
  let batchNumber = 0

  for (const emoji in data.data) {
    batch.push(data.data[emoji].text)

    if (batch.length >= BATCH_SIZE) {
      const textToTranslate = batch.join(`. ${PAUSE_PHRASE}. `)
      const audioData = await fetchTTS(textToTranslate, file.split('-')[0]) // Assume language is prefix of filename

      // Save the batch audio file
      await Deno.writeFile(`batch_${batchNumber}.mp3`, audioData)

      // Split the batch audio file
      await splitAudio(`batch_${batchNumber}.mp3`, `output_${batchNumber}`)

      batchNumber++
      batch = []
    }
  }
}

const files = Deno.readDirSync(LANGUAGES_DIR)
for (const file of files) {
  if (file.isFile) {
    await processLanguageFile(file.name)
  }
}
