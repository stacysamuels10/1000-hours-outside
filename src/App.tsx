import { useEffect, useState } from 'react'
import { useStore } from './lib/store'
import HomeScreen from './components/HomeScreen'
import HistoryScreen from './components/HistoryScreen'
import SettingsScreen from './components/SettingsScreen'
import TabBar, { type Tab } from './components/TabBar'
import { ToastProvider } from './components/Toast'

/** "now" that ticks every second while a timer runs, else every 30s (and on tab refocus). */
function useNow(running: boolean): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), running ? 1000 : 30000)
    const onVis = () => { if (document.visibilityState === 'visible') setNow(new Date()) }
    document.addEventListener('visibilitychange', onVis)
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVis) }
  }, [running])
  return now
}

export default function App() {
  const store = useStore()
  const now = useNow(store.activeTimer !== null)
  const [tab, setTab] = useState<Tab>('home')

  return (
    <ToastProvider>
      <main className="app">
        {tab === 'home' && <HomeScreen store={store} now={now} />}
        {tab === 'history' && <HistoryScreen store={store} now={now} />}
        {tab === 'settings' && <SettingsScreen store={store} />}
      </main>
      <TabBar tab={tab} onChange={setTab} />
    </ToastProvider>
  )
}
