import { test, expect } from '@playwright/test'

test.describe('錯題頁 — 初始狀態', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('review')
  })

  test('顯示錯題本標題', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '錯題本' })).toBeVisible()
  })

  test('無錯題時顯示鼓勵訊息，有錯題時顯示科目與張數', async ({ page }) => {
    // 全新 DB：只顯示「沒有錯題」訊息；有弱卡時顯示科目區塊和「張待加強」
    const emptyMsg = page.getByText('目前沒有錯題，繼續保持！')
    const hasCards = page.getByText(/張待加強/)
    await expect(emptyMsg.or(hasCards)).toBeVisible({ timeout: 5000 })
  })

  test('有錯題時顯示三個科目區塊', async ({ page }) => {
    // 只在有弱卡的情況下驗科目標籤
    const hasCards = page.getByText(/張待加強/)
    if (!await hasCards.isVisible({ timeout: 3000 }).catch(() => false)) {
      // 無錯題，略過此測試
      test.skip()
      return
    }
    await expect(page.getByText('五十音')).toBeVisible()
    await expect(page.getByText('單字')).toBeVisible()
    await expect(page.getByText('文法')).toBeVisible()
  })
})

test.describe('錯題頁 — 開始複習', () => {
  test('點開始複習：錯題不足 4 張顯示提示，足夠則進入測驗', async ({ page }) => {
    await page.goto('review')
    await expect(
      page.getByText('目前沒有錯題，繼續保持！').or(
        page.getByText(/張待加強/)
      )
    ).toBeVisible({ timeout: 5000 })

    const startBtn = page.getByRole('button', { name: '開始複習' }).first()
    if (!await startBtn.isVisible()) return

    await startBtn.click()
    await expect(
      page.getByText('錯題不足 4 張，多練幾輪後再回來！').or(
        page.getByText(/第 \d+ \/ \d+ 題/)
      )
    ).toBeVisible({ timeout: 5000 })
  })

  test('進入複習測驗後可返回錯題列表', async ({ page }) => {
    await page.goto('review')

    const startBtn = page.getByRole('button', { name: '開始複習' }).first()
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) return

    await startBtn.click()

    const backBtn = page.getByRole('button', { name: /← 返回/ })
    if (!await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) return

    await backBtn.click()
    await expect(page.getByRole('heading', { name: '錯題本' })).toBeVisible()
  })
})
