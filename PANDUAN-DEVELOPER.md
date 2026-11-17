# Panduan Developer SIMPEG K3

Dokumen serah-terima teknis untuk menyiapkan lingkungan, memahami struktur aplikasi, dan menjalankan pengujian. Panduan ini melengkapi [Panduan Penggunaan](./PANDUAN-PENGGUNAAN.md) dan [Panduan Pengujian](./PANDUAN-PENGUJIAN.md).

## 1. Ringkasan sistem

SIMPEG K3 adalah aplikasi Next.js dengan App Router. Antarmuka dan sebagian besar logika server berada di `src/app`; data disimpan di PostgreSQL dan diakses melalui Neon Serverless serta Drizzle ORM. Aplikasi saat ini berpusat pada panel administrator.

Fitur utama:

- Data pegawai, profil, riwayat pendidikan, dan diklat.
- Master jabatan, kelas jabatan, pangkat/golongan, dan jenjang.
- Impor presensi harian dan pembentukan rekap bulanan.
- Pencatatan cuti dan saldo cuti.
- Penilaian kinerja bulanan dan pencatatan PAK tahunan.
- Kalkulasi serta ekspor Tukin dalam format Excel.
- Login dengan NIP dan kata sandi.

## 2. Teknologi dan prasyarat

Versi dependency yang tercatat di `package.json`:

- Next.js `16.3.5`, React `19.2.8`, TypeScript `5`.
- NextAuth `4.24.x`.
- PostgreSQL via `@neondatabase/serverless`, Drizzle ORM `0.45.x`, Drizzle Kit `0.31.x`.
- Tailwind CSS `4`, Playwright `1.64.x`, dan `xlsx` untuk pengolahan workbook.

Gunakan versi Node.js yang didukung oleh Next.js 16. Gunakan Node.js/npm yang sama dengan lingkungan tim bila tersedia. `package-lock.json` menjadi sumber versi dependency yang tepat; instalasi bersih dilakukan dengan `npm ci`.

## 3. Menyiapkan lingkungan lokal

1. Pastikan akses ke repository dan database development/test PostgreSQL.
2. Dari root repository jalankan:

   ```powershell
   npm ci
   ```

3. Buat `.env` di root proyek. File `.env*` sudah diabaikan Git.

   ```env
   DATABASE_URL=postgresql://<user>:<password>@<host>/<database>?sslmode=require
   ```

4. Jalankan aplikasi:

   ```powershell
   npm run dev
   ```

5. Buka `http://localhost:3000`. Login menggunakan akun yang sudah tersedia di database.

Jangan masukkan kredensial ke source control, dokumentasi, issue publik, atau log. Pastikan `DATABASE_URL` menunjuk ke database development/test sebelum menjalankan integration test, E2E, script seed, atau sinkronisasi skema.

### Variabel environment

| Nama | Kegunaan |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL; digunakan aplikasi dan Drizzle Kit. Wajib untuk operasi database. |
| `ADMIN_INITIAL_PASSWORD` | Kata sandi sementara untuk script seed akun admin dan fallback kredensial E2E. Seed akun mensyaratkan 12–72 byte. |
| `E2E_ADMIN_NIP` | NIP akun yang digunakan E2E; bila tidak diatur, test helper memakai NIP bawaan yang ditentukan di `tests/helpers/test-helper.ts`. |
| `E2E_ADMIN_PASSWORD` | Kata sandi akun E2E; fallback-nya `ADMIN_INITIAL_PASSWORD`. |
| `CI` | Mengubah perilaku Playwright di CI: melarang `.only` dan mengaktifkan retry. |

Untuk deployment, siapkan secret NextAuth yang kuat dan URL aplikasi sesuai lingkungan deployment; jangan memakai nilai development. Repository ini tidak menyediakan file `.env.example` atau konfigurasi deployment khusus.

## 4. Struktur kode

```text
src/
  app/
    admin/                 Halaman panel dan Server Actions per fitur
    api/auth/[...nextauth]/ Endpoint NextAuth Credentials
    login/                 Halaman login
  components/              Komponen UI bersama
  db/
    schema.ts              Definisi skema dan relasi Drizzle
    seed-*.ts               Script seed khusus dataset proyek
  lib/
    auth-options.ts        Konfigurasi autentikasi dan session JWT
    db.ts                  Koneksi database aplikasi
    tukin/                 Validasi periode dan kalkulasi Tukin
    auth/                  Aturan autentikasi tambahan
  proxy.ts                 Gate sesi untuk route admin dan redirect login
  types/                   Augmentasi tipe
tests/
  unit/                    Unit test
  integration/             Integration test
  *.spec.ts                Test browser Playwright
  helpers/                 Helper untuk test
drizzle/                   File SQL yang tersimpan di repository
```

