import { test, expect, type Page } from '@playwright/test'

/** 透過桌機頂部導覽列點擊切換頁面（Desktop Chrome viewport） */
async function navTo(page: Page, label: string) {
  await page.locator('header nav').getByText(label).click()
  await page.waitForTimeout(500)
}

test.describe('導覽列', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('learn')
    await page.waitForTimeout(1000)
  })

  test('顯示五個導覽項目', async ({ page }) => {
    const nav = page.locator('header nav')
    await expect(nav.getByText('學習')).toBeVisible()
    await expect(nav.getByText('測驗')).toBeVisible()
    await expect(nav.getByText('錯題')).toBeVisible()
    await expect(nav.getByText('進度')).toBeVisible()
    await expect(nav.getByText('設定')).toBeVisible()
  })

  test('點測驗後切換到測驗頁', async ({ page }) => {
    await navTo(page, '測驗')
    await expect(page.getByText('五十音')).toBeVisible()
  })

  test('點錯題後切換到錯題頁', async ({ page }) => {
    await navTo(page, '錯題')
    await expect(page.getByText('錯題本')).toBeVisible()
  })

  test('點進度後切換到進度頁', async ({ page }) => {
    await navTo(page, '進度')
    await expect(
      page.getByText('還沒有練習記錄，去各模組學習後就會顯示統計。').or(
        page.getByText(/已熟悉|已學習/)
      )
    ).toBeVisible({ timeout: 5000 })
  })

  test('點設定後切換到設定頁', async ({ page }) => {
    await navTo(page, '設定')
    await expect(page.getByRole('main').getByText('設定')).toBeVisible()
  })

  test('點學習後切換回學習頁', async ({ page }) => {
    await navTo(page, '測驗')
    await navTo(page, '學習')
    await expect(page.locator('.px-topic')).toHaveCount(4)
  })
})

test.describe('跨頁狀態保留', () => {
  test('在學習頁進入單字後切換到測驗再返回學習，主畫面顯示 tile', async ({ page }) => {
    await page.goto('learn')
    await page.waitForTimeout(1000)
    // 進入單字子頁
    await page.locator('.px-topic').nth(2).click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: 'N5' }).first()).toBeVisible()

    // 切到測驗頁
    await navTo(page, '測驗')
    await expect(page.getByText('五十音')).toBeVisible()

    // 切回學習頁 — 重新掛載後回到主畫面
    await navTo(page, '學習')
    await expect(page.locator('.px-topic')).toHaveCount(4)
  })

  test('在測驗頁進入五十音後切換到其他頁再返回，主畫面重新顯示 tile', async ({ page }) => {
    await page.goto('quiz')
    await page.waitForTimeout(1000)
    await page.locator('button.pcard-tap').filter({ hasText: '五十音' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('button').filter({ hasText: '平假名' }).first()).toBeVisible()

    // 切到進度頁再回來
    await navTo(page, '進度')
    await navTo(page, '測驗')

    // 重新掛載後回到 home — 顯示四個 tile
    await expect(page.locator('button.pcard-tap')).toHaveCount(4)
  })
})
