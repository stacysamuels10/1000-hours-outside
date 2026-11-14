import { useState } from 'react'
import type { Store, SyncStatus } from '../lib/types'
import SyncBadge from './SyncBadge'

const WHERE: Record<SyncStatus, string> = {
  'local-only': 'Your hours are saved on this device only. They stay private, but won’t show up on another phone.',
  synced: 'Your hours are saved on this device and synced, so both parents see the same numbers.',
  syncing: 'Syncing your hours right now. Everything is also saved on this device.',
  offline: 'You’re offline. Everything is saved on this device and will sync when you’re back online.',
}

export default function SettingsScreen({ store }: { store: Store }) {
  const { settings } = store
  const [h, setH] = useState(String(Math.floor(settings.daycareMinutes / 60)))
  const [m, setM] = useState(String(settings.daycareMinutes % 60))
  const [goal, setGoal] = useState(String(settings.goalHours))
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const dm = (parseInt(h, 10) || 0) * 60 + (parseInt(m, 10) || 0)
    const g = Math.round(Number(goal))
    if (dm <= 0) return setErr('Daycare time needs to be more than 0 minutes.'), setMsg('')
    if (!Number.isFinite(g) || g < 1) return setErr('Goal needs to be at least 1 hour.'), setMsg('')
    store.updateSettings({ daycareMinutes: dm, goalHours: g })
    setErr('')
    setMsg('Saved!')
  }
  const touch = () => setMsg('')

  return (
    <div className="screen">
      <h1 className="page-title">Settings</h1>
      <form className="card" onSubmit={save} noValidate>
        <fieldset className="field">
          <legend>Daycare duration</legend>
          <div className="field-row dur">
            <label className="field small">Hours
              <input type="number" inputMode="numeric" min={0} max={24} value={h} onChange={(e) => { setH(e.target.value); touch() }} />
            </label>
            <label className="field small">Minutes
              <input type="number" inputMode="numeric" min={0} max={59} value={m} onChange={(e) => { setM(e.target.value); touch() }} />
            </label>
          </div>
          <p className="hint">Used by the “+ Daycare” button on Home.</p>
        </fieldset>
        <label className="field">Yearly goal (hours)
          <input type="number" inputMode="numeric" min={1} value={goal} onChange={(e) => { setGoal(e.target.value); touch() }} />
        </label>
        <p className="hint">1000 is a big, lofty goal. Any number of hours outside is a win.</p>
        {err && <p className="form-error" role="alert">{err}</p>}
        <div className="sheet-actions">
          <button type="submit" className="btn primary-sm">Save</button>
          {msg && <span className="saved" role="status">{msg}</span>}
        </div>
      </form>

      <section className="card">
        <h2 className="card-title">Where your data lives</h2>
        <p>{WHERE[store.syncStatus]}</p>
        <SyncBadge status={store.syncStatus} />
      </section>
    </div>
  )
}
