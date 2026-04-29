import { test, expect, type Page } from '@playwright/test'

// tab 按鈕文字是 icon span + label（如「語單字」），用 filter hasText 比對
const vocabTab = (page: Page) => page.locator('button').filter({ hasText: '單字' }).first()
const grammarTab = (page: Page) => page.locator('button').filter({ hasText: '文法' }).first()

/** 在學習頁翻完 N 張指定科目的卡片，以觸發 markAsSeen */
async function seedCards(page: Page, subject: '單字' | '文法', count: number) {
  await page.goto('learn')
  await page.locator('button').filter({ hasText: subject }).first().click()
  await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
  // 每組 5 張，翻完需要的組數
  for (let i = 0; i < count; i++) {
    const nextBtn = page.getByRole('button', { name: '下一張' })
    const doneBtn = page.getByRole('button', { name: '完成這組' })
    const nextGroupBtn = page.getByRole('button', { name: '下一組' })

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

test.describe('測驗頁 — 五十音', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('quiz')
    await expect(page.getByRole('button', { name: '平假名' })).toBeVisible({ timeout: 5000 })
  })

  test('顯示類型切換按鈕', async ({ page }) => {
    await expect(page.getByRole('button', { name: '平假名' })).toBeVisible()
    await expect(page.getByRole('button', { name: '片假名' })).toBeVisible()
  })

  test('顯示測驗模式切換按鈕', async ({ page }) => {
    await expect(page.getByRole('button', { name: '看假名選讀音' })).toBeVisible()
    await expect(page.getByRole('button', { name: '看讀音選假名' })).toBeVisible()
  })

  test('顯示題目進度與四個選項', async ({ page }) => {
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible()
    const choiceButtons = page.locator('.grid.grid-cols-2 button')
    await expect(choiceButtons).toHaveCount(4)
  })

  test('選擇答案後顯示下一題或查看結果', async ({ page }) => {
    await expect(page.getByText(/第 1 \/ \d+ 題/)).toBeVisible()
    await page.locator('.grid.grid-cols-2 button').first().click()
    await expect(
      page.getByRole('button', { name: '下一題' }).or(
        page.getByRole('button', { name: '查看結果' })
      )
    ).toBeVisible()
  })

  test('切換到片假名模式後仍顯示題目', async ({ page }) => {
    await page.getByRole('button', { name: '片假名' }).click()
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible()
  })

  test('切換到「看讀音選假名」模式，選項改為假名', async ({ page }) => {
    await page.getByRole('button', { name: '看讀音選假名' }).click()
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible()
    const kanaOptions = page.locator('.grid.grid-cols-2 button').filter({ hasText: /[ぁ-んァ-ン]/ })
    await expect(kanaOptions).toHaveCount(4)
  })
})

test.describe('測驗頁 — 單字', () => {
  test.beforeEach(async ({ page }) => {
    // 需先看過 ≥10 張卡片才能開始測驗
    await seedCards(page, '單字', 12)
    await page.goto('quiz')
    await vocabTab(page).click()
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })
  })

  test('顯示日文單字題目', async ({ page }) => {
    await expect(page.locator('span, p').filter({ hasText: /[ぁ-んァ-ン一-龯]/ }).first()).toBeVisible()
  })

  test('顯示四個選項', async ({ page }) => {
    await expect(page.locator('.grid.grid-cols-2 button')).toHaveCount(4)
  })

  test('選擇答案後可繼續', async ({ page }) => {
    await page.locator('.grid.grid-cols-2 button').first().click()
    await expect(
      page.getByRole('button', { name: '下一題' }).or(
        page.getByRole('button', { name: '查看結果' })
      )
    ).toBeVisible()
  })
})

test.describe('測驗頁 — 文法', () => {
  test.beforeEach(async ({ page }) => {
    // 需先看過 ≥10 張卡片才能開始測驗
    await seedCards(page, '文法', 12)
    await page.goto('quiz')
    await grammarTab(page).click()
    await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 8000 })
  })

  test('顯示含空白欄位的句子', async ({ page }) => {
    // 空白欄位是 span.border-b-2（全形空格），不是純文字 ___
    await expect(page.locator('span.border-b-2')).toBeVisible()
  })

  test('顯示四個文法選項', async ({ page }) => {
    await expect(page.locator('.grid.grid-cols-2 button')).toHaveCount(4)
  })

  test('選擇答案後空白欄位填入答案（顯示為有色文字）', async ({ page }) => {
    // 未選時空白欄位為 teal 色；選後變 green 或 red
    const blank = page.locator('span.border-b-2')
    await expect(blank).toBeVisible()
    await page.locator('.grid.grid-cols-2 button').first().click()
    // 選後 span 不再是空白，text-teal 類消失，改為 text-green 或 text-red
    await expect(blank).not.toHaveClass(/text-teal-400/, { timeout: 3000 })
  })
})

test.describe('測驗完成流程 — 五十音', () => {
  test('答完全部題目後顯示結果與下一輪按鈕', async ({ page }) => {
    await page.goto('quiz')
    await expect(page.getByRole('button', { name: '平假名' })).toBeVisible({ timeout: 5000 })

    const progressText = await page.getByText(/第 \d+ \/ \d+ 題/).textContent()
    const total = parseInt(progressText?.match(/\/ (\d+) 題/)?.[1] ?? '10')

    for (let i = 0; i < total; i++) {
      await expect(page.getByText(/第 \d+ \/ \d+ 題/)).toBeVisible({ timeout: 5000 })
      await page.locator('.grid.grid-cols-2 button').first().click()

      if (i === total - 1) {
        await page.getByRole('button', { name: '查看結果' }).click()
      } else {
        await page.getByRole('button', { name: '下一題' }).click()
      }
    }

    await expect(page.getByText(/%/)).toBeVisible({ timeout: 5000 })
    await expect(page.getByRole('button', { name: /下一輪/ })).toBeVisible()
  })
})
