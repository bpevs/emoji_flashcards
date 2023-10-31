// Constants that are used onlu in server and in scripts
import { resolve } from 'std/path/mod.ts'

// Absolute paths of directories (for server)
export const DATA_DIR = resolve('./data')
export const LANGUAGES_DIR = resolve('./data/languages')
export const EXTENSIONS_DIR = resolve('./data/extensions')
export const GEN_DIR = resolve('./data/gen')
export const STATIC_DIR = resolve('./www')
export const SOURCE_FILE = resolve('data/source.json')
