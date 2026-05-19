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

  test('sidebar shows disputes link for admin', async ({ page }) => {
    await expect(page.getByRole('link', { name: /disputes/i })).toBeVisible();
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

  test('can navigate to disputes page', async ({ page }) => {
    await page.getByRole('link', { name: /disputes/i }).click();
    await expect(page).toHaveURL(/\/disputes/);
    await expect(page.getByRole('heading', { name: /dispute/i })).toBeVisible({ timeout: 5000 });
  });

  test('disputes page shows open dispute count or empty state', async ({ page }) => {
    await page.goto('/disputes');
    await expect(page.getByRole('heading', { name: /dispute/i })).toBeVisible({ timeout: 5000 });
    // either a count badge or the empty-state checkmark
    const hasContent = await page.getByText(/open dispute|no open disputes/i).first().isVisible({ timeout: 5000 });
    expect(hasContent).toBe(true);
  });

  test('compliance verify page accessible', async ({ page }) => {
    await page.goto('/compliance/verify');
    await expect(page.getByRole('main')).toBeVisible({ timeout: 5000 });
  });
});
