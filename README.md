# SIMPEG K3

SIMPEG K3 adalah aplikasi web internal untuk membantu administrator mengelola data pegawai, presensi, cuti, kinerja bulanan, Angka Kredit (PAK), dan perhitungan serta ekspor Tunjangan Kinerja (Tukin).

## Mulai cepat

Prasyarat: Node.js yang kompatibel dengan Next.js 16, npm, dan database PostgreSQL yang dapat diakses melalui Neon Serverless.

```powershell
npm ci
```

Buat file `.env` di root proyek dan isi `DATABASE_URL` dengan connection string database development. Jangan gunakan kredensial atau database produksi untuk pengembangan maupun pengujian.

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
```

Jalankan aplikasi:

```powershell
npm run dev
```

Buka `http://localhost:3000`. Login membutuhkan akun yang sudah ada di database. Jika menyiapkan akun melalui seed administrator, lihat bagian seed dan variabel environment di [Panduan Developer](./PANDUAN-DEVELOPER.md).

## Dokumentasi

- [Panduan Developer dan serah-terima](./PANDUAN-DEVELOPER.md) — setup, arsitektur, database, pengujian, dan catatan operasional.
- [Panduan Penggunaan](./PANDUAN-PENGGUNAAN.md) — alur kerja operator/admin dan penjelasan fitur.
- [Panduan Pengujian](./PANDUAN-PENGUJIAN.md) — skenario manual dan perintah pengujian otomatis.
- [Laporan hasil E2E](./LAPORAN-HASIL-E2E-2026-10-20.md) — hasil pengujian browser yang terdokumentasi.

## Perintah utama

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | Menjalankan server development |
| `npm run build` | Membuat build production |
| `npm run start` | Menjalankan build production |
| `npm run lint` | Menjalankan ESLint |
| `npm run test:unit` | Menjalankan unit test |
| `npm run test:integration` | Menjalankan integration test |
| `npm run test:e2e` | Menjalankan E2E Playwright |

Untuk konfigurasi database, kredensial test, seed data, dan peringatan perubahan skema, baca [Panduan Developer](./PANDUAN-DEVELOPER.md) terlebih dahulu.
