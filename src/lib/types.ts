/** One stretch of time outside. An open timer is a session with end === null. */
export interface Session {
  id: string // uuid
  start: string // ISO timestamp
  end: string | null // ISO timestamp; null while the timer is running
  kind: 'timer' | 'manual' | 'daycare'
  note: string
  updatedAt: string // ISO timestamp, used for last-write-wins sync
  deleted: boolean // soft delete so deletions sync
}

export interface Settings {
  daycareMinutes: number // default 60
  goalHours: number // default 1000
  updatedAt: string
}

export type SyncStatus = 'local-only' | 'synced' | 'syncing' | 'offline'

/** What the UI gets from useStore(). */
export interface Store {
  /** Non-deleted sessions, newest start first. Includes the open timer if any. */
  sessions: Session[]
  /** The running timer (earliest open session), or null. */
  activeTimer: Session | null
  settings: Settings
  syncStatus: SyncStatus
  /** No-op if a timer is already running. */
  startTimer(): void
  stopTimer(): void
  /** Adds a finished session starting at `start` lasting `minutes`. Returns its id. */
  addSession(input: { start: Date; minutes: number; kind: 'manual' | 'daycare'; note?: string }): string
  updateSession(id: string, patch: Partial<Pick<Session, 'start' | 'end' | 'note'>>): void
  deleteSession(id: string): void
  /** Undo a delete. */
  restoreSession(id: string): void
  updateSettings(patch: Partial<Pick<Settings, 'daycareMinutes' | 'goalHours'>>): void
}
