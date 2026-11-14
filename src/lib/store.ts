import { useSyncExternalStore } from 'react'
import type { Session, Settings, Store, SyncStatus } from './types'
import {
  fetchRemote,
  isSyncConfigured,
  mergeRemote,
  pushSessions,
  pushSettings,
  type SyncState,
} from './sync'

const STORAGE_KEY = 'hours-outside/v1'
const EPOCH = '1970-01-01T00:00:00.000Z'

const DEFAULT_SETTINGS: Settings = { daycareMinutes: 60, goalHours: 1000, updatedAt: EPOCH }

// ---- module-level state ----------------------------------------------------

let sessions: Session[] = []
let settings: Settings = { ...DEFAULT_SETTINGS }
let dirtySessionIds = new Set<string>()
let settingsDirty = false
let syncStatus: SyncStatus = isSyncConfigured() ? 'syncing' : 'local-only'

const listeners = new Set<() => void>()
let snapshot: Store

function isSession(x: unknown): x is Session {
  if (!x || typeof x !== 'object') return false
  const s = x as Record<string, unknown>
  return (
    typeof s.id === 'string' &&
    typeof s.start === 'string' &&
    (s.end === null || typeof s.end === 'string') &&
    (s.kind === 'timer' || s.kind === 'manual' || s.kind === 'daycare') &&
    typeof s.updatedAt === 'string'
  )
}

function load(): void {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    if (!raw) return
    const data = JSON.parse(raw) as Record<string, unknown>
    if (Array.isArray(data.sessions)) {
      sessions = data.sessions
        .filter(isSession)
        .map((s) => ({ ...s, note: typeof s.note === 'string' ? s.note : '', deleted: !!s.deleted }))
    }
    if (data.settings && typeof data.settings === 'object') {
      const st = data.settings as Partial<Settings>
      settings = {
        daycareMinutes: typeof st.daycareMinutes === 'number' ? st.daycareMinutes : DEFAULT_SETTINGS.daycareMinutes,
        goalHours: typeof st.goalHours === 'number' ? st.goalHours : DEFAULT_SETTINGS.goalHours,
        updatedAt: typeof st.updatedAt === 'string' ? st.updatedAt : EPOCH,
      }
    }
    const ids = new Set(sessions.map((s) => s.id))
    if (Array.isArray(data.dirtySessionIds)) {
      dirtySessionIds = new Set(data.dirtySessionIds.filter((i): i is string => typeof i === 'string' && ids.has(i)))
    }
    settingsDirty = data.settingsDirty === true
  } catch {
    // corrupt storage: start fresh
    sessions = []
    settings = { ...DEFAULT_SETTINGS }
    dirtySessionIds = new Set()
    settingsDirty = false
  }
}

function persist(): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ sessions, settings, dirtySessionIds: [...dirtySessionIds], settingsDirty }),
    )
  } catch {
    // storage unavailable or full: keep working in memory
  }
}

function findActive(list: Session[]): Session | null {
  let best: Session | null = null
  for (const s of list) {
    if (s.deleted || s.end !== null) continue
    if (best === null || new Date(s.start).getTime() < new Date(best.start).getTime()) best = s
  }
  return best
}

function rebuildSnapshot(): void {
  const visible = sessions
    .filter((s) => !s.deleted)
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  snapshot = { ...actions, sessions: visible, activeTimer: findActive(sessions), settings, syncStatus }
}

function emit(): void {
  rebuildSnapshot()
  for (const l of listeners) l()
}

const nowIso = () => new Date().toISOString()

/** Apply a change to one session, mark dirty, persist, notify, schedule sync. */
function mutateSession(id: string, fn: (s: Session) => Session): void {
  const idx = sessions.findIndex((s) => s.id === id)
  if (idx < 0) return
  const next = [...sessions]
  next[idx] = { ...fn(sessions[idx]), updatedAt: nowIso() }
  sessions = next
  dirtySessionIds.add(id)
  persist()
  emit()
  scheduleSync()
}

// ---- actions ---------------------------------------------------------------

