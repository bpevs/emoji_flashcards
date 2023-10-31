export function langToTSV(compactLanguageFile) {
  const { name, columns, data = [] } = compactLanguageFile
  const categories = Object.keys(data).sort()

  const emojis = categories.map((category) => {
    return Object.keys(data[category])
      .map((emoji) => [emoji, category, ...(data[category][emoji])])
  }).flat(1)

  let str = ['emoji', 'category', 'audio', ...columns].join('\t') + '\n'
  emojis.forEach(([emoji, category, text, ...other]) => {
    const audio = `[sound:emoji_${name}_${text}.mp3]`
    const sub = [emoji, category, audio, text, ...other].join('\t')
    str += `${sub}\n`
  })
  return str
}
