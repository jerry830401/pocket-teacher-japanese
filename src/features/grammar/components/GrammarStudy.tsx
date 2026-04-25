import type { GrammarCard } from '../types'

function splitSentence(sentence: string): [string, string] {
  const idx = sentence.indexOf('___')
  if (idx === -1) return [sentence, '']
  return [sentence.slice(0, idx), sentence.slice(idx + 3)]
}

export default function GrammarStudy({ cards }: { cards: GrammarCard[] }) {
  return (
    <div className="space-y-3">
      {cards.map((card) => {
        const [before, after] = splitSentence(card.payload.sentence)
        return (
          <div
            key={card.id}
            className="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-950 px-4 py-3 space-y-1.5"
          >
            <p className="text-base font-medium leading-relaxed">
              {before}
              <span className="inline-block px-1.5 mx-0.5 rounded bg-teal-200 dark:bg-teal-800 text-teal-700 dark:text-teal-300">
                {card.payload.answer}
              </span>
              {after}
            </p>
            <p className="text-sm text-teal-600 dark:text-teal-300">{card.payload.meaning}</p>
            <p className="text-xs text-teal-400 dark:text-teal-500">{card.payload.grammar}</p>
          </div>
        )
      })}
    </div>
  )
}
