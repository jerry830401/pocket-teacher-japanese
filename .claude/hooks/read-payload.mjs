// Hook 的 stdin 是 pipe，而 Edit 的 payload 可以到數百 KB（old_string、tool_response
// 都夾在裡面）。readFileSync(0) 在 Windows 上遇到這種大小會讀失敗，靜靜地讓 hook 空轉，
// 所以一律用串流把 chunk 收齊再 parse。
export async function readPayload() {
  const chunks = []
  for await (const chunk of process.stdin) chunks.push(chunk)
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
