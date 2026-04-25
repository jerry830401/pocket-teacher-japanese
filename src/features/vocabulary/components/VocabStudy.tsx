import type { VocabCard } from '../types'

const POS_LABEL: Record<string, string> = {
  noun: '名詞', verb: '動詞', 'i-adj': 'い形', 'na-adj': 'な形',
  adverb: '副詞', particle: '助詞', expression: '表現', other: '其他',
}

export default function VocabStudy({ cards }: { cards: VocabCard[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className="rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950 px-3 py-3 space-y-1"
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-2xl font-medium leading-tight">{card.payload.word}</span>
            <span className="text-xs text-indigo-400 dark:text-indigo-500 mt-1 shrink-0">
              {POS_LABEL[card.payload.pos] ?? card.payload.pos}
            </span>
          </div>
          <p className="text-sm text-indigo-400 dark:text-indigo-300">{card.payload.reading}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{card.payload.meaning}</p>
        </div>
      ))}
    </div>
  )
}
