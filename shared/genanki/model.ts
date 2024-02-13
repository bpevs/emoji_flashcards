export interface Template {
  name: string
  qfmt: string // question template
  afmt: string // answer template
  ord?: number
  did?: number // deckId
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

export interface ModelProps {
  id: number
  sortf: number // sort field
  did: number // deck id
  latexPre: string
  latexPost: string
  mod: number // modification time
  usn: number // unsure, something to do with sync?
  vers: [] // seems to be unused
  type: number
  css: string
  tags: string[]
  name: string
  flds: Array<{ name: string }>
  tmpls: Template[]
  req: Array<[
    number, // Card order
    'any' | 'all', // Are ALL fields required, or just any?
    number[], // Required Fields, by ord
  ]>
}

export class Model {
  props: ModelProps

  constructor({ id, did = 1, name, ...props }: Partial<ModelProps>) {
    if (id == null) throw new Error('missing id')
    if (name == null) throw new Error('missing name')

    const flds = (props.flds || [])
      .map((field: Partial<Field>, ord) => ({
        name: field.name || '',
        ord,
        sticky: field.sticky || false,
        rtl: field.rtl || false,
        font: field.font || 'Arial',
        size: field.size || 20,
        media: field.media || [],
      }))

    const tmpls = (props.tmpls || [])
      .map((tmpl: Partial<Template>, ord): Template => ({
        name: '',
        qfmt: '',
        afmt: '',
        bqfmt: '',
        bafmt: '',
        ord,
        did,
        ...tmpl,
      }))

    this.props = {
      id: id || 0,
      name: name || '',
      css: `.card {
        font-family: arial;
        font-size: 20px;
        text-align: center;
        color: black;
        background-color: white;
      }`,
      did,
      latexPre: `\\documentclass[12pt]{article}
       \\special{papersize=3in,5in}
       \\usepackage[utf8]{inputenc}
       \\usepackage{amssymb,amsmath}
       \\pagestyle{empty}
       \\setlength{\\parindent}{0in}
       \\begin{document}`,
      latexPost: '\\end{document}',
      sortf: 0,
      tags: [],
      type: 0,
      usn: 0,
      vers: [],
      req: [],
      ...props,
      flds,
      tmpls,
      mod: new Date().getTime() || 0,
    }
  }

  createNote(fieldValues: string[], tags: string[] = [], guid: string) {
    const { flds, name } = this.props
    if (fieldValues.length !== flds.length) {
      throw new Error(
        `Expected ${flds.length} fields for model '${name}' but got ${fieldValues.length}`,
      )
    }
    return new Note(this, fieldValues, tags, guid)
  }
}

export class Note {
  model: Model
  fields: string[]
  tags: string[]
  guid: string

  constructor(
    model: Model,
    fields: string[] = [],
    tags: string[] = [],
    guid: string,
  ) {
    this.model = model
    this.fields = fields
    this.tags = tags
    this.guid = guid
  }

  get cards() {
    const isEmpty = (fld: string) => !fld || fld.toString().trim().length === 0

    const rv = []

    for (const req of this.model.props.req) {
      const [template_index, any_or_all, required_field_ords] = req
      const operation = any_or_all === 'any' ? 'some' : 'every'
      const predicate = (ord: number) => !isEmpty(this.fields[ord])
      if (required_field_ords[operation](predicate)) rv.push(template_index)
    }

    return rv
  }
}
