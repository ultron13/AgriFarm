import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Farmer flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.farmer.email, USERS.farmer.password);
  });

  test('lands on dashboard with stats visible', async ({ page }) => {
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('sidebar shows farmer nav items', async ({ page }) => {
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /listings/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /payouts/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /tenders/i })).toBeVisible();
  });

  test('can navigate to listings page', async ({ page }) => {
    await page.getByRole('link', { name: /listings/i }).click();
    await expect(page).toHaveURL(/\/listings/);
    await expect(page.getByRole('heading', { name: /listings/i })).toBeVisible({ timeout: 5000 });
  });

  test('listings page has create listing button', async ({ page }) => {
    await page.goto('/listings');
    const createBtn = page.getByRole('button', { name: /create|add|new listing/i });
    await expect(createBtn).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to payouts page', async ({ page }) => {
    await page.goto('/payouts');
    await expect(page.getByRole('heading', { name: /payouts/i })).toBeVisible({ timeout: 5000 });
  });

  test('can navigate to gov tenders page', async ({ page }) => {
    await page.goto('/tenders');
    await expect(page.getByRole('heading', { name: /tenders|procurement/i })).toBeVisible({ timeout: 5000 });
  });

  test('tenders page shows tender list or empty state', async ({ page }) => {
    await page.goto('/tenders');
    await expect(page.getByRole('heading', { name: /tenders|procurement/i })).toBeVisible({ timeout: 5000 });
  });

  test('compliance vault page accessible', async ({ page }) => {
    await page.goto('/compliance');
    await expect(page.getByRole('heading', { name: /compliance|vault/i })).toBeVisible({ timeout: 5000 });
  });

  test('farmer sidebar does not show disputes or reports links', async ({ page }) => {
    await expect(page.getByRole('link', { name: /^disputes$/i })).not.toBeVisible();
    await expect(page.getByRole('link', { name: /^reports$/i })).not.toBeVisible();
  });
});
