import type { CSSProperties } from 'react'

interface Props {
  // sentenceRuby string with <ruby>漢字<rt>よみ</rt></ruby> and optionally ___ placeholder
  html?: string
  // plain sentence fallback when html is absent
  fallback: string
  // rendered in place of ___ when provided
  blankContent?: React.ReactNode
  blankStyle?: CSSProperties
}

// Parses <ruby>漢字<rt>よみ</rt></ruby> tags and an optional ___ blank placeholder.
export default function RubyText({ html, fallback, blankContent, blankStyle }: Props) {
  if (!html) {
    if (blankContent === undefined) return <>{fallback}</>
    const idx = fallback.indexOf('___')
    if (idx === -1) return <>{fallback}</>
    return (
      <>
        {fallback.slice(0, idx)}
        <span data-blank="true" style={blankStyle}>{blankContent}</span>
        {fallback.slice(idx + 3)}
      </>
    )
  }

  // Split on ruby tags and ___ blank, preserving them as tokens
  const parts = html.split(/(<ruby>.*?<\/ruby>|___)/g)

  return (
    <>
      {parts.map((part, i) => {
        if (part === '___') {
          if (blankContent === undefined) return null
          return <span key={i} data-blank="true" style={blankStyle}>{blankContent}</span>
        }
        const match = part.match(/^<ruby>(.*?)<rt>(.*?)<\/rt><\/ruby>$/)
        if (match) {
          return (
            <ruby key={i}>
              {match[1]}
              <rt style={{ fontSize: '0.6em', color: 'inherit', opacity: 0.75 }}>{match[2]}</rt>
            </ruby>
          )
        }
        return <span key={i}>{part}</span>
      })}
    </>
  )
}