const actions = {
  startTimer(): void {
    if (findActive(sessions)) return
    const now = nowIso()
    const s: Session = { id: crypto.randomUUID(), start: now, end: null, kind: 'timer', note: '', updatedAt: now, deleted: false }
    sessions = [...sessions, s]
    dirtySessionIds.add(s.id)
    persist()
    emit()
    scheduleSync()
  },
  stopTimer(): void {
    const t = findActive(sessions)
    if (!t) return
    mutateSession(t.id, (s) => ({ ...s, end: nowIso() }))
  },
  addSession(input: { start: Date; minutes: number; kind: 'manual' | 'daycare'; note?: string }): string {
    const now = nowIso()
    const s: Session = {
      id: crypto.randomUUID(),
      start: input.start.toISOString(),
      end: new Date(input.start.getTime() + input.minutes * 60_000).toISOString(),
      kind: input.kind,
      note: input.note ?? '',
      updatedAt: now,
      deleted: false,
    }
    sessions = [...sessions, s]
    dirtySessionIds.add(s.id)
    persist()
    emit()
    scheduleSync()
    return s.id
  },
  updateSession(id: string, patch: Partial<Pick<Session, 'start' | 'end' | 'note'>>): void {
    mutateSession(id, (s) => ({ ...s, ...patch }))
  },
  deleteSession(id: string): void {
    mutateSession(id, (s) => ({ ...s, deleted: true }))
  },
  restoreSession(id: string): void {
    mutateSession(id, (s) => ({ ...s, deleted: false }))
  },
  updateSettings(patch: Partial<Pick<Settings, 'daycareMinutes' | 'goalHours'>>): void {
    settings = { ...settings, ...patch, updatedAt: nowIso() }
    settingsDirty = true
    persist()
    emit()
    scheduleSync()
  },
}

// ---- sync orchestration ----------------------------------------------------

let running = false
let again = false
let debounceTimer: ReturnType<typeof setTimeout> | undefined

function setStatus(s: SyncStatus): void {
  if (syncStatus === s) return
  syncStatus = s
  emit()
}

function currentSyncState(): SyncState {
  return { sessions, settings, dirtySessionIds: [...dirtySessionIds], settingsDirty }
}

async function syncOnce(): Promise<void> {
  // 1. fetch remote
  const remote = await fetchRemote()
  // 2. merge against the *current* local state (it may have changed while fetching)
  const merged = mergeRemote(currentSyncState(), remote.sessions, remote.settings)
  sessions = merged.sessions
  settings = merged.settings
  dirtySessionIds = new Set(merged.dirtySessionIds)
  settingsDirty = merged.settingsDirty
  persist()
  emit()
  // 3. push dirty rows; clear a flag only if the row was not edited again meanwhile
  const toPush = sessions.filter((s) => dirtySessionIds.has(s.id))
  const settingsToPush = settingsDirty ? settings : null
  if (toPush.length > 0) await pushSessions(toPush)
  if (settingsToPush) await pushSettings(settingsToPush)
  const current = new Map(sessions.map((s) => [s.id, s]))
  for (const p of toPush) {
    if (current.get(p.id)?.updatedAt === p.updatedAt) dirtySessionIds.delete(p.id)
  }
  if (settingsToPush && settings.updatedAt === settingsToPush.updatedAt) settingsDirty = false
  persist()
}

async function runSync(): Promise<void> {
  if (!isSyncConfigured()) return
  if (running) {
    again = true
    return
  }
  running = true
  try {
    do {
      again = false
      setStatus('syncing')
      try {
        await syncOnce()
        setStatus('synced')
      } catch {
        setStatus('offline')
        again = false // retry via the next trigger rather than hot-looping
      }
    } while (again)
  } finally {
    running = false
  }
}

function scheduleSync(delay = 500): void {
  if (!isSyncConfigured()) return
  if (debounceTimer !== undefined) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    debounceTimer = undefined
    void runSync()
  }, delay)
}

// ---- init ------------------------------------------------------------------

load()
rebuildSnapshot()

if (typeof window !== 'undefined' && typeof document !== 'undefined' && isSyncConfigured()) {
  scheduleSync(0)
  window.addEventListener('online', () => scheduleSync(0))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleSync(0)
  })
  setInterval(() => {
    if (document.visibilityState === 'visible') void runSync()
  }, 30_000)
}

// ---- hook ------------------------------------------------------------------

function subscribe(l: () => void): () => void {
  listeners.add(l)
  return () => {
    listeners.delete(l)
  }
}

export function useStore(): Store {
  return useSyncExternalStore(subscribe, () => snapshot, () => snapshot)
}
