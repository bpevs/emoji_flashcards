# Plugins

These plugins are for `gen_text` usage, and they do additional processing for building specific note/data sets.

For example:

- `zh` language, generate pinyin and use it as hint.
- `ja` language, generate romanji and use it as a hint.
- `es` language:
  - if noun, translate with "the" to generate "el" or "la"; no hint.
  - if verb, hint should be alternate forms
    - e.g. `comer` -> hint: `como, come, comes`

Plugin usage will simple match language, so naming conventions carry over:

- `es` will apply to all `es_XX` files.
- `es_ES` will apply only to Spanish in Spain, and will override `es`
- This will also apply to related extensions.
