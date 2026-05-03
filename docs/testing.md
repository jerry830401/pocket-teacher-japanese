# Testing Guide

## Two test layers

| Layer | Runner | Command | Coverage |
|-------|--------|---------|----------|
| Unit / component | Vitest | `npx vitest run` | SM-2 algorithm (`src/lib/srs/sm2.test.ts`), grammar quiz, progress page |
| E2E | Playwright | `npx playwright test` | All pages — learn, quiz (五十音/vocab/grammar/listening), review, settings, navigation |

## Playwright setup

Config: `playwright.config.ts`

- Viewport: `Desktop Chrome` — top nav (`header nav`) visible; bottom nav (`nav.md:hidden`) hidden
- Base URL: `http://localhost:5173/pocket-teacher-japanese/` (dev server auto-starts via `webServer`)
- Headed locally, headless on CI

## PWA / Offline

Test PWA locally with `npm run preview` — the dev server does not register the service worker.

## Writing e2e tests

- Navigate with `page.goto('learn')` (relative to baseURL, no leading slash)
- Use `header nav` for nav clicks — not the mobile bottom nav (hidden in Desktop Chrome)

Stable selectors (do not rename without updating specs):

| Selector | Where |
|----------|-------|
| `button.pcard-tap` | Quiz page subject tiles |
| `.px-topic` | Learn page subject tiles |
| `.px-choice` | Answer choices in all quiz types |
| `[data-blank="true"]` | Grammar fill-in-the-blank span |
| `[role="switch"]` | PxToggle component (settings page) |

## Seeding state for e2e tests

Tests that need pre-existing data navigate the UI to create it (no direct IndexedDB access from Playwright):

- **Listening quiz** — seed vocab by flipping cards on the learn page (`seedVocab` helper in `listening.spec.ts`)
- **Vocab / grammar quiz** — seed seen cards via learn page (`seedCards` helper in `quiz.spec.ts`)
- **Review (weak cards)** — deliberately answer wrong in 五十音 quiz; SM-2 sets `easeFactor < 2.5, repetitions = 0` which satisfies `isWeak` (`seedWeakKanaCards` helper in `review.spec.ts`)
