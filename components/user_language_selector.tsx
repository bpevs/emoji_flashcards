/** @jsx jsx **/
import { jsx } from 'hono/middleware.ts'
import type { UserLanguageMeta } from '../types.ts'

export default function UserLanguageSelector(
  { locales, noteLangCode, userLangCode }: UserLanguageMeta,
) {
  return (
    <div class='user-lang'>
      <form action='/' method='GET'>
        <label for='user' id='user-selector-label'>🌐</label>
        <select
          name='user'
          id='user-lang-selector'
          defaultValue={userLangCode}
        >
          ${locales.map((locale) => (
            <option
              value={locale.locale_code}
              selected={userLangCode === locale.locale_code}
            >
              {locale.locale_flag} {locale.native_name}
            </option>
          ))}
        </select>
        <input type='hidden' name='card' value={userLangCode} />
        <noscript>
          <input id='fallback-go' type='submit' value='Go' />
        </noscript>
      </form>
    </div>
  )
}
