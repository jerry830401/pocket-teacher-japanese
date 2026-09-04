# /bump — 版本推進

詢問使用者要推進的版本類型（patch / minor / major），然後依序執行：

1. **確認環境**
   - 必須在 `main` 分支（`git rev-parse --abbrev-ref HEAD`）
   - 工作區必須乾淨（`git diff --quiet && git diff --cached --quiet`）
   - 若有未暫存或暫存的變更，告知使用者後中止

2. **執行測試**
   - `pnpm test`
   - 測試失敗時中止，不進行版本推進

3. **推進版本**
   - 用 `pnpm version <patch|minor|major> --no-git-tag-version` 更新 `package.json`
   - 讀取新版本號（`node -p "require('./package.json').version"`）
   - `git add package.json`
   - `git commit -m "chore: bump version to v<NEW_VERSION>"`
   - `git tag v<NEW_VERSION>`

4. **回報結果**
   - 顯示新版本號與 tag 名稱
   - 提示使用者可執行 `/deploy` 部署，或 `git push --follow-tags` 推送 tag

不做 build、不做 push、不做部署。
