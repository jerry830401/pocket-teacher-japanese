# /commit — 自動 commit

自動將所有已修改的檔案整理成一個 commit。依序執行：

1. **確認有變更**
   - `git status --short`
   - 若工作區完全乾淨（無已追蹤的變更），告知使用者後中止

2. **分析變更內容**
   - `git diff HEAD` 讀取所有已修改（含已暫存）的 diff
   - 根據 diff 內容自行判斷合適的 commit message，格式遵循 Conventional Commits：
     - `feat:` 新功能
     - `fix:` 修 bug
     - `refactor:` 重構（不影響行為）
     - `test:` 測試相關
     - `chore:` 建置、設定、雜項
     - `docs:` 文件
   - 若變更跨多個 scope，選最主要的一個或用逗號分隔（例如 `feat(quiz,review):`）
   - message 使用**英文**，簡短描述 *why*（不只是 *what*）

3. **顯示計畫並詢問確認**
   - 列出將被 commit 的檔案清單
   - 計算並顯示總共幾個檔案將被 commit（`git status --short | wc -l`）
   - 顯示草擬的 commit message
   - 詢問使用者：「確認 commit？(y / 修改 message / n 取消)」
   - 若使用者提供新的 message，使用使用者提供的版本

4. **執行前品質檢查**
   - `npm run lint` — 若有錯誤，列出問題並中止，不繼續 commit
   - 通過後才繼續

5. **執行 commit**
   - `git add -A`（暫存所有變更，含新增 untracked 檔案、修改、刪除）
   - `git commit -m "<message>"`

6. **回報結果**
   - 顯示 commit hash 與 message
   - 提示使用者若需要也可執行 `/bump` 推進版本，或 `git push` 推送

不做 push、不做 tag、不做部署。
