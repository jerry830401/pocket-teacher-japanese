#!/usr/bin/env bash
# 發佈到 GitHub Pages 的防呆腳本
# 執行前會依序確認環境正確，全部通過才打包並推送。

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}✔${NC} $1"; }
fail() { echo -e "${RED}✘${NC} $1"; exit 1; }
warn() { echo -e "${YELLOW}!${NC} $1"; }

echo "=== 發佈前檢查 ==="

# 1. 必須在 main 分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "main" ] || fail "目前在 '$BRANCH' 分支，請先切回 main。"
pass "目前分支：main"

# 2. 工作區不能有未提交的變更
if ! git diff --quiet || ! git diff --cached --quiet; then
  fail "工作區有未提交的變更，請先 commit 或 stash。"
fi
pass "工作區乾淨"

# 3. 本地 main 必須與遠端同步（先 fetch）
git fetch origin main --quiet
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)
[ "$LOCAL" = "$REMOTE" ] || fail "本地 main 與 origin/main 不同步，請先 git pull。"
pass "本地與遠端同步"

# 4. 確認 Node.js 版本與 .prototools 一致
EXPECTED_NODE=$(grep -m1 '^node' .prototools | cut -d'"' -f2)
[ -n "$EXPECTED_NODE" ] || fail ".prototools 未指定 node 版本。"
ACTUAL_NODE=$(node -e "process.stdout.write(process.versions.node)")
[ "$ACTUAL_NODE" = "$EXPECTED_NODE" ] || fail "需要 Node.js $EXPECTED_NODE（.prototools），目前是 v$ACTUAL_NODE。請執行 proto install。"
pass "Node.js v$ACTUAL_NODE"

# 5. 確認相依套件已安裝且與 lockfile 一致
[ -d "node_modules" ] || fail "node_modules 不存在，請先執行 pnpm install。"
pnpm install --frozen-lockfile --prefer-offline >/dev/null || fail "相依套件與 pnpm-lock.yaml 不一致，請執行 pnpm install。"
pass "相依套件與 pnpm-lock.yaml 一致"

echo ""
echo "=== 開始打包 ==="
pnpm run build

echo ""
echo "=== 推送到 GitHub Pages ==="
pnpm exec gh-pages -d dist -b gh-pages

echo ""
pass "部署完成！網址：https://jerry830401.github.io/pocket-teacher-japanese/"
