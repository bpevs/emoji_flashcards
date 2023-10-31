import { ankiHash } from './anki_hash.js'

export class Note {
  constructor(model, fields = [], tags = [], guid = null) {
    this.model = model
    this.fields = fields
    this.tags = tags
    this._guid = guid
  }

  get guid() {
    return this._guid ? this._guid : ankiHash(this.fields)
  }

  get cards() {
    const isEmpty = (field) => !field || field.toString().trim().length === 0

    const rv = []

    for (const props of this.model.props.req) {
      const [card_ord, any_or_all, required_field_ords] = props
      const operation = any_or_all === 'any' ? 'some' : 'every'
      const predicate = (field) => !isEmpty(this.fields[field])
      if (required_field_ords[operation](predicate)) rv.push(card_ord)
    }

    return rv
  }
}