Rute panel utama:

| Rute | Fitur |
|---|---|
| `/admin/dashboard` | Dasbor |
| `/admin/pegawai` | Daftar dan detail pegawai |
| `/admin/presensi` | Presensi |
| `/admin/cuti` | Manajemen cuti |
| `/admin/manajemen-kinerja` | Kinerja bulanan, PAK, dan master pangkat/golongan |
| `/admin/tukin` | Kalkulasi, detail, dan ekspor Tukin |
| `/admin/profil` | Profil dan penggantian kata sandi |

Alias TypeScript `@/*` menunjuk ke `src/*`. Perubahan mutasi data umumnya berada pada file `actions.ts` di direktori fitur terkait; halaman dan komponen berada di `page.tsx` serta file UI lokal.

## 5. Autentikasi dan batas akses

- Login memakai provider Credentials NextAuth: NIP pegawai dan kata sandi.
- Kata sandi disimpan dalam bentuk hash bcrypt.
- Session memakai JWT dan membawa identitas pegawai serta role.
- `src/proxy.ts` mengarahkan pengguna yang belum memiliki token dari area `/admin` ke `/login`, serta mengarahkan token yang membuka `/login` ke dashboard.

Enum role `admin` dan `pegawai` tersedia di skema. Proxy berfungsi sebagai gate sesi untuk route; saat menambah atau mengubah operasi sensitif, tetap lakukan pemeriksaan autentikasi dan otorisasi yang sesuai di sisi server/Server Action. Jangan menganggap keberadaan token saja sudah memvalidasi hak akses suatu operasi.

## 6. Database dan perubahan skema

`src/db/schema.ts` adalah definisi skema Drizzle. Kelompok tabel yang ada:

| Kelompok | Tabel |
|---|---|
| Master | `master_jenjang`, `master_kelas_jabatan`, `master_jabatan`, `master_pangkat_golongan` |
| Identitas pegawai | `pegawai`, `users`, `riwayat_pendidikan`, `riwayat_diklat` |
| Presensi dan cuti | `presensi_harian`, `rekap_presensi_bulanan`, `sisa_cuti`, `pengajuan_cuti`, `alokasi_saldo_cuti` |
| Kinerja dan Tukin | `capaian_pak_bulanan`, `riwayat_angka_kredit`, `tukin_bulanan` |

Relasi penting:

- Status PNS/PPPK pegawai diturunkan dari relasi pangkat/golongan, bukan kolom langsung di `pegawai`.
- Presensi harian membentuk rekap presensi per pegawai/periode.
- Penilaian kinerja dan Tukin disimpan per pegawai/periode; PAK disimpan per pegawai/tahun.
- `alokasi_saldo_cuti` menyimpan rincian saldo per tahun yang dipakai oleh suatu pengajuan. Tabel ini diperlukan oleh alur hapus/pengembalian saldo cuti.
- Data Tukin menyimpan snapshot nominal dasar dan jabatan saat perhitungan agar perubahan master berikutnya tidak mengubah histori.

Sinkronkan skema hanya setelah memeriksa database target:

```powershell
npx drizzle-kit push
```

`drizzle.config.ts` memuat `.env` dan menunjuk ke `src/db/schema.ts`. Perintah `push` menerapkan perubahan langsung ke database yang ditunjuk `DATABASE_URL`; jangan jalankan ke production tanpa review perubahan, backup, dan persetujuan prosedur rilis. File SQL di `drizzle/` adalah file yang tersimpan di repository; jangan berasumsi bahwa file tersebut merupakan seluruh rangkaian migrasi untuk skema saat ini.

## 7. Seed dan data lokal

Script di `src/db/` adalah script data spesifik proyek, bukan command bootstrap generik yang aman dijalankan pada semua lingkungan. Sebelum memakai script, periksa isi dan `DATABASE_URL`:

