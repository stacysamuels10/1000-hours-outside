import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config'
import type { Session, Settings } from './types'

/** The slice of store state that sync reads and merges. */
export interface SyncState {
  sessions: Session[]
  settings: Settings
  dirtySessionIds: string[]
  settingsDirty: boolean
}

export function isSyncConfigured(): boolean {
  return SUPABASE_URL.trim() !== '' && SUPABASE_ANON_KEY.trim() !== ''
}

function time(iso: string): number {
  return new Date(iso).getTime()
}

/**
 * Pure last-write-wins merge of remote rows into local state.
 * A remote row wins if there is no local row or remote.updatedAt > local.updatedAt
 * (compared as Dates); a winning remote row clears that id's dirty flag.
 * Ties keep the local row. Does not mutate its inputs.
 */
export function mergeRemote(
  local: SyncState,
  remoteSessions: Session[],
  remoteSettings: Settings | null,
): SyncState {
  const byId = new Map(local.sessions.map((s) => [s.id, s]))
  const dirty = new Set(local.dirtySessionIds)
  for (const r of remoteSessions) {
    const l = byId.get(r.id)
    if (!l || time(r.updatedAt) > time(l.updatedAt)) {
      byId.set(r.id, r)
      dirty.delete(r.id)
    }
  }
  let settings = local.settings
  let settingsDirty = local.settingsDirty
  if (remoteSettings && time(remoteSettings.updatedAt) > time(local.settings.updatedAt)) {
    settings = remoteSettings
    settingsDirty = false
  }
  return { sessions: [...byId.values()], settings, dirtySessionIds: [...dirty], settingsDirty }
}

// ---- row mapping -----------------------------------------------------------

interface SessionRow {
  id: string
  start: string
  end: string | null
  kind: Session['kind']
  note: string | null
  updated_at: string
  deleted: boolean | null
}

interface SettingsRow {
  id: number
  daycare_minutes: number
  goal_hours: number
  updated_at: string
}

const iso = (v: string) => new Date(v).toISOString()

export function sessionToRow(s: Session): SessionRow {
  return {
    id: s.id,
    start: s.start,
    end: s.end,
    kind: s.kind,
    note: s.note,
    updated_at: s.updatedAt,
    deleted: s.deleted,
  }
}

export function sessionFromRow(r: SessionRow): Session {
  return {
    id: r.id,
    start: iso(r.start),
    end: r.end === null || r.end === undefined ? null : iso(r.end),
    kind: r.kind,
    note: r.note ?? '',
    updatedAt: iso(r.updated_at),
    deleted: !!r.deleted,
  }
}

export function settingsToRow(s: Settings): SettingsRow {
  return { id: 1, daycare_minutes: Math.round(s.daycareMinutes), goal_hours: Math.round(s.goalHours), updated_at: s.updatedAt }
}

export function settingsFromRow(r: SettingsRow): Settings {
  return { daycareMinutes: r.daycare_minutes, goalHours: r.goal_hours, updatedAt: iso(r.updated_at) }
}

// ---- network ---------------------------------------------------------------

function base(): string {
  return `${SUPABASE_URL.trim().replace(/\/+$/, '')}/rest/v1`
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...extra,
  }
}

async function check(res: Response): Promise<void> {
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text().catch(() => '')}`)
}

const PAGE = 1000 // Supabase's default max rows per request

/** Fetch every remote session (paged) and the settings row. Throws on any failure. */
export async function fetchRemote(): Promise<{ sessions: Session[]; settings: Settings | null }> {
  const sessions: Session[] = []
  for (let offset = 0; ; offset += PAGE) {
    const res = await fetch(`${base()}/sessions?select=*&order=id&limit=${PAGE}&offset=${offset}`, {
      headers: headers(),
    })
    await check(res)
    const rows = (await res.json()) as SessionRow[]
    for (const r of rows) sessions.push(sessionFromRow(r))
    if (rows.length < PAGE) break
  }
  const sres = await fetch(`${base()}/settings?select=*&id=eq.1`, { headers: headers() })
  await check(sres)
  const srows = (await sres.json()) as SettingsRow[]
  return { sessions, settings: srows.length > 0 ? settingsFromRow(srows[0]) : null }
}

async function upsert(table: string, rows: object[]): Promise<void> {
  const res = await fetch(`${base()}/${table}?on_conflict=id`, {
    method: 'POST',
    headers: headers({ Prefer: 'resolution=merge-duplicates,return=minimal' }),
    body: JSON.stringify(rows),
  })
  await check(res)
}

export async function pushSessions(sessions: Session[]): Promise<void> {
  const CHUNK = 500
  for (let i = 0; i < sessions.length; i += CHUNK) {
    await upsert('sessions', sessions.slice(i, i + CHUNK).map(sessionToRow))
  }
}

export async function pushSettings(settings: Settings): Promise<void> {
  await upsert('settings', [settingsToRow(settings)])
}
