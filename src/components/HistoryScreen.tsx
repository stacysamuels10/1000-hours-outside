import { useState } from 'react'
import type { Session, Store } from '../lib/types'
import { formatDuration, groupByMonth, sessionMinutes } from '../lib/stats'
import SessionForm from './SessionForm'
import { kindIcon } from './Icons'
import { useToast } from './Toast'
import { fmtClock, fmtDay } from './dates'

const KIND_LABEL = { timer: 'Timer', manual: 'Added by hand', daycare: 'Daycare' } as const

export default function HistoryScreen({ store, now }: { store: Store; now: Date }) {
  const toast = useToast()
  const [editing, setEditing] = useState<Session | null>(null)
  const groups = groupByMonth(store.sessions, now)

  if (groups.length === 0) {
    return (
      <div className="screen">
        <h1 className="page-title">History</h1>
        <div className="empty">
          <svg viewBox="0 0 200 130" width="200" height="130" aria-hidden="true">
            <circle cx="150" cy="30" r="16" fill="#ffd93d" />
            <path d="M0 100 C40 70 90 80 130 95 C160 105 180 90 200 92 V130 H0Z" fill="#a8d38a" />
            <path d="M0 115 C50 98 120 112 200 106 V130 H0Z" fill="#3f7d4e" />
            <rect x="48" y="62" width="6" height="30" rx="2" fill="#7a5a3a" /><circle cx="51" cy="54" r="18" fill="#5fae6a" />
          </svg>
          <p className="empty-title">No adventures yet</p>
          <p>When Hollis heads outside, her time will show up here.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="screen">
      <h1 className="page-title">History</h1>
      {groups.map((g) => (
        <section key={g.key} className="month" aria-label={g.label}>
          <h2 className="month-head"><span>{g.label}</span><span className="month-total">{formatDuration(g.totalMinutes)}</span></h2>
          <ul className="rows">
            {g.sessions.map((s) => {
              const st = new Date(s.start)
              const running = s.end === null
              const inner = (
                <>
                  <span className={'kind kind-' + s.kind} role="img" aria-label={KIND_LABEL[s.kind]}>{kindIcon(s.kind)}</span>
                  <span className="row-main">
                    <span className="row-day">{fmtDay(st)}</span>
                    <span className="row-time">{fmtClock(st)}{!running && ` – ${fmtClock(new Date(s.end!))}`}</span>
                    {s.note && <span className="row-note">{s.note}</span>}
                  </span>
                  <span className="row-dur">{running ? 'In progress' : formatDuration(sessionMinutes(s, now))}</span>
                </>
              )
              return (
                <li key={s.id}>
                  {running
                    ? <div className="row">{inner}</div>
                    : <button type="button" className="row" onClick={() => setEditing(s)}>{inner}</button>}
                </li>
              )
            })}
          </ul>
        </section>
      ))}

      {editing && (
        <SessionForm
          key={editing.id}
          title="Edit session"
          submitLabel="Save"
          initial={{
            start: new Date(editing.start),
            minutes: Math.max(1, Math.round(sessionMinutes(editing, now))),
            note: editing.note,
          }}
          onClose={() => setEditing(null)}
          onSubmit={(v) => {
            store.updateSession(editing.id, {
              start: v.start.toISOString(),
              end: new Date(v.start.getTime() + v.minutes * 60000).toISOString(),
              note: v.note,
            })
            setEditing(null)
          }}
          onDelete={() => {
            const id = editing.id
            store.deleteSession(id)
            setEditing(null)
            toast('Session deleted', () => store.restoreSession(id))
          }}
        />
      )}
    </div>
  )
}
