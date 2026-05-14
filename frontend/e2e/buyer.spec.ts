import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Buyer flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.buyer.email, USERS.buyer.password);
  });

  test('browse produce page shows listings', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('heading', { name: 'Browse Produce' })).toBeVisible({ timeout: 8000 });
    // Wait for listings grid to populate (any listing card — they're divs with rounded-2xl)
    await expect(page.locator('.rounded-2xl.border').first()).toBeVisible({ timeout: 8000 });
  });

  test('sidebar shows Browse Produce link for buyer', async ({ page }) => {
    await expect(page.getByRole('link', { name: /browse/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /orders/i })).toBeVisible();
  });

  test('can navigate to orders page', async ({ page }) => {
    await page.getByRole('link', { name: /orders/i }).click();
    await expect(page).toHaveURL(/\/orders/);
  });

  test('order modal opens when clicking order button', async ({ page }) => {
    await page.goto('/browse');
    // Wait for listings to load
    await expect(page.locator('.rounded-2xl.border').first()).toBeVisible({ timeout: 8000 });
    const orderBtn = page.getByRole('button', { name: /^order$/i }).first();
    if (await orderBtn.isVisible({ timeout: 2000 })) {
      await orderBtn.click();
      // Modal uses fixed overlay, not dialog role — check for modal heading
      await expect(page.getByText(/place order/i).or(page.locator('.fixed.inset-0.z-50'))).toBeVisible({ timeout: 5000 });
    }
  });
});
