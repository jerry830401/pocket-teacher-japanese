/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
cleanupOutdatedCaches()

// Allow the page to trigger activation of a waiting SW
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting()
})

// __WB_MANIFEST is replaced by workbox-build with the precache manifest
precacheAndRoute(self.__WB_MANIFEST)
