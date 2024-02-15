# Data

This is where we store all our language-specific files! All the translations are available here! The things that are not available here (due to their filesize) are our audio files and Anki decks.

## How You Can Contribute

The main things to note are:

1. If you want to fix a translation for **ONLY ONE LANGUAGE**, update [`/languages/{your-lang-here}.json`](./languages)
2. If you want to ADD new words to **ONLY ONE LANGUAGE**, update [`/extensions/{your-lang-here}.json`](./extensions).
3. If you want to add a new word to **ALL languages**, make your change in [`source.json`](./source.json).

## Language Data Files Spec

Language data is stored in JSON in the `languages` directory. `extensions` of the same name and file format can be used to "extend" specific languages with words that may be useful in those languages. `root.json` is the file we source in order to power the `generate` script. Basically, we update this in order to make changes to all langues (ala, add an emoji). It mostly matches `en-US`, but with additional properties that could be useful for better tuning or sorting of translations (part of speech, additional tags, etc).

### Versioning

**`Major.Minor.Patch`**

- **Major**: Changes in format
- **Minor**: Words added or deleted (Changes that reflect on all languages)
- **Patch**: Data mod, extension update, or column addition

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

  "key": "emoji",
  "columns": ["emoji", "text", "pinyin"],

  "notes": {
    "animal": {
      "🐶": ["狗", "gǒu"]
    }
  }
}
```

#### Extension Files

Extension files inherit the strings and columns of their parents.

```jsonc
{
  "notes": {
    "phrases": {
      /* Extension files inherit the column definitions of their parent */
      "👋": ["你好", "nĭ hăo"]
    }
  },

  /* Multiple options can be stacked and applied. These are optional */
  "extensions": {
    "formal": {
      "name": "Formal Modifications",
      "description": "Use more formal versions of words",
      "notes": {
        /* If applied, this named extension would override the `你好` above */
        "👋": ["您好", "nín hăo"]
      }
    }
  }
}
```

```jsonc
{
  "notes": {
    "beverages": {
      "🍺": ["cervesa", ""]
    }
  },

  "extensions": {
    "gender-extension": {
      "name": "Modify with gender",
      "description": "Adds definite articles",
      "notes": {
        "beverages": {
          "🍺": ["una cervesa", ""]
        }
      }
    },

    "subject-extension": {
      "name": "Add Subjects to verbs",
      "description": "Adds verb subjects",
      "notes": {
        "verbs": {
          "😮🍔 (🙋)": ["como"],
          "😮🍔 (🫵)": ["comes"],
          "😮🍔 (👉🧍)": ["come"]
        }
      }
    }
  }
}
```

### Audio

For filesize reasons, audio is not included in this git repo (audio is generated into `data/gen`, but is ignored for commits). The canonical audio is just `.mp3` files that can come from various sources. For this reason, it is recommended to download the latest `https://static.bpev.me/flashcards/Archive.zip`, unzip it, and relocate it to `/data/gen`.

When adding new audio, we usually start with TTS-generated audio, since it is an easy was to create a consistent set of audio. These are currently generated using [play.ht](https://play.ht/text-to-speech-api/), because they have pretty good audio through a fairly standard api. However, there are some limitations in language-choice and flexibility. In the future, it makes sense to look at some more open solutions, such as [IMS-Toucan](https://github.com/DigitalPhonetics/IMS-Toucan), [whisper](https://github.com/openai/whisper) or some other huggingface ai thing or smthn. Requirements for TTS engines are multi-lingual and SSML support (For inserting breaks to split audio. This is not necessary if using a local engine, where we can translate each word individually).

Audio is generated into the directory:

`data/gen/{language-region-code}/audio/${locale}_${emoji}_${text}.mp3`

Examples:

- `data/gen/zh-CN/audio/zh-cn_🐈_猫.mp3`
- `data/gen/ja-JP/audio/es-es_🔥_fuego.mp3`

Name should be parsed to be valid urls, so we don't really care about keys with awkward text entities. The only restriction is disallowing `_` in plugin names, since we use it for splitting entity names.
