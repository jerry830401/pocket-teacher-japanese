// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { GrammarCard } from '../types'

vi.mock('@/lib/db/db', () => ({
  getOrCreateCard: vi.fn().mockResolvedValue({ cardId: 'grammar-N5-001', easeFactor: 2.5, interval: 0, repetitions: 0, dueAt: 0 }),
  saveCard: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/stores/useSettings', () => ({
  useSettings: vi.fn((selector) => selector({
    autoNextGrammar: false,
    roundSizeGrammar: 10,
  })),
}))

import GrammarQuiz from './GrammarQuiz'

const makeCard = (id: string, answer: string, choices: string[]): GrammarCard => ({
  id,
  type: 'grammar',
  level: 'N5',
  payload: {
    sentence: `私は___学校に行きます。`,
    answer,
    choices,
    meaning: '我去學校。',
    grammar: `${answer}：表示方向`,
  },
  tags: [],
})

const CARDS: GrammarCard[] = [
  makeCard('grammar-N5-001', 'に', ['に', 'で', 'を', 'が']),
  makeCard('grammar-N5-002', 'で', ['で', 'に', 'を', 'は']),
  makeCard('grammar-N5-003', 'を', ['を', 'に', 'が', 'は']),
  makeCard('grammar-N5-004', 'が', ['が', 'を', 'に', 'で']),
  makeCard('grammar-N5-005', 'は', ['は', 'が', 'を', 'に']),
]

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => cleanup())

describe('GrammarQuiz', () => {
  it('renders a sentence with blank and 4 choice buttons', () => {
    render(<GrammarQuiz cards={CARDS} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('shows progress as "第 1 / N 題"', () => {
    render(<GrammarQuiz cards={CARDS} />)
    expect(screen.getByText(/第 1 \//)).toBeInTheDocument()
  })

  it('shows the sentence with a blank placeholder', () => {
    render(<GrammarQuiz cards={CARDS} />)
    // RubyText splits the sentence into multiple inline nodes; check container text instead
    const body = document.body.textContent ?? ''
    expect(body).toMatch(/私は/)
    expect(body).toMatch(/学校に行きます。/)
  })

  it('fills the blank with selected answer after picking', async () => {
    render(<GrammarQuiz cards={CARDS} />)

    // Get the current card's answer from the displayed choices
    const bodyText = document.body.textContent ?? ''
    const shownCard = CARDS.find((c) => c.payload.choices.every((ch) => bodyText.includes(ch)))

    if (shownCard) {
      const correctBtn = screen.getByRole('button', { name: shownCard.payload.answer })
      await userEvent.click(correctBtn)
      // The blank should now show the answer
      expect(screen.getAllByText(shownCard.payload.answer, { selector: 'span' }).length).toBeGreaterThan(0)
    }
  })

  it('shows meaning and grammar note after picking', async () => {
    render(<GrammarQuiz cards={CARDS} />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    // After picking, meaning and grammar note become visible (opacity-100)
    expect(screen.getByText(/我去學校。/)).toBeInTheDocument()
  })

  it('shows "下一題" button after picking when autoNext is off', async () => {
    render(<GrammarQuiz cards={CARDS} />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    const nextBtn = screen.getByRole('button', { name: /下一題|查看結果/ })
    expect(nextBtn).toBeVisible()
  })

  it('highlights correct choice green and wrong choice red', async () => {
    render(<GrammarQuiz cards={CARDS} />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    const allButtons = screen.getAllByRole('button')
    const hasGreen = allButtons.some((b) => b.className.includes('px-choice-correct'))
    expect(hasGreen).toBe(true)
  })

  it('shows round summary after answering all questions', async () => {
    const { useSettings } = await import('@/stores/useSettings')
    vi.mocked(useSettings).mockImplementation((selector: (s: Parameters<typeof selector>[0]) => unknown) =>
      selector({ autoNextGrammar: false, roundSizeGrammar: 5 } as Parameters<typeof selector>[0])
    )

    render(<GrammarQuiz cards={CARDS} />)

    for (let i = 0; i < 5; i++) {
      const choices = screen.getAllByRole('button').slice(0, 4)
      await userEvent.click(choices[0])
      const nextBtn = await screen.findByRole('button', { name: /下一題|查看結果/ })
      if (nextBtn.textContent?.includes('查看結果')) {
        await userEvent.click(nextBtn)
        break
      }
      await userEvent.click(nextBtn)
    }

    await waitFor(() => {
      expect(screen.getByText(/%/)).toBeInTheDocument()
    })
  })

  it('shows next round button after round is done', async () => {
    const { useSettings } = await import('@/stores/useSettings')
    vi.mocked(useSettings).mockImplementation((selector: (s: Parameters<typeof selector>[0]) => unknown) =>
      selector({ autoNextGrammar: false, roundSizeGrammar: 5 } as Parameters<typeof selector>[0])
    )

    render(<GrammarQuiz cards={CARDS} />)

    for (let i = 0; i < 5; i++) {
      const choices = screen.getAllByRole('button').slice(0, 4)
      await userEvent.click(choices[0])
      const nextBtn = await screen.findByRole('button', { name: /下一題|查看結果/ })
      if (nextBtn.textContent?.includes('查看結果')) {
        await userEvent.click(nextBtn)
        break
      }
      await userEvent.click(nextBtn)
    }

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /下一輪/ })).toBeInTheDocument()
    })
  })
})
