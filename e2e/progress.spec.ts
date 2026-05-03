import { test, expect, type Page } from '@playwright/test'

/** 在學習頁翻 count 張卡片（觸發 markAsSeen）*/
async function seedLearn(page: Page, subject: '單字' | '文法', count: number) {
  await page.goto('learn')
  await page.waitForTimeout(1500)
  const tileIndex = subject === '單字' ? 2 : 3
  await page.locator('.px-topic').nth(tileIndex).click()
  await page.waitForTimeout(500)
  await page.locator('button').filter({ hasText: 'N5' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('button').filter({ hasText: '全部' }).first().click()
  await page.waitForTimeout(1500)
  await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
  for (let i = 0; i < count; i++) {
    const nextGroupBtn = page.getByRole('button', { name: /下一組/ })
    const doneBtn = page.getByRole('button', { name: '完成這組' })
    const nextBtn = page.getByRole('button', { name: '下一張' })
    if (await nextGroupBtn.isVisible().catch(() => false)) {
      await nextGroupBtn.click()
      await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 5000 })
    } else if (await doneBtn.isVisible().catch(() => false)) {
      await doneBtn.click()
    } else {
      await nextBtn.click()
    }
  }
}

test.describe('進度頁', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('progress')
    await page.waitForTimeout(1500)
  })

  test('顯示統計數字或無記錄提示', async ({ page }) => {
    const noData = page.getByText('還沒有練習記錄，去各模組學習後就會顯示統計。')
    const hasData = page.getByText(/已熟悉|已學習/)
    await expect(noData.or(hasData)).toBeVisible({ timeout: 5000 })
  })

  test('答完五十音後進度頁不再顯示「還沒有練習記錄」', async ({ page }) => {
    // 五十音測驗：主畫面 → 五十音 → 平假名 → 看假名選讀音 → 答一題觸發 SRS 寫入
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').first().click() // 五十音
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '平假名' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '看假名選讀音' }).first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByText(/第 1 \/ \d+ 題/)).toBeVisible({ timeout: 5000 })
    await page.locator('.px-choice').first().click()

    await page.goto('progress')
    await expect(
      page.getByText('還沒有練習記錄，去各模組學習後就會顯示統計。')
    ).toBeHidden({ timeout: 5000 })
  })

  test('學習單字後進度頁顯示單字 N5 統計區塊', async ({ page }) => {
    await seedLearn(page, '單字', 10)
    await page.goto('progress')
    // total 由 ProgressPage 的 MODULE_TOTALS 決定，不硬編碼
    await expect(page.getByText(/已學習 \d+ \//)).toBeVisible({ timeout: 5000 })
  })
})
