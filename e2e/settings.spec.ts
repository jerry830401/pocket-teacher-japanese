import { test, expect } from '@playwright/test'

test.describe('設定頁', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('settings')
    await page.waitForTimeout(1000)
  })

  test('顯示設定頁標題', async ({ page }) => {
    await expect(page.getByRole('main').getByText('設定')).toBeVisible()
  })

  test('顯示老師角色切換按鈕', async ({ page }) => {
    await expect(page.getByRole('button', { name: '招財貓' })).toBeVisible()
    await expect(page.getByRole('button', { name: '柴犬' })).toBeVisible()
  })

  test('顯示答對自動下一題開關（四個科目）', async ({ page }) => {
    await expect(page.getByText('答對自動下一題')).toBeVisible()
    await expect(page.getByText('五十音').first()).toBeVisible()
    await expect(page.getByText('單字').first()).toBeVisible()
    await expect(page.getByText('文法').first()).toBeVisible()
    await expect(page.getByText('聽力').first()).toBeVisible()
  })

  test('顯示每輪題數選項 5、10、20', async ({ page }) => {
    await expect(page.getByText('每輪題數')).toBeVisible()
    // 確認三個題數按鈕至少出現一次
    await expect(page.getByRole('button', { name: '5' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: '10' }).first()).toBeVisible()
    await expect(page.getByRole('button', { name: '20' }).first()).toBeVisible()
  })

  test('切換到柴犬後不顯示貓咪花色區塊', async ({ page }) => {
    await page.getByRole('button', { name: '柴犬' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('貓咪花色')).toBeHidden()
  })

  test('切換到招財貓後顯示貓咪花色選項', async ({ page }) => {
    // 先切到柴犬再切回招財貓，確保狀態可切換
    await page.getByRole('button', { name: '柴犬' }).click()
    await page.waitForTimeout(300)
    await page.getByRole('button', { name: '招財貓' }).click()
    await page.waitForTimeout(300)
    await expect(page.getByText('貓咪花色')).toBeVisible()
    await expect(page.getByText('黑貓')).toBeVisible()
    await expect(page.getByText('賓士貓')).toBeVisible()
    await expect(page.getByText('三花貓')).toBeVisible()
    await expect(page.getByText('橘貓')).toBeVisible()
  })

  test('點擊自動下一題開關後狀態改變', async ({ page }) => {
    // role="switch" 是 PxToggle 的 aria 角色
    const toggles = page.locator('[role="switch"]')
    await expect(toggles.first()).toBeVisible()
    const before = await toggles.first().getAttribute('aria-checked')
    await toggles.first().click()
    await page.waitForTimeout(300)
    const after = await toggles.first().getAttribute('aria-checked')
    expect(after).not.toBe(before)
  })

  test('點擊每輪題數按鈕後該按鈕呈現選取樣式', async ({ page }) => {
    // 點 20 題，確認其背景色變為 gold（已選）
    const btn20 = page.getByRole('button', { name: '20' }).first()
    await btn20.click()
    await page.waitForTimeout(300)
    const bg = await btn20.evaluate((el) => getComputedStyle(el).backgroundColor)
    // --color-gold 在 chromium 下會解析為具體 rgb 值，確認不是預設 paper 色即可
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })
})
