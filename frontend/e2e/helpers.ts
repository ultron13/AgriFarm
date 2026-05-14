import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(browse|dashboard|gov|quality|logistics|sales|orders)/);
}

export const USERS = {
  farmer:    { email: 'mahela@demo.farmconnect.co.za',    password: 'demo1234' },
  buyer:     { email: 'buyer@demo.farmconnect.co.za',     password: 'demo1234' },
  govBuyer:  { email: 'dbe@demo.farmconnect.co.za',       password: 'demo1234' },
  admin:     { email: 'admin@farmconnect.co.za',          password: 'admin-change-me' },
  fieldAgent:{ email: 'agent@demo.farmconnect.co.za',     password: 'demo1234' },
  logistics: { email: 'logistics@demo.farmconnect.co.za', password: 'demo1234' },
  sales:     { email: 'sales@demo.farmconnect.co.za',     password: 'demo1234' },
};
