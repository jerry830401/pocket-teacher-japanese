import { test, expect } from '@playwright/test'

// tab 按鈕的文字是 icon span + label（如「あ五十音」），用 filter hasText 匹配
const vocabTab = (page: import('@playwright/test').Page) =>
  page.locator('button').filter({ hasText: '單字' }).first()
const grammarTab = (page: import('@playwright/test').Page) =>
  page.locator('button').filter({ hasText: '文法' }).first()

test.describe('學習頁 — 五十音', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('learn')
  })

  test('顯示五十音、單字、文法三個分頁按鈕', async ({ page }) => {
    await expect(page.locator('button').filter({ hasText: '五十音' }).first()).toBeVisible()
    await expect(vocabTab(page)).toBeVisible()
    await expect(grammarTab(page)).toBeVisible()
  })

  test('預設顯示平假名表格', async ({ page }) => {
    await expect(page.getByRole('button', { name: '平假名' })).toBeVisible()
    await expect(page.getByText('あ').first()).toBeVisible()
  })

  test('切換到片假名', async ({ page }) => {
    await page.getByRole('button', { name: '片假名' }).click()
    await expect(page.getByText('ア').first()).toBeVisible()
  })

  test('顯示/隱藏羅馬拼音', async ({ page }) => {
    const checkbox = page.getByLabel('顯示羅馬拼音')
    await checkbox.check()
    await expect(page.getByText('a').first()).toBeVisible()
  })
})

test.describe('學習頁 — 單字', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('learn')
    await vocabTab(page).click()
  })

  test('顯示 N5 卡片與導覽按鈕', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '下一張' }).or(
        page.getByRole('button', { name: '完成這組' })
      )
    ).toBeVisible({ timeout: 8000 })
  })

  test('顯示第一張進度', async ({ page }) => {
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
  })

  test('可前進到下一張卡片', async ({ page }) => {
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '下一張' }).or(
      page.getByRole('button', { name: '完成這組' })
    ).first().click()
    await expect(page.getByText(/第 2 \/ 5 張/)).toBeVisible()
  })

  test('上一張按鈕在第一張時為 disabled', async ({ page }) => {
    await expect(page.getByRole('button', { name: '上一張' })).toBeDisabled({ timeout: 8000 })
  })

  test('完成一組後顯示下一組按鈕', async ({ page }) => {
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: '下一張' }).click()
    }
    await page.getByRole('button', { name: '完成這組' }).click()
    await expect(page.getByRole('button', { name: '下一組' })).toBeVisible()
  })
})

test.describe('學習頁 — 文法', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('learn')
    await grammarTab(page).click()
  })

  test('顯示文法卡片', async ({ page }) => {
    await expect(
      page.getByRole('button', { name: '下一張' }).or(
        page.getByRole('button', { name: '完成這組' })
      )
    ).toBeVisible({ timeout: 8000 })
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible()
  })

  test('可前進到下一張文法卡片', async ({ page }) => {
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '下一張' }).or(
      page.getByRole('button', { name: '完成這組' })
    ).first().click()
    await expect(page.getByText(/第 2 \/ 5 張/)).toBeVisible()
  })
})
