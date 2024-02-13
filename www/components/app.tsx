/** @jsx jsx **/
import { jsx } from 'hono/middleware.ts'
import NoteLanguageSelector from './note_language_selector.tsx'
import type { UserLanguageMeta } from '@/shared/types.ts'

export default function App(
  props: UserLanguageMeta,
) {
  const { flag, noteLangCode, strings } = props
  return (
    <div class='container text-center min-vh-100 d-flex flex-column justify-content-center'>
      <div class='row my-5'>
        <h1 id='title'>{strings.title}</h1>
        <div class='description'>
          <NoteLanguageSelector {...props} />
        </div>
      </div>

      <div id='app' class='row container mx-auto'>
        <div class='note-wrapper'>
          <div id='note-stack' class='note'>
            <noscript>
              <div id='no-js' class='no-script-message'>
                {strings['no-js']}
              </div>
            </noscript>
          </div>
        </div>
        <div style='text-align: center; padding: 10px;'>
          <div id='note-selector-wrapper' />
        </div>
      </div>

      <div class='row my-5'>
        <h2 class='download'>
          <a
            id='download-link'
            download
            href={`https://static.bpev.me/flashcards/${noteLangCode}/emoji-flashcards-${noteLangCode}.apkg`}
          >
            <span id='download'>
              <span class='flag-icon'>{flag}</span> {strings.download}
            </span>
          </a>
        </h2>
      </div>
    </div>
  )
}
