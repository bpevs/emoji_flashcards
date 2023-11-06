# Emoji Flashcards Contribution Guide <!-- omit in toc -->

Thank you for investing your time in contributing to Emoji Flashcards!

Read our [Code of Conduct](./CODE_OF_CONDUCT.md) to keep our community approachable and respectable.

## How to Contribute Translations

If you are looking to report an incorrect translation and you are not familiar with using Github, the easiest way to help is to [join our Discord](https://discord.gg/m9WGM2QWBK). If you feel a bit more comfortable, it's even more convenient for us if you [create an issue](https://github.com/bpevs/emoji_flashcards/issues/new?template=translation_request.md)!

All translation edits will be in the [data](../data) directory. The main things to note are:

1. If you want to FIX a translation for **AN INDIVIDUAL LANGUAGE**, update [`data/languages/{your-lang-here}.json`](../data/languages)
2. If you want to ADD new words to **AN INDIVIDUAL LANGUAGE**, update [`data/extensions/{your-lang-here}.json`](../data/extensions).
3. If you want to add a new word to **ALL languages**, make your change in [`data/source.json`](../data/source.json).
