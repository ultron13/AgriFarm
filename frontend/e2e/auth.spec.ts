import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('Authentication', () => {
  test('shows login page at /login', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'FarmConnect' })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/browse');
    await expect(page).toHaveURL(/\/login/);
  });

  test('shows error for wrong credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('wrong@example.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page.getByText(/invalid|incorrect|credentials/i)).toBeVisible({ timeout: 5000 });
  });

  test('farmer logs in and lands on /dashboard', async ({ page }) => {
    await login(page, USERS.farmer.email, USERS.farmer.password);
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
  });

  test('buyer logs in and lands on /browse', async ({ page }) => {
    await login(page, USERS.buyer.email, USERS.buyer.password);
    await expect(page).toHaveURL(/\/browse/, { timeout: 5000 });
  });

  test('gov buyer logs in and lands on /gov', async ({ page }) => {
    await login(page, USERS.govBuyer.email, USERS.govBuyer.password);
    await expect(page).toHaveURL(/\/gov/, { timeout: 5000 });
  });

  test('admin logs in and lands on /orders', async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
    await expect(page).toHaveURL(/\/orders/, { timeout: 5000 });
  });
});
