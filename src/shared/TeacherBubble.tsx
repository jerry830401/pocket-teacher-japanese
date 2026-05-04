import { useEffect, useState } from 'react'
import Mascot from './Mascot'
import { useSettings } from '@/stores/useSettings'
import type { MascotMood } from './Mascot'

interface TeacherBubbleProps {
  hint: string
  mood?: MascotMood
}

export default function TeacherBubble({ hint, mood = 'idle' }: TeacherBubbleProps) {
  const { mascotKind, catVariant, dogVariant } = useSettings()
  const [visible, setVisible] = useState(true)
  const [currentHint, setCurrentHint] = useState(hint)

  // fade-in animation on hint change
  useEffect(() => {
    const fadeOut = setTimeout(() => setVisible(false), 0)
    const fadeIn = setTimeout(() => {
      setCurrentHint(hint)
      setVisible(true)
    }, 120)
    return () => { clearTimeout(fadeOut); clearTimeout(fadeIn) }
  }, [hint])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      border: '2.5px solid var(--color-ink)',
      boxShadow: '3px 3px 0 var(--color-ink)',
      padding: '10px 12px',
      minHeight: 100,
      background: 'var(--color-cream)',
    }}>
      <div style={{ flexShrink: 0 }}>
        <Mascot kind={mascotKind} variant={mascotKind === 'cat' ? catVariant : dogVariant} mood={mood} size={4} />
      </div>
      <div
        style={{
          position: 'relative',
          background: 'var(--color-paper)',
          border: '2.5px solid var(--color-ink)',
          boxShadow: '3px 3px 0 var(--color-ink)',
          padding: '8px 12px',
          fontFamily: '"VT323", monospace',
          fontSize: '1.125rem',
          color: 'var(--color-ink)',
          lineHeight: 1.5,
          flex: 1,
          minHeight: 64,
          display: 'flex',
          alignItems: 'center',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(4px)',
          transition: 'opacity 0.18s ease, transform 0.18s ease',
        }}
      >
        {/* 對話泡泡左側箭頭 */}
        <span style={{
          position: 'absolute',
          left: -10,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '6px solid transparent',
          borderBottom: '6px solid transparent',
          borderRight: '8px solid var(--color-ink)',
        }} />
        <span style={{
          position: 'absolute',
          left: -6,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 0,
          height: 0,
          borderTop: '5px solid transparent',
          borderBottom: '5px solid transparent',
          borderRight: '7px solid var(--color-paper)',
        }} />
        {currentHint}
      </div>
    </div>
  )
}
