import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 02: Dashboard Admin', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/dashboard');
  });

  test('2.1 Menampilkan panel informasi selamat datang dan ringkasan statistik', async ({ page }) => {
    // Header selamat datang
    await expect(page.locator('text=Selamat datang')).toBeVisible();
    await expect(page.locator('main').getByText('Panel Administrator • 2026')).toBeVisible();

    // Kartu statistik ringkas
    await expect(page.getByText('Total Pegawai', { exact: true })).toBeVisible();
    await expect(page.getByText('Pengajuan Cuti', { exact: true })).toBeVisible();
    await expect(page.getByText('Total Tukin', { exact: true })).toBeVisible();
  });

  test('2.2 Pintasan tombol "Kelola Pegawai" bekerja dengan benar', async ({ page }) => {
    const btnKelola = page.locator('a:has-text("Kelola Pegawai")');
    await expect(btnKelola).toBeVisible();
    await btnKelola.click();

    await expect(page).toHaveURL(/\/admin\/pegawai/);
    await expect(page.getByRole('heading', { name: 'Data Pegawai' })).toBeVisible();
    await expect(page.locator('button:has-text("Tambah Pegawai")')).toBeVisible();
  });

  test('2.3 Pintasan tombol "Tinjau Cuti" bekerja dengan benar', async ({ page }) => {
    const btnCuti = page.locator('a:has-text("Tinjau Cuti")');
    await expect(btnCuti).toBeVisible();
    await btnCuti.click();

    await page.waitForURL('**/admin/cuti', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: 'Manajemen Pengajuan Cuti' })).toBeVisible();
  });

  test('2.4 Tautan eksternal JDIH Kemnaker tersedia', async ({ page }) => {
    const jdihLink = page.locator('a[href*="jdih.kemnaker.go.id"]');
    await expect(jdihLink).toBeVisible();
    await expect(jdihLink).toHaveAttribute('target', '_blank');
  });

});
