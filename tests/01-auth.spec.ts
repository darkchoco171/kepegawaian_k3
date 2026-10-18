import { test, expect } from '@playwright/test';
import { ADMIN_CREDENTIALS, loginAdmin } from './helpers/test-helper';

test.describe('Modul 01: Autentikasi & Otorisasi', () => {

  test('1.1 Gagal login jika password salah', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="nip"]', ADMIN_CREDENTIALS.nip);
    await page.fill('input[name="password"]', 'passwordsalah123');
    await page.click('button[type="submit"]');

    // Pesan error harus muncul di layar
    const errorBox = page.locator('div.bg-red-50');
    await expect(errorBox).toBeVisible({ timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

  test('1.2 Tombol Masuk dinonaktifkan jika digit NIP belum lengkap (kurang dari 18)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="nip"]', '199506222018011'); // hanya 15 digit
    await page.fill('input[name="password"]', ADMIN_CREDENTIALS.password);

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();

    // Masukkan sisa 3 digit menjadi 18
    await page.fill('input[name="nip"]', ADMIN_CREDENTIALS.nip);
    await expect(submitBtn).toBeEnabled();
  });

  test('1.3 Login berhasil dengan akun admin valid', async ({ page }) => {
    await loginAdmin(page);
    expect(page.url()).toContain('/admin/dashboard');
    await expect(page.getByRole('banner').getByText('SIMPEG K3 — Panel Administrator')).toBeVisible();
  });

  test('1.4 Proteksi rute: Pengguna tanpa login diarahkan ke halaman login', async ({ browser }) => {
    // Gunakan browser context baru yang bersih tanpa session cookie
    const context = await browser.newContext();
    const cleanPage = await context.newPage();

    await cleanPage.goto('/admin/pegawai');
    await cleanPage.waitForURL('**/login**', { timeout: 15000 });
    expect(cleanPage.url()).toContain('/login');

    await context.close();
  });

  test('1.5 Logout berhasil melalui tombol Keluar di Navbar', async ({ page }) => {
    await loginAdmin(page);

    // Temukan tombol Keluar di navbar
    const logoutBtn = page.locator('button:has-text("Keluar")');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Diarahkan kembali ke halaman login
    await page.waitForURL('**/login', { timeout: 15000 });
    expect(page.url()).toContain('/login');
  });

});
