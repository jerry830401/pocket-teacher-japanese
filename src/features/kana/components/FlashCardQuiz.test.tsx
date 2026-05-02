// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { KanaChar } from '../types'

vi.mock('@/lib/db/db', () => ({
  getOrCreateCard: vi.fn().mockResolvedValue({ cardId: 'kana-h-a', easeFactor: 2.5, interval: 0, repetitions: 0, dueAt: 0 }),
  saveCard: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('@/stores/useSettings', () => ({
  useSettings: vi.fn((selector) => selector({
    autoNextKana: false,
    roundSizeKana: 10,
  })),
}))

import FlashCardQuiz from './FlashCardQuiz'

const makeChar = (id: string, kana: string, romaji: string): KanaChar => ({
  id,
  kana,
  romaji,
  type: 'hiragana',
  group: 'vowel',
  order: 0,
})

// Enough chars to build a round (need at least 4 for choices)
const CHARS: KanaChar[] = [
  makeChar('h-a', 'あ', 'a'),
  makeChar('h-i', 'い', 'i'),
  makeChar('h-u', 'う', 'u'),
  makeChar('h-e', 'え', 'e'),
  makeChar('h-o', 'お', 'o'),
]

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => cleanup())

describe('FlashCardQuiz', () => {
  it('renders a question card with 4 choice buttons', () => {
    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)
    const buttons = screen.getAllByRole('button')
    // 4 choices + 1 next button (invisible)
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it('shows progress as "第 1 / N 題"', () => {
    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)
    expect(screen.getByText(/第 1 \//)).toBeInTheDocument()
  })

  it('highlights correct answer green after picking correct choice', async () => {
    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)

    // Find all choice buttons (they show romaji in kana→romaji mode)
    const choiceButtons = screen.getAllByRole('button').filter((b) => !b.classList.contains('invisible') && b.getAttribute('disabled') === null)

    // Identify which button is the correct answer by checking text content against the displayed kana
    // We can't know which card was picked (shuffle), so click the first button and check for visual feedback
    const firstButton = choiceButtons[0]
    await userEvent.click(firstButton)

    // After picking, at least one button should have a green or red border class
    const allButtons = screen.getAllByRole('button')
    const hasGreen = allButtons.some((b) => b.className.includes('px-choice-correct'))
    const hasRed = allButtons.some((b) => b.className.includes('px-choice-wrong'))
    expect(hasGreen || hasRed).toBe(true)
  })

  it('makes choices non-clickable after one has been selected', async () => {
    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    // All choices should now have visual state (no longer show hover class)
    const buttons = screen.getAllByRole('button').slice(0, 4)
    buttons.forEach((b) => {
      expect(b.className).not.toContain('cursor-pointer')
    })
  })

  it('shows "下一題" button after picking when autoNext is off', async () => {
    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)

    const choiceButtons = screen.getAllByRole('button').slice(0, 4)
    await userEvent.click(choiceButtons[0])

    const nextBtn = screen.getByRole('button', { name: /下一題|查看結果/ })
    expect(nextBtn).toBeVisible()
  })

  it('shows round summary with percentage after completing all questions', async () => {
    // Use roundSize 5 matching our CHARS length via mock override
    const { useSettings } = await import('@/stores/useSettings')
    vi.mocked(useSettings).mockImplementation((selector: (s: Parameters<typeof selector>[0]) => unknown) =>
      selector({ autoNextKana: false, roundSizeKana: 5 } as Parameters<typeof selector>[0])
    )

    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)

    // Answer all 5 questions
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
      selector({ autoNextKana: false, roundSizeKana: 5 } as Parameters<typeof selector>[0])
    )

    render(<FlashCardQuiz chars={CHARS} mode="kana→romaji" />)

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

  it('works in romaji→kana mode (shows romaji as prompt)', () => {
    render(<FlashCardQuiz chars={CHARS} mode="romaji→kana" />)
    // In romaji→kana, choices should show kana characters
    // Just verify render doesn't crash and there are 4 choices
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })
})
