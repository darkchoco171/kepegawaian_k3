import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 04: Presensi Pegawai', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/presensi');
  });

  test('4.1 Menampilkan halaman presensi, ringkasan kartu status, dan tabel data', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Rekap Presensi Harian' })).toBeVisible();
    await expect(page.locator('text=Hadir (WFO/WFH)')).toBeVisible();
    await expect(page.locator('main').getByText('Cuti', { exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('Alpa', { exact: true })).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('4.2 Filter pencarian nama pegawai di tabel presensi', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Cari nama pegawai..."]');
    await expect(searchInput).toBeVisible();

    await searchInput.fill('Aryo');
    await page.waitForTimeout(1000);
    // Verifikasi URL mencatat query parameter
    expect(page.url()).toContain('query=Aryo');
  });

  test('4.3 Filter periode bulan dan tahun presensi', async ({ page }) => {
    const monthPicker = page.locator('input[type="month"]');
    await expect(monthPicker).toBeVisible();

    // Pilih bulan tertentu, misal 2026-08
    await monthPicker.fill('2026-08');
    await page.waitForTimeout(1000);

    // Parameter bulan terdaftar di URL
    expect(page.url()).toContain('bulan=2026-08');
  });

  test('4.4 Tombol Download Template Excel presensi tersedia', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    const downloadBtn = page.locator('button:has-text("Download Template")');
    await expect(downloadBtn).toBeVisible();
    await downloadBtn.click();

    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('Template_Import_Presensi.xlsx');
  });

  test('4.5 Tombol Import Data Absen siap menerima file', async ({ page }) => {
    const importBtn = page.locator('button:has-text("Import Data Absen")');
    await expect(importBtn).toBeVisible();
    await expect(importBtn).toBeEnabled();

    // Pastikan hidden input file tersedia
    const fileInput = page.locator('input[type="file"][accept*=".xlsx"]');
    await expect(fileInput).toHaveCount(1);
  });

  test('4.6 Import file Excel presensi menyimpan data harian dan menampilkan hasil', async ({ page }) => {
    await page.locator('input[type="month"]').fill('2026-11');
    await expect(page).toHaveURL(/bulan=2026-11/);

    const dialogPromise = page.waitForEvent('dialog');
    await page.locator('input[type="file"][accept*=".xlsx"]')
      .setInputFiles('tests/fixtures/presensi-dummy-november-2026.xlsx');
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();

    expect(message).toContain('Berhasil mengimpor 3 data absensi harian untuk 1 pegawai.');
  });

});
