import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Buyer flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.buyer.email, USERS.buyer.password);
  });

  test('browse produce page shows listings', async ({ page }) => {
    await page.goto('/browse');
    await expect(page.getByRole('heading', { name: 'Browse Produce' })).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId('listing-card').first()).toBeVisible({ timeout: 8000 });
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
    await expect(page.getByTestId('listing-card').first()).toBeVisible({ timeout: 8000 });
    const orderBtn = page.getByRole('button', { name: /^order$/i }).first();
    if (await orderBtn.isVisible({ timeout: 2000 })) {
      await orderBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    }
  });
});
