import ankiHash from './anki_hash.js'
import { MODEL_STD } from './constants.ts'

export class Note {
  constructor(model, fields, tags = null, guid = null) {
    this.model = model
    this.fields = fields
    this.tags = tags
    this._guid = guid
  }

  get guid() {
    return this._guid ? this._guid : ankiHash(this.fields)
  }

  get cards() {
    if (this.model.props.type === MODEL_STD) {
      const isEmpty = (f) => {
        return !f || f.toString().trim().length === 0
      }
      const rv = []
      for (
        const [card_ord, any_or_all, required_field_ords] of this.model.props
          .req
      ) {
        const op = any_or_all === 'any' ? 'some' : 'every'
        if (required_field_ords[op]((f) => !isEmpty(this.fields[f]))) {
          rv.push(card_ord)
        }
      }
      return rv
    } else {
      // the below logic is copied from anki's ModelManager._availClozeOrds
      const ords = new Set()
      const matches = []
      const curliesRe = /{{[^}]*?cloze:(?:[^}]?:)*(.+?)}}/g
      const percentRe = /<%cloze:(.+?)%>/g
      const { qfmt } = this.model.props.tmpls[0] // cloze models only have 1 template
      let m = curliesRe.exec(qfmt)
      while (m) {
        matches.push(m[1])
        m = curliesRe.exec(qfmt)
      }

      m = percentRe.exec(qfmt)
      while (m) {
        matches.push(m[1])
        m = percentRe.exec(qfmt)
      }

      const map = {}
      this.model.props.flds.forEach((fld, i) => {
        map[fld.name] = [i, fld]
      })
      for (const fname of matches) {
        if (!(fname in map)) continue
        const ord = map[fname][0]
        const re = /{{c(\d+)::.+?}}/gs

        m = re.exec(this.fields[ord])
        while (m) {
          const i = parseInt(m[1])
          if (i > 0) {
            ords.add(i - 1)
          }
          m = re.exec(this.fields[ord])
        }
      }
      if (ords.size === 0) {
        // empty clozes use first ord
        return [0]
      }
      return Array.from(ords)
    }
  }
}
