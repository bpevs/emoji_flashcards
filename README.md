> **Note**
>
> You can help improve Emoji Flashcards translations! Read our [Contribution Guide](./.github/CONTRIBUTING.md) to learn more!

# About

You are looking at the entire Emoji Flashcards project! All our documentation, website, and tooling exists in this repository. Everything you need to know is either here, or in our [Discord](https://discord.gg/m9WGM2QWBK).

"Emoji Flashcards" is a tool to help generate [Anki](https://apps.ankiweb.net) flashcards from emoji/text/audio pairings. These emoji flashcards are meant to be used at the beginning of language learning, in order to give some confidence in vocabulary and act as a supplement for additional more language-specific learning. These are not intended to be a list of "most common words", but rather are a list of pictographic words that are hopefully fairly translatable across many languages and cultures. This is **NOT** a flashcard studying app in itself.

![A Generated Anki Flashcard](./screenshots/answer.png)

### Running Emoji Flashcards

The only prerequisite to running Emoji Flashcards is [Deno](https://deno.com/manual/getting_started/installation). There are also a few optional requirements, which are needed for specific tasks.

| task                  | description                                                                                                                                                                                                                                                                                                         |
| :-------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `deno task start`     | Runs the Emoji Flashcards website                                                                                                                                                                                                                                                                                   |
| `deno task test`      | Makes sure everything works. Please run this before making a PR                                                                                                                                                                                                                                                     |
| `deno task gen:anki`  | Generates Anki Decks from data                                                                                                                                                                                                                                                                                      |
| `deno task gen:audio` <img width=400/> | Generates audio files from data. It is NOT recommended to use this task if you are trying to contribute by adding new translations, since I will need to run it again later anyways. A local installation of [ffmpeg](https://ffmpeg.org), and a [play.ht](https://play.ht) API key are required to run this script |
| `deno task gen:text`  | Generates translations from [source](./data/source.json). Requires a [DeepL](https://www.deepl.com/pro-api) API key                                                                                                                                                                                                 |

## Other Similar Resources

- [Unicode Emoji List](https://unicode.org/emoji/charts/full-emoji-list.html)
- [Frequency Lists](https://en.m.wiktionary.org/wiki/Wiktionary:Frequency_lists/English)
- [Gabriel Wyner's "625 Words"](https://fluent-forever.com/wp-content/uploads/2014/05/625-List-Thematic.pdf)
- [HSK (漢語水平考試)](https://mandarinbean.com/new-hsk-vocabulary/)
