/** @jsx jsx **/
import { jsx } from 'hono/middleware.ts'
import { html } from 'hono/helper.ts'
import type { UserLanguageMeta } from '@/shared/types.ts'

export default function NoteLanguageSelector(
  { locales, noteLangCode, userLangCode, strings }: UserLanguageMeta,
) {
  return (
    <form action='/' method='GET'>
      <input type='hidden' name='user' value={userLangCode} />
      <label for='note' id='card-selector-label'>
        {strings['card-selector-label']}
      </label>
      <select id='note-lang-selector' name='note'>
        {locales.map((locale) => (
          <option
            value={locale.locale_code}
            selected={locale.locale_code === noteLangCode}
          >
            {locale.locale_flag} {strings[locale.locale_code]}
          </option>
        ))}
      </select>
      <noscript>
        <input id='fallback-go' type='submit' value='Go' />
      </noscript>
    </form>
  )
}
