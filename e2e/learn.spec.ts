import { test, expect } from '@playwright/test'

// Helper: navigate into learn subject via tile click
async function goToSubject(page: import('@playwright/test').Page, tileIndex: number) {
  await page.goto('learn')
  await page.waitForTimeout(1500)
  await page.locator('.px-topic').nth(tileIndex).click()
  await page.waitForTimeout(500)
}

test.describe('學習頁 — 主畫面', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('learn')
    await page.waitForTimeout(1500)
  })

  test('顯示四個學科 tile', async ({ page }) => {
    const tiles = page.locator('.px-topic')
    await expect(tiles).toHaveCount(4)
  })

  test('顯示平假名、片假名、單字、文法 tile 文字', async ({ page }) => {
    await expect(page.getByText('平假名')).toBeVisible()
    await expect(page.getByText('片假名')).toBeVisible()
    await expect(page.getByText('單字')).toBeVisible()
    await expect(page.getByText('文法')).toBeVisible()
  })
})

test.describe('學習頁 — 五十音（平假名）', () => {
  test('點平假名 tile 後顯示行列表', async ({ page }) => {
    await goToSubject(page, 0) // あ 平假名
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible()
    // 至少一個行按鈕
    await expect(page.locator('button.w-full').first()).toBeVisible()
  })

  test('點行後顯示假名卡片', async ({ page }) => {
    await goToSubject(page, 0)
    await page.locator('button.w-full').first().click()
    await page.waitForTimeout(500)
    // 假名卡片含有假名字符
    await expect(page.locator('.pcard').first()).toBeVisible()
    await expect(page.locator('span.kana').first()).toBeVisible()
  })

  test('點片假名 tile 後顯示片假名行列表', async ({ page }) => {
    await goToSubject(page, 1) // ア 片假名
    await expect(page.getByRole('button', { name: '返回' })).toBeVisible()
    await expect(page.locator('button.w-full').first()).toBeVisible()
  })

  test('返回按鈕可回到主畫面', async ({ page }) => {
    await goToSubject(page, 0)
    await page.getByRole('button', { name: '返回' }).click()
    await page.waitForTimeout(300)
    await expect(page.locator('.px-topic')).toHaveCount(4)
  })
})

test.describe('學習頁 — 單字', () => {
  test('點單字 tile 後顯示 N5 等級按鈕', async ({ page }) => {
    await goToSubject(page, 2) // 語 單字
    await expect(page.locator('button').filter({ hasText: 'N5' }).first()).toBeVisible()
  })

  test('點 N5 後顯示分類列表', async ({ page }) => {
    await goToSubject(page, 2)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: '全部' }).first()).toBeVisible()
  })

  test('點全部分類後進入單字學習，顯示進度', async ({ page }) => {
    await goToSubject(page, 2)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '全部' }).first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
  })

  test('可前進到下一張單字卡片', async ({ page }) => {
    await goToSubject(page, 2)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '全部' }).first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '下一張' }).or(
      page.getByRole('button', { name: '完成這組' })
    ).first().click()
    await expect(page.getByText(/第 2 \/ 5 張/)).toBeVisible()
  })

  test('完成一組後顯示下一組按鈕', async ({ page }) => {
    await goToSubject(page, 2)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '全部' }).first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
    for (let i = 0; i < 4; i++) {
      await page.getByRole('button', { name: '下一張' }).click()
    }
    await page.getByRole('button', { name: '完成這組' }).click()
    await expect(page.getByRole('button', { name: /下一組/ })).toBeVisible()
  })
})

test.describe('學習頁 — 文法', () => {
  test('點文法 tile 後顯示 N5 等級按鈕', async ({ page }) => {
    await goToSubject(page, 3) // 文 文法
    await expect(page.locator('button').filter({ hasText: 'N5' }).first()).toBeVisible()
  })

  test('點 N5 → 全部後進入文法學習，顯示進度', async ({ page }) => {
    await goToSubject(page, 3)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '全部' }).first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
  })

  test('可前進到下一張文法卡片', async ({ page }) => {
    await goToSubject(page, 3)
    await page.locator('button').filter({ hasText: 'N5' }).first().click()
    await page.waitForTimeout(500)
    await page.locator('button').filter({ hasText: '全部' }).first().click()
    await page.waitForTimeout(1500)
    await expect(page.getByText(/第 1 \/ 5 張/)).toBeVisible({ timeout: 8000 })
    await page.getByRole('button', { name: '下一張' }).or(
      page.getByRole('button', { name: '完成這組' })
    ).first().click()
    await expect(page.getByText(/第 2 \/ 5 張/)).toBeVisible()
  })
})
