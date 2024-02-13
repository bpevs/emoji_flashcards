/** @jsx jsx **/
import { jsx } from 'hono/middleware.ts'

export default function About(
  { strings }: { strings: { [key: string]: string } },
) {
  return (
    <div>
      <div class='card m-5'>
        <h1 id='about'>{strings.about}</h1>
        <p>{strings['about-about-description']}</p>
        <p class='about-links'>
          <a href='https://apps.ankiweb.net'>
            <img src='/static/icons/anki-mark.png' height='25px' />
            <span>Anki</span>
          </a>
        </p>
      </div>

      <div class='card m-5'>
        <h1 id='about-help-title'>{strings['about-help-title']}</h1>
        <p id='about-help-description-1'>
          {strings['about-help-description-1']}
        </p>
        <p id='about-help-description-2'>
          {strings['about-help-description-2']}
        </p>

        <p class='about-links'>
          <a href='https://github.com/bpevs/emoji_flashcards/tree/main/data'>
            <img src='/static/icons/github-mark.png' height='25px' />
            <span>Github</span>
          </a>
          <a href='https://discord.gg/m9WGM2QWBK'>
            <img src='/static/icons/discord-mark-black.png' height='20px' />
            <span>Discord</span>
          </a>
        </p>
      </div>
      <div class='card m-5'>
        <h1 id='about-sponsor-title'>{strings['about-sponsor-title']}</h1>
        <p id='about-sponsor-description'>
          {strings['about-sponsor-description']}
        </p>
        <p class='about-links'>
          <a href='https://github.com/sponsors/bpevs'>
            <img src='/static/icons/github-mark.png' height='25px' />
            <span>Github Sponsors</span>
          </a>
        </p>
      </div>
    </div>
  )
}
