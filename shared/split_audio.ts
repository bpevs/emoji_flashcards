// Function to split audio based on silence
// Function to split audio based on silence
export default function splitAudioBySilence(
  audioData: Uint8Array,
  silenceThreshold: number,
  silenceDuration: number,
  sampleRate: number,
): Uint8Array[] {
  const segments: Uint8Array[] = []
  let currentSegment: number[] = []
  let isSilent = true

  for (let i = 0; i < audioData.length; i++) {
    const sample = audioData[i]
    if (Math.abs(sample) < silenceThreshold) {
      if (!isSilent) {
        isSilent = true
        if (currentSegment.length >= silenceDuration * sampleRate) {
          segments.push(new Uint8Array(currentSegment))
        }
        currentSegment = []
      }
    } else {
      isSilent = false
      currentSegment.push(sample)
    }
  }

  // Add the last segment if it's not silent
  if (currentSegment.length > 0) {
    segments.push(new Uint8Array(currentSegment))
  }

  return segments
}
