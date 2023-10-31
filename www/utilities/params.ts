import {
  DEFAULT_LANG,
  DEFAULT_LANG_MAP,
  NOTE_PARAM,
  USER_PARAM,
} from '../../shared/constants_shared.ts'

const params = (new URL(document.location)).searchParams
const noteLangParam = params.get(NOTE_PARAM)
const userLangParam = params.get(USER_PARAM)

export const noteLangCodeParam = DEFAULT_LANG_MAP[noteLangParam] ||
  noteLangParam || DEFAULT_LANG
export const userLangCodeParam = DEFAULT_LANG_MAP[userLangParam] ||
  userLangParam || DEFAULT_LANG

export function setNoteLangCodeParam() {
  const goto = new URL(document.location)
  goto.searchParams.set(NOTE_PARAM, this.value.split('-')[0])
  window.location = goto
}

export function setUserLangCodeParam() {
  const goto = new URL(document.location)
  goto.searchParams.set(USER_PARAM, this.value.split('-')[0])
  window.location = goto
}
