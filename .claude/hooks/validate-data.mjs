#!/usr/bin/env node
// PostToolUse hook：public/data 下的 JSON 一被改動，立刻跑 schema 測試。
//
// jsonSchema.test.ts 的規則（重複 ID、跨等級重複單字、tag 白名單、挖空數量…）
// 本來只在 /commit 與 CI 才驗，錯誤往往拖到事後才發現。掛在編輯當下才擋得住。

import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, relative, sep } from 'node:path'
import { readPayload } from './read-payload.mjs'

const SCHEMA_TEST = 'src/lib/data/jsonSchema.test.ts'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const dataDir = resolve(projectRoot, 'public/data')

// 路徑比對一律走 node:path，不自己寫分隔符的 regex：hook 收到的 file_path 在
// Windows 上是反斜線，相對路徑則兩種都可能。
function isDataFile(filePath) {
  if (!filePath) return false
  const rel = relative(dataDir, resolve(projectRoot, filePath))
  return rel.endsWith('.json') && !rel.startsWith('..') && !rel.includes(sep)
}

let payload
try {
  payload = await readPayload()
} catch (error) {
  // 讀不到 payload 就不擋工作，但要讓人看見這個 hook 壞了，而不是靜靜失效。
  process.stderr.write(`hook validate-data 無法解析 payload：${error.message}\n`)
  process.exit(1)
}

if (!isDataFile(payload?.tool_input?.file_path)) process.exit(0)

const result = spawnSync('pnpm', ['exec', 'vitest', 'run', SCHEMA_TEST], {
  cwd: projectRoot,
  encoding: 'utf8',
  // pnpm 在 Windows 上是 .cmd shim，不透過 shell 會找不到
  shell: process.platform === 'win32',
})

if (result.status === 0) process.exit(0)

process.stderr.write(`資料驗證未通過（${SCHEMA_TEST}），請依下列失敗項目修正：\n\n`)
process.stderr.write(`${result.stdout ?? ''}${result.stderr ?? ''}`)
process.exit(2)
