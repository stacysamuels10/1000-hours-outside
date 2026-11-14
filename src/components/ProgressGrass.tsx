/** Grass-filling progress bar; has a minimum visible fill so 1% still reads. */
export default function ProgressGrass({ hours, goal }: { hours: number; goal: number }) {
  const frac = goal > 0 ? Math.min(1, hours / goal) : 0
  const pct = Math.round(frac * 1000) / 10
  const shown = hours > 0 ? Math.max(frac * 100, 7) : 0
  return (
    <div className="grass-wrap">
      <div className="grass" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(hours * 10) / 10}
        aria-label={`${hours.toFixed(1)} of ${goal} hours`}>
        <div className="grass-fill" style={{ width: shown + '%' }}>
          <svg className="blades" viewBox="0 0 40 10" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 10 L2 2 L4 10 L7 0 L10 10 L13 3 L16 10 L19 1 L22 10 L25 3 L28 10 L31 0 L34 10 L37 2 L40 10Z" fill="#6fbf5a" />
          </svg>
        </div>
        <div className="grass-sprout" style={{ left: `${Math.max(shown, 5)}%` }} aria-hidden="true">
          <svg viewBox="0 0 24 24" width="30" height="30"><circle cx="12" cy="12" r="11" fill="#ffd93d" stroke="#fff" strokeWidth="2" />
            <path d="M12 18v-6M12 12c0-3 2-4 5-4 0 3-2 4-5 4zM12 13c0-2-1.500-3-4-3 0 2 1.500 3 4 3z" fill="#3f7d4e" stroke="#3f7d4e" strokeWidth="1" strokeLinejoin="round" /></svg>
        </div>
      </div>
      <div className="grass-scale"><span>0</span><span>{pct}% there</span><span>{goal}</span></div>
    </div>
  )
}
