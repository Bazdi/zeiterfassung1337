import { test, expect } from '@playwright/test'

test('home redirects or loads without server error', async ({ page }) => {
  const resp = await page.goto('/')
  expect(resp?.status()).toBeLessThan(500)
})

test('timesheet month view mounts without server error', async ({ page }) => {
  const resp = await page.goto('/timesheet/month')
  expect(resp?.status()).toBeLessThan(500)
})

test('login page is reachable', async ({ page }) => {
  const resp = await page.goto('/login')
  expect(resp?.status()).toBeLessThan(500)
})

