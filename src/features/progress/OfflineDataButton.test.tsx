// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockGetOfflineStatus = vi.hoisted(() => vi.fn())
const mockDownloadOfflineData = vi.hoisted(() => vi.fn())

vi.mock('@/lib/db/offlineData', () => ({
  getOfflineStatus: mockGetOfflineStatus,
  downloadOfflineData: mockDownloadOfflineData,
}))

// Override matchMedia to simulate standalone (PWA) mode before module loads
vi.stubGlobal('matchMedia', (_query: string) => ({
  matches: true, media: _query, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
}))

import OfflineDataButton from './OfflineDataButton'

beforeEach(() => { vi.clearAllMocks() })
afterEach(() => cleanup())

describe('OfflineDataButton', () => {
  it('shows download button when no offline data exists', async () => {
    mockGetOfflineStatus.mockResolvedValue({ hasData: false, savedAt: null })
    render(<OfflineDataButton />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '下載離線資料' })).toBeInTheDocument()
    })
  })

  it('shows update button when offline data already exists', async () => {
    mockGetOfflineStatus.mockResolvedValue({ hasData: true, savedAt: Date.now() })
    render(<OfflineDataButton />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument()
    })
  })

  it('shows downloading state while download is in progress', async () => {
    mockGetOfflineStatus.mockResolvedValue({ hasData: false, savedAt: null })
    // downloadOfflineData never resolves during this test
    mockDownloadOfflineData.mockReturnValue(new Promise(() => {}))

    render(<OfflineDataButton />)
    await waitFor(() => screen.getByRole('button', { name: '下載離線資料' }))

    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toBeDisabled()
    expect(screen.getByRole('button').textContent).toMatch(/下載中/)
  })

  it('shows updated timestamp after successful download', async () => {
    const savedAt = new Date('2026-04-26T10:00:00').getTime()
    mockGetOfflineStatus
      .mockResolvedValueOnce({ hasData: false, savedAt: null })
      .mockResolvedValueOnce({ hasData: true, savedAt })
    mockDownloadOfflineData.mockResolvedValue(undefined)

    render(<OfflineDataButton />)
    await waitFor(() => screen.getByRole('button', { name: '下載離線資料' }))

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '更新' })).toBeInTheDocument()
    })
    expect(screen.getByText(/已儲存/)).toBeInTheDocument()
  })

  it('shows error message when download fails', async () => {
    mockGetOfflineStatus.mockResolvedValue({ hasData: false, savedAt: null })
    mockDownloadOfflineData.mockRejectedValue(new Error('下載失敗：vocab (404)'))

    render(<OfflineDataButton />)
    await waitFor(() => screen.getByRole('button', { name: '下載離線資料' }))

    await userEvent.click(screen.getByRole('button'))

    await waitFor(() => {
      expect(screen.getByText('下載失敗：vocab (404)')).toBeInTheDocument()
    })
  })
})
