import { test, expect } from '@playwright/test';

test('Dashboard berhasil render Widget Ultah & SLKS', async ({ page }) => {
  // 1. buka halaman localhost
  await page.goto('http://localhost:3000'); // Ganti URL ini kalau misal dashboard lu ada di /dashboard

  // 2. ngecek apakah ada judul "Ulang Tahun Bulan Ini"
  const judulUltah = page.locator('text=Ulang Tahun Bulan Ini');
  await expect(judulUltah).toBeVisible();

  // 3. ngecek apakah ada judul "Kandidat Penerima SLKS"
  const judulSlks = page.locator('text=Kandidat Penerima SLKS');
  await expect(judulSlks).toBeVisible();
});