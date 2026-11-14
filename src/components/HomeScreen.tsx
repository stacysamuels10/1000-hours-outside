import { useState } from 'react'
import type { Store } from '../lib/types'
import { formatDuration, yearStats } from '../lib/stats'
import Scene from './Scene'
import ProgressGrass from './ProgressGrass'
import SessionForm from './SessionForm'
import Sheet from './Sheet'
import SyncBadge from './SyncBadge'
import { PlusIcon, DaycareIcon } from './Icons'
import { useToast } from './Toast'
import { fmtClock, fmtElapsed, sameDay } from './dates'

export default function HomeScreen({ store, now }: { store: Store; now: Date }) {
  const { sessions, activeTimer, settings } = store
  const toast = useToast()
  const year = now.getFullYear()
  const stats = yearStats(sessions, year, settings.goalHours, now)
  const hours = stats.totalMinutes / 60
  const [adding, setAdding] = useState(false)
  const [confirmDaycare, setConfirmDaycare] = useState(false)

  const addDaycare = () => {
    const start = new Date(Date.now() - settings.daycareMinutes * 60000)
    const id = store.addSession({ start, minutes: settings.daycareMinutes, kind: 'daycare' })
    toast(`Added ${formatDuration(settings.daycareMinutes)} — nice!`, () => store.deleteSession(id))
  }
  const onDaycare = () => {
    const exists = sessions.some((s) => s.kind === 'daycare' && sameDay(new Date(s.start), now))
    if (exists) setConfirmDaycare(true)
    else addDaycare()
  }
  const onTimer = () => {
    if (activeTimer) {
      const ms = Date.now() - new Date(activeTimer.start).getTime()
      store.stopTimer()
      if (ms < 60000) {
        // An accidental tap: don't leave a 0-minute entry in the history.
        store.deleteSession(activeTimer.id)
        toast('Under a minute — not counted')
      } else {
        toast(`Added ${formatDuration(ms / 60000)} — welcome back!`)
      }
    } else {
      store.startTimer()
    }
  }

  return (
    <div className="screen">
      <header className="hero">
        <Scene />
        <div className="hero-text">
          <h1>Hollis&rsquo;s Hours Outside</h1>
          <p className="year">{year}</p>
        </div>
      </header>

      <section className="card progress" aria-label="Yearly progress">
        <div className="big-number"><span className="num">{hours.toFixed(1)}</span><span className="of">of {settings.goalHours} hours</span></div>
        <ProgressGrass hours={hours} goal={settings.goalHours} />
        <p className="cheer">{hours === 0 ? 'Every adventure starts with step one.' : 'Every minute outside counts.'}</p>
      </section>

      <section className="timer" aria-label="Timer">
        {activeTimer && (
          <>
            <div className="elapsed" role="timer" aria-label="Time outside so far">{fmtElapsed(now.getTime() - new Date(activeTimer.start).getTime())}</div>
            <div className="started">Started at {fmtClock(new Date(activeTimer.start))}</div>
          </>
        )}
        <button type="button" className={'big-btn' + (activeTimer ? ' running' : '')} onClick={onTimer}>
          {activeTimer ? 'Back inside' : 'Head outside'}
        </button>
      </section>

      <div className="btn-row">
        <button type="button" className="btn secondary" onClick={onDaycare}>
          <DaycareIcon />+ Daycare ({formatDuration(settings.daycareMinutes)})
        </button>
        <button type="button" className="btn secondary" onClick={() => setAdding(true)}>
          <PlusIcon />Add time
        </button>
      </div>

      <div className="chips-row">
        <div className="stat"><span className="stat-label">Avg per day</span><span className="stat-val">{formatDuration(stats.avgMinutesPerDay)}</span></div>
        <div className="stat"><span className="stat-label">Today</span><span className="stat-val">{formatDuration(stats.todayMinutes)}</span></div>
      </div>

      <div className="sync-row"><SyncBadge status={store.syncStatus} /></div>

      {adding && (
        <SessionForm
          title="Add time outside"
          submitLabel="Add"
          initial={{ start: new Date(now.getTime() - 3600000), minutes: 60, note: '' }}
          onClose={() => setAdding(false)}
          onSubmit={(v) => {
            const id = store.addSession({ start: v.start, minutes: v.minutes, kind: 'manual', note: v.note })
            setAdding(false)
            toast(`Added ${formatDuration(v.minutes)} — nice!`, () => store.deleteSession(id))
          }}
        />
      )}
      {confirmDaycare && (
        <Sheet title="Daycare again?" onClose={() => setConfirmDaycare(false)}>
          <p>Daycare is already logged today. Add again?</p>
          <div className="sheet-actions">
            <button type="button" className="btn primary-sm" onClick={() => { setConfirmDaycare(false); addDaycare() }}>Add again</button>
            <button type="button" className="btn secondary" onClick={() => setConfirmDaycare(false)}>Cancel</button>
          </div>
        </Sheet>
      )}
    </div>
  )
}
