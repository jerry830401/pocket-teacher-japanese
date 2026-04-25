# Pocket Teacher Japanese (PTJP)

A frontend-only React web app for learning Japanese. Users practice 五十音, JLPT vocabulary, kanji, grammar, and listening — all locally in the browser via IndexedDB. No backend.

## Status

Phase 0 (scaffold) → Phase 1 (kana). Higher JLPT levels (N4–N1) are planned but not implemented; designs must keep them in mind.

## Stack

- Vite + React 19 + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Zustand for client state
- Dexie.js (IndexedDB) for SRS state and bundled JLPT content
- React Router v7
- Web Speech API for TTS
- Vite PWA (planned, Phase 5)

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | ESLint over the project |
| `npm run preview` | Serve the production build locally |
| `npm run deploy` | 發佈到 GitHub Pages，發佈前執行完整防呆檢查（分支、乾淨工作區、遠端同步、Node 版本、node_modules）|

## Project structure

```
src/
├── features/     One folder per learning module (kana, vocabulary, kanji, …).
│                 Each owns its components, hooks, store, types, and tests.
├── lib/          Cross-cutting infrastructure (srs/, db/, tts/).
├── shared/       Generic UI building blocks reused across features.
├── stores/       Top-level Zustand stores (settings, session).
├── pages/        Route-level components that compose features.
├── App.tsx       Router declaration.
└── main.tsx      React entry point.
```

Public data files (kana tables, JLPT vocab JSON, etc.) live under `public/data/` and are loaded into IndexedDB on first run.

## Conventions

- **Language**: User-facing text (UI labels, page copy, ARIA labels, errors, README, user-facing docs) is **Traditional Chinese (zh-Hant) primary, English supplementary**. English may appear smaller/secondary where it genuinely helps (technical terms, brand). Code-facing text (identifiers, comments, commit messages, TypeScript types, this file) stays English. Japanese learning content (kana, vocab, examples) stays Japanese.
- **Path alias**: import from `@/...` (configured in `vite.config.ts` and `tsconfig.app.json`). Avoid deep relative imports like `../../../`.
- **Feature-first**: new code goes under `src/features/<feature>/` unless it is genuinely cross-cutting, in which case it lives in `lib/` or `shared/`.
- **JLPT extensibility**: every learnable item must implement the shared `Card` interface (`id`, `type`, `level`, `payload`, `tags`). Adding N4–N1 should be a data change, not a code change.
- **Pure frontend**: no servers, no runtime API calls beyond bundled assets. Persistence is IndexedDB or LocalStorage.
- **No speaking features**: pronunciation grading, recording, etc. are out of scope.
- **Comments**: let names explain *what*; only comment when *why* is non-obvious (constraints, workarounds, surprising invariants).

## Out of scope

- Server-side rendering, authentication, multi-device sync.
- AI-generated content at runtime. (We may use AI offline to *prepare* data, but the shipped app is static.)
- Speaking practice and pronunciation grading.

## Testing

Not wired up yet. Planned: Vitest + React Testing Library, introduced alongside the SRS engine in Phase 2 where pure-logic testing has the highest payoff.
