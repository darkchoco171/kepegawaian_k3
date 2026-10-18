import { Page, expect } from '@playwright/test';

export const ADMIN_CREDENTIALS = {
  nip: '199506222018011001',
  password: 'admin123',
};

/**
 * Helper login untuk sesi admin
 */
export async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Jika sudah dalam sesi login dan diredirect ke dashboard
  if (page.url().includes('/admin/dashboard')) {
    return;
  }

  await page.fill('input[name="nip"]', ADMIN_CREDENTIALS.nip);
  await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);
  await page.click('button[type="submit"]');

  // Tunggu redirect ke dashboard admin
  await page.waitForURL('**/admin/dashboard', { timeout: 30000 });
  await expect(page.getByRole('banner').getByText('SIMPEG K3 — Panel Administrator')).toBeVisible({ timeout: 15000 });
}

/**
 * Menghasilkan NIP 18 digit unik berdasarkan timestamp
 */
export function generateUniqueNIP(): string {
  const prefix = '199'; // 3 digit
  const timePart = Date.now().toString().slice(-9); // 9 digit
  const randPart = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit
  const nip = (prefix + timePart + randPart).slice(0, 18);
  return nip;
}

/**
 * Menghasilkan nama pegawai unik untuk pengujian
 */
export function generateTestPegawaiName(): string {
  const id = Math.floor(1000 + Math.random() * 9000);
  return `Test Pegawai Auto E2E ${id}`;
}
