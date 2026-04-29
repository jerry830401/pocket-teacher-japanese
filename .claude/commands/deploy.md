# /deploy — 部署到 GitHub Pages

從 `origin/main` 取得最新版本後部署，不依賴本地未推送的 commit。

依序執行：

1. **確認環境**
   - 必須在 `main` 分支
   - 工作區必須乾淨（不允許未提交的變更）
   - `git fetch origin main --quiet`
   - 確認本地 HEAD 與 `origin/main` 一致；若不一致，告知使用者執行 `git pull` 後中止
   - 確認 Node.js >= 18（`node -e "process.stdout.write(String(process.versions.node.split('.')[0]))"` >= 18）
   - 確認 `node_modules` 存在

2. **執行測試**
   - `npm test`
   - 測試失敗時中止，不進行部署

3. **打包**
   - `npm run build`

4. **推送到 GitHub Pages**
   - `npx gh-pages -d dist -b gh-pages`

5. **回報結果**
   - 顯示部署完成，並印出網址：`https://jerry830401.github.io/pocket-teacher-japanese/`
