import { test, expect } from '@playwright/test';

// Helper function untuk login otomatis
async function loginAdmin(page: any) {
  await page.goto('/login');
  await page.fill('input[name="nip"]', '199506222018011001');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/admin/dashboard', {timeout: 30000 });
}

test('1. Alur Login Berhasil', async ({ page }) => {
  await loginAdmin(page);
  expect(page.url()).toContain('/admin/dashboard');
});

test('2. Alur Tambah Pegawai Baru', async ({ page }) => {
  await loginAdmin(page);
  
  // Pindah ke halaman Data Pegawai
  await page.click('text=Data Pegawai');
  await expect(page).toHaveURL('/admin/pegawai');

  // Klik tombol Tambah Pegawai
  await page.click('text=Tambah Pegawai');

  // Isi form data pegawai baru dengan NIP dan Nama dinamis agar tidak kena unique violation
  const randSuffix = Date.now().toString().slice(-4);
  const dynamicNip = '199' + Date.now().toString().slice(-9) + '123456';
  const dynamicNama = `Dr. Otomatis ${randSuffix}`;
  await page.fill('input[name="namaLengkap"]', dynamicNama);
  await page.fill('input[name="nip"]', dynamicNip);
  
  // Pilih status kepegawaian
  await page.selectOption('select[name="status"]', 'Aktif');

  // Simpan data
  await page.click('button:has-text("Simpan Data")');

  // Kasih jeda dikit biar Next.js selesai revalidatePath dan nutup modal
  await page.waitForTimeout(1500); 

  // Suruh Playwright ngetik di kolom pencarian biar datanya kesaring
  await page.fill('input[placeholder="Cari nama atau NIP..."]', dynamicNama);

  // Baru deh verifikasi namanya muncul di tabel
  await expect(page.locator(`text=${dynamicNama}`)).toBeVisible();
});

test('3. Cek Semua Menu Navigasi Utama Admin', async ({ page }) => {
  await loginAdmin(page);

  // OPSI PALING GAMPANG: Pakai text= (nyari teks persis di layar)
  await page.getByRole('link', { name: 'Manajemen Kinerja' }).click();
  await expect(page).toHaveURL('/admin/manajemen-kinerja');

  await page.getByRole('link', { name: 'Presensi' }).click();
  await expect(page).toHaveURL('/admin/presensi');

  await page.getByRole('link', { name: 'Tunjangan Kinerja' }).click();
  await expect(page).toHaveURL('/admin/tukin');

  // OPSI LEBIH KETAT: Pakai getByRole (biar nggak salah klik teks di tempat lain)
  await page.getByRole('link', { name: 'Manajemen Cuti' }).click();
  await expect(page).toHaveURL('/admin/cuti');
});