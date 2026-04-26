import { useNavigate } from 'react-router-dom'
import { useSettings } from '@/stores/useSettings'
import OfflineDataButton from '@/features/progress/OfflineDataButton'

type AutoNextKey = 'kana' | 'vocab' | 'grammar' | 'listening'

const ITEMS: { key: AutoNextKey; label: string; desc: string }[] = [
  { key: 'kana',      label: '五十音',  desc: '答對後自動進入下一題' },
  { key: 'vocab',     label: '單字',    desc: '答對後自動進入下一題' },
  { key: 'grammar',   label: '文法',    desc: '答對後自動進入下一題' },
  { key: 'listening', label: '聽力',    desc: '答對後自動進入下一題' },
]

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600',
      ].join(' ')}
    >
      <span className={[
        'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0',
      ].join(' ')} />
    </button>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { autoNextKana, autoNextVocab, autoNextGrammar, autoNextListening, setAutoNext } = useSettings()

  const values: Record<AutoNextKey, boolean> = {
    kana:      autoNextKana,
    vocab:     autoNextVocab,
    grammar:   autoNextGrammar,
    listening: autoNextListening,
  }

  return (
    <div className="h-full overflow-y-auto pb-20 md:pb-6">
      <div className="pt-4 space-y-6">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-tight">設定</h1>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            ← 返回
          </button>
        </header>

        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
            答對自動下一題
          </h2>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {ITEMS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900">
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
                </div>
                <Toggle checked={values[key]} onChange={(v) => setAutoNext(key, v)} />
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-1">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 px-1">
            離線
          </h2>
          <OfflineDataButton />
        </section>
      </div>
    </div>
  )
}
