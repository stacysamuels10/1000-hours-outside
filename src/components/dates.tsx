/** Local-time date helpers. Never build dates through UTC strings. */
const p2 = (n: number) => String(n).padStart(2, '0')

export const toDateInput = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`
export const toTimeInput = (d: Date) => `${p2(d.getHours())}:${p2(d.getMinutes())}`

/** Combine "yyyy-mm-dd" and "HH:mm" as LOCAL time. Returns null if invalid. */
export function fromInputs(date: string, time: string): Date | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  const tm = /^(\d{1,2}):(\d{2})/.exec(time)
  if (!dm || !tm) return null
  const d = new Date(+dm[1], +dm[2] - 1, +dm[3], +tm[1], +tm[2], 0, 0)
  return isNaN(d.getTime()) ? null : d
}

export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

export const fmtClock = (d: Date) => d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
export const fmtDay = (d: Date) => d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })

export function fmtElapsed(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return `${h}:${p2(m)}:${p2(s % 60)}`
}
