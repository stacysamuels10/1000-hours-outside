import { describe, expect, it } from 'vitest'
import { formatDuration, groupByMonth, sessionMinutes, yearStats } from './stats'
import type { Session } from './types'

let n = 0
function mk(start: Date, minutes: number | null, extra: Partial<Session> = {}): Session {
  return {
    id: `id${n++}`,
    start: start.toISOString(),
    end: minutes === null ? null : new Date(start.getTime() + minutes * 60_000).toISOString(),
    kind: 'manual',
    note: '',
    updatedAt: start.toISOString(),
    deleted: false,
    ...extra,
  }
}

describe('sessionMinutes', () => {
  const now = new Date(2026, 5, 10, 12, 0)
  it('measures finished sessions', () => {
    expect(sessionMinutes(mk(new Date(2026, 5, 10, 10, 0), 45), now)).toBe(45)
  })
  it('counts open timers up to now', () => {
    expect(sessionMinutes(mk(new Date(2026, 5, 10, 11, 0), null), now)).toBe(60)
  })
  it('is never negative', () => {
    expect(sessionMinutes(mk(new Date(2026, 5, 10, 13, 0), null), now)).toBe(0)
    expect(sessionMinutes(mk(new Date(2026, 5, 10, 10, 0), -5), now)).toBe(0)
  })
})

describe('formatDuration', () => {
  it('formats', () => {
    expect(formatDuration(85)).toBe('1h 25m')
    expect(formatDuration(45)).toBe('45m')
    expect(formatDuration(0)).toBe('0m')
    expect(formatDuration(59.6)).toBe('1h')
    expect(formatDuration(-3)).toBe('0m')
  })
})

describe('yearStats', () => {
  const now = new Date(2026, 0, 10, 15, 0) // Jan 10
  it('is zeroed with no sessions', () => {
    const s = yearStats([], 2026, 1000, now)
    expect(s.daysTracked).toBe(0)
    expect(s.avgMinutesPerDay).toBe(0)
    expect(s.totalMinutes).toBe(0)
  })
  it('counts days from first session through today inclusive', () => {
    const list = [mk(new Date(2026, 0, 5, 9, 0), 60), mk(new Date(2026, 0, 10, 9, 0), 120)]
    const s = yearStats(list, 2026, 1000, now)
    expect(s.totalMinutes).toBe(180)
    expect(s.daysTracked).toBe(6)
    expect(s.avgMinutesPerDay).toBe(30)
    expect(s.todayMinutes).toBe(120)
    // 356 days remain from Jan 10 through Dec 31 inclusive
    expect(s.neededMinutesPerDay).toBeCloseTo((60000 - 180) / 356)
  })
  it('ignores deleted sessions and other years', () => {
    const list = [
      mk(new Date(2026, 0, 5, 9, 0), 60, { deleted: true }),
      mk(new Date(2025, 11, 31, 9, 0), 60),
      mk(new Date(2026, 0, 8, 9, 0), 30),
    ]
    const s = yearStats(list, 2026, 1000, now)
    expect(s.totalMinutes).toBe(30)
    expect(s.daysTracked).toBe(3)
  })
  it('uses Dec 31 and zero needed for past years', () => {
    const s = yearStats([mk(new Date(2025, 11, 30, 9, 0), 60)], 2025, 1000, now)
    expect(s.daysTracked).toBe(2)
    expect(s.neededMinutesPerDay).toBe(0)
    expect(s.todayMinutes).toBe(0)
  })
  it('needed is 0 once goal is reached', () => {
    const s = yearStats([mk(new Date(2026, 0, 5, 9, 0), 120)], 2026, 2, now)
    expect(s.neededMinutesPerDay).toBe(0)
  })
  it('counts an open timer up to now', () => {
    const s = yearStats([mk(new Date(2026, 0, 10, 14, 0), null)], 2026, 1000, now)
    expect(s.totalMinutes).toBe(60)
  })
})

describe('groupByMonth', () => {
  it('groups newest month first, sessions newest first, skipping deleted', () => {
    const a = mk(new Date(2026, 0, 5, 9, 0), 30)
    const b = mk(new Date(2026, 0, 20, 9, 0), 60)
    const c = mk(new Date(2025, 11, 31, 23, 0), 15)
    const d = mk(new Date(2026, 0, 6, 9, 0), 99, { deleted: true })
    const g = groupByMonth([a, c, d, b], new Date(2026, 1, 1))
    expect(g.map((x) => x.key)).toEqual(['2026-01', '2025-12'])
    expect(g[0].sessions).toEqual([b, a])
    expect(g[0].totalMinutes).toBe(90)
    expect(g[0].label).toContain('2026')
    expect(g[1].totalMinutes).toBe(15)
  })
})
