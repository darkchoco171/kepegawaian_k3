import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 05: Manajemen Kinerja & Angka Kredit (PAK)', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/manajemen-kinerja');
  });

  test('5.1 Menampilkan halaman manajemen kinerja dan tab navigasi', async ({ page }) => {
    await expect(page.locator('h2:has-text("Manajemen Penilaian & PAK")')).toBeVisible();
    await expect(page.locator('a:has-text("Kinerja Bulanan (Tukin)")')).toBeVisible();
    await expect(page.locator('a:has-text("Angka Kredit Tahunan (PAK)")')).toBeVisible();
    await expect(page.locator('a:has-text("Input Kinerja Bulanan")')).toBeVisible();
  });

  test('5.2 Form Input Kinerja Bulanan memiliki elemen yang lengkap', async ({ page }) => {
    await page.click('a:has-text("Input Kinerja Bulanan")');
    await page.waitForURL('**/admin/manajemen-kinerja/input', { timeout: 15000 });

    await expect(page.locator('h2:has-text("Form Input Penilaian Kinerja")')).toBeVisible();
    await expect(page.locator('select[name="idPegawai"]')).toBeVisible();
    await expect(page.locator('select[name="bulan"]')).toBeVisible();
    await expect(page.locator('input[name="tahun"]')).toBeVisible();
    await expect(page.locator('select[name="hasilKerja"]')).toBeVisible();
    await expect(page.locator('select[name="perilakuKerja"]')).toBeVisible();
    await expect(page.locator('button:has-text("Simpan Penilaian")')).toBeVisible();

    // Kembali ke halaman kinerja
    await page.click('a:has-text("Batal")');
    await expect(page).toHaveURL(/\/admin\/manajemen-kinerja/);
  });

  test('5.3 Beralih ke tab Angka Kredit Tahunan (PAK) dan memeriksa tabel', async ({ page }) => {
    const tabAk = page.locator('a:has-text("Angka Kredit Tahunan (PAK)")');
    await tabAk.click();
    await expect(page).toHaveURL(/tab=angka-kredit/);

    // Tombol di header berubah menjadi Input Angka Kredit
    await expect(page.locator('a:has-text("Input Angka Kredit")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('5.4 Form Input Angka Kredit memiliki elemen yang lengkap', async ({ page }) => {
    await page.goto('/admin/manajemen-kinerja?tab=angka-kredit');
    await page.click('a:has-text("Input Angka Kredit")');
    await page.waitForURL('**/admin/manajemen-kinerja/input-ak', { timeout: 15000 });

    await expect(page.locator('h2:has-text("Form Input Angka Kredit")')).toBeVisible();
    await expect(page.locator('select[name="idPegawai"]')).toBeVisible();
    await expect(page.locator('input[name="tahunPenilaian"]')).toBeVisible();
    await expect(page.locator('input[name="nilaiPak"]')).toBeVisible();
    await expect(page.locator('button:has-text("Simpan Angka Kredit")')).toBeVisible();

    // Kembali ke tab angka kredit
    await page.click('a:has-text("Batal")');
    await expect(page).toHaveURL(/tab=angka-kredit/);
  });

});
