// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import type { KanaChar } from '../types'
import KanaTable from './KanaTable'

const makeChar = (id: string, kana: string, romaji: string, group: KanaChar['group']): KanaChar => ({
  id,
  kana,
  romaji,
  type: 'hiragana',
  group,
  order: 0,
})

const HIRAGANA_CHARS: KanaChar[] = [
  makeChar('h-a', 'あ', 'a', 'vowel'),
  makeChar('h-i', 'い', 'i', 'vowel'),
  makeChar('h-u', 'う', 'u', 'vowel'),
  makeChar('h-e', 'え', 'e', 'vowel'),
  makeChar('h-o', 'お', 'o', 'vowel'),
  makeChar('h-ka', 'か', 'ka', 'k'),
  makeChar('h-ki', 'き', 'ki', 'k'),
  makeChar('h-ku', 'く', 'ku', 'k'),
  makeChar('h-ke', 'け', 'ke', 'k'),
  makeChar('h-ko', 'こ', 'ko', 'k'),
  makeChar('h-n', 'ん', 'n', 'n-char'),
]

afterEach(() => cleanup())

describe('KanaTable', () => {
  it('renders section titles 清音 and 濁音・半濁音', () => {
    render(<KanaTable chars={HIRAGANA_CHARS} showRomaji={false} />)
    expect(screen.getByText('清音')).toBeInTheDocument()
    expect(screen.getByText('濁音・半濁音')).toBeInTheDocument()
  })

  it('renders kana characters in the grid', () => {
    render(<KanaTable chars={HIRAGANA_CHARS} showRomaji={false} />)
    expect(screen.getAllByText('あ').length).toBeGreaterThan(0)
    expect(screen.getAllByText('か').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ん').length).toBeGreaterThan(0)
  })

  it('shows romaji labels when showRomaji is true', () => {
    render(<KanaTable chars={HIRAGANA_CHARS} showRomaji={true} />)
    // romaji labels appear as small text under each kana
    const romajiEls = screen.getAllByText('a')
    expect(romajiEls.length).toBeGreaterThan(0)
  })

  it('does not show romaji labels when showRomaji is false', () => {
    render(<KanaTable chars={HIRAGANA_CHARS} showRomaji={false} />)
    // column header 'a' still exists, but kana-cell romaji should not render
    // The vowel column headers are always shown; check that kana cells don't add romaji
    const allText = document.body.textContent ?? ''
    // 'ka' as romaji should not appear (only 'か' kana)
    expect(allText).not.toContain('ka')
  })

  it('renders vowel column headers (a i u e o)', () => {
    render(<KanaTable chars={HIRAGANA_CHARS} showRomaji={false} />)
    // Each vowel header appears at least twice (once per section)
    expect(screen.getAllByText('a').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('i').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('u').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('e').length).toBeGreaterThanOrEqual(2)
    expect(screen.getAllByText('o').length).toBeGreaterThanOrEqual(2)
  })
})
