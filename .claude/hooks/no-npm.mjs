#!/usr/bin/env node
// PreToolUse hook：本專案統一用 pnpm（見 6540cee 與 .gitignore 對 package-lock.json
// 的排除）。誤打的 npm / npx 會生出第二份 lockfile，這裡在執行前就擋掉。

import { readPayload } from './read-payload.mjs'

// 只認「指令位置」的 npm/npx：開頭，或 ; & | ( 換行之後。
// 這樣 pnpm 不會被誤判，commit message 裡提到的 npm 也不會。
const OFFENDER = /(?:^|[;&|(\n])\s*(npm|npx)(?=\s|$)/

let payload
try {
  payload = await readPayload()
} catch (error) {
  process.stderr.write(`hook no-npm 無法解析 payload：${error.message}\n`)
  process.exit(1)
}

const hit = (payload?.tool_input?.command ?? '').match(OFFENDER)
if (!hit) process.exit(0)

const [, tool] = hit
const replacement = tool === 'npx' ? 'pnpm exec' : 'pnpm'

process.stdout.write(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        `本專案統一使用 pnpm，請把 \`${tool}\` 換成 \`${replacement}\` 再執行一次` +
        `（npm 會產生 package-lock.json，已被 .gitignore 排除）。`,
    },
  }),
)
