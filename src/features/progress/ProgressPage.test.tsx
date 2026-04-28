// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import type { SrsCard } from '@/lib/srs/types'

const mockToArray = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/db', () => ({
  db: { srsCards: { toArray: mockToArray } },
}))

import ProgressPage from './ProgressPage'

const makeCard = (cardId: string, repetitions: number): SrsCard => ({
  cardId,
  easeFactor: 2.5,
  interval: 1,
  repetitions,
  dueAt: Date.now(),
})

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => cleanup())

describe('ProgressPage', () => {
  it('shows loading state initially', () => {
    mockToArray.mockReturnValue(new Promise(() => {}))
    render(<ProgressPage />)
    expect(screen.getByText(/載入中/)).toBeInTheDocument()
  })

  it('shows error message when db fails', async () => {
    mockToArray.mockRejectedValue(new Error('db error'))
    render(<ProgressPage />)
    await waitFor(() => {
      expect(screen.getByText(/無法讀取學習記錄/)).toBeInTheDocument()
    })
  })

  it('shows empty hint when no records exist', async () => {
    mockToArray.mockResolvedValue([])
    render(<ProgressPage />)
    await waitFor(() => {
      expect(screen.getByText(/還沒有練習記錄/)).toBeInTheDocument()
    })
  })

  it('shows 五十音 section with hiragana data', async () => {
    const cards = [
      makeCard('kana-h-a', 3),
      makeCard('kana-h-i', 1),
      makeCard('kana-h-u', 0),
    ]
    mockToArray.mockResolvedValue(cards)
    render(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByText('五十音')).toBeInTheDocument()
      expect(screen.getByText('平假名')).toBeInTheDocument()
    })
  })

  it('shows 單字 section with vocab data', async () => {
    const cards = [
      makeCard('vocab-N5-001', 3),
      makeCard('vocab-N5-002', 1),
    ]
    mockToArray.mockResolvedValue(cards)
    render(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByText('單字')).toBeInTheDocument()
      expect(screen.getByText('N5')).toBeInTheDocument()
    })
  })

  it('shows 文法 section with grammar data', async () => {
    const cards = [
      makeCard('grammar-N5-001', 3),
      makeCard('grammar-N5-002', 1),
    ]
    mockToArray.mockResolvedValue(cards)
    render(<ProgressPage />)

    await waitFor(() => {
      expect(screen.getByText('文法')).toBeInTheDocument()
    })
  })

  it('shows mastered count correctly (repetitions >= 3)', async () => {
    const cards = [
      makeCard('vocab-N5-001', 3),  // mastered
      makeCard('vocab-N5-002', 2),  // not mastered
      makeCard('vocab-N5-003', 5),  // mastered
    ]
    mockToArray.mockResolvedValue(cards)
    render(<ProgressPage />)

    await waitFor(() => {
      // 2 mastered out of 500 total
      expect(screen.getByText(/已熟悉 2 \/ 500/)).toBeInTheDocument()
    })
  })
})
