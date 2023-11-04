import initSqlJs from 'sql.js'
import JSZip, { OutputType } from 'jszip'
import {
  DeckProps,
  defaultConf,
  defaultDeck,
  defaultDeckConf,
} from './constants.ts'
import { ModelProps } from './model.ts'
import { Deck } from './deck.ts'

const APKG_SCHEMA = `
PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;

CREATE TABLE col (
    id              integer primary key,
    crt             integer not null,
    mod             integer not null,
    scm             integer not null,
    ver             integer not null,
    dty             integer not null,
    usn             integer not null,
    ls              integer not null,
    conf            text not null,
    models          text not null,
    decks           text not null,
    dconf           text not null,
    tags            text not null
);
CREATE TABLE notes (
    id              integer primary key,   /* 0 */
    guid            text not null,         /* 1 */
    mid             integer not null,      /* 2 */
    mod             integer not null,      /* 3 */
    usn             integer not null,      /* 4 */
    tags            text not null,         /* 5 */
    flds            text not null,         /* 6 */
    sfld            integer not null,      /* 7 */
    csum            integer not null,      /* 8 */
    flags           integer not null,      /* 9 */
    data            text not null          /* 10 */
);
CREATE TABLE cards (
    id              integer primary key,   /* 0 */
    nid             integer not null,      /* 1 */
    did             integer not null,      /* 2 */
    ord             integer not null,      /* 3 */
    mod             integer not null,      /* 4 */
    usn             integer not null,      /* 5 */
    type            integer not null,      /* 6 */
    queue           integer not null,      /* 7 */
    due             integer not null,      /* 8 */
    ivl             integer not null,      /* 9 */
    factor          integer not null,      /* 10 */
    reps            integer not null,      /* 11 */
    lapses          integer not null,      /* 12 */
    left            integer not null,      /* 13 */
    odue            integer not null,      /* 14 */
    odid            integer not null,      /* 15 */
    flags           integer not null,      /* 16 */
    data            text not null          /* 17 */
);
CREATE TABLE revlog (
    id              integer primary key,
    cid             integer not null,
    usn             integer not null,
    ease            integer not null,
    ivl             integer not null,
    lastIvl         integer not null,
    factor          integer not null,
    time            integer not null,
    type            integer not null
);
CREATE TABLE graves (
    usn             integer not null,
    oid             integer not null,
    type            integer not null
);
CREATE INDEX ix_notes_usn on notes (usn);
CREATE INDEX ix_cards_usn on cards (usn);
CREATE INDEX ix_revlog_usn on revlog (usn);
CREATE INDEX ix_cards_nid on cards (nid);
CREATE INDEX ix_cards_sched on cards (did, queue, due);
CREATE INDEX ix_revlog_cid on revlog (cid);
CREATE INDEX ix_notes_csum on notes (csum);
COMMIT;
`

interface Media {
  name: string
  data: Blob
}

export class Package {
  decks: Deck[]
  media: Media[]

  constructor() {
    this.decks = []
    this.media = []
  }

  addDeck(deck: Deck) {
    this.decks.push(deck)
  }

  addMedia(data: Blob, name: string) {
    this.media.push({ name, data })
  }

  async writeToFile(filename: string) {
    const SQL = await initSqlJs()

    const db = new SQL.Database()
    db.run(APKG_SCHEMA)

    this.write(db)

    const zip = new JSZip()

    const data = db.export()
    const buffer = new Uint8Array(data).buffer

    zip.file('collection.anki2', buffer)

    const media_name: { [id: number]: string } = {}

    this.media.forEach((media, idx) => {
      zip.file(idx.toString(), media.data)
      media_name[idx] = media.name
    })

    zip.file('media', JSON.stringify(media_name))

    const props: {
      type: OutputType
      mimeType: string
    } = { type: 'blob', mimeType: 'application/apkg' }
    const blob = await zip.generateAsync(props)
    const zipBuffer = await blob.arrayBuffer()
    await Deno.writeFile(filename, new Uint8Array(zipBuffer))
  }

  // deno-lint-ignore no-explicit-any
  write(db: any) {
    const now = new Date()
    const models: { [id: number]: ModelProps } = {}
    const decks: { [id: string]: DeckProps } = {}

    // AnkiDroid failed to import subdeck, So add a Default deck
    decks['1'] = { ...defaultDeck, id: 1, name: 'Default' }

    this.decks.forEach(({ id, name, notes, desc }) => {
      notes.forEach(({ model }) => models[model.props.id] = model.props)
      decks[id] = { ...defaultDeck, id, name, desc }
    })

    db.prepare(`INSERT INTO col
         (id, crt, mod, scm, ver, dty, usn, ls, conf, models, decks, dconf, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run([
      null, // id
      (+now / 1000) | 0, // crt
      +now, // mod
      +now, // scm
      11, // ver
      0, // dty
      0, // usn
      0, // ls
      JSON.stringify(defaultConf), // conf
      JSON.stringify(models), // models
      JSON.stringify(decks), // decks
      JSON.stringify({ 1: { id: 1, ...defaultDeckConf } }), // dconf
      JSON.stringify({}), // tags
    ])

    const insert_notes = db.prepare(
      `INSERT INTO notes (id, guid, mid, mod, usn, tags, flds, sfld, csum, flags, data) 
        VALUES (null, ?, ?, ?, ?, ?, ?, ?, 0, 0, '')`,
    )

    const insert_cards = db.prepare(
      `INSERT INTO cards (id, nid, did, ord, mod, usn, type, queue, due, ivl, factor, reps, lapses, left, odue, odid, flags, data) 
        VALUES (null, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, 0, 0, '')`,
    )

    for (const deck of this.decks) {
      for (const note of deck.notes) {
        const tags = note.tags == null ? '' : note.tags.join(' ')
        insert_notes.run(
          [
            note.guid, // guid
            note.model.props.id, // mid
            (+now / 1000) | 0, // mod
            -1, // usn
            tags, // tags
            note.fields.join('\x1f'), // flds
            0, // sfld
          ],
        )

        const rowID = db.exec('select last_insert_rowid();')
        const note_id = rowID[0]['values'][0][0]

        for (const card_ord of note.cards) {
          insert_cards.run(
            [
              note_id, // nid
              deck.id, // did
              card_ord, // ord
              (+now / 1000) | 0, // mod
              -1, // usn
              0, // type 0=new, 1=learning, 2=due
              0, // queue -1 for suspended
            ],
          )
        }
      }
    }
  }
}
