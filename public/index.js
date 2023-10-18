// node_modules/.deno/solid-js@1.7.11/node_modules/solid-js/dist/solid.js
var sharedConfig = {
  context: void 0,
  registry: void 0,
}
function setHydrateContext(context) {
  sharedConfig.context = context
}
function nextHydrateContext() {
  return {
    ...sharedConfig.context,
    id: `${sharedConfig.context.id}${sharedConfig.context.count++}-`,
    count: 0,
  }
}
var equalFn = (a, b) => a === b
var $PROXY = Symbol('solid-proxy')
var $TRACK = Symbol('solid-track')
var $DEVCOMP = Symbol('solid-dev-component')
var signalOptions = {
  equals: equalFn,
}
var ERROR = null
var runEffects = runQueue
var STALE = 1
var PENDING = 2
var UNOWNED = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null,
}
var NO_INIT = {}
var Owner = null
var Transition = null
var Scheduler = null
var ExternalSourceFactory = null
var Listener = null
var Updates = null
var Effects = null
var ExecCount = 0
var [transPending, setTransPending] = /* @__PURE__ */ createSignal(false)
function createRoot(fn, detachedOwner) {
  const listener = Listener,
    owner = Owner,
    unowned = fn.length === 0,
    current = detachedOwner === void 0 ? owner : detachedOwner,
    root = unowned ? UNOWNED : {
      owned: null,
      cleanups: null,
      context: current ? current.context : null,
      owner: current,
    },
    updateFn = unowned ? fn : () => fn(() => untrack(() => cleanNode(root)))
  Owner = root
  Listener = null
  try {
    return runUpdates(updateFn, true)
  } finally {
    Listener = listener
    Owner = owner
  }
}
function createSignal(value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions
  const s = {
    value,
    observers: null,
    observerSlots: null,
    comparator: options.equals || void 0,
  }
  const setter = (value2) => {
    if (typeof value2 === 'function') {
      if (Transition && Transition.running && Transition.sources.has(s)) {
        value2 = value2(s.tValue)
      } else {
        value2 = value2(s.value)
      }
    }
    return writeSignal(s, value2)
  }
  return [readSignal.bind(s), setter]
}
function createComputed(fn, value, options) {
  const c = createComputation(fn, value, true, STALE)
  if (Scheduler && Transition && Transition.running) {
    Updates.push(c)
  } else {
    updateComputation(c)
  }
}
function createRenderEffect(fn, value, options) {
  const c = createComputation(fn, value, false, STALE)
  if (Scheduler && Transition && Transition.running) {
    Updates.push(c)
  } else {
    updateComputation(c)
  }
}
function createEffect(fn, value, options) {
  runEffects = runUserEffects
  const c = createComputation(fn, value, false, STALE),
    s = SuspenseContext && useContext(SuspenseContext)
  if (s) {
    c.suspense = s
  }
  if (!options || !options.render) {
    c.user = true
  }
  Effects ? Effects.push(c) : updateComputation(c)
}
function createMemo(fn, value, options) {
  options = options ? Object.assign({}, signalOptions, options) : signalOptions
  const c = createComputation(fn, value, true, 0)
  c.observers = null
  c.observerSlots = null
  c.comparator = options.equals || void 0
  if (Scheduler && Transition && Transition.running) {
    c.tState = STALE
    Updates.push(c)
  } else {
    updateComputation(c)
  }
  return readSignal.bind(c)
}
function createResource(pSource, pFetcher, pOptions) {
  let source
  let fetcher
  let options
  if (
    arguments.length === 2 && typeof pFetcher === 'object' ||
    arguments.length === 1
  ) {
    source = true
    fetcher = pSource
    options = pFetcher || {}
  } else {
    source = pSource
    fetcher = pFetcher
    options = pOptions || {}
  }
  let pr = null,
    initP = NO_INIT,
    id = null,
    loadedUnderTransition = false,
    scheduled = false,
    resolved = 'initialValue' in options,
    dynamic = typeof source === 'function' && createMemo(source)
  const contexts = /* @__PURE__ */ new Set(),
    [value, setValue] = (options.storage || createSignal)(options.initialValue),
    [error, setError] = createSignal(void 0),
    [track, trigger] = createSignal(void 0, {
      equals: false,
    }),
    [state, setState] = createSignal(resolved ? 'ready' : 'unresolved')
  if (sharedConfig.context) {
    id = `${sharedConfig.context.id}${sharedConfig.context.count++}`
    let v
    if (options.ssrLoadFrom === 'initial') {
      initP = options.initialValue
    } else if (sharedConfig.load && (v = sharedConfig.load(id))) {
      initP = v[0]
    }
  }
  function loadEnd(p, v, error2, key) {
    if (pr === p) {
      pr = null
      key !== void 0 && (resolved = true)
      if ((p === initP || v === initP) && options.onHydrated) {
        queueMicrotask(() =>
          options.onHydrated(key, {
            value: v,
          })
        )
      }
      initP = NO_INIT
      if (Transition && p && loadedUnderTransition) {
        Transition.promises.delete(p)
        loadedUnderTransition = false
        runUpdates(() => {
          Transition.running = true
          completeLoad(v, error2)
        }, false)
      } else {
        completeLoad(v, error2)
      }
    }
    return v
  }
  function completeLoad(v, err) {
    runUpdates(() => {
      if (err === void 0) {
        setValue(() => v)
      }
      setState(err !== void 0 ? 'errored' : resolved ? 'ready' : 'unresolved')
      setError(err)
      for (const c of contexts.keys()) {
        c.decrement()
      }
      contexts.clear()
    }, false)
  }
  function read() {
    const c = SuspenseContext && useContext(SuspenseContext),
      v = value(),
      err = error()
    if (err !== void 0 && !pr) {
      throw err
    }
    if (Listener && !Listener.user && c) {
      createComputed(() => {
        track()
        if (pr) {
          if (c.resolved && Transition && loadedUnderTransition) {
            Transition.promises.add(pr)
          } else if (!contexts.has(c)) {
            c.increment()
            contexts.add(c)
          }
        }
      })
    }
    return v
  }
  function load(refetching = true) {
    if (refetching !== false && scheduled) {
      return
    }
    scheduled = false
    const lookup = dynamic ? dynamic() : source
    loadedUnderTransition = Transition && Transition.running
    if (lookup == null || lookup === false) {
      loadEnd(pr, untrack(value))
      return
    }
    if (Transition && pr) {
      Transition.promises.delete(pr)
    }
    const p = initP !== NO_INIT ? initP : untrack(() =>
      fetcher(lookup, {
        value: value(),
        refetching,
      })
    )
    if (typeof p !== 'object' || !(p && 'then' in p)) {
      loadEnd(pr, p, void 0, lookup)
      return p
    }
    pr = p
    scheduled = true
    queueMicrotask(() => scheduled = false)
    runUpdates(() => {
      setState(resolved ? 'refreshing' : 'pending')
      trigger()
    }, false)
    return p.then(
      (v) => loadEnd(p, v, void 0, lookup),
      (e) => loadEnd(p, void 0, castError(e), lookup),
    )
  }
  Object.defineProperties(read, {
    state: {
      get: () => state(),
    },
    error: {
      get: () => error(),
    },
    loading: {
      get() {
        const s = state()
        return s === 'pending' || s === 'refreshing'
      },
    },
    latest: {
      get() {
        if (!resolved) {
          return read()
        }
        const err = error()
        if (err && !pr) {
          throw err
        }
        return value()
      },
    },
  })
  if (dynamic) {
    createComputed(() => load(false))
  } else {
    load(false)
  }
  return [read, {
    refetch: load,
    mutate: setValue,
  }]
}
function untrack(fn) {
  if (Listener === null) {
    return fn()
  }
  const listener = Listener
  Listener = null
  try {
    return fn()
  } finally {
    Listener = listener
  }
}
function on(deps, fn, options) {
  const isArray = Array.isArray(deps)
  let prevInput
  let defer = options && options.defer
  return (prevValue) => {
    let input
    if (isArray) {
      input = Array(deps.length)
      for (let i = 0; i < deps.length; i++) {
        input[i] = deps[i]()
      }
    } else {
      input = deps()
    }
    if (defer) {
      defer = false
      return void 0
    }
    const result = untrack(() => fn(input, prevInput, prevValue))
    prevInput = input
    return result
  }
}
function onCleanup(fn) {
  if (Owner === null);
  else if (Owner.cleanups === null) {
    Owner.cleanups = [fn]
  } else {
    Owner.cleanups.push(fn)
  }
  return fn
}
function getOwner() {
  return Owner
}
function startTransition(fn) {
  if (Transition && Transition.running) {
    fn()
    return Transition.done
  }
  const l = Listener
  const o = Owner
  return Promise.resolve().then(() => {
    Listener = l
    Owner = o
    let t
    if (Scheduler || SuspenseContext) {
      t = Transition || (Transition = {
        sources: /* @__PURE__ */ new Set(),
        effects: [],
        promises: /* @__PURE__ */ new Set(),
        disposed: /* @__PURE__ */ new Set(),
        queue: /* @__PURE__ */ new Set(),
        running: true,
      })
      t.done || (t.done = new Promise((res) => t.resolve = res))
      t.running = true
    }
    runUpdates(fn, false)
    Listener = Owner = null
    return t ? t.done : void 0
  })
}
function createContext(defaultValue, options) {
  const id = Symbol('context')
  return {
    id,
    Provider: createProvider(id),
    defaultValue,
  }
}
function useContext(context) {
  return Owner && Owner.context && Owner.context[context.id] !== void 0
    ? Owner.context[context.id]
    : context.defaultValue
}
function children(fn) {
  const children2 = createMemo(fn)
  const memo = createMemo(() => resolveChildren(children2()))
  memo.toArray = () => {
    const c = memo()
    return Array.isArray(c) ? c : c != null ? [c] : []
  }
  return memo
}
var SuspenseContext
function readSignal() {
  const runningTransition = Transition && Transition.running
  if (this.sources && (runningTransition ? this.tState : this.state)) {
    if ((runningTransition ? this.tState : this.state) === STALE) {
      updateComputation(this)
    } else {
      const updates = Updates
      Updates = null
      runUpdates(() => lookUpstream(this), false)
      Updates = updates
    }
  }
  if (Listener) {
    const sSlot = this.observers ? this.observers.length : 0
    if (!Listener.sources) {
      Listener.sources = [this]
      Listener.sourceSlots = [sSlot]
    } else {
      Listener.sources.push(this)
      Listener.sourceSlots.push(sSlot)
    }
    if (!this.observers) {
      this.observers = [Listener]
      this.observerSlots = [Listener.sources.length - 1]
    } else {
      this.observers.push(Listener)
      this.observerSlots.push(Listener.sources.length - 1)
    }
  }
  if (runningTransition && Transition.sources.has(this)) {
    return this.tValue
  }
  return this.value
}
function writeSignal(node, value, isComp) {
  let current = Transition && Transition.running && Transition.sources.has(node)
    ? node.tValue
    : node.value
  if (!node.comparator || !node.comparator(current, value)) {
    if (Transition) {
      const TransitionRunning = Transition.running
      if (TransitionRunning || !isComp && Transition.sources.has(node)) {
        Transition.sources.add(node)
        node.tValue = value
      }
      if (!TransitionRunning) {
        node.value = value
      }
    } else {
      node.value = value
    }
    if (node.observers && node.observers.length) {
      runUpdates(() => {
        for (let i = 0; i < node.observers.length; i += 1) {
          const o = node.observers[i]
          const TransitionRunning = Transition && Transition.running
          if (TransitionRunning && Transition.disposed.has(o)) {
            continue
          }
          if (TransitionRunning ? !o.tState : !o.state) {
            if (o.pure) {
              Updates.push(o)
            } else {
              Effects.push(o)
            }
            if (o.observers) {
              markDownstream(o)
            }
          }
          if (!TransitionRunning) {
            o.state = STALE
          } else {
            o.tState = STALE
          }
        }
        if (Updates.length > 1e6) {
          Updates = []
          if (false);
          throw new Error()
        }
      }, false)
    }
  }
  return value
}
function updateComputation(node) {
  if (!node.fn) {
    return
  }
  cleanNode(node)
  const owner = Owner, listener = Listener, time = ExecCount
  Listener = Owner = node
  runComputation(
    node,
    Transition && Transition.running && Transition.sources.has(node)
      ? node.tValue
      : node.value,
    time,
  )
  if (Transition && !Transition.running && Transition.sources.has(node)) {
    queueMicrotask(() => {
      runUpdates(() => {
        Transition && (Transition.running = true)
        Listener = Owner = node
        runComputation(node, node.tValue, time)
        Listener = Owner = null
      }, false)
    })
  }
  Listener = listener
  Owner = owner
}
function runComputation(node, value, time) {
  let nextValue
  try {
    nextValue = node.fn(value)
  } catch (err) {
    if (node.pure) {
      if (Transition && Transition.running) {
        node.tState = STALE
        node.tOwned && node.tOwned.forEach(cleanNode)
        node.tOwned = void 0
      } else {
        node.state = STALE
        node.owned && node.owned.forEach(cleanNode)
        node.owned = null
      }
    }
    node.updatedAt = time + 1
    return handleError(err)
  }
  if (!node.updatedAt || node.updatedAt <= time) {
    if (node.updatedAt != null && 'observers' in node) {
      writeSignal(node, nextValue, true)
    } else if (Transition && Transition.running && node.pure) {
      Transition.sources.add(node)
      node.tValue = nextValue
    } else {
      node.value = nextValue
    }
    node.updatedAt = time
  }
}
function createComputation(fn, init, pure, state = STALE, options) {
  const c = {
    fn,
    state,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: init,
    owner: Owner,
    context: Owner ? Owner.context : null,
    pure,
  }
  if (Transition && Transition.running) {
    c.state = 0
    c.tState = state
  }
  if (Owner === null);
  else if (Owner !== UNOWNED) {
    if (Transition && Transition.running && Owner.pure) {
      if (!Owner.tOwned) {
        Owner.tOwned = [c]
      } else {
        Owner.tOwned.push(c)
      }
    } else {
      if (!Owner.owned) {
        Owner.owned = [c]
      } else {
        Owner.owned.push(c)
      }
    }
  }
  if (ExternalSourceFactory) {
    const [track, trigger] = createSignal(void 0, {
      equals: false,
    })
    const ordinary = ExternalSourceFactory(c.fn, trigger)
    onCleanup(() => ordinary.dispose())
    const triggerInTransition = () =>
      startTransition(trigger).then(() => inTransition.dispose())
    const inTransition = ExternalSourceFactory(c.fn, triggerInTransition)
    c.fn = (x) => {
      track()
      return Transition && Transition.running
        ? inTransition.track(x)
        : ordinary.track(x)
    }
  }
  return c
}
function runTop(node) {
  const runningTransition = Transition && Transition.running
  if ((runningTransition ? node.tState : node.state) === 0) {
    return
  }
  if ((runningTransition ? node.tState : node.state) === PENDING) {
    return lookUpstream(node)
  }
  if (node.suspense && untrack(node.suspense.inFallback)) {
    return node.suspense.effects.push(node)
  }
  const ancestors = [node]
  while (
    (node = node.owner) && (!node.updatedAt || node.updatedAt < ExecCount)
  ) {
    if (runningTransition && Transition.disposed.has(node)) {
      return
    }
    if (runningTransition ? node.tState : node.state) {
      ancestors.push(node)
    }
  }
  for (let i = ancestors.length - 1; i >= 0; i--) {
    node = ancestors[i]
    if (runningTransition) {
      let top = node, prev = ancestors[i + 1]
      while ((top = top.owner) && top !== prev) {
        if (Transition.disposed.has(top)) {
          return
        }
      }
    }
    if ((runningTransition ? node.tState : node.state) === STALE) {
      updateComputation(node)
    } else if ((runningTransition ? node.tState : node.state) === PENDING) {
      const updates = Updates
      Updates = null
      runUpdates(() => lookUpstream(node, ancestors[0]), false)
      Updates = updates
    }
  }
}
function runUpdates(fn, init) {
  if (Updates) {
    return fn()
  }
  let wait = false
  if (!init) {
    Updates = []
  }
  if (Effects) {
    wait = true
  } else {
    Effects = []
  }
  ExecCount++
  try {
    const res = fn()
    completeUpdates(wait)
    return res
  } catch (err) {
    if (!wait) {
      Effects = null
    }
    Updates = null
    handleError(err)
  }
}
function completeUpdates(wait) {
  if (Updates) {
    if (Scheduler && Transition && Transition.running) {
      scheduleQueue(Updates)
    } else {
      runQueue(Updates)
    }
    Updates = null
  }
  if (wait) {
    return
  }
  let res
  if (Transition) {
    if (!Transition.promises.size && !Transition.queue.size) {
      const sources = Transition.sources
      const disposed = Transition.disposed
      Effects.push.apply(Effects, Transition.effects)
      res = Transition.resolve
      for (const e2 of Effects) {
        'tState' in e2 && (e2.state = e2.tState)
        delete e2.tState
      }
      Transition = null
      runUpdates(() => {
        for (const d of disposed) {
          cleanNode(d)
        }
        for (const v of sources) {
          v.value = v.tValue
          if (v.owned) {
            for (let i = 0, len = v.owned.length; i < len; i++) {
              cleanNode(v.owned[i])
            }
          }
          if (v.tOwned) {
            v.owned = v.tOwned
          }
          delete v.tValue
          delete v.tOwned
          v.tState = 0
        }
        setTransPending(false)
      }, false)
    } else if (Transition.running) {
      Transition.running = false
      Transition.effects.push.apply(Transition.effects, Effects)
      Effects = null
      setTransPending(true)
      return
    }
  }
  const e = Effects
  Effects = null
  if (e.length) {
    runUpdates(() => runEffects(e), false)
  }
  if (res) {
    res()
  }
}
function runQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    runTop(queue[i])
  }
}
function scheduleQueue(queue) {
  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    const tasks = Transition.queue
    if (!tasks.has(item)) {
      tasks.add(item)
      Scheduler(() => {
        tasks.delete(item)
        runUpdates(() => {
          Transition.running = true
          runTop(item)
        }, false)
        Transition && (Transition.running = false)
      })
    }
  }
}
function runUserEffects(queue) {
  let i, userLength = 0
  for (i = 0; i < queue.length; i++) {
    const e = queue[i]
    if (!e.user) {
      runTop(e)
    } else {
      queue[userLength++] = e
    }
  }
  if (sharedConfig.context) {
    if (sharedConfig.count) {
      sharedConfig.effects || (sharedConfig.effects = [])
      sharedConfig.effects.push(...queue.slice(0, userLength))
      return
    } else if (sharedConfig.effects) {
      queue = [...sharedConfig.effects, ...queue]
      userLength += sharedConfig.effects.length
      delete sharedConfig.effects
    }
    setHydrateContext()
  }
  for (i = 0; i < userLength; i++) {
    runTop(queue[i])
  }
}
function lookUpstream(node, ignore) {
  const runningTransition = Transition && Transition.running
  if (runningTransition) {
    node.tState = 0
  } else {
    node.state = 0
  }
  for (let i = 0; i < node.sources.length; i += 1) {
    const source = node.sources[i]
    if (source.sources) {
      const state = runningTransition ? source.tState : source.state
      if (state === STALE) {
        if (
          source !== ignore &&
          (!source.updatedAt || source.updatedAt < ExecCount)
        ) {
          runTop(source)
        }
      } else if (state === PENDING) {
        lookUpstream(source, ignore)
      }
    }
  }
}
function markDownstream(node) {
  const runningTransition = Transition && Transition.running
  for (let i = 0; i < node.observers.length; i += 1) {
    const o = node.observers[i]
    if (runningTransition ? !o.tState : !o.state) {
      if (runningTransition) {
        o.tState = PENDING
      } else {
        o.state = PENDING
      }
      if (o.pure) {
        Updates.push(o)
      } else {
        Effects.push(o)
      }
      o.observers && markDownstream(o)
    }
  }
}
function cleanNode(node) {
  let i
  if (node.sources) {
    while (node.sources.length) {
      const source = node.sources.pop(),
        index = node.sourceSlots.pop(),
        obs = source.observers
      if (obs && obs.length) {
        const n = obs.pop(), s = source.observerSlots.pop()
        if (index < obs.length) {
          n.sourceSlots[s] = index
          obs[index] = n
          source.observerSlots[index] = s
        }
      }
    }
  }
  if (Transition && Transition.running && node.pure) {
    if (node.tOwned) {
      for (i = node.tOwned.length - 1; i >= 0; i--) {
        cleanNode(node.tOwned[i])
      }
      delete node.tOwned
    }
    reset(node, true)
  } else if (node.owned) {
    for (i = node.owned.length - 1; i >= 0; i--) {
      cleanNode(node.owned[i])
    }
    node.owned = null
  }
  if (node.cleanups) {
    for (i = node.cleanups.length - 1; i >= 0; i--) {
      node.cleanups[i]()
    }
    node.cleanups = null
  }
  if (Transition && Transition.running) {
    node.tState = 0
  } else {
    node.state = 0
  }
}
function reset(node, top) {
  if (!top) {
    node.tState = 0
    Transition.disposed.add(node)
  }
  if (node.owned) {
    for (let i = 0; i < node.owned.length; i++) {
      reset(node.owned[i])
    }
  }
}
function castError(err) {
  if (err instanceof Error) {
    return err
  }
  return new Error(typeof err === 'string' ? err : 'Unknown error', {
    cause: err,
  })
}
function runErrors(err, fns, owner) {
  try {
    for (const f of fns) {
      f(err)
    }
  } catch (e) {
    handleError(e, owner && owner.owner || null)
  }
}
function handleError(err, owner = Owner) {
  const fns = ERROR && owner && owner.context && owner.context[ERROR]
  const error = castError(err)
  if (!fns) {
    throw error
  }
  if (Effects) {
    Effects.push({
      fn() {
        runErrors(error, fns, owner)
      },
      state: STALE,
    })
  } else {
    runErrors(error, fns, owner)
  }
}
function resolveChildren(children2) {
  if (typeof children2 === 'function' && !children2.length) {
    return resolveChildren(children2())
  }
  if (Array.isArray(children2)) {
    const results = []
    for (let i = 0; i < children2.length; i++) {
      const result = resolveChildren(children2[i])
      Array.isArray(result)
        ? results.push.apply(results, result)
        : results.push(result)
    }
    return results
  }
  return children2
}
function createProvider(id, options) {
  return function provider(props) {
    let res
    createRenderEffect(() =>
      res = untrack(() => {
        Owner.context = {
          ...Owner.context,
          [id]: props.value,
        }
        return children(() => props.children)
      }), void 0)
    return res
  }
}
var FALLBACK = Symbol('fallback')
var hydrationEnabled = false
function createComponent(Comp, props) {
  if (hydrationEnabled) {
    if (sharedConfig.context) {
      const c = sharedConfig.context
      setHydrateContext(nextHydrateContext())
      const r = untrack(() => Comp(props || {}))
      setHydrateContext(c)
      return r
    }
  }
  return untrack(() => Comp(props || {}))
}
var SuspenseListContext = createContext()

