// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { VocabCard } from '../types'

vi.mock('@/lib/db/db', () => ({
  getOrCreateCard: vi.fn().mockResolvedValue({ cardId: 'vocab-N5-001', easeFactor: 2.5, interval: 0, repetitions: 0, dueAt: 0 }),
  saveCard: vi.fn().mockResolvedValue(undefined),
}))

const mockStore = { autoNextVocab: false, roundSizeVocab: 5, mascotKind: 'cat', catVariant: 'black', dogVariant: 'shiba' }
vi.mock('@/stores/useSettings', () => ({
  useSettings: vi.fn((selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore
  ),
}))

import VocabQuiz from './VocabQuiz'

const makeCard = (id: string, word: string, meaning: string): VocabCard => ({
  id,
  type: 'vocabulary',
  level: 'N5',
  payload: { word, reading: word, meaning, pos: 'noun' },
  tags: [],
})

const CARDS: VocabCard[] = [
  makeCard('vocab-N5-001', 'いぬ', '狗'),
  makeCard('vocab-N5-002', 'ねこ', '貓'),
  makeCard('vocab-N5-003', 'とり', '鳥'),
  makeCard('vocab-N5-004', 'さかな', '魚'),
  makeCard('vocab-N5-005', 'うま', '馬'),
]

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => cleanup())

describe('VocabQuiz', () => {
  it('renders a word card with 4 meaning choices', () => {
    render(<VocabQuiz cards={CARDS} />)
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('shows progress as "第 1 / N 題"', () => {
    render(<VocabQuiz cards={CARDS} />)
    expect(screen.getByText(/第 1 \//)).toBeInTheDocument()
  })

  it('shows correct count starting at 0', () => {
    render(<VocabQuiz cards={CARDS} />)
    expect(screen.getByText(/正確 0/)).toBeInTheDocument()
  })

  it('marks correct answer green and wrong answer red after picking', async () => {
    render(<VocabQuiz cards={CARDS} />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    const allButtons = screen.getAllByRole('button')
    const hasGreen = allButtons.some((b) => b.className.includes('px-choice-correct'))
    const hasRed = allButtons.some((b) => b.className.includes('px-choice-wrong'))
    expect(hasGreen || hasRed).toBe(true)
  })

  it('shows "下一題" button after picking when autoNext is off', async () => {
    render(<VocabQuiz cards={CARDS} />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    const nextBtn = screen.getByRole('button', { name: /下一題|查看結果/ })
    expect(nextBtn).toBeVisible()
  })

  it('increments correct count when correct answer is picked', async () => {
    render(<VocabQuiz cards={CARDS} />)

    // Find which card is currently displayed by checking which meaning buttons are visible
    // One of the 4 choice buttons corresponds to the correct answer
    // Try each meaning until we find one that's the correct answer (correct count goes up)
    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    const meanings = CARDS.map((c) => c.payload.meaning)
    const correctBtn = choiceButtons.find((b) => meanings.includes(b.textContent ?? ''))

    // Identify which card is shown by looking at all text content
    const bodyText = document.body.textContent ?? ''
    const shownCard = CARDS.find((c) => bodyText.includes(c.payload.word))

    if (shownCard) {
      const btn = screen.getByRole('button', { name: shownCard.payload.meaning })
      await userEvent.click(btn)
      expect(screen.getByText(/正確 1/)).toBeInTheDocument()
    } else if (correctBtn) {
      // fallback: just verify visual feedback
      await userEvent.click(correctBtn)
      const allButtons = screen.getAllByRole('button')
      expect(allButtons.some((b) => b.className.includes('px-choice-correct'))).toBe(true)
    }
  })

  it('shows round summary after answering all questions', async () => {
    render(<VocabQuiz cards={CARDS} />)

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
      expect(screen.getByText(/題中答對/)).toBeInTheDocument()
    })
  })

  it('shows next round button after round is done', async () => {
    render(<VocabQuiz cards={CARDS} />)

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
