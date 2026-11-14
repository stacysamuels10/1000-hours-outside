import { useState } from 'react'
import Sheet from './Sheet'
import { fromInputs, toDateInput, toTimeInput } from './dates'

export interface SessionFormValues { start: Date; minutes: number; note: string }

const CHIPS = [
  { label: '30m', m: 30 }, { label: '1h', m: 60 }, { label: '1h 30m', m: 90 }, { label: '2h', m: 120 },
]

export default function SessionForm({ title, initial, submitLabel, onSubmit, onDelete, onClose }: {
  title: string
  initial: { start: Date; minutes: number; note: string }
  submitLabel: string
  onSubmit: (v: SessionFormValues) => void
  onDelete?: () => void
  onClose: () => void
}) {
  const [date, setDate] = useState(toDateInput(initial.start))
  const [time, setTime] = useState(toTimeInput(initial.start))
  const [hours, setHours] = useState(String(Math.floor(initial.minutes / 60)))
  const [mins, setMins] = useState(String(initial.minutes % 60))
  const [note, setNote] = useState(initial.note)
  const [error, setError] = useState('')

  const setTotal = (m: number) => { setHours(String(Math.floor(m / 60))); setMins(String(m % 60)); setError('') }
  const total = (Math.max(0, parseInt(hours, 10) || 0) * 60) + Math.max(0, parseInt(mins, 10) || 0)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const start = fromInputs(date, time)
    if (!start) return setError('Please pick a date and start time.')
    if (total <= 0) return setError('Duration needs to be more than 0 minutes.')
    if (total > 24 * 60) return setError('That is more than a full day. Split it into separate entries.')
    if (start.getTime() + total * 60000 > Date.now() + 60000) {
      return setError("That time hasn't happened yet. Pick an earlier start or a shorter stay.")
    }
    onSubmit({ start, minutes: total, note: note.trim() })
  }

  return (
    <Sheet title={title} onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <div className="field-row">
          <label className="field">Date
            <input type="date" value={date} max={toDateInput(new Date())} onChange={(e) => { setDate(e.target.value); setError('') }} required />
          </label>
          <label className="field">Started at
            <input type="time" value={time} onChange={(e) => { setTime(e.target.value); setError('') }} required />
          </label>
        </div>
        <fieldset className="field">
          <legend>How long?</legend>
          <div className="field-row dur">
            <label className="field small">Hours
              <input type="number" inputMode="numeric" min={0} max={24} value={hours} onChange={(e) => { setHours(e.target.value); setError('') }} />
            </label>
            <label className="field small">Minutes
              <input type="number" inputMode="numeric" min={0} max={59} value={mins} onChange={(e) => { setMins(e.target.value); setError('') }} />
            </label>
          </div>
          <div className="chips" role="group" aria-label="Quick durations">
            {CHIPS.map((c) => (
              <button type="button" key={c.m} className={'chip-btn' + (total === c.m ? ' on' : '')} onClick={() => setTotal(c.m)}>{c.label}</button>
            ))}
          </div>
        </fieldset>
        <label className="field">Note (optional)
          <input type="text" value={note} maxLength={200} placeholder="Park, backyard, walk…" onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="sheet-actions">
          <button type="submit" className="btn primary-sm">{submitLabel}</button>
          {onDelete && <button type="button" className="btn danger" onClick={onDelete}>Delete</button>}
        </div>
      </form>
    </Sheet>
  )
}