// node_modules/.deno/solid-js@1.7.11/node_modules/solid-js/web/dist/web.js
var booleans = [
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'disabled',
  'formnovalidate',
  'hidden',
  'indeterminate',
  'ismap',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'seamless',
  'selected',
]
var Properties = /* @__PURE__ */ new Set([
  'className',
  'value',
  'readOnly',
  'formNoValidate',
  'isMap',
  'noModule',
  'playsInline',
  ...booleans,
])
function reconcileArrays(parentNode, a, b) {
  let bLength = b.length,
    aEnd = a.length,
    bEnd = bLength,
    aStart = 0,
    bStart = 0,
    after = a[aEnd - 1].nextSibling,
    map = null
  while (aStart < aEnd || bStart < bEnd) {
    if (a[aStart] === b[bStart]) {
      aStart++
      bStart++
      continue
    }
    while (a[aEnd - 1] === b[bEnd - 1]) {
      aEnd--
      bEnd--
    }
    if (aEnd === aStart) {
      const node = bEnd < bLength
        ? bStart ? b[bStart - 1].nextSibling : b[bEnd - bStart]
        : after
      while (bStart < bEnd) {
        parentNode.insertBefore(b[bStart++], node)
      }
    } else if (bEnd === bStart) {
      while (aStart < aEnd) {
        if (!map || !map.has(a[aStart])) {
          a[aStart].remove()
        }
        aStart++
      }
    } else if (a[aStart] === b[bEnd - 1] && b[bStart] === a[aEnd - 1]) {
      const node = a[--aEnd].nextSibling
      parentNode.insertBefore(b[bStart++], a[aStart++].nextSibling)
      parentNode.insertBefore(b[--bEnd], node)
      a[aEnd] = b[bEnd]
    } else {
      if (!map) {
        map = /* @__PURE__ */ new Map()
        let i = bStart
        while (i < bEnd) {
          map.set(b[i], i++)
        }
      }
      const index = map.get(a[aStart])
      if (index != null) {
        if (bStart < index && index < bEnd) {
          let i = aStart, sequence = 1, t
          while (++i < aEnd && i < bEnd) {
            if ((t = map.get(a[i])) == null || t !== index + sequence) {
              break
            }
            sequence++
          }
          if (sequence > index - bStart) {
            const node = a[aStart]
            while (bStart < index) {
              parentNode.insertBefore(b[bStart++], node)
            }
          } else {
            parentNode.replaceChild(b[bStart++], a[aStart++])
          }
        } else {
          aStart++
        }
      } else {
        a[aStart++].remove()
      }
    }
  }
}
var $$EVENTS = '_$DX_DELEGATE'
function render(code, element, init, options = {}) {
  let disposer
  createRoot((dispose) => {
    disposer = dispose
    element === document
      ? code()
      : insert(element, code(), element.firstChild ? null : void 0, init)
  }, options.owner)
  return () => {
    disposer()
    element.textContent = ''
  }
}
function template(html, isCE, isSVG) {
  let node
  const create = () => {
    const t = document.createElement('template')
    t.innerHTML = html
    return isSVG ? t.content.firstChild.firstChild : t.content.firstChild
  }
  const fn = isCE
    ? () => untrack(() => document.importNode(node || (node = create()), true))
    : () => (node || (node = create())).cloneNode(true)
  fn.cloneNode = fn
  return fn
}
function delegateEvents(eventNames, document2 = window.document) {
  const e = document2[$$EVENTS] ||
    (document2[$$EVENTS] = /* @__PURE__ */ new Set())
  for (let i = 0, l = eventNames.length; i < l; i++) {
    const name = eventNames[i]
    if (!e.has(name)) {
      e.add(name)
      document2.addEventListener(name, eventHandler)
    }
  }
}
function setAttribute(node, name, value) {
  if (value == null) {
    node.removeAttribute(name)
  } else {
    node.setAttribute(name, value)
  }
}
function style(node, value, prev) {
  if (!value) {
    return prev ? setAttribute(node, 'style') : value
  }
  const nodeStyle = node.style
  if (typeof value === 'string') {
    return nodeStyle.cssText = value
  }
  typeof prev === 'string' && (nodeStyle.cssText = prev = void 0)
  prev || (prev = {})
  value || (value = {})
  let v, s
  for (s in prev) {
    value[s] == null && nodeStyle.removeProperty(s)
    delete prev[s]
  }
  for (s in value) {
    v = value[s]
    if (v !== prev[s]) {
      nodeStyle.setProperty(s, v)
      prev[s] = v
    }
  }
  return prev
}
function insert(parent, accessor, marker, initial) {
  if (marker !== void 0 && !initial) {
    initial = []
  }
  if (typeof accessor !== 'function') {
    return insertExpression(parent, accessor, initial, marker)
  }
  createRenderEffect(
    (current) => insertExpression(parent, accessor(), current, marker),
    initial,
  )
}
function eventHandler(e) {
  const key = `$$${e.type}`
  let node = e.composedPath && e.composedPath()[0] || e.target
  if (e.target !== node) {
    Object.defineProperty(e, 'target', {
      configurable: true,
      value: node,
    })
  }
  Object.defineProperty(e, 'currentTarget', {
    configurable: true,
    get() {
      return node || document
    },
  })
  if (sharedConfig.registry && !sharedConfig.done) {
    sharedConfig.done = _$HY.done = true
  }
  while (node) {
    const handler = node[key]
    if (handler && !node.disabled) {
      const data2 = node[`${key}Data`]
      data2 !== void 0 ? handler.call(node, data2, e) : handler.call(node, e)
      if (e.cancelBubble) {
        return
      }
    }
    node = node._$host || node.parentNode || node.host
  }
}
function insertExpression(parent, value, current, marker, unwrapArray) {
  if (sharedConfig.context) {
    !current && (current = [...parent.childNodes])
    let cleaned = []
    for (let i = 0; i < current.length; i++) {
      const node = current[i]
      if (node.nodeType === 8 && node.data.slice(0, 2) === '!$') {
        node.remove()
      } else {
        cleaned.push(node)
      }
    }
    current = cleaned
  }
  while (typeof current === 'function') {
    current = current()
  }
  if (value === current) {
    return current
  }
  const t = typeof value, multi = marker !== void 0
  parent = multi && current[0] && current[0].parentNode || parent
  if (t === 'string' || t === 'number') {
    if (sharedConfig.context) {
      return current
    }
    if (t === 'number') {
      value = value.toString()
    }
    if (multi) {
      let node = current[0]
      if (node && node.nodeType === 3) {
        node.data = value
      } else {
        node = document.createTextNode(value)
      }
      current = cleanChildren(parent, current, marker, node)
    } else {
      if (current !== '' && typeof current === 'string') {
        current = parent.firstChild.data = value
      } else {
        current = parent.textContent = value
      }
    }
  } else if (value == null || t === 'boolean') {
    if (sharedConfig.context) {
      return current
    }
    current = cleanChildren(parent, current, marker)
  } else if (t === 'function') {
    createRenderEffect(() => {
      let v = value()
      while (typeof v === 'function') {
        v = v()
      }
      current = insertExpression(parent, v, current, marker)
    })
    return () => current
  } else if (Array.isArray(value)) {
    const array = []
    const currentArray = current && Array.isArray(current)
    if (normalizeIncomingArray(array, value, current, unwrapArray)) {
      createRenderEffect(() =>
        current = insertExpression(parent, array, current, marker, true)
      )
      return () => current
    }
    if (sharedConfig.context) {
      if (!array.length) {
        return current
      }
      for (let i = 0; i < array.length; i++) {
        if (array[i].parentNode) {
          return current = array
        }
      }
    }
    if (array.length === 0) {
      current = cleanChildren(parent, current, marker)
      if (multi) {
        return current
      }
    } else if (currentArray) {
      if (current.length === 0) {
        appendNodes(parent, array, marker)
      } else {
        reconcileArrays(parent, current, array)
      }
    } else {
      current && cleanChildren(parent)
      appendNodes(parent, array)
    }
    current = array
  } else if (value.nodeType) {
    if (sharedConfig.context && value.parentNode) {
      return current = multi ? [value] : value
    }
    if (Array.isArray(current)) {
      if (multi) {
        return current = cleanChildren(parent, current, marker, value)
      }
      cleanChildren(parent, current, null, value)
    } else if (current == null || current === '' || !parent.firstChild) {
      parent.appendChild(value)
    } else {
      parent.replaceChild(value, parent.firstChild)
    }
    current = value
  } else {
    console.warn(`Unrecognized value. Skipped inserting`, value)
  }
  return current
}
function normalizeIncomingArray(normalized, array, current, unwrap) {
  let dynamic = false
  for (let i = 0, len = array.length; i < len; i++) {
    let item = array[i], prev = current && current[i], t
    if (item == null || item === true || item === false);
    else if ((t = typeof item) === 'object' && item.nodeType) {
      normalized.push(item)
    } else if (Array.isArray(item)) {
      dynamic = normalizeIncomingArray(normalized, item, prev) || dynamic
    } else if (t === 'function') {
      if (unwrap) {
        while (typeof item === 'function') {
          item = item()
        }
        dynamic = normalizeIncomingArray(
          normalized,
          Array.isArray(item) ? item : [item],
          Array.isArray(prev) ? prev : [prev],
        ) || dynamic
      } else {
        normalized.push(item)
        dynamic = true
      }
    } else {
      const value = String(item)
      if (prev && prev.nodeType === 3 && prev.data === value) {
        normalized.push(prev)
      } else {
        normalized.push(document.createTextNode(value))
      }
    }
  }
  return dynamic
}
function appendNodes(parent, array, marker = null) {
  for (let i = 0, len = array.length; i < len; i++) {
    parent.insertBefore(array[i], marker)
  }
}
function cleanChildren(parent, current, marker, replacement) {
  if (marker === void 0) {
    return parent.textContent = ''
  }
  const node = replacement || document.createTextNode('')
  if (current.length) {
    let inserted = false
    for (let i = current.length - 1; i >= 0; i--) {
      const el = current[i]
      if (node !== el) {
        const isParent = el.parentNode === parent
        if (!inserted && !i) {
          isParent
            ? parent.replaceChild(node, el)
            : parent.insertBefore(node, marker)
        } else {
          isParent && el.remove()
        }
      } else {
        inserted = true
      }
    }
  } else {
    parent.insertBefore(node, marker)
  }
  return [node]
}

