import { describe, expect, it } from 'vitest'
import { mergeRemote, type SyncState } from './sync'
import type { Session, Settings } from './types'

const sess = (id: string, updatedAt: string, extra: Partial<Session> = {}): Session => ({
  id,
  start: '2026-01-01T10:00:00.000Z',
  end: '2026-01-01T11:00:00.000Z',
  kind: 'manual',
  note: '',
  updatedAt,
  deleted: false,
  ...extra,
})
const settings = (updatedAt: string, goalHours = 1000): Settings => ({ daycareMinutes: 60, goalHours, updatedAt })

const base = (over: Partial<SyncState> = {}): SyncState => ({
  sessions: [],
  settings: settings('1970-01-01T00:00:00.000Z'),
  dirtySessionIds: [],
  settingsDirty: false,
  ...over,
})

describe('mergeRemote', () => {
  it('adds unknown remote rows', () => {
    const r = sess('a', '2026-01-02T00:00:00.000Z')
    expect(mergeRemote(base(), [r], null).sessions).toEqual([r])
  })
  it('newer remote wins and clears dirty', () => {
    const l = sess('a', '2026-01-02T00:00:00.000Z', { note: 'local' })
    const r = sess('a', '2026-01-03T00:00:00.000Z', { note: 'remote' })
    const out = mergeRemote(base({ sessions: [l], dirtySessionIds: ['a'] }), [r], null)
    expect(out.sessions[0].note).toBe('remote')
    expect(out.dirtySessionIds).toEqual([])
  })
  it('newer local stays dirty', () => {
    const l = sess('a', '2026-01-03T00:00:00.000Z', { note: 'local' })
    const r = sess('a', '2026-01-02T00:00:00.000Z', { note: 'remote' })
    const out = mergeRemote(base({ sessions: [l], dirtySessionIds: ['a'] }), [r], null)
    expect(out.sessions[0].note).toBe('local')
    expect(out.dirtySessionIds).toEqual(['a'])
  })
  it('equal timestamps keep local', () => {
    const l = sess('a', '2026-01-02T00:00:00.000Z', { note: 'local' })
    const r = sess('a', '2026-01-02T00:00:00.000Z', { note: 'remote' })
    expect(mergeRemote(base({ sessions: [l] }), [r], null).sessions[0].note).toBe('local')
  })
  it('compares as dates, not strings (different formats)', () => {
    // string compare would say "...+00:00" < "...Z"; as dates the remote is 1s newer
    const l = sess('a', '2026-01-02T00:00:00.000Z', { note: 'local' })
    const r = sess('a', '2026-01-02T00:00:01+00:00', { note: 'remote' })
    expect(mergeRemote(base({ sessions: [l] }), [r], null).sessions[0].note).toBe('remote')
    // and an older remote in a lexically larger format must not win
    const l2 = sess('b', '2026-01-02T00:00:01.000Z', { note: 'local' })
    const r2 = sess('b', '2026-01-02T00:00:00+00:00', { note: 'remote' })
    expect(mergeRemote(base({ sessions: [l2] }), [r2], null).sessions[0].note).toBe('local')
  })
  it('propagates remote deletions', () => {
    const l = sess('a', '2026-01-02T00:00:00.000Z')
    const r = sess('a', '2026-01-03T00:00:00.000Z', { deleted: true })
    expect(mergeRemote(base({ sessions: [l] }), [r], null).sessions[0].deleted).toBe(true)
  })
  it('does not mutate input', () => {
    const l = sess('a', '2026-01-02T00:00:00.000Z')
    const input = base({ sessions: [l], dirtySessionIds: ['a'] })
    mergeRemote(input, [sess('a', '2026-01-09T00:00:00.000Z')], null)
    expect(input.dirtySessionIds).toEqual(['a'])
    expect(input.sessions[0]).toBe(l)
  })
  it('settings: newer remote wins and clears dirty flag', () => {
    const out = mergeRemote(
      base({ settings: settings('2026-01-01T00:00:00.000Z', 500), settingsDirty: true }),
      [],
      settings('2026-01-02T00:00:00.000Z', 800),
    )
    expect(out.settings.goalHours).toBe(800)
    expect(out.settingsDirty).toBe(false)
  })
  it('settings: newer local stays dirty; null remote keeps local', () => {
    const local = settings('2026-01-05T00:00:00.000Z', 500)
    const a = mergeRemote(base({ settings: local, settingsDirty: true }), [], settings('2026-01-02T00:00:00.000Z', 800))
    expect(a.settings.goalHours).toBe(500)
    expect(a.settingsDirty).toBe(true)
    const b = mergeRemote(base({ settings: local, settingsDirty: true }), [], null)
    expect(b.settings).toBe(local)
    expect(b.settingsDirty).toBe(true)
  })
})
