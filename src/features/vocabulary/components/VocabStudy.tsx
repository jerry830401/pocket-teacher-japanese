import { useState, useEffect } from 'react'
import type { VocabCard } from '../types'
import { speak } from '@/lib/tts/tts'

const BATCH_SIZE = 5

const POS_LABEL: Record<string, string> = {
  noun: '名詞', verb: '動詞', 'i-adj': 'い形', 'na-adj': 'な形',
  adverb: '副詞', particle: '助詞', expression: '表現', other: '其他',
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function VocabStudy({ cards }: { cards: VocabCard[] }) {
  const [deck, setDeck] = useState<VocabCard[]>([])
  const [index, setIndex] = useState(0)
  const [batchDone, setBatchDone] = useState(false)
  const [ttsError, setTtsError] = useState(false)

  function startBatch(pool: VocabCard[]) {
    setDeck(shuffle(pool).slice(0, BATCH_SIZE))
    setIndex(0)
    setBatchDone(false)
    setTtsError(false)
  }

  useEffect(() => { startBatch(cards) }, [cards])

  if (deck.length === 0) return null

  if (batchDone) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4">
        <p className="text-slate-500 text-sm">已瀏覽 {BATCH_SIZE} 個單字</p>
        <button
          onClick={() => startBatch(cards)}
          className="px-8 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          下一組（{BATCH_SIZE} 個）
        </button>
      </div>
    )
  }

  const current = deck[index]

  function play() {
    setTtsError(false)
    speak(current.payload.reading, 'ja-JP', () => setTtsError(true))
  }

  function goTo(i: number) {
    setIndex(i)
    setTtsError(false)
  }

  return (
    <div className="h-full flex flex-col gap-4 py-2">
      {/* 進度區 */}
      <div className="shrink-0 space-y-2">
        <div className="text-sm text-slate-500">第 {index + 1} / {deck.length} 張</div>
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${(index + 1) / deck.length * 100}%` }}
          />
        </div>
      </div>

      {/* 卡片 */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        <div className="w-full max-w-xs rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5 min-w-0">
              <p className="text-4xl font-medium">{current.payload.word}</p>
              <p className="text-base text-indigo-400 dark:text-indigo-300">{current.payload.reading}</p>
              <p className="text-base text-slate-700 dark:text-slate-200">{current.payload.meaning}</p>
              <p className="text-xs text-indigo-300 dark:text-indigo-500">
                {POS_LABEL[current.payload.pos] ?? current.payload.pos}
              </p>
            </div>
            <button
              onClick={play}
              className="flex-none flex items-center justify-center w-10 h-10 rounded-full border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-indigo-900 text-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-800 transition-colors mt-1"
              aria-label={`播放 ${current.payload.word}`}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
          {ttsError && <p className="text-red-500 text-xs mt-2">語音播放失敗，請再試一次</p>}
        </div>
      </div>

      {/* 導覽按鈕 */}
      <div className="shrink-0 flex items-center justify-center gap-3 pb-4">
        <button
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          className="px-5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          上一張
        </button>
        <button
          onClick={() => index + 1 >= deck.length ? setBatchDone(true) : goTo(index + 1)}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
        >
          {index + 1 >= deck.length ? '完成這組' : '下一張'}
        </button>
      </div>
    </div>
  )
}
