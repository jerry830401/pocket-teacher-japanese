# Pocket Teacher Japanese (PTJP)

純前端的 React 日文學習應用程式。所有學習資料與進度皆儲存於瀏覽器（IndexedDB），不需要後端。

## 功能範圍

- 五十音（平假名、片假名）
- JLPT 單字與文法（N5、N4 已上線並持續擴充；N3–N1 規劃中）
- 文法句型填空測驗
- 聽力（Web Speech API TTS）
- SRS 間隔重複 + 錯題本
- 離線支援（PWA + 手動下載資料至 IndexedDB）

> 不在範圍：口說 / 發音評分、後端服務、跨裝置同步。

## 環境需求

工具鏈版本由 [proto](https://moonrepo.dev/proto) 的 `.prototools` 統一管理（Node 22.22.0、pnpm 10.28.0）。

```bash
proto install   # 依 .prototools 安裝指定版本
proto status    # 確認目前解析到的版本
```

未安裝 proto 時請自備 Node 22.x。

## 開發指令

| 指令              | 用途                                    |
| ----------------- | --------------------------------------- |
| `pnpm install`       | 安裝依賴                                |
| `pnpm run dev`     | 啟動開發伺服器（http://localhost:5173） |
| `pnpm run build`   | 型別檢查 + production build + 產生 sw.js |
| `pnpm run lint`    | ESLint 檢查                              |
| `pnpm run preview` | 預覽 production build（可測試 PWA/SW）   |
| `pnpm run deploy`  | 部署到 GitHub Pages                      |

## 技術棧

Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand · Dexie.js (IndexedDB) · React Router v7 · Workbox (PWA)

## 專案結構

詳見 [CLAUDE.md](./CLAUDE.md)。
