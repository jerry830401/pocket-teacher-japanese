# Pocket Teacher Japanese (PTJP)

A frontend-only React web app for learning Japanese. Users practice 五十音, JLPT vocabulary, grammar, and listening — all locally in the browser via IndexedDB. No backend.

## Status

N5 complete (kana + vocabulary 500 entries + grammar 200 entries, listening, SRS review, weak-card review, offline PWA). Higher JLPT levels (N4–N1) are planned but not yet populated; designs must keep them in mind.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Zustand for client state
- Dexie.js (IndexedDB) for SRS state and bundled JLPT content
- React Router v7
- Web Speech API for TTS
- Workbox service worker (offline PWA)

## Commands

| Command | What it does |
|---|---|
| `pnpm run dev` | Vite dev server (http://localhost:5173) |
| `pnpm run build` | Type-check (`tsc -b`), production build, then generate `dist/sw.js` via Workbox |
| `pnpm run lint` | ESLint over the project |
| `pnpm run preview` | Serve the production build locally |
| `pnpm run deploy` | 發佈到 GitHub Pages，發佈前執行完整防呆檢查（分支、乾淨工作區、遠端同步、Node 版本、node_modules）|

## Project structure

```
src/
├── features/     One folder per learning module (kana, vocabulary, grammar, listening, progress).
│                 Each owns its components, hooks, types, and tests.
├── lib/          Cross-cutting infrastructure (srs/, db/, tts/).
├── shared/       Generic UI building blocks reused across features.
├── App.tsx       Router declaration.
└── main.tsx      React entry point.
```

Public data files live under `public/data/` and are fetched at runtime (not bundled into JS):

| File | ID format | Notes |
|------|-----------|-------|
| `kana.json` | `h-a`, `k-ka` | Loaded once, cached in module |
| `vocabulary.json` | `vocab-N5-001` | Prefers IndexedDB (`offlineData` table); falls back to fetch |
| `grammar.json` | `grammar-N5-001` | Prefers IndexedDB (`offlineData` table); falls back to fetch |

All cards implement the shared `Card` interface: `{ id, type, level, payload, tags }`.

## Conventions

- **Language**: User-facing text (UI labels, page copy, ARIA labels, errors, README, user-facing docs) is **Traditional Chinese (zh-Hant) primary, English supplementary**. English may appear smaller/secondary where it genuinely helps (technical terms, brand). Code-facing text (identifiers, comments, commit messages, TypeScript types, this file) stays English. Japanese learning content (kana, vocab, examples) stays Japanese.
- **Path alias**: import from `@/...` (configured in `vite.config.ts` and `tsconfig.app.json`). Avoid deep relative imports like `../../../`.
- **Feature-first**: new code goes under `src/features/<feature>/` unless it is genuinely cross-cutting, in which case it lives in `lib/` or `shared/`.
- **JLPT extensibility**: every learnable item must implement the shared `Card` interface (`id`, `type`, `level`, `payload`, `tags`). Adding N4–N1 should be a data-only change — add entries to the relevant JSON under `public/data/`; no code changes required.
- **Pure frontend**: no servers, no runtime API calls beyond bundled assets. Persistence is IndexedDB or LocalStorage.
- **No speaking features**: pronunciation grading, recording, etc. are out of scope.
- **CSS class naming**: UI primitives use the `px-` prefix (`px-topic`, `px-choice`, `px-toggle`, etc.). Quiz subject cards use `pcard-tap`. These class names are stable e2e selectors — do not rename without updating specs.
- **Comments**: let names explain *what*; only comment when *why* is non-obvious (constraints, workarounds, surprising invariants).

## Out of scope

- Kanji module (removed from roadmap).
- Server-side rendering, authentication, multi-device sync.
- AI-generated content at runtime. (We may use AI offline to *prepare* data, but the shipped app is static.)
- Speaking practice and pronunciation grading.

## Testing

- Unit / component: `pnpm exec vitest run`
- E2E: `pnpm exec playwright test` (Desktop Chrome, dev server auto-starts)
- Details and selector conventions: `docs/testing.md`

## Architecture

Core data-flow, SRS update rules, weak-card criteria, and design invariants are documented in `docs/architecture.md`. Read it before modifying quiz, review, or SRS-related code.
