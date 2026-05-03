import { test, expect, type Page } from '@playwright/test'

// Navigate: quiz top → subject tile → sub-tile if needed
async function goToQuizSubject(page: Page, tileIndex: number) {
  await page.goto('quiz')
  await page.waitForTimeout(1500)
  await page.locator('button.pcard-tap').nth(tileIndex).click()
  await page.waitForTimeout(500)
}

// Navigate all the way into kana quiz questions
async function goToKanaQuiz(page: Page, kanaType: '平假名' | '片假名', mode: '看假名選讀音' | '看讀音選假名') {
  await goToQuizSubject(page, 0) // 五十音
  await page.locator('button').filter({ hasText: kanaType }).first().click()
  await page.waitForTimeout(500)
  await page.locator('button').filter({ hasText: mode }).first().click()
  await page.waitForTimeout(1500)
}

// Seed vocab/grammar cards by flipping through learn page
async function seedCards(page: Page, subject: '單字' | '文法', count: number) {
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

test.describe('測驗頁 — 主畫面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('quiz')
    await page.waitForTimeout(1500)
  })

  test('顯示四個測驗科目 tile', async ({ page }) => {
    await expect(page.locator('button.pcard-tap')).toHaveCount(4)
  })

  test('顯示五十音、單字、文法、聽力 tile', async ({ page }) => {
    await expect(page.getByText('五十音')).toBeVisible()
    await expect(page.getByText('單字')).toBeVisible()
    await expect(page.getByText('文法')).toBeVisible()
    await expect(page.getByText('聽力')).toBeVisible()
  })
})

test.describe('測驗頁 — 五十音', () => {
  test('點五十音後顯示平假名、片假名選擇按鈕', async ({ page }) => {
    await goToQuizSubject(page, 0)
    await expect(page.locator('button').filter({ hasText: '平假名' }).first()).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '片假名' }).first()).toBeVisible()
  })

  test('點平假名後顯示測驗模式選擇', async ({ page }) => {
    await goToQuizSubject(page, 0)
    await page.locator('button').filter({ hasText: '平假名' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: '看假名選讀音' }).first()).toBeVisible()
    await expect(page.locator('button').filter({ hasText: '看讀音選假名' }).first()).toBeVisible()
  })

  test('進入「看假名選讀音」後顯示題目進度與四個選項', async ({ page }) => {
    await goToKanaQuiz(page, '平假名', '看假名選讀音')
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible()
    await expect(page.locator('.px-choice')).toHaveCount(4)
  })

  test('選擇答案後顯示下一題或查看結果', async ({ page }) => {
    await goToKanaQuiz(page, '平假名', '看假名選讀音')
    await expect(page.getByText(/第 1 \/ \d+ 題/)).toBeVisible()
    await page.locator('.px-choice').first().click()
    await expect(
      page.getByRole('button', { name: '下一題' }).or(
        page.getByRole('button', { name: '查看結果' })
      )
    ).toBeVisible()
  })

  test('進入「看讀音選假名」後選項改為假名', async ({ page }) => {
    await goToKanaQuiz(page, '平假名', '看讀音選假名')
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible()
    const kanaOptions = page.locator('.px-choice').filter({ hasText: /[ぁ-んァ-ン]/ })
    await expect(kanaOptions).toHaveCount(4)
  })

  test('切換為片假名模式後仍顯示題目', async ({ page }) => {
    await goToKanaQuiz(page, '片假名', '看假名選讀音')
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible()
    await expect(page.locator('.px-choice')).toHaveCount(4)
  })

  test('返回按鈕可回到上一層', async ({ page }) => {
    await goToKanaQuiz(page, '平假名', '看假名選讀音')
    await page.getByRole('button', { name: '返回' }).click()
    await page.waitForTimeout(500)
    // should be back at mode selection or type selection
    await expect(page.locator('button').filter({ hasText: /看假名選讀音|平假名/ }).first()).toBeVisible()
  })
})

test.describe('測驗頁 — 單字', () => {
  test.beforeEach(async ({ page }) => {
    await seedCards(page, '單字', 12)
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').nth(1).click() // 單字
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(3000)
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })
  })

  test('顯示日文單字題目', async ({ page }) => {
    await expect(page.locator('span, p').filter({ hasText: /[ぁ-んァ-ン一-龯]/ }).first()).toBeVisible()
  })

  test('顯示四個選項', async ({ page }) => {
    await expect(page.locator('.px-choice')).toHaveCount(4)
  })

  test('選擇答案後可繼續', async ({ page }) => {
    await page.locator('.px-choice').first().click()
    await expect(
      page.getByRole('button', { name: '下一題' }).or(
        page.getByRole('button', { name: '查看結果' })
      )
    ).toBeVisible()
  })
})

test.describe('測驗頁 — 文法', () => {
  test.beforeEach(async ({ page }) => {
    await seedCards(page, '文法', 12)
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').nth(2).click() // 文法
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(3000)
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })
  })

  test('顯示含空白欄位的句子', async ({ page }) => {
    await expect(page.locator('[data-blank="true"]')).toBeVisible()
  })

  test('顯示四個文法選項', async ({ page }) => {
    await expect(page.locator('.px-choice')).toHaveCount(4)
  })

  test('選擇答案後空白欄位填入答案（顯示為有色文字）', async ({ page }) => {
    const blank = page.locator('[data-blank="true"]')
    await expect(blank).toBeVisible()
    const colorBefore = await blank.evaluate((el) => getComputedStyle(el).borderBottomColor)
    await page.locator('.px-choice').first().click()
    await page.waitForTimeout(300)
    const colorAfter = await blank.evaluate((el) => getComputedStyle(el).borderBottomColor)
    expect(colorAfter).not.toBe(colorBefore)
  })
})

/** 答完一輪題目並點查看結果，驗證結果頁 */
async function completeRound(page: import('@playwright/test').Page) {
  const progressText = await page.getByText(/第 \d+ \/ \d+ 題/).textContent()
  const total = parseInt(progressText?.match(/\/ (\d+) 題/)?.[1] ?? '10')

  for (let i = 0; i < total; i++) {
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 5000 })
    await page.locator('.px-choice').first().click()
    await page.waitForTimeout(200)

    if (i === total - 1) {
      await page.getByRole('button', { name: '查看結果' }).click()
    } else {
      await page.getByRole('button', { name: '下一題' }).click()
    }
  }
}

test.describe('測驗完成流程 — 五十音', () => {
  test('答完全部題目後顯示結果與下一輪按鈕', async ({ page }) => {
    await goToKanaQuiz(page, '平假名', '看假名選讀音')
    await completeRound(page)
    await expect(page.getByText(/%/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /下一輪/ })).toBeVisible()
  })
})

test.describe('測驗完成流程 — 單字', () => {
  test('答完全部題目後顯示正確率與下一輪按鈕', async ({ page }) => {
    await seedCards(page, '單字', 12)
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').nth(1).click() // 單字
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(3000)
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })

    await completeRound(page)

    await expect(page.getByText(/%/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /下一輪/ })).toBeVisible()
  })
})

test.describe('測驗完成流程 — 文法', () => {
  test('答完全部題目後顯示正確率與下一輪按鈕', async ({ page }) => {
    await seedCards(page, '文法', 12)
    await page.goto('quiz')
    await page.waitForTimeout(1500)
    await page.locator('button.pcard-tap').nth(2).click() // 文法
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(3000)
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })

    await completeRound(page)

    await expect(page.getByText(/%/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /下一輪/ })).toBeVisible()
  })
})
