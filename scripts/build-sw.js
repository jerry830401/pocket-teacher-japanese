// Generates dist/sw.js using Workbox injectManifest after Vite build.
// Two-step: esbuild bundles src/sw.ts → dist/sw-src.js, then workbox injects the precache manifest.
import { injectManifest } from 'workbox-build'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { rmSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

// Step 1: bundle sw.ts with workbox packages
await build({
  entryPoints: [resolve(root, 'src/sw.ts')],
  outfile: resolve(root, 'dist/sw-src.js'),
  bundle: true,
  format: 'esm',
  target: 'chrome96',
  minify: true,
})

// Step 2: inject precache manifest
const result = await injectManifest({
  swSrc: resolve(root, 'dist/sw-src.js'),
  swDest: resolve(root, 'dist/sw.js'),
  globDirectory: resolve(root, 'dist'),
  globPatterns: [
    '**/*.{js,css,html,svg,png,ico,woff2}',
    'data/*.json',
  ],
  modifyURLPrefix: { '': '/pocket-teacher-japanese/' },
  // exclude the intermediate sw-src file
  globIgnores: ['sw-src.js', 'sw.js'],
})

// Clean up intermediate file
rmSync(resolve(root, 'dist/sw-src.js'))

console.log(`Service Worker generated — ${result.count} files precached (${Math.round(result.size / 1024)} kB)`)
