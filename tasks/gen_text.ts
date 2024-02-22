/**
 * This script is for generating translations to new words: basically, it
 * pre-populates our `languages` files via translation APIs. It is expected
 * that some of the translations will be inaccurate, and will be corrected by
 * hand. Do not use this for extensions; those should be done purely by-hand,
 * since they should be used for individual translations anyways.
 *
 * Reads source.json as "source of truth" of emoji set.
 * For each `source.json`` emoji...
 *
 * Look at each language's base file...
 *   Loop through existing set
 *      If a translation is pre-existing, skip
 *      If a translation does not exist, translate via API
 *      If key does not exist in en_US, delete
 */
import { fromJSON, toJSON } from '@flashcard/adapters'
import { listLanguages, readSourceFile } from '@/shared/data_access.ts'
import { LANGUAGES_DIR } from '@/shared/paths.ts'
import plugins from '@/data/plugins/mod.ts'
import Plugin from '@/shared/plugin.ts'

const [input_locale_code] = Deno.args

const sourceFile = await readSourceFile()
const locales = input_locale_code ? [input_locale_code] : listLanguages()

console.info('locale_codes: ', locales)

for (const locale of locales) {
  try {
    const deckLocation = `${LANGUAGES_DIR}/${locale}.json`
    const deck = fromJSON(
      await Deno.readTextFile(deckLocation),
      { sortField: 'emoji' },
    )
    const { locale_code, lang_code } = deck.meta || {}

    console.info(`Language (${locale_code}):`)
    if (!locale_code) throw new Error(`invalid locale: ${locale_code}`)

    // Remote notes that are no longer in source.json
    for (const id in deck.notes) {
      const { category, emoji } = deck.notes[id].content
      // @todo: fix Deck.meta typing
      // deno-lint-ignore no-explicit-any
      if (!sourceFile.notes[category][emoji as any]) {
        delete deck.notes[id]
      }
    }

    const plugin = plugins[locale_code] || plugins[lang_code] || new Plugin()

    const nextDeck = await plugin.getTranslations(sourceFile, deck)
    await Deno.writeTextFile(deckLocation, toJSON(nextDeck))
  } catch (e) {
    console.warn('Failed to translate locale: ', locale)
    console.error(e)
  }
}

Deno.exit(0)
