/// <reference lib="webworker" />
import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'

declare const self: ServiceWorkerGlobalScope

clientsClaim()
self.skipWaiting()

cleanupOutdatedCaches()

// __WB_MANIFEST is replaced by workbox-build with the precache manifest
precacheAndRoute(self.__WB_MANIFEST)
