import { useState } from 'react'
import type { VocabCard } from '@/features/vocabulary/types'
import { speak } from '@/lib/tts/tts'

export default function ListeningStudy({ cards }: { cards: VocabCard[] }) {
  const [ttsError, setTtsError] = useState(false)

  function play(reading: string) {
    setTtsError(false)
    speak(reading, 'ja-JP', () => setTtsError(true))
  }

  return (
    <div className="space-y-2">
      {ttsError && (
        <p className="text-red-500 text-sm">語音播放失敗，請再試一次</p>
      )}
      {cards.map((card) => (
        <div
          key={card.id}
          className="flex items-center gap-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950 px-4 py-3"
        >
          <button
            onClick={() => play(card.payload.reading)}
            className="flex-none flex items-center justify-center w-9 h-9 rounded-full border border-orange-300 dark:border-orange-600 bg-white dark:bg-orange-900 text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-800 transition-colors"
            aria-label={`播放 ${card.payload.word}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
              <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
            </svg>
          </button>
          <div className="min-w-0">
            <p className="text-base font-medium">
              {card.payload.word}
              <span className="ml-2 text-sm font-normal text-orange-400 dark:text-orange-300">
                {card.payload.reading}
              </span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300">{card.payload.meaning}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
