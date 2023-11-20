/**
 * This is code modified from https://github.com/hanleyweng/CantoJpMin/tree/main
 */
import data from './data.ts'

// Examples:
// const cantoJpMin = new CantoJpMin()
// console.log( cantoJpMin.toJyutping('食咗飯未呀?🍚') );
// Result => sik6 zo2 faan6 mei6 aa1 ?🍚
export default class CantoJpMin {
  // An array for each character in the text and its jyutping options
  toJyutpingArray(
    text: string,
  ): Array<{ original: string; jyutpings: string[] | undefined }> {
    // Note: This also separates out Emojis like '🍚' into ['�', '�'],
    // which can be rejoined later with .join('')
    const chars = text.split('')
    const array = []

    for (let i = 0; i < chars.length; i++) {
      const original = chars[i]
      const jp_string = data[original]

      // Split by 1st Delimiter ("/") and 2nd Delimiter (".")
      const jyutpings = jp_string != undefined
        ? jp_string.split(/[\/\.]/g)
        : undefined

      array.push({ original, jyutpings })
    }

    return array
  }

  /* A simple string based on the 1st jyutping option for each character. (Note: There's no guaranteer that the 1st jyutping option is correct within the given sentence.) */
  toJyutpingString(text: string): string {
    const array = this.toJyutpingArray(text)
    let sentence = ''

    for (let i = 0; i < array.length; i++) {
      // get the 1st jyutping option for the word
      const word = array[i]
      if (word.jyutpings != undefined) {
        sentence += ' ' + word.jyutpings[0] + ' '
      } else {
        sentence += word.original
      }
    }
    sentence = sentence.replace(/\s\s+/g, ' ').trim()
    return sentence
  }

  toJyutping(text: string): string {
    return this.toJyutpingString(text)
  }
}
