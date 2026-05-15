import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Admin flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
  });

  test('lands on orders page', async ({ page }) => {
    await expect(page).toHaveURL(/\/orders/);
  });

  test('sidebar shows admin nav items', async ({ page }) => {
    await expect(page.getByRole('link', { name: /orders/i }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /reports/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /browse produce/i })).toBeVisible();
  });

  test('can navigate to reports page', async ({ page }) => {
    await page.getByRole('link', { name: /reports/i }).click();
    await expect(page).toHaveURL(/\/reports/);
    await expect(page.getByRole('heading', { name: /reports/i })).toBeVisible({ timeout: 5000 });
  });

  test('orders page shows order list or empty state', async ({ page }) => {
    await expect(page.getByRole('main')).toBeVisible({ timeout: 5000 });
  });

  test('quality checks page accessible', async ({ page }) => {
    await page.goto('/quality');
    await expect(page.getByRole('heading', { name: /quality/i })).toBeVisible({ timeout: 5000 });
  });

  test('logistics page accessible', async ({ page }) => {
    await page.goto('/logistics');
    await expect(page.getByRole('heading', { name: /logistics/i })).toBeVisible({ timeout: 5000 });
  });
});
