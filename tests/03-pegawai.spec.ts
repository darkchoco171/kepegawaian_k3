import { test, expect } from '@playwright/test';
import { loginAdmin, generateUniqueNIP, generateTestPegawaiName } from './helpers/test-helper';

test.describe.serial('Modul 03: Manajemen Pegawai (CRUD)', () => {
  const testNip = generateUniqueNIP();
  const testNama = generateTestPegawaiName();
  const updatedNama = `${testNama} (Updated)`;

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/pegawai');
  });

  test('3.1 Menampilkan halaman daftar pegawai dengan tabel dan toolbar', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Data Pegawai' })).toBeVisible();
    await expect(page.locator('input[placeholder="Cari nama atau NIP..."]')).toBeVisible();
    await expect(page.locator('button:has-text("Tambah Pegawai")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('3.2 Fitur pencarian pegawai berfungsi', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Cari nama atau NIP..."]');
    // Cari admin demo yang pasti ada
    await searchInput.fill('Raffi');
    await page.waitForTimeout(1000); // Debounce search
    await expect(page.locator('table')).toContainText('Raffi');
  });

  test('3.3 Tambah data pegawai baru dengan NIP dinamis', async ({ page }) => {
    // Buka modal Tambah Pegawai
    await page.click('button:has-text("Tambah Pegawai")');
    await expect(page.locator('h3:has-text("Tambah Data Pegawai")')).toBeVisible();

    // Isi formulir
    await page.fill('input[name="namaLengkap"]', testNama);
    await page.fill('input[name="nip"]', testNip);
    await page.selectOption('select[name="status"]', 'Aktif');
    await page.fill('input[name="tempatLahir"]', 'Jakarta');
    await page.fill('input[name="tglLahir"]', '1995-05-15');
    await page.selectOption('select[name="jenisKelamin"]', 'L');
    await page.fill('input[name="kontak"]', '081234567890');

    // Klik tombol Simpan Data
    await page.click('button:has-text("Simpan Data")');

    // Tunggu modal tertutup
    await expect(page.locator('h3:has-text("Tambah Data Pegawai")')).not.toBeVisible({ timeout: 15000 });

    // Cari pegawai yang baru saja dibuat
    const searchInput = page.locator('input[placeholder="Cari nama atau NIP..."]');
    await searchInput.fill(testNama);
    await page.waitForTimeout(1000);

    // Verifikasi data muncul di tabel
    await expect(page.locator(`text=${testNama}`)).toBeVisible();
    await expect(page.locator(`text=${testNip}`)).toBeVisible();
  });

  test('3.4 Buka halaman detail pegawai yang baru dibuat', async ({ page }) => {
    // Cari pegawai
    const searchInput = page.locator('input[placeholder="Cari nama atau NIP..."]');
    await searchInput.fill(testNama);
    await page.waitForTimeout(1000);

    // Klik tombol Detail pada baris pegawai tersebut
    const row = page.locator('tr', { hasText: testNama });
    await expect(row).toBeVisible();
    await row.locator('a:has-text("Detail")').click();

    // Verifikasi berada di halaman detail pegawai
    await page.waitForURL('**/admin/pegawai/**', { timeout: 15000 });
    await expect(page.locator(`h2:has-text("${testNama}")`)).toBeVisible();
    await expect(page.locator(`p:has-text("${testNip}")`)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Cuti Pegawai' })).toBeVisible();

    // Navigasi kembali ke daftar pegawai
    await page.click('a:has-text("Kembali ke Data Pegawai")');
    await expect(page).toHaveURL('/admin/pegawai');
  });

  test('3.5 Edit data pegawai melalui modal Edit', async ({ page }) => {
    // Cari pegawai
    const searchInput = page.locator('input[placeholder="Cari nama atau NIP..."]');
    await searchInput.fill(testNama);
    await page.waitForTimeout(1000);

    const row = page.locator('tr', { hasText: testNama });
    await expect(row).toBeVisible();

    // Klik tombol Edit
    await row.locator('button[title="Edit Pegawai"]').click();
    await expect(page.locator('h3:has-text("Edit Data Pegawai")')).toBeVisible();

    // Ganti nama dan kontak
    const namaInput = page.locator('div.fixed input[name="namaLengkap"]');
    await namaInput.fill(updatedNama);

    // Simpan Perubahan
    await page.click('button:has-text("Simpan Perubahan")');

    // Tunggu modal tertutup
    await expect(page.locator('h3:has-text("Edit Data Pegawai")')).not.toBeVisible({ timeout: 15000 });

    // Cari ulang data yang telah diupdate
    await searchInput.fill(updatedNama);
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedNama}`)).toBeVisible();
  });

  test('3.6 Hapus data pegawai uji dengan konfirmasi dialog', async ({ page }) => {
    // Tangani window.confirm dialog browser secara otomatis
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Cari pegawai yang akan dihapus
    const searchInput = page.locator('input[placeholder="Cari nama atau NIP..."]');
    await searchInput.fill(updatedNama);
    await page.waitForTimeout(1000);

    const row = page.locator('tr', { hasText: updatedNama });
    await expect(row).toBeVisible();

    // Klik tombol Hapus
    await row.locator('button[title="Hapus Pegawai"]').click();

    // Tunggu proses hapus dan refresh selesai
    await page.waitForTimeout(2000);

    // Cari ulang, pastikan nama pegawai tidak ada lagi
    await searchInput.fill(updatedNama);
    await page.waitForTimeout(1000);
    await expect(page.locator(`text=${updatedNama}`)).not.toBeVisible();
  });

});
