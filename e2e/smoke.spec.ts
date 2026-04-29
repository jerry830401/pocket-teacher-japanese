import { test, expect } from '@playwright/test'

test('首頁重導向到學習頁', async ({ page }) => {
  await page.goto('')
  await expect(page).toHaveURL(/\/learn/)
})

test('頂部導覽列顯示四個連結', async ({ page }) => {
  await page.goto('learn')
  // 桌機版導覽在 header 內，使用連結文字確認四個頁籤都存在
  for (const label of ['學習', '測驗', '錯題', '進度']) {
    await expect(page.getByRole('link', { name: label })).toBeVisible()
  }
})

test('可切換到測驗頁', async ({ page }) => {
  await page.goto('quiz')
  await expect(page).toHaveURL(/\/quiz/)
})

test('可切換到複習頁', async ({ page }) => {
  await page.goto('review')
  await expect(page).toHaveURL(/\/review/)
})

test('可切換到進度頁', async ({ page }) => {
  await page.goto('progress')
  await expect(page).toHaveURL(/\/progress/)
})
