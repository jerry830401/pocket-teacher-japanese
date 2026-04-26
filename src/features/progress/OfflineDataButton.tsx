import { useEffect, useState } from 'react'
import { getOfflineStatus, downloadOfflineData, type OfflineStatus } from '@/lib/db/offlineData'

type ButtonState =
  | { phase: 'checking' }
  | { phase: 'idle'; status: OfflineStatus }
  | { phase: 'downloading'; done: number; total: number }
  | { phase: 'done'; savedAt: number }
  | { phase: 'error'; message: string }

export default function OfflineDataButton() {
  const [state, setState] = useState<ButtonState>({ phase: 'checking' })

  useEffect(() => {
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

  if (state.phase === 'checking') return null

  const hasData = state.phase === 'idle' ? state.status.hasData : state.phase === 'done'
  const savedAt =
    state.phase === 'idle' ? state.status.savedAt :
    state.phase === 'done' ? state.savedAt : null

  const isDownloading = state.phase === 'downloading'

  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">離線資料</p>
          {hasData && savedAt ? (
            <p className="text-xs text-slate-400">
              已儲存 · {new Date(savedAt).toLocaleString('zh-TW', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          ) : (
            <p className="text-xs text-slate-400">尚未下載，需連線才能學習</p>
          )}
        </div>

        <button
          onClick={handleClick}
          disabled={isDownloading}
          className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50
            ${hasData
              ? 'border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
        >
          {isDownloading
            ? `下載中 ${state.done}/${state.total}…`
            : hasData ? '更新' : '下載離線資料'
          }
        </button>
      </div>

      {state.phase === 'error' && (
        <p className="text-xs text-red-500">{state.message}</p>
      )}
    </section>
  )
}
