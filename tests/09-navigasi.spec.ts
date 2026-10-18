import { test, expect } from '@playwright/test';
import { loginAdmin } from './helpers/test-helper';

test.describe('Modul 09: Navigasi Global & Routing', () => {

  test.beforeEach(async ({ page }) => {
    await loginAdmin(page);
  });

  test('9.1 Navigasi lancar ke seluruh menu utama panel admin', async ({ page }) => {
    const menus = [
      { name: 'Dasbor', url: '/admin/dashboard' },
      { name: 'Data Pegawai', url: '/admin/pegawai' },
      { name: 'Manajemen Kinerja', url: '/admin/manajemen-kinerja' },
      { name: 'Presensi', url: '/admin/presensi' },
      { name: 'Tunjangan Kinerja', url: '/admin/tukin' },
      { name: 'Manajemen Cuti', url: '/admin/cuti' },
    ];

    for (const menu of menus) {
      const link = page.getByRole('link', { name: menu.name, exact: true });
      await expect(link).toBeVisible();
      await link.click();
      await expect(page).toHaveURL(menu.url, { timeout: 15000 });
    }
  });

  test('9.2 Status highlight menu aktif pada navbar berubah sesuai URL', async ({ page }) => {
    await page.goto('/admin/presensi');
    const presensiLink = page.getByRole('link', { name: 'Presensi', exact: true });
    // Link aktif memiliki style latar putih dan teks biru
    await expect(presensiLink).toHaveClass(/text-\[#1a4b8c\]/);

    await page.goto('/admin/tukin');
    const tukinLink = page.getByRole('link', { name: 'Tunjangan Kinerja', exact: true });
    await expect(tukinLink).toHaveClass(/text-\[#1a4b8c\]/);
  });

});
