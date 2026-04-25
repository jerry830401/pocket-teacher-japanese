// getVoices() is async on Chrome — voices may be empty on first call.
// We wait for voiceschanged once, then cache the result.
let cachedVoices: SpeechSynthesisVoice[] | null = null

// Prevent Chrome GC bug: keep a strong reference to the active utterance so
// onend/onerror are not silently dropped after garbage collection.
let activeUtt: SpeechSynthesisUtterance | null = null  // eslint-disable-line prefer-const

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (cachedVoices) { resolve(cachedVoices); return }
    const voices = window.speechSynthesis.getVoices()
    if (voices.length > 0) {
      cachedVoices = voices
      resolve(voices)
      return
    }
    const onChanged = () => {
      cachedVoices = window.speechSynthesis.getVoices()
      window.speechSynthesis.removeEventListener('voiceschanged', onChanged)
      resolve(cachedVoices)
    }
    window.speechSynthesis.addEventListener('voiceschanged', onChanged)
  })
}

function pickJaVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  const jaVoices = voices.filter((v) => v.lang.startsWith('ja'))
  return jaVoices.find((v) => v.name.toLowerCase().includes('female') || /kyoko|o-ren|mizuki|haruka/i.test(v.name))
    ?? jaVoices[0]
    ?? null
}

function doSpeak(text: string, lang: string): void {
  const ss = window.speechSynthesis
  const utt = new SpeechSynthesisUtterance(text)
  activeUtt = utt
  utt.lang = lang
  utt.rate = 0.7
  utt.onend = () => { activeUtt = null }
  utt.onerror = () => { activeUtt = null }

  const voice = cachedVoices ? pickJaVoice(cachedVoices) : null
  if (voice) utt.voice = voice
  ss.speak(utt)

  // If voices weren't cached yet, patch voice after loading (utterance already queued)
  if (!cachedVoices) {
    loadVoices().then((voices) => {
      const v = pickJaVoice(voices)
      if (v) utt.voice = v
    })
  }

  // Chrome stall bug: after ~30 s of inactivity the engine freezes silently —
  // speaking stays false after speak(). Detect and retry within the same call,
  // which is safe because speak() is synchronous and stays on the gesture stack.
  setTimeout(() => {
    if (!ss.speaking && !ss.paused && activeUtt === utt) {
      ss.cancel()
      cachedVoices = null
      loadVoices().then(() => doSpeak(text, lang))
    }
  }, 200)
}

export function speak(text: string, lang = 'ja-JP'): void {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  doSpeak(text, lang)
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
