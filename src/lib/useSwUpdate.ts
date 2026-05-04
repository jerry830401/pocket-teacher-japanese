import { useEffect, useState } from 'react'

export function useSwUpdate() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const checkRegistration = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        setWaitingSW(reg.waiting)
        return
      }
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing
        if (!installing) return
        installing.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            setWaitingSW(installing)
          }
        })
      })
    }

    navigator.serviceWorker.getRegistration().then((reg) => {
      if (reg) checkRegistration(reg)
    })
  }, [])

  function applyUpdate() {
    if (!waitingSW) return
    waitingSW.postMessage({ type: 'SKIP_WAITING' })
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    }, { once: true })
  }

  return { hasUpdate: waitingSW !== null, applyUpdate }
}
