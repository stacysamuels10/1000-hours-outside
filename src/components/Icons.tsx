import type { ReactNode } from 'react'

function Svg({ children, size = 24 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  )
}
export const HomeIcon = () => <Svg><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /><path d="M10 20v-6h4v6" /></Svg>
export const HistoryIcon = () => <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>
export const SettingsIcon = () => <Svg><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></Svg>
export const TimerIcon = () => <Svg><circle cx="12" cy="13" r="7" /><path d="M12 13V9M9.5 3h5" /></Svg>
export const ManualIcon = () => <Svg><path d="M4 20l1-4L16 5l3 3L8 19z" /><path d="M14 7l3 3" /></Svg>
export const DaycareIcon = () => <Svg><path d="M3 20V10l9-6 9 6v10z" /><path d="M10 20v-5h4v5" /></Svg>
export const PlusIcon = () => <Svg><path d="M12 5v14M5 12h14" /></Svg>
export const CloseIcon = () => <Svg><path d="M6 6l12 12M18 6L6 18" /></Svg>
export const kindIcon = (k: 'timer' | 'manual' | 'daycare') =>
  k === 'timer' ? <TimerIcon /> : k === 'manual' ? <ManualIcon /> : <DaycareIcon />
