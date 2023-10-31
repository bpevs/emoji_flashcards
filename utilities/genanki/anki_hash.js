import { crypto } from 'std/crypto/crypto.ts'

// deno-fmt-ignore
const BASE91_TABLE = [
  'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o',
  'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'A', 'B', 'C', 'D',
  'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
  'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7',
  '8', '9', '!', '#', '$', '%', '&', '(', ')', '*', '+', ',', '-', '.', '/',
  ':', ';', '<', '=', '>', '?', '@', '[', ']', '^', '_', '`', '{', '|', '}',
  '~',
]

export function ankiHash(fields) {
  const str = fields.join('__')

  const msgUint8 = new TextEncoder().encode(str)
  const hashBuffer = crypto.subtle.digestSync('SHA-256', msgUint8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  let hash_int = 0n
  for (let i = 0; i < 8; i++) {
    hash_int *= 256n
    hash_int += BigInt(hashArray[i])
  }

  // convert to the weird base91 format that Anki uses
  const rv_reversed = []
  while (hash_int > 0) {
    rv_reversed.push(BASE91_TABLE[hash_int % 91n])
    hash_int = hash_int / 91n
  }

  return rv_reversed.reverse().join('')
}
