export const STARTING_FACTOR = 2500

// whether new cards should be mixed with reviews, or shown first or last
export enum NewCardDistribution {
  DISTRIBUTE = 0,
  LAST,
  FIRST,
}

export enum NewCardInsertion {
  RANDOM = 0,
  DUE,
}

export enum LeechAction {
  SUSPEND = 0,
  TAG_ONLY,
}

export const defaultConf = {
  activeDecks: [1],
  curDeck: 1,
  newSpread: NewCardDistribution.DISTRIBUTE,
  collapseTime: 1200,
  timeLim: 0,
  estTimes: true,
  dueCounts: true,
  // other config
  curModel: null,
  nextPos: 1,
  sortType: 'noteFld',
  sortBackwards: false,
  addToCur: true, // add new to currently selected deck?
  dayLearnFirst: false,
}

export const defaultDeckConf = {
  name: 'Default',
  new: {
    delays: [1, 10],
    ints: [1, 4, 7], // 7 is not currently used
    initialFactor: STARTING_FACTOR,
    separate: true,
    order: NewCardInsertion.DUE,
    perDay: 20,
    // may not be set on old decks
    bury: false,
  },
  lapse: {
    delays: [10],
    mult: 0,
    minInt: 1,
    leechFails: 8,
    leechAction: LeechAction.SUSPEND,
  },
  rev: {
    perDay: 200,
    ease4: 1.3,
    fuzz: 0.05,
    minSpace: 1, // not currently used
    ivlFct: 1,
    maxIvl: 36500,
    // may not be set on old decks
    bury: false,
    hardFactor: 1.2,
  },
  maxTaken: 60,
  timer: 0,
  autoplay: true,
  replayq: true,
  mod: 0,
  usn: 0,
}

export const defaultDeck: {
  newToday: [number, number]
  revToday: [number, number]
  lrnToday: [number, number]
  timeToday: [number, number]
  conf: number
  usn: number
  desc: string
  dyn: boolean | number
  collapsed: boolean
  extendNew: number
  extendRev: number
} = {
  newToday: [0, 0], // currentDay, count
  revToday: [0, 0],
  lrnToday: [0, 0],
  timeToday: [0, 0], // time in ms
  conf: 1,
  usn: 0,
  desc: '',
  dyn: 0,
  collapsed: false,
  // added in beta11
  extendNew: 10,
  extendRev: 50,
}
