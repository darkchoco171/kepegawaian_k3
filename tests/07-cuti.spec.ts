import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 07: Manajemen Cuti Pegawai', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/cuti');
  });

  test('7.1 Menampilkan halaman manajemen cuti, kartu ringkasan, dan tabel', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Manajemen Pengajuan Cuti' })).toBeVisible();
    await expect(page.locator('main').getByText('Disetujui', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('Menunggu Persetujuan', { exact: true }).first()).toBeVisible();
    await expect(page.locator('main').getByText('Ditolak', { exact: true }).first()).toBeVisible();
    await expect(page.locator('button:has-text("Ajukan Cuti Baru")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();
  });

  test('7.2 Filter jenis cuti dan pencarian riwayat cuti', async ({ page }) => {
    const filterJenis = page.locator('select');
    if (await filterJenis.count() > 0) {
      await filterJenis.first().selectOption('Tahunan');
      await expect(page).toHaveURL(/jenis=Tahunan/);
    }

    const searchInput = page.locator('input[placeholder="Cari nama pegawai..."]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('Aryo');
      await expect(page).toHaveURL(/query=Aryo/);
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
    const selectedPegawai = (await pegawaiSelect.locator('option:checked').textContent()) || '';
    const namaPegawai = selectedPegawai.split(' — NIP.')[0].trim();

    await page.selectOption('select[name="jenisCuti"]', 'Tahunan');

    // Gunakan tanggal masa depan pada hari kerja agar tes tidak terpengaruh akhir pekan.
    const futureYear = 2035 + Math.floor(Math.random() * 100);
    const weekday = new Date(Date.UTC(futureYear, 5, 1));
    while (weekday.getUTCDay() === 0 || weekday.getUTCDay() === 6) {
      weekday.setUTCDate(weekday.getUTCDate() + 1);
    }
    const tglMulai = weekday.toISOString().slice(0, 10);
    const tglSelesai = tglMulai;
    const alasanUji = `Urusan keluarga mendesak (Playwright Auto Test ${Date.now()})`;

    await page.fill('input[name="tglMulai"]', tglMulai);
    await page.fill('input[name="tglSelesai"]', tglSelesai);
    await expect(page.locator('input[name="jumlahHari"]')).toHaveValue('1');
    await page.fill('textarea[name="alasan"]', alasanUji);

    // Tangani dialog alert jika ada
    page.on('dialog', async (dialog) => {
      await dialog.accept();
    });

    // Simpan pengajuan
    await page.click('button:has-text("Simpan Pengajuan")');

    // Tunggu modal tertutup
    await expect(page.locator('h3:has-text("Form Pengajuan Cuti Pegawai")')).not.toBeVisible({ timeout: 15000 });
    await expect(page.locator('table')).toContainText(alasanUji);
    const rowCuti = page.locator('tr', { hasText: alasanUji });
    await expect(rowCuti).toContainText(`N-2 (${futureYear - 2}): 11`);

    await page.goto(`/admin/presensi?bulan=${futureYear}-06&query=${encodeURIComponent(namaPegawai)}`);
    const rowPresensi = page.locator('tr', { hasText: namaPegawai });
    await expect(rowPresensi).toContainText('Cuti');
  });

});
