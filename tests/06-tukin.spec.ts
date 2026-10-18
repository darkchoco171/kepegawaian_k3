import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 06: Tunjangan Kinerja (Tukin)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/tukin');
  });

  test('6.1 Menampilkan halaman rekapitulasi tunjangan kinerja dan tabel', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tunjangan Kinerja Bulanan' })).toBeVisible();
    await expect(page.locator('input[placeholder="Cari nama pegawai..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Kalkulasi Tukin")')).toBeVisible();
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('6.2 Filter pencarian pegawai pada tabel tunjangan kinerja', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Cari nama pegawai..."]');
    await searchInput.fill('Aryo');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('query=Aryo');
  });

  test('6.3 Filter periode bulan dan tahun pada tunjangan kinerja', async ({ page }) => {
    const monthPicker = page.locator('input[type="month"]');
    await expect(monthPicker).toBeVisible();

    await monthPicker.fill('2026-08');
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('bulan=2026-08');
  });

  test('6.4 Tombol Export Excel rekapitulasi tukin tersedia dan aktif', async ({ page }) => {
    const exportBtn = page.locator('button:has-text("Export")');
    await expect(exportBtn).toBeVisible();
    await expect(exportBtn).toBeEnabled();
  });

  test('6.5 Menjalankan fungsi Kalkulasi Tukin massal dengan dialog konfirmasi', async ({ page }) => {
    let dialogMessage = '';
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.accept();
    });

    const calcBtn = page.locator('button:has-text("Kalkulasi Tukin")');
    await expect(calcBtn).toBeVisible();
    await calcBtn.click();

    // Tunggu dialog muncul dan ditangani
    await page.waitForTimeout(3000);
    expect(dialogMessage.length).toBeGreaterThan(0);
  });

});
