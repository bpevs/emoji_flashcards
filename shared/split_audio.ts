const SOURCE = 'tmp/my_file.mp3'
const OUT = 'tmp/out/'
const MAX_NOISE_LEVEL = -40
const MIN_SILENCE_LENGTH = 0.1
const DETECT_STR =
  `silencedetect=noise=${MAX_NOISE_LEVEL}dB:d=${MIN_SILENCE_LENGTH}`
const MATCH_SILENCE = /silence_start: ([\w\.]+)[\s\S]+?silence_end: ([\w\.]+)/g

try {
  await Deno.mkdir(OUT, { recursive: true })
} catch { /* Dir Exists */ }

const detectSilence = new Deno.Command('ffmpeg', {
  stdout: 'piped',
  args: ['-i', SOURCE, '-af', DETECT_STR, '-f', 'null', '-'],
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

  const outFile = OUT + (++count) + '.mp3'
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
