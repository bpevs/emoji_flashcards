import { Note } from './model.ts'

export class Deck {
  id: number
  name: string
  desc: string
  notes: Note[]

  constructor(id: number, name: string, desc = '') {
    this.id = id
    this.name = name
    this.desc = desc
    this.notes = []
  }

  addNote(note: Note) {
    this.notes.push(note)
  }
}
