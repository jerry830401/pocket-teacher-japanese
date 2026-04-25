---
description: 在 src/features/ 下建立新功能模組的骨架（types、資料層、頁面、路由）
allowed-tools: Read, Write, Edit, Bash
---

幫我在 `src/features/$ARGUMENTS/` 下建立新功能模組，並接入路由。

**請依序做以下步驟，每步完成後說明你做了什麼：**

1. **確認 `$ARGUMENTS` 有效**
   - 確認名稱是英文小寫 kebab-case（例如 `vocabulary`、`kanji`）
   - 如果沒有填入參數，告訴我該怎麼用：`/new-feature <模組名稱>`

2. **讀取現有路由與 Layout**
   - 讀 `src/App.tsx` 了解現有路由結構
   - 讀 `src/shared/Layout.tsx` 了解現有導覽項目

3. **建立模組骨架**（若目錄已存在則跳過）：
   ```
   src/features/$ARGUMENTS/
   ├── types.ts          # 型別定義（繼承 Card 介面的局部型別）
   ├── data.ts           # 資料載入與過濾函式
   ├── $ARGUMENTSPage.tsx  # 主頁面（PascalCase）
   └── components/       # 元件子目錄（先建空目錄用 .gitkeep 佔位）
   ```
   - `types.ts`：定義此功能的 payload 型別
   - `data.ts`：export `load<Feature>()` 非同步函式，從 `/data/<feature>.json` 載入
   - `<Feature>Page.tsx`：基本骨架（含 `useEffect` 載入資料、顯示「建置中」佔位文字）

4. **接入路由**
   - 在 `src/App.tsx` 加入 `lazy` import 與對應 `<Route>`
   - 在 `src/shared/Layout.tsx` 的 `navItems` 加入繁中導覽標籤

5. **驗證**
   - 執行 `npm run build`
   - 若有 TS 錯誤請修正後再回報

完成後告訴我下一步可以怎麼繼續（例如：「可以開始在 `$ARGUMENTS/components/` 裡實作 UI」）。
