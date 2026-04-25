// getVoices() is async on Chrome — voices may be empty on first call.
// We wait for voiceschanged once, then cache the result.
let cachedVoices: SpeechSynthesisVoice[] | null = null

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

export async function speak(text: string, lang = 'ja-JP'): Promise<void> {
  if (!window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const voices = await loadVoices()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = lang
  utt.rate = 0.7
  const voice = pickJaVoice(voices)
  if (voice) utt.voice = voice
  window.speechSynthesis.speak(utt)
}

export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
