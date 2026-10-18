import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 07: Manajemen Cuti Pegawai', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/cuti');
  });

  test('7.1 Menampilkan halaman manajemen cuti, kartu ringkasan, dan tabel', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Manajemen Pengajuan Cuti' })).toBeVisible();
    await expect(page.locator('main').getByText('Disetujui', { exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('Menunggu Persetujuan', { exact: true })).toBeVisible();
    await expect(page.locator('main').getByText('Ditolak', { exact: true })).toBeVisible();
    await expect(page.locator('button:has-text("Ajukan Cuti Baru")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('7.2 Filter jenis cuti dan pencarian riwayat cuti', async ({ page }) => {
    const filterJenis = page.locator('select');
    if (await filterJenis.count() > 0) {
      await filterJenis.first().selectOption('Tahunan');
      await page.waitForTimeout(500);
    }

    const searchInput = page.locator('input[placeholder="Cari nama pegawai..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Aryo');
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('query=Aryo');
    }
  });

  test('7.3 Modal pengajuan cuti baru memiliki elemen form yang lengkap', async ({ page }) => {
    await page.click('button:has-text("Ajukan Cuti Baru")');
    await expect(page.locator('h3:has-text("Form Pengajuan Cuti Pegawai")')).toBeVisible();

    await expect(page.locator('input[placeholder="Ketik nama atau NIP untuk mencari..."]')).toBeVisible();
    await expect(page.locator('select[name="idPegawai"]')).toBeVisible();
    await expect(page.locator('select[name="jenisCuti"]')).toBeVisible();
    await expect(page.locator('input[name="tglMulai"]')).toBeVisible();
    await expect(page.locator('input[name="tglSelesai"]')).toBeVisible();
    await expect(page.locator('input[name="jumlahHari"]')).toBeVisible();
    await expect(page.locator('textarea[name="alasan"]')).toBeVisible();
    await expect(page.locator('button:has-text("Simpan Pengajuan")')).toBeVisible();

    // Tutup modal dengan tombol Batal
    await page.click('button:has-text("Batal")');
    await expect(page.locator('h3:has-text("Form Pengajuan Cuti Pegawai")')).not.toBeVisible();
  });

  test('7.4 Alur pengajuan cuti baru berhasil disimpan', async ({ page }) => {
    await page.click('button:has-text("Ajukan Cuti Baru")');
    await expect(page.locator('h3:has-text("Form Pengajuan Cuti Pegawai")')).toBeVisible();

    // Pilih pegawai pertama yang tersedia dari daftar
    const pegawaiSelect = page.locator('select[name="idPegawai"]');
    const firstOptionValue = await pegawaiSelect.locator('option:not([disabled])').first().getAttribute('value');
    if (firstOptionValue) {
      await pegawaiSelect.selectOption(firstOptionValue);
    }

    // Pilih Jenis Cuti Alasan Penting
    await page.selectOption('select[name="jenisCuti"]', 'Alasan Penting');

    // Gunakan tanggal masa depan acak agar tidak overlap dengan data yang ada
    const randomDay = Math.floor(10 + Math.random() * 15);
    const tglMulai = `2029-06-${randomDay}`;
    const tglSelesai = `2029-06-${randomDay}`;

    await page.fill('input[name="tglMulai"]', tglMulai);
    await page.fill('input[name="tglSelesai"]', tglSelesai);
    await page.fill('input[name="jumlahHari"]', '1');
    await page.fill('textarea[name="alasan"]', 'Urusan keluarga mendesak (Playwright Auto Test)');

    // Tangani dialog alert jika ada
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Simpan pengajuan
    await page.click('button:has-text("Simpan Pengajuan")');

    // Tunggu modal tertutup
    await expect(page.locator('h3:has-text("Form Pengajuan Cuti Pegawai")')).not.toBeVisible({ timeout: 15000 });
  });

});
