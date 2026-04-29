// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Simulate non-PWA environment (isPwa returns false)
vi.mock('@/lib/pwa', () => ({ isPwa: () => false }))
vi.mock('@/features/progress/OfflineDataButton', () => ({ default: () => null }))

const mockSetAutoNext = vi.hoisted(() => vi.fn())
const mockSetRoundSize = vi.hoisted(() => vi.fn())

vi.mock('@/stores/useSettings', () => {
  const fullState = {
    autoNextKana: false, autoNextVocab: false, autoNextGrammar: false, autoNextListening: false,
    roundSizeKana: 10 as const, roundSizeVocab: 10 as const, roundSizeGrammar: 10 as const, roundSizeListening: 10 as const,
    setAutoNext: mockSetAutoNext,
    setRoundSize: mockSetRoundSize,
  }
  return {
    useSettings: vi.fn((selector?: (s: typeof fullState) => unknown) =>
      typeof selector === 'function' ? selector(fullState) : fullState
    ),
    QUIZ_ROUND_OPTIONS: [5, 10, 20] as const,
  }
})

import SettingsPage from './SettingsPage'

const renderSettings = () =>
  render(<MemoryRouter><SettingsPage /></MemoryRouter>)

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => cleanup())

describe('SettingsPage', () => {
  it('renders the page title 設定', () => {
    renderSettings()
    expect(screen.getByText('設定')).toBeInTheDocument()
  })

  it('renders autoNext section with all 4 modules', () => {
    renderSettings()
    expect(screen.getByText('答對自動下一題')).toBeInTheDocument()
    expect(screen.getAllByText('五十音').length).toBeGreaterThan(0)
    expect(screen.getAllByText('單字').length).toBeGreaterThan(0)
    expect(screen.getAllByText('文法').length).toBeGreaterThan(0)
    expect(screen.getAllByText('聽力').length).toBeGreaterThan(0)
  })

  it('renders round size section with options 5, 10, 20', () => {
    renderSettings()
    expect(screen.getByText('每輪題數')).toBeInTheDocument()
    // 4 modules × 3 options = 12 buttons with these values (plus back button + switches)
    const fiveButtons = screen.getAllByRole('button', { name: '5' })
    expect(fiveButtons.length).toBe(4)
  })

  it('calls setAutoNext when toggle is clicked', async () => {
    renderSettings()
    const toggles = screen.getAllByRole('switch')
    await userEvent.click(toggles[0])
    expect(mockSetAutoNext).toHaveBeenCalledOnce()
  })

  it('does not show offline section when not in PWA mode', () => {
    renderSettings()
    expect(screen.queryByText('離線')).not.toBeInTheDocument()
  })

  it('renders back button', () => {
    renderSettings()
    expect(screen.getByText(/← 返回/)).toBeInTheDocument()
  })
})
