import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 08: Profil Administrator', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('8.1 Mengakses halaman profil melalui klik avatar di navbar', async ({ page }) => {
    // Klik link profil di navbar kanan
    const profilNav = page.locator('a[href="/admin/profil"]');
    await expect(profilNav).toBeVisible();
    await profilNav.click();

    await page.waitForURL('**/admin/profil', { timeout: 15000 });
    expect(page.url()).toContain('/admin/profil');
  });

  test('8.2 Menampilkan informasi header profil dan status akun aktif', async ({ page }) => {
    await page.goto('/admin/profil');

    await expect(page.locator('main').locator('h1.text-2xl')).toBeVisible();
    await expect(page.locator('main').getByText('Akun Aktif')).toBeVisible();
    await expect(page.locator('main').getByText('Role Akses:')).toBeVisible();
    await expect(page.locator('main').getByText('Administrator', { exact: true })).toBeVisible();
  });

  test('8.3 Menampilkan detail Informasi Pribadi dan Kepegawaian', async ({ page }) => {
    await page.goto('/admin/profil');

    // Kartu Informasi Pribadi
    await expect(page.locator('h3:has-text("Informasi Pribadi")')).toBeVisible();
    await expect(page.locator('text=Tempat, Tgl Lahir')).toBeVisible();
    await expect(page.locator('text=Jenis Kelamin')).toBeVisible();

    // Kartu Jabatan & Kepegawaian
    await expect(page.locator('h3:has-text("Jabatan & Kepegawaian")')).toBeVisible();
    await expect(page.locator('text=Jabatan Saat Ini')).toBeVisible();
    await expect(page.locator('text=Pangkat / Golongan')).toBeVisible();
  });

});
