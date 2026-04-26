# Pocket Teacher Japanese (PTJP)

純前端的 React 日文學習應用程式。所有學習資料與進度皆儲存於瀏覽器（IndexedDB），不需要後端。

## 功能範圍

- 五十音（平假名、片假名）
- JLPT N5 單字 500 筆、文法 200 筆（架構保留 N4–N1 擴充）
- 文法句型填空測驗
- 聽力（Web Speech API TTS）
- SRS 間隔重複 + 錯題本
- 離線支援（PWA + 手動下載資料至 IndexedDB）

> 不在範圍：口說 / 發音評分、後端服務、跨裝置同步。

## 開發指令

| 指令              | 用途                                    |
| ----------------- | --------------------------------------- |
| `npm install`     | 安裝依賴                                |
| `npm run dev`     | 啟動開發伺服器（http://localhost:5173） |
| `npm run build`   | 型別檢查 + production build + 產生 sw.js |
| `npm run lint`    | ESLint 檢查                              |
| `npm run preview` | 預覽 production build（可測試 PWA/SW）   |
| `npm run deploy`  | 部署到 GitHub Pages                      |

## 技術棧

Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Dexie.js (IndexedDB) · React Router v7 · Workbox (PWA)

## 專案結構

詳見 [CLAUDE.md](./CLAUDE.md)。
