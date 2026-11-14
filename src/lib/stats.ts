import type { Session } from './types'

const MS_PER_MIN = 60_000

/** Minutes in a session; an open timer counts up to `now`. Never negative. */
export function sessionMinutes(s: Session, now: Date): number {
  const start = new Date(s.start).getTime()
  const end = s.end === null ? now.getTime() : new Date(s.end).getTime()
  const ms = end - start
  if (!Number.isFinite(ms) || ms <= 0) return 0
  return ms / MS_PER_MIN
}

export interface YearStats {
  totalMinutes: number
  /** Days counted for the average: from the later of Jan 1 and the first
   *  session's day in that year, through today (or Dec 31 for past years), inclusive. 0 if no sessions. */
  daysTracked: number
  avgMinutesPerDay: number
  /** Minutes per remaining day (today included) needed to reach the goal; 0 if reached or year over. */
  neededMinutesPerDay: number
  todayMinutes: number
}

/** Whole calendar days between two local dates (b - a), DST-safe. */
function dayDiff(a: Date, b: Date): number {
  const ua = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate())
  const ub = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate())
  return Math.round((ub - ua) / 86_400_000)
}

function sameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

/** Stats for sessions whose start falls in `year` (local time). */
export function yearStats(sessions: Session[], year: number, goalHours: number, now: Date): YearStats {
  let totalMinutes = 0
  let todayMinutes = 0
  let first: Date | null = null
  for (const s of sessions) {
    if (s.deleted) continue
    const start = new Date(s.start)
    if (Number.isNaN(start.getTime()) || start.getFullYear() !== year) continue
    const m = sessionMinutes(s, now)
    totalMinutes += m
    if (sameLocalDay(start, now)) todayMinutes += m
    if (first === null || start < first) first = start
  }

  const jan1 = new Date(year, 0, 1)
  const dec31 = new Date(year, 11, 31)
  const endDay = now.getFullYear() === year ? now : now.getFullYear() > year ? dec31 : jan1

  let daysTracked = 0
  if (first !== null) {
    daysTracked = Math.max(1, dayDiff(first, endDay) + 1)
  }
  const avgMinutesPerDay = daysTracked > 0 ? totalMinutes / daysTracked : 0

  // Remaining days including today; whole year if the year hasn't started, 0 if over.
  let remainingDays = 0
  if (now.getFullYear() === year) remainingDays = dayDiff(now, dec31) + 1
  else if (now.getFullYear() < year) remainingDays = dayDiff(jan1, dec31) + 1
  const remainingMinutes = goalHours * 60 - totalMinutes
  const neededMinutesPerDay = remainingMinutes > 0 && remainingDays > 0 ? remainingMinutes / remainingDays : 0

  return { totalMinutes, daysTracked, avgMinutesPerDay, neededMinutesPerDay, todayMinutes }
}

/** "1h 25m", "2h", "45m", "0m". */
export function formatDuration(minutes: number): string {
  const total = Math.max(0, Math.round(Number.isFinite(minutes) ? minutes : 0))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m === 0) return `${h}h`
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

/** Sessions grouped by local calendar month, newest month first, sessions newest first. */
export function groupByMonth(
  sessions: Session[],
  now: Date,
): { key: string; label: string; totalMinutes: number; sessions: Session[] }[] {
  const groups = new Map<string, { key: string; label: string; totalMinutes: number; sessions: Session[] }>()
  const live = sessions
    .filter((s) => !s.deleted && !Number.isNaN(new Date(s.start).getTime()))
    .sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime())
  for (const s of live) {
    const d = new Date(s.start)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    let g = groups.get(key)
    if (!g) {
      g = {
        key,
        label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        totalMinutes: 0,
        sessions: [],
      }
      groups.set(key, g)
    }
    g.sessions.push(s)
    g.totalMinutes += sessionMinutes(s, now)
  }
  return [...groups.values()].sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0))
}
