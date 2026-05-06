import { useEffect, useState } from 'react'
import { getOfflineStatus, downloadOfflineData, type OfflineStatus } from '@/lib/db/offlineData'
import { isPwa } from '@/lib/pwa'

type ButtonState =
  | { phase: 'checking' }
  | { phase: 'idle'; status: OfflineStatus }
  | { phase: 'downloading'; done: number; total: number }
  | { phase: 'done'; savedAt: number }
  | { phase: 'error'; message: string }

export default function OfflineDataButton() {
  const [state, setState] = useState<ButtonState>({ phase: 'checking' })

  useEffect(() => {
    if (!isPwa()) return
    getOfflineStatus().then((status) => setState({ phase: 'idle', status }))
  }, [])

  async function handleClick() {
    setState({ phase: 'downloading', done: 0, total: 2 })
    try {
      await downloadOfflineData((done, total) =>
        setState({ phase: 'downloading', done, total }),
      )
      const status = await getOfflineStatus()
      setState({ phase: 'done', savedAt: status.savedAt! })
    } catch (e) {
      setState({ phase: 'error', message: e instanceof Error ? e.message : '未知錯誤' })
    }
  }

  if (!isPwa || state.phase === 'checking') return null

  const hasData = state.phase === 'idle' ? state.status.hasData : state.phase === 'done'
  const savedAt =
    state.phase === 'idle' ? state.status.savedAt :
    state.phase === 'done' ? state.savedAt : null

  const isDownloading = state.phase === 'downloading'

  return (
    <div className="px-settings-list" style={{ marginBottom: 18 }}>
      <div className="px-settings-row">
        <div>
          <div style={{ fontWeight: 600 }}>離線資料</div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-ink-soft)', marginTop: 2 }}>
            {hasData && savedAt
              ? `已儲存 · ${new Date(savedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : '尚未下載，需連線才能學習'
            }
          </div>
          {state.phase === 'error' && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--color-red, #c0392b)', marginTop: 4 }}>
              ⚠ {state.message}
            </div>
          )}
        </div>
        <button
          className={['pbtn', !hasData ? 'pbtn-primary' : ''].join(' ')}
          onClick={handleClick}
          disabled={isDownloading}
          style={{ padding: '8px 14px', fontSize: '0.875rem', minWidth: 72 }}
        >
          {isDownloading
            ? `${state.done}/${state.total}…`
            : hasData ? '更新' : '下載'
          }
        </button>
      </div>
    </div>
  )
}
