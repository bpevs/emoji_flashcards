import { Note } from './note.js'

export interface Template {
  name: string
  qfmt: string // question template
  afmt: string // answer template
  ord?: number | null
  did?: number | null // deckId
  bqfmt?: string
  bafmt?: string
}

export interface Field {
  name: string
  ord?: number | null
  sticky?: boolean
  rtl?: boolean
  font?: string
  size?: number
  media: { name: string; data: string }[]
}

const defaultField: Field = {
  name: '',
  ord: null,
  sticky: false,
  rtl: false,
  font: 'Arial',
  size: 20,
  media: [],
}

const defaultModel = {
  sortf: 0, // sort field
  did: 1, // deck id
  latexPre: `\\documentclass[12pt]{article}
 \\special{papersize=3in,5in}
 \\usepackage[utf8]{inputenc}
 \\usepackage{amssymb,amsmath}
 \\pagestyle{empty}
 \\setlength{\\parindent}{0in}
 \\begin{document}`,
  latexPost: '\\end{document}',
  mod: 0, // modification time
  usn: 0, // unsure, something to do with sync?
  vers: [], // seems to be unused
  type: 0,
  css: `.card {
  font-family: arial;
  font-size: 20px;
  text-align: center;
  color: black;
  background-color: white;
 }`,
  tags: [],
  flds: [],
}

const defaultTemplate: Template = {
  name: '',
  ord: null,
  qfmt: '',
  afmt: '',
  did: null,
  bqfmt: '',
  bafmt: '',
}

export class Model {
  props = defaultModel
  fieldNameToOrder = {}

  constructor(props) {
    this.props = {
      ...this.props,
      ...props,
      flds: props.flds.map((field: Field, idx: number) => ({
        ...defaultField,
        ord: idx,
        ...field,
      })),
      tmpls: props.tmpls.map((template: Template, idx: number) => ({
        ...defaultTemplate,
        ord: idx,
        did: props.did || null,
        ...template,
      })),
      mod: new Date().getTime(),
    }
    this.props.flds.forEach((field: Field) => {
      this.fieldNameToOrder[field.name] = field.ord
    })
  }

  createNote(
    fields: string[],
    tags: string[] = [],
    guid: string | null = null,
  ) {
    if (Array.isArray(fields)) {
      if (fields.length !== this.props.flds.length) {
        throw new Error(
          `Expected ${this.props.flds.length} fields for model '${this.props.name}' but got ${fields.length}`,
        )
      }
      return new Note(this, fields, tags, guid)
    }

    const fields_list: Field[] = []

    Object.keys(fields).forEach((field_name) => {
      const ord = this.fieldNameToOrder[field_name]
      if (ord == null) {
        throw new Error(`Field '${field_name}' does not exist in the model`)
      }
      fields_list[ord] = fields[field_name]
    })
    return new Note(this, fields_list, tags, guid)
  }
}
