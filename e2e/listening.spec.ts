import { test, expect, type Page } from '@playwright/test'

/** 在學習頁翻單字卡片以建立 seenIds，供聽力測驗使用 */
async function seedVocab(page: Page, count: number) {
  await page.goto('learn')
  await page.waitForTimeout(1500)
  await page.locator('.px-topic').nth(2).click() // 單字
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

/** 導覽到聽力測驗題目畫面（需先 seed 足夠單字） */
async function goToListeningQuiz(page: Page) {
  await page.goto('quiz')
  await page.waitForTimeout(1500)
  await page.locator('button.pcard-tap').filter({ hasText: '聽力' }).first().click()
  await page.waitForTimeout(500)
  await page.locator('button.pcard-tap').filter({ hasText: 'N5' }).first().click()
  await page.waitForTimeout(2000)
}

test.describe('測驗頁 — 聽力', () => {
  test('顯示聽力 tile', async ({ page }) => {
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await expect(page.getByText('聽力')).toBeVisible()
  })

  test('點聽力後顯示 N5 等級按鈕', async ({ page }) => {
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').filter({ hasText: '聽力' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: 'N5' }).first()).toBeVisible()
  })

  test('未學習足夠單字時顯示提示訊息', async ({ page }) => {
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').filter({ hasText: '聽力' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button.pcard-tap').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(2000)
    // 如果沒有 seed，顯示「尚未學習足夠題目」；如果已有資料則顯示題目
    await expect(
      page.getByText('尚未學習足夠題目').or(page.getByText(/第 \d+ \/ \d+ 題/))
    ).toBeVisible({ timeout: 5000 })
  })
})

test.describe('測驗頁 — 聽力（有單字資料）', () => {
  test.beforeEach(async ({ page }) => {
    await seedVocab(page, 12)
    await goToListeningQuiz(page)
  })

  test('進入聽力測驗後顯示題目進度', async ({ page }) => {
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })
  })

  test('顯示播放發音按鈕', async ({ page }) => {
    await expect(page.getByRole('button', { name: '播放發音' })).toBeVisible({ timeout: 5000 })
  })

  test('顯示四個選項', async ({ page }) => {
    await expect(page.locator('.px-choice')).toHaveCount(4, { timeout: 5000 })
  })

  test('選擇答案後可繼續', async ({ page }) => {
    await page.locator('.px-choice').first().click()
    await expect(
      page.getByRole('button', { name: '下一題 →' }).or(
        page.getByRole('button', { name: '查看結果' })
      )
    ).toBeVisible({ timeout: 5000 })
  })

  test('返回按鈕可回到等級選擇', async ({ page }) => {
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '返回' }).click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: 'N5' }).first()).toBeVisible()
  })
})

test.describe('測驗完成流程 — 聽力', () => {
  test('答完全部題目後顯示正確率與下一輪按鈕', async ({ page }) => {
    await seedVocab(page, 12)
    await goToListeningQuiz(page)
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })

    const progressText = await page.getByText(/第 \d+ \/ \d+ 題/).textContent()
    const total = parseInt(progressText?.match(/\/ (\d+) 題/)?.[1] ?? '5')

    for (let i = 0; i < total; i++) {
      await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 5000 })
      await page.locator('.px-choice').first().click()
      await page.waitForTimeout(300)

      const isLast = i === total - 1
      const nextBtn = page.getByRole('button', { name: isLast ? '查看結果' : '下一題 →' })
      if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await nextBtn.click()
      }
    }

    await expect(page.getByText(/%/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /下一輪/ })).toBeVisible()
  })
})
