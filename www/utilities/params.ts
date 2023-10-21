import {
  CARD_PARAM,
  DEFAULT_LANG,
  DEFAULT_LANG_MAP,
  USER_PARAM,
} from '../../shared/constants_shared.ts'

const params = (new URL(document.location)).searchParams
const cardLangParam = params.get(CARD_PARAM)
const userLangParam = params.get(USER_PARAM)

export const cardLangCodeParam = DEFAULT_LANG_MAP[cardLangParam] ||
  cardLangParam || DEFAULT_LANG
export const userLangCodeParam = DEFAULT_LANG_MAP[userLangParam] ||
  userLangParam || DEFAULT_LANG

export function setCardLangCodeParam() {
  const goto = new URL(document.location)
  goto.searchParams.set(CARD_PARAM, this.value.split('-')[0])
  window.location = goto
}

export function setUserLangCodeParam() {
  const goto = new URL(document.location)
  goto.searchParams.set(USER_PARAM, this.value.split('-')[0])
  window.location = goto
}
