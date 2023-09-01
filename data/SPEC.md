## Language Data Files Spec

Language data is stored in JSON in the `languages` directory. `extensions` of the same name and file format can be used to "extend" specific languages with words that may be useful in those languages. `root.json` is the file we source in order to power the `generate` script. Basically, we update this in order to make changes to all langues (ala, add an emoji). It mostly matches `en-US`, but with additional properties that could be useful for better tuning or sorting of translations (part of speech, additional tags, etc).

### File Naming

Language files should be named via 2-part [language tag](https://www.rfc-editor.org/rfc/rfc5646.html#section-2.1). Specifically, we are using [a ISO 639-1 OR ISO 639-3 code](https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes) (if a 2-digit ISO 639-1 is not specific enough for common understanding) and [ISO 3166-1 code](https://www.iso.org/obp/ui/#search/code/) (again, shortest. So Probably Alpha-2 code) joined by a `-` and appended with `.json`:

Examples:

- `en-US.json` English - United States of America (the)
- `es-MX.json` Spanish - Mexico
- `es-ES.json` Spanish - Spain
- `zh-CN.json` Chinese - China
- `zh-TW.json` Chinese - Taiwan
- `yue-CN.json` Yue Chinese - China

#### Extension File Naming

Extensions are named the same way, with the additional flexibility of using language-only filenames (`en.json` or `ja.json`). These can extend all language files of all country codes (`es.json` will extend `es-ES.json` and `es-MX.json`).

Examples:

- `en-US.json` English - United States of America (the)
- `es.json` Spanish (All spanish-speaking countries)
- `es-MX.json` Spanish (only Mexico. Individual words override `es.json`)

Notes:

1. There is NO concept of "cross-region" extensions (`CN.json` will not extend `[xx]-CN.json`).
2. More specific extensions will override more general ones on a word-by-word basis:

- If a word exists in only `extensions/es.json`, it will extend `languages/es_MS.json`.
- If a word exists in only `extensions/es-MX.json`, it will extend `languages/es_MS.json`.
- If a word exists in BOTH `extensions/es.json` and `extensions/es-MX.json`, `extensions/es-MX.json` will extend `languages/es_MS.json`

##### Override Priority (Highest First)

1. Extension File Optional Extensions (in order within json if in multiple)
2. Extension File Data property
3. Language file
4. source.json

If a key exists in source.json, but not the language file, it will be translated into the language file.

### File Structure

#### Language Files

```jsonc
{
  /* Strings for the website */
  "strings": {
    "title": "表情符號語言抽認卡",
    "description": "可下載的表情符號抽認卡以學習多種語言",

    /* Translations for all the languages for the selector */
    "en-US": "英文 （美國）",
    "ch-ZH": "中文 （台灣）"
  },

  /* Map of all emoji data, keyed by emoji to enforce one-of-a-kind */
  "data": {
    "🐶": {
      "text": "dog", /* Translated text */

      /* Data: Category Key */
      /* Category keys are translated to user-language at DL runtime */
      "category": "animal",

      /* A broad "anything goes" field that is hidden until clicked */
      /* This example is pinyin. Another might be gender for es or fr nouns */
      "hint": "gǒu"
      /* Audio location is in card data, but is applied at DL runtime */
    }
  }
}
```

#### Extension Files

```jsonc
{
  /* Matches Language File. These changes are always applied to this lang*/
  "strings": {},
  "data": {
    "👋": { "text": "你好!", "category": "phrases", "hint": "nĭ hăo" }
  },

  /* Multiple options can be stacked and applied. These are optional */
  "formal-extension": {
    "name": "Formal Modifications",
    "description": "Use more formal versions of words",
    "data": {
      "👋": { "text": "您好", "category": "phrases", "hint": "nín hăo" }
    }
  }
}
```

```jsonc
{
  "strings": {},
  "data": {
    "🍺": { "text": "cervesa", "category": "beverages" }
  },

  "gender-extension": {
    "name": "Modify with gender",
    "description": "Adds definite articles",
    "data": {
      "🍺": { "text": "una cervesa", "category": "beverages" }
    }
  },

  "subject-extension": {
    "name": "Add Subject",
    "description": "Adds verb subjects",
    "data": {
      "😮🍔 (🙋)": { "text": "como", "category": "verbs" },
      "😮🍔 (🫵)": { "text": "comes", "category": "verbs" },
      "😮🍔 (👉🧍)": { "text": "come", "category": "verbs" }
    }
  }
}
```

### Audio

Still need to sort out where this will be stored (not in this repo, for size concerns). Expect general TTS to be pulled from [Forvo](https://api.forvo.com/) or generated via [Google TTS](https://cloud.google.com/text-to-speech). Maybe at some point, we can replace our own audio.

Audio will be saved with a filename format like: `{language-region-code}[-extension-name]_{emoji-key}.mp3`

Example: `en-US_📏🐜.mp3` `en-US-merica_📏🐜.mp3`

Name will be parsed to be valid urls, so we don't really care about keys with awkward text entities, but the name could look weird.