- `seed-master.ts` memuat master contoh/operasional.
- `seed-pegawai.ts` membaca `data_pegawai_bersih.xlsx` dari root dan mencocokkan data ke master.
- `seed-user.ts` menargetkan pegawai berdasarkan NIP yang tertulis di script dan membutuhkan `ADMIN_INITIAL_PASSWORD`.
- **`seed-sisa-cuti.ts` menghapus seluruh isi `sisa_cuti` sebelum mengisi ulang data yang tertanam di script. Jangan jalankan tanpa konfirmasi, backup, dan database yang benar.**

Sebagian script tidak memuat `.env` dengan cara yang sama. `drizzle.config.ts` secara eksplisit membaca `.env`, tetapi script seed mengimpor koneksi database langsung. Pastikan environment process memiliki `DATABASE_URL` dan variabel terkait sebelum menjalankannya. Jangan membuat akun menggunakan kata sandi tetap atau mengirim kata sandi melalui source control.

File Excel selain fixture tertentu diabaikan oleh Git. Perlakukan file data pegawai/presensi sebagai data sensitif: jangan mengunggahnya ke issue, layanan eksternal, atau repository tanpa izin.

## 8. Pengujian dan pemeriksaan perubahan

Perintah tersedia di `package.json`:

```powershell
npm run lint
npx tsc --noEmit
npm run test:unit
npm run test:integration
npm run test:e2e
```

- Unit test tidak memerlukan alur UI penuh.
- Integration test ekspor memerlukan `DATABASE_URL` ke database test dan memilih periode Tukin yang tersedia; sebagian skenario dapat `skip` bila datanya tidak ada.
- E2E menggunakan Playwright/Chromium, menjalankan `npm run dev` melalui konfigurasi Playwright, dan membutuhkan akun login. E2E dapat membuat atau mengubah data, sehingga jangan jalankan terhadap database produksi.
- Detail skenario manual ada di [Panduan Pengujian](./PANDUAN-PENGUJIAN.md).

Pemeriksaan minimum sebelum menyerahkan perubahan: lint, type-check, unit test, lalu test integration/E2E yang relevan dengan koneksi test database. Catat bila test dilewati atau membutuhkan fixture/data tertentu.

## 9. Alur bisnis yang perlu dijaga

Untuk alur bulanan Tukin, urutan operasional umumnya: master dan data pegawai → impor presensi/rekap → data cuti → penilaian kinerja → kalkulasi Tukin → pemeriksaan dan ekspor. PAK merupakan pencatatan tahunan yang terpisah.

Rincian aturan bisnis berubah dan harus diverifikasi pada kode serta panduan pengguna. Beberapa catatan penting yang sudah terdokumentasi:

- Impor presensi parsial dapat membentuk ulang rekap berdasarkan isi file yang diimpor; pastikan file mencakup data lengkap untuk periode yang dimaksud.
- Import presensi menolak tanggal yang berada di luar bulan/tahun periode yang dipilih. Kalkulasi Tukin dibatalkan jika ada pegawai dengan penilaian pada periode tersebut yang belum memiliki rekap presensi.
- Pengajuan cuti dari formulir administrator saat ini langsung disimpan sebagai disetujui; ini bukan workflow persetujuan mandiri bertahap.
- Perhitungan hari kerja cuti belum mengecualikan hari libur nasional.
- Ringkasan Tukin/rata-rata presensi di dashboard belum menjadi sumber verifikasi nominal; cocokkan hasil melalui halaman detail Tukin dan workbook ekspor.

Untuk langkah operator dan rumus yang dijelaskan kepada pengguna, lihat [Panduan Penggunaan](./PANDUAN-PENGGUNAAN.md).

## 10. Checklist serah-terima

- [ ] Pastikan developer penerima memiliki akses repository dan database development/test yang benar.
- [ ] Sampaikan cara mendapatkan secret melalui kanal yang disetujui; jangan menaruhnya di repository.
- [ ] Pastikan `.env` lokal tidak berisi kredensial production saat menjalankan test.
- [ ] Tinjau perubahan skema dan buat backup sesuai prosedur sebelum perubahan database.
- [ ] Jalankan pemeriksaan dan test yang relevan; dokumentasikan test yang gagal atau di-skip.
- [ ] Jelaskan perubahan data lokal, fixture, atau pekerjaan yang belum selesai secara terpisah.
