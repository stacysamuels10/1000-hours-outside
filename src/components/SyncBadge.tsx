import type { SyncStatus } from '../lib/types'

export const SYNC_LABEL: Record<SyncStatus, string> = {
  'local-only': 'This device only',
  synced: 'Synced',
  syncing: 'Syncing…',
  offline: 'Offline — will sync later',
}

export default function SyncBadge({ status }: { status: SyncStatus }) {
  return <span className={'sync sync-' + status}><span className="dot" aria-hidden="true" />{SYNC_LABEL[status]}</span>
}
