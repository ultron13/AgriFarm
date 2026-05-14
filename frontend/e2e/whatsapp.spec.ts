import { test, expect } from '@playwright/test';
import { login, USERS } from './helpers';

test.describe('WhatsApp simulator', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, USERS.admin.email, USERS.admin.password);
  });

  test('can navigate to whatsapp simulator', async ({ page }) => {
    await page.getByRole('link', { name: /whatsapp/i }).click();
    await expect(page).toHaveURL(/\/whatsapp/);
  });

  test('shows WhatsApp chat interface', async ({ page }) => {
    await page.goto('/whatsapp');
    await expect(page.getByRole('heading', { name: /whatsapp/i })).toBeVisible({ timeout: 5000 });
  });

  test('can send a message in simulator', async ({ page }) => {
    await page.goto('/whatsapp');
    // The chat input has no type attribute, use placeholder text
    const msgInput = page.getByPlaceholder('Type a message');
    await expect(msgInput).toBeVisible({ timeout: 5000 });
    await msgInput.fill('hi');
    await msgInput.press('Enter');
    // Should show a response from the bot
    await page.waitForTimeout(2000);
    const hasBotResponse = await page.locator('strong, span').filter({ hasText: /welcome|hello|menu|order/i }).count();
    expect(hasBotResponse).toBeGreaterThan(0);
  });
});
