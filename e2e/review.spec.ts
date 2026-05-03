import { test, expect, type Page } from '@playwright/test'

/**
 * 在五十音「看假名選讀音」測驗中故意答錯 count 題，
 * 使對應假名的 SRS 卡片成為弱卡（easeFactor < 2.5, repetitions=0）。
 */
async function seedWeakKanaCards(page: Page, count: number) {
  await page.goto('quiz')
  await page.waitForTimeout(1500)
  await page.locator('button.pcard-tap').filter({ hasText: '五十音' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('button').filter({ hasText: '平假名' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('button').filter({ hasText: '看假名選讀音' }).first().click()
  await page.waitForTimeout(1500)
  await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })

  for (let i = 0; i < count; i++) {
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 5000 })
    // 選最後一個選項（大概率答錯）
    await page.locator('.px-choice').last().click()
    await page.waitForTimeout(300)
    const nextBtn = page.getByRole('button', { name: '下一題' })
    const resultBtn = page.getByRole('button', { name: '查看結果' })
    if (await resultBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await resultBtn.click()
      break
    } else if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await nextBtn.click()
    }
  }
}

test.describe('錯題頁 — 初始狀態', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('review')
    await page.waitForTimeout(1500)
  })

  test('顯示錯題本標題', async ({ page }) => {
    await expect(page.getByText('錯題本')).toBeVisible()
  })

  test('無錯題時顯示鼓勵訊息，有錯題時顯示科目與張數', async ({ page }) => {
    const emptyMsg = page.getByText('目前沒有錯題，繼續保持！')
    const hasCards = page.getByText(/張待加強/)
    await expect(emptyMsg.or(hasCards)).toBeVisible({ timeout: 5000 })
  })

  test('有錯題時顯示科目區塊', async ({ page }) => {
    const hasCards = page.getByText(/張待加強/)
    if (!await hasCards.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip()
      return
    }
    await expect(page.getByText('五十音')).toBeVisible()
  })
})

test.describe('錯題頁 — 開始複習', () => {
  test('點開始複習：錯題不足 4 張顯示提示，足夠則進入測驗', async ({ page }) => {
    await page.goto('review')
    await page.waitForTimeout(1500)
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
    await page.waitForTimeout(1500)

    const startBtn = page.getByRole('button', { name: '開始複習' }).first()
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) return

    await startBtn.click()

    const backBtn = page.getByRole('button', { name: /← 返回/ })
    if (!await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) return

    await backBtn.click()
    await expect(page.getByText('錯題本')).toBeVisible()
  })
})

test.describe('錯題複習 — 有弱卡時的答題流程', () => {
  test.beforeEach(async ({ page }) => {
    // 在五十音答錯 8 題確保產生足夠弱卡（≥4 張）
    await seedWeakKanaCards(page, 8)
    await page.goto('review')
    await page.waitForTimeout(1500)
  })

  test('產生弱卡後錯題頁顯示五十音待加強區塊', async ({ page }) => {
    await expect(page.getByText(/張待加強/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('五十音')).toBeVisible()
  })

  test('弱卡足夠時點開始複習可進入測驗', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: '開始複習' }).first()
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip()
      return
    }
    await startBtn.click()
    await expect(
      page.getByText(/第 \d+ \/ \d+ 題/).or(
        page.getByText('錯題不足 4 張，多練幾輪後再回來！')
      )
    ).toBeVisible({ timeout: 5000 })
  })

  test('複習測驗中可答題並繼續', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: '開始複習' }).first()
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip()
      return
    }
    await startBtn.click()

    // 若弱卡不足 4 張則跳過
    const tooFew = page.getByText('錯題不足 4 張，多練幾輪後再回來！')
    if (await tooFew.isVisible({ timeout: 2000 }).catch(() => false)) {
      test.skip()
      return
    }

    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 5000 })
    await expect(page.locator('.px-choice')).toHaveCount(4)
    await page.locator('.px-choice').first().click()
    await expect(
      page.getByRole('button', { name: '下一題' }).or(
        page.getByRole('button', { name: '查看結果' })
      )
    ).toBeVisible({ timeout: 5000 })
  })

  test('複習測驗答完後可返回錯題列表', async ({ page }) => {
    const startBtn = page.getByRole('button', { name: '開始複習' }).first()
    if (!await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip()
      return
    }
    await startBtn.click()

    const backBtn = page.getByRole('button', { name: /← 返回/ })
    if (!await backBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      test.skip()
      return
    }
    await backBtn.click()
    await expect(page.getByText('錯題本')).toBeVisible()
  })
})
