import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Gov Buyer flows', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.govBuyer.email, USERS.govBuyer.password);
  });

  test('lands on gov procurement portal', async ({ page }) => {
    await expect(page).toHaveURL(/\/gov/);
    await expect(page.getByRole('main')).toBeVisible();
  });

  test('sidebar shows Procurement Portal link', async ({ page }) => {
    await expect(page.getByRole('link', { name: /procurement/i })).toBeVisible();
  });

  test('portal shows tender stats or list', async ({ page }) => {
    await page.waitForTimeout(2000);
    const main = page.getByRole('main');
    await expect(main).toBeVisible();
    // Should show stats or tender list
    const hasStats = await page.getByText(/tenders|bids|department/i).first().isVisible();
    expect(hasStats).toBe(true);
  });

  test('post tender button is visible', async ({ page }) => {
    const postBtn = page.getByRole('button', { name: /post|new tender|create tender/i });
    await expect(postBtn).toBeVisible({ timeout: 5000 });
  });

  test('opens post tender modal', async ({ page }) => {
    const postBtn = page.getByRole('button', { name: /new tender/i });
    await postBtn.click();
    // Modal uses fixed overlay — look for the heading inside it
    await expect(page.getByText('Post Government Tender')).toBeVisible({ timeout: 5000 });
  });

  test('tender form has required fields', async ({ page }) => {
    await page.getByRole('button', { name: /new tender/i }).click();
    await expect(page.getByText('Post Government Tender')).toBeVisible({ timeout: 5000 });
    // Form inputs should be visible (labels use text, not htmlFor, so check by text proximity)
    await expect(page.getByText('Tender Title *')).toBeVisible();
    await expect(page.getByText('Issuing Department *')).toBeVisible();
  });
});
