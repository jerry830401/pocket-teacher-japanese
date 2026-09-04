# PTJP 測試指南

## 兩層測試

| 層級 | 工具 | 指令 | 涵蓋範圍 |
|------|------|------|----------|
| 單元 / 元件 | Vitest | `pnpm exec vitest run` | SM-2 演算法（`src/lib/srs/sm2.test.ts`）、文法測驗、進度頁 |
| E2E | Playwright | `pnpm exec playwright test` | 全部頁面 —— 學習、測驗（五十音／單字／文法／聽力）、複習、設定、導覽 |

## Playwright 設定

設定檔：`playwright.config.ts`

- 視窗：`Desktop Chrome` —— 頂部導覽（`header nav`）可見，底部導覽（`nav.md:hidden`）隱藏
- Base URL：`http://localhost:5173/pocket-teacher-japanese/`（dev server 由 `webServer` 自動啟動）
- 本機開視窗執行，CI 上 headless

## PWA / 離線

要在本機測 PWA 請用 `pnpm run preview` —— dev server 不會註冊 service worker。

## 撰寫 e2e 測試

- 用 `page.goto('learn')` 導頁（相對於 baseURL，開頭不要加斜線）
- 點導覽時用 `header nav`，不要用手機版的底部導覽（在 Desktop Chrome 下是隱藏的）

穩定選擇器（未同步更新 spec 前不要改名）：

| 選擇器 | 位置 |
|--------|------|
| `button.pcard-tap` | 測驗頁的科目卡 |
| `.px-topic` | 學習頁的科目卡 |
| `.px-choice` | 所有測驗類型的選項 |
| `[data-blank="true"]` | 文法填空的空格 span |
| `[role="switch"]` | PxToggle 元件（設定頁） |

## e2e 測試的資料準備

需要既有資料的測試一律透過操作 UI 產生（Playwright 不直接存取 IndexedDB）：

- **聽力測驗** —— 在學習頁翻卡以產生單字紀錄（`listening.spec.ts` 的 `seedVocab` helper）
- **單字／文法測驗** —— 透過學習頁產生「已看過」的卡（`quiz.spec.ts` 的 `seedCards` helper）
- **複習（弱卡）** —— 在五十音測驗中故意答錯；SM-2 會設成 `easeFactor < 2.5, repetitions = 0`，符合 `isWeak` 的判定（`review.spec.ts` 的 `seedWeakKanaCards` helper）
