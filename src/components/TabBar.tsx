import { HistoryIcon, HomeIcon, SettingsIcon } from './Icons'

export type Tab = 'home' | 'history' | 'settings'
const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <HomeIcon /> },
  { id: 'history', label: 'History', icon: <HistoryIcon /> },
  { id: 'settings', label: 'Settings', icon: <SettingsIcon /> },
]

export default function TabBar({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav className="tabbar" aria-label="Main">
      <div className="tabbar-inner">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={'tab' + (tab === t.id ? ' active' : '')}
            aria-current={tab === t.id ? 'page' : undefined} onClick={() => onChange(t.id)}>
            {t.icon}<span>{t.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