// node_modules/.deno/@solidjs-use+solid-to-vue@2.3.0/node_modules/@solidjs-use/solid-to-vue/dist/index.mjs
var resolvedPromise = Promise.resolve()
function isAccessor(val) {
  return typeof val === 'function'
}

// node_modules/.deno/@solidjs-use+shared@2.3.0/node_modules/@solidjs-use/shared/dist/index.mjs
function toValue(r) {
  return typeof r === 'function' ? r() : r
}
var isClient = typeof window !== 'undefined'
var toString = Object.prototype.toString
var isObject = (val) => toString.call(val) === '[object Object]'
var noop = () => {
}
function cacheStringFunction(fn) {
  const cache = /* @__PURE__ */ Object.create(null)
  return (str) => {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}
var hyphenateRE = /\B([A-Z])/g
var hyphenate = cacheStringFunction(
  (str) => str.replace(hyphenateRE, '-$1').toLowerCase(),
)
var camelizeRE = /-(\w)/g
var camelize = cacheStringFunction((str) => {
  return str.replace(camelizeRE, (_, c) => c ? c.toUpperCase() : '')
})
function tryOnCleanup(fn) {
  if (getOwner()) {
    onCleanup(fn)
    return true
  }
  return false
}
function toAccessors(props, defaultProps) {
  const obj = {}
  Object.keys(props).forEach((key) => {
    obj[key] = createMemo(() =>
      props[key] ?? (defaultProps == null ? void 0 : defaultProps[key])
    )
  })
  return obj
}
function watch(deps, fn, options) {
  const [isWatch, setIsWatch] = createSignal(true)
  createEffect(
    on(
      getAccessors(deps),
      (input, prevInput, prev) => {
        if (isWatch()) {
          fn(input, prevInput, prev)
        }
      },
      options,
    ),
  )
  const stop = () => {
    setIsWatch(false)
  }
  return stop
}
function getAccessors(deps) {
  if (Array.isArray(deps)) {
    return deps
  }
  if (isObject(deps)) {
    return Object.values(toAccessors(deps))
  }
  if (isAccessor(deps)) {
    return deps
  }
  return () => deps
}
function toAccessor(r) {
  return isAccessor(r) ? r : () => r
}

// node_modules/.deno/solidjs-use@2.3.0/node_modules/solidjs-use/dist/index.mjs
var defaultWindow = isClient ? window : void 0
var defaultDocument = isClient ? window.document : void 0
var defaultNavigator = isClient ? window.navigator : void 0
var defaultLocation = isClient ? window.location : void 0
function useEventListener(...args) {
  let target
  let events2
  let listeners
  let options
  if (typeof args[0] === 'string' || Array.isArray(args[0])) {
    ;[events2, listeners, options] = args
    target = defaultWindow
  } else {
    ;[target, events2, listeners, options] = args
  }
  if (!target) {
    return noop
  }
  if (!Array.isArray(events2)) {
    events2 = [events2]
  }
  if (!Array.isArray(listeners)) {
    listeners = [listeners]
  }
  const cleanups = []
  const cleanup = () => {
    cleanups.forEach((fn) => fn())
    cleanups.length = 0
  }
  const register = (el, event, listener, options2) => {
    el.addEventListener(event, listener, options2)
    return () => el.removeEventListener(event, listener, options2)
  }
  const stopWatch = watch(
    [toAccessor(target), toAccessor(options)],
    ([el, options2]) => {
      cleanup()
      if (!el) {
        return
      }
      cleanups.push(
        ...events2.flatMap((event) => {
          return listeners.map((listener) =>
            register(el, event, listener, options2)
          )
        }),
      )
    },
  )
  const stop = () => {
    stopWatch()
    cleanup()
  }
  tryOnCleanup(stop)
  return stop
}
function createKeyPredicate(keyFilter) {
  if (typeof keyFilter === 'function') {
    return keyFilter
  } else if (typeof keyFilter === 'string') {
    return (event) => event.key === keyFilter
  } else if (Array.isArray(keyFilter)) {
    return (event) => keyFilter.includes(event.key)
  }
  return () => true
}
function onKeyStroke(...args) {
  let key
  let handler
  let options = {}
  if (args.length === 3) {
    key = args[0]
    handler = args[1]
    options = args[2]
  } else if (args.length === 2) {
    if (typeof args[1] === 'object') {
      key = true
      handler = args[0]
      options = args[1]
    } else {
      key = args[0]
      handler = args[1]
    }
  } else {
    key = true
    handler = args[0]
  }
  const {
    target = defaultWindow,
    eventName = 'keydown',
    passive = false,
    dedupe = false,
  } = options
  const predicate = createKeyPredicate(key)
  const listener = (e) => {
    if (e.repeat && toValue(dedupe)) {
      return
    }
    if (predicate(e)) {
      handler(e)
    }
  }
  return useEventListener(target, eventName, listener, passive)
}
var DEFAULT_UNITS = [
  { max: 6e4, value: 1e3, name: 'second' },
  { max: 276e4, value: 6e4, name: 'minute' },
  { max: 72e6, value: 36e5, name: 'hour' },
  { max: 5184e5, value: 864e5, name: 'day' },
  { max: 24192e5, value: 6048e5, name: 'week' },
  { max: 28512e6, value: 2592e6, name: 'month' },
  { max: Number.POSITIVE_INFINITY, value: 31536e6, name: 'year' },
]

// public/index.tsx
var _tmpl$ = /* @__PURE__ */ template(
  `<div><div class="card-wrapper"><div class="card"><h1></h1><div><h1></h1></div></div><button>`,
)
var _tmpl$2 = /* @__PURE__ */ template(`<h2>`)
var langMap = {
  'ja': 'ja-JP',
  'en': 'en-US',
  'es': 'es-ES',
  'zh': 'zh-CN',
}
var selectUserLanguage = document.getElementById('switch-user-language')
var selectCardLanguage = document.getElementById('switch-card-language')
var downloadButton = document.getElementById('download')
var cardLang = new URL(document.location).searchParams.get('card')
var [cardLangCode, setCardLangCode] = createSignal(
  langMap[cardLang] || cardLang || 'en-US',
)
var [lang, {
  refetch,
}] = createResource(cardLangCode, async (code) => await fetchLanguage(code))
var data = () => (lang() || {}).data
var columns = () => (lang() || {})?.columns || []
var emojis = () => {
  if (!data()) {
    return []
  }
  let categories = Object.keys(data()).sort()
  return categories.map((category) => {
    return Object.keys(data()[category]).map((
      emoji,
    ) => [emoji, category, ...data()[category][emoji]])
  }).flat(1)
}
selectUserLanguage.onchange = function () {
  const lang2 = this.value
  const goto = new URL(document.location)
  goto.searchParams.set('lang', lang2.split('-')[0])
  window.location = goto
}
selectCardLanguage.onchange = function () {
  const lang2 = this.value
  const goto = new URL(document.location)
  goto.searchParams.set('card', lang2.split('-')[0])
  window.location = goto
}
downloadButton.onclick = function () {
  download(`${cardLangCode()}.tsv`, langToTSV())
}
function download(filename, text) {
  var element = document.createElement('a')
  element.setAttribute(
    'href',
    'data:text/plain;charset=utf-8,' + encodeURIComponent(text),
  )
  element.setAttribute('download', filename)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.click()
  document.body.removeChild(element)
}
function langToTSV() {
  let str = ['emoji', 'category', ...columns()].join('	') + '\n'
  emojis().forEach((card) => {
    const [emoji, category, ...other] = card
    const sub = [emoji, category, ...other].join('	')
    str += `${sub}
`
  })
  return str
}
async function fetchLanguage(langCode = 'en-US') {
  return await (await fetch(`/data/languages/${langCode}.json`)).json()
}
function App() {
  const [currIndex, setCurrIndex] = createSignal(0)
  const currEmoji = () => emojis()[currIndex()]?.[0]
  const currAnswer = () => emojis()[currIndex()]?.[2]
  const currOther = () => (emojis()[currIndex()] || []).slice(3)
  const [isFlipped, setFlipped] = createSignal(true)
  const [showCards, setShowCards] = createSignal(false)
  createEffect(() => {
    data()
    setCurrIndex(0)
    setFlipped(true)
  })
  onKeyStroke(['ArrowLeft'], (e) => {
    e.preventDefault()
    setCurrIndex(Math.max(0, currIndex() - 1))
  })
  onKeyStroke(['ArrowRight', ' '], (e) => {
    e.preventDefault()
    if (isFlipped()) {
      setCurrIndex(Math.min(emojis().length, currIndex() + 1))
      setFlipped(false)
    } else {
      setFlipped(true)
    }
  })
  return (() => {
    const _el$ = _tmpl$(),
      _el$2 = _el$.firstChild,
      _el$3 = _el$2.firstChild,
      _el$4 = _el$3.firstChild,
      _el$5 = _el$4.nextSibling,
      _el$6 = _el$5.firstChild,
      _el$7 = _el$3.nextSibling
    insert(_el$4, currEmoji)
    insert(_el$6, currAnswer)
    insert(_el$5, () =>
      currOther().map((item) =>
        (() => {
          const _el$8 = _tmpl$2()
          insert(_el$8, item)
          return _el$8
        })()
      ), null)
    _el$7.$$click = () => {
      if (isFlipped()) {
        setCurrIndex(Math.min(emojis().length, currIndex() + 1))
        setFlipped(false)
      } else {
        setFlipped(true)
      }
    }
    insert(_el$7, () => isFlipped() ? 'next card' : 'show answer')
    createRenderEffect((_p$) => {
      const _v$ = `visibility: ${isFlipped() ? 'visible' : 'hidden'}`,
        _v$2 = currIndex() === emojis().length
      _p$._v$ = style(_el$5, _v$, _p$._v$)
      _v$2 !== _p$._v$2 && (_el$7.disabled = _p$._v$2 = _v$2)
      return _p$
    }, {
      _v$: void 0,
      _v$2: void 0,
    })
    return _el$
  })()
}
render(() => createComponent(App, {}), document.getElementById('app'))
delegateEvents(['click'])
