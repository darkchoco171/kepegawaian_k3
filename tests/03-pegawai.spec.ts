import { test, expect } from '@playwright/test';
import { loginAdmin, generateUniqueNIP, generateTestPegawaiName } from './helpers/test-helper';

test.describe.serial('Modul 03: Manajemen Pegawai (CRUD)', () => {
  const testNip = generateUniqueNIP();
  const testNama = generateTestPegawaiName();
  const updatedNama = `${testNama} (Updated)`;
  let testKelasJabatanId: string;

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

  test('3.1a Halaman master pangkat/golongan dapat dibuka dari Manajemen Kinerja', async ({ page }) => {
    await page.goto('/admin/manajemen-kinerja');
    await page.getByRole('link', { name: 'Master Pangkat/Golongan' }).click();
    await expect(page).toHaveURL('/admin/manajemen-kinerja/master-pangkat-golongan');
    await expect(page.getByRole('heading', { name: 'Master Pangkat/Golongan & Aturan AK' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Tambah Master Pangkat/Golongan' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Angka Kredit Minimal' })).toBeVisible();
    await expect(page.locator('input[name="angkaKreditMinimal"]').first()).toHaveAttribute('required', '');
    await expect(page.locator('input[name="namaJabatan"]')).toBeVisible();
  });

  test('3.1b Menolak pegawai dengan jabatan yang belum terdaftar di master', async ({ page }) => {
    await page.click('button:has-text("Tambah Pegawai")');
    await page.fill('input[name="namaLengkap"]', generateTestPegawaiName());
    await page.fill('input[name="nip"]', generateUniqueNIP());
    await page.fill('input[name="namaJabatan"]', 'Jabatan Uji Belum Terdaftar');
    await page.selectOption('select[name="idKelasJabatan"]', { index: 1 });
    await page.fill('input[name="pangkat"]', 'Pangkat Uji');
    await page.fill('input[name="golongan"]', 'ZZ/99');
    await page.selectOption('select[name="jenisKepegawaian"]', 'PNS');
    await page.click('button:has-text("Simpan Data")');
    await expect(page.locator('p[role="alert"]')).toHaveText(
      'Jabatan belum tersedia di master. Lengkapi data master jabatan terlebih dahulu.',
    );
  });

  test('3.1c Menghapus master pangkat/golongan yang tidak digunakan', async ({ page }) => {
    await page.goto('/admin/manajemen-kinerja/master-pangkat-golongan');
    const golongan = `Z${Date.now().toString().slice(-8)}`;
    await page.selectOption('select[name="jenisKepegawaian"]', 'NON-ASN');
    await page.fill('input[name="pangkat"]', 'Pangkat Uji Hapus');
    await page.fill('input[name="golongan"]', golongan);
    await page.click('button:has-text("Simpan Master Pangkat/Golongan")');

    const row = page.locator('tr', { hasText: golongan });
    await expect(row).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await row.getByRole('button', { name: `Hapus master ${golongan}` }).click();
    await expect(row).not.toBeVisible();
  });

  test('3.1d Menghapus master jabatan yang tidak digunakan', async ({ page }) => {
    await page.goto('/admin/manajemen-kinerja/master-pangkat-golongan');
    const namaJabatanUji = `Jabatan Uji Hapus ${Date.now()}`;
    await page.fill('input[name="namaJabatan"]', namaJabatanUji);
    await page.selectOption('select[name="idKelasJabatan"]', { index: 1 });
    await page.fill('input[name="jenisJabatan"]', 'Uji');
    await page.click('button:has-text("Simpan Master Jabatan")');
    await expect(page.locator('button:has-text("Simpan Master Jabatan")')).toBeEnabled();
    await page.reload();

    const row = page.locator('tr', { hasText: namaJabatanUji });
    await expect(row).toBeVisible();
    page.once('dialog', dialog => dialog.accept());
    await row.getByRole('button', { name: `Hapus master jabatan ${namaJabatanUji}` }).click();
    await expect(row).not.toBeVisible();
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
    testKelasJabatanId = await page.locator('select[name="idKelasJabatan"] option')
      .filter({ hasText: 'Kelas 8' })
      .first()
      .getAttribute('value') || '';
    await page.fill('input[name="namaJabatan"]', 'Penguji K3 Ahli Pertama');
    await page.selectOption('select[name="idKelasJabatan"]', testKelasJabatanId);
    await page.fill('input[name="pangkat"]', 'Penata Muda');
    await page.fill('input[name="golongan"]', 'III/a');
    await page.selectOption('select[name="jenisKepegawaian"]', 'PNS');
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
    await expect(page.getByText('Terpakai 0 dari 36 hari')).toBeVisible();
    await expect(page.getByText('36 Tersisa')).toBeVisible();

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
    await expect(page.locator('input[name="namaJabatan"]')).toHaveValue('Penguji K3 Ahli Pertama');
    await expect(page.locator('select[name="idKelasJabatan"]')).toHaveValue(testKelasJabatanId);
    await expect(page.locator('input[name="pangkat"]')).toHaveValue('Penata Muda');
    await expect(page.locator('input[name="golongan"]')).toHaveValue('III/a');
    await expect(page.locator('select[name="jenisKepegawaian"]')).toHaveValue('PNS');

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
