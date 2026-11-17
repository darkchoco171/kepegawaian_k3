# Dokumentasi Teknis & Panduan Serah Terima (Handover)
**Sistem Pencatatan Riwayat Cuti Pegawai & Perhitungan Tunjangan Kinerja (Tukin)**  
**Unit Kerja:** Tata Usaha Direktorat Bina Kelembagaan K3 — Kementerian Ketenagakerjaan RI

---

## 1. Ringkasan Arsitektur & Tech Stack
* **Framework Utama:** Next.js (App Router) dengan TypeScript
* **Database & ORM:** PostgreSQL (Neon DB) dengan Drizzle ORM (`src/db/schema.ts`)
* **UI & Styling:** Tailwind CSS + shadcn/ui
* **Pengolahan Excel:** Library `xlsx` (SheetJS) untuk impor presensi/kinerja dan ekspor format 38 kolom Tukin

---

## 2. Regulasi & Logika Bisnis Sistem

### A. Perhitungan Tunjangan Kinerja (Tukin)
*File rujukan: `src/lib/tukin/calculation.ts`*

Komponen total Tukin yang dibayarkan (`dibayarkan`) terbagi menjadi dua porsi utama dari `base_tukin` (berdasarkan `master_kelas_jabatan`): **70% Kinerja** dan **30% Kehadiran**.

1. **Porsi Kinerja (Maksimal 70%):**
   Dihitung berdasarkan matriks kombinasi **Hasil Kerja** dan **Perilaku Kerja**:

   | Hasil Kerja | Perilaku Kerja | Predikat Capaian Kinerja | Persentase Kinerja |
   | :--- | :--- | :--- | :--- |
   | Di Atas Ekspektasi | Di Atas Ekspektasi | Sangat Baik | **70%** (`0.70`) |
   | Sesuai Ekspektasi | Di Atas Ekspektasi | Baik | **70%** (`0.70`) |
   | Di Atas Ekspektasi | Sesuai Ekspektasi | Baik | **70%** (`0.70`) |
   | Sesuai Ekspektasi | Sesuai Ekspektasi | Baik | **70%** (`0.70`) |
   | Di Bawah Ekspektasi | Di Atas Ekspektasi / Sesuai Ekspektasi | Butuh Perbaikan | **59,5%** (`0.595`) |
   | Di Atas / Sesuai Ekspektasi | Di Bawah Ekspektasi | Kurang / Miss Conduct | **42%** (`0.42`) |
   | Di Bawah Ekspektasi | Di Bawah Ekspektasi | Sangat Kurang | **42%** (`0.42`) |

2. **Porsi Kehadiran (Maksimal 30%):**
   * Nilai maksimal kehadiran adalah `30% × nominalDasar`.
   * Total persentase potongan bulanan (`persentasePotongan`, dibatasi maksimal `100%`) mengurangi porsi 30% tersebut secara proporsional:
     $$\text{Nominal Kehadiran} = (\text{nominalDasar} \times 0.30) \times \left(\frac{100 - \text{persentasePotongan}}{100}\right)$$

3. **Total Tukin Dibayarkan:**
   $$\text{Dibayarkan} = \text{Nominal Kinerja} + \text{Nominal Kehadiran}$$

---

### B. Konversi Angka Kredit (CPAK) Jabatan Fungsional
*File rujukan: `src/lib/tukin/calculation.ts`*

1. **Koefisien Konversi Predikat Kinerja:**
   * **Sangat Baik:** `1.5` (150%)
   * **Baik:** `1.0` (100%)
   * **Butuh Perbaikan:** `0.75` (75%)
   * **Kurang / Miss Conduct & Sangat Kurang:** `0.5` (50%)

2. **Rumus Capaian PAK:**
   * **Bulanan:** $(\text{koefisienTahunan} / 12) \times \text{koefisienKonversi}$
   * **Tahunan:** $\text{koefisienTahunan} \times \text{koefisienKonversi}$

3. **Aturan Akumulasi Saldo AK:**
   * Akumulasi saldo dihitung berurutan lintas tahun selama `idMasterJenjang` pegawai tidak berubah.
   * Jika pegawai mengalami kenaikan jenjang jabatan (`idMasterJenjang` berubah), perhitungan saldo akumulasi dimulai kembali dari `0` pada jenjang yang baru.

---

### C. Impor Presensi Harian & Deteksi Anomali
*File rujukan: `src/app/admin/presensi/actions.ts`*

1. **Sumber Persentase Potongan Harian:**
   * Sistem **tidak** menghitung ulang persentase denda keterlambatan dari selisih menit secara terpisah. Nilai `persentasePotonganHarian` dibaca langsung dari **Kolom ke-19 (indeks `row[18]`)** file Excel presensi mentah, sedangkan total menit terlambat diambil dari **Kolom ke-15 (`row[14]`)**.
   * Seluruh `persentasePotonganHarian` dalam satu bulan dijumlahkan ke tabel `rekap_presensi_bulanan`.

2. **Validasi Periode & Parsing Tanggal:**
   * Sebelum data disimpan, sistem memvalidasi bahwa seluruh tanggal pada `row[3]` berada di bulan dan tahun yang sama dengan periode target yang dipilih admin.
   * Konversi objek `Date` Excel menggunakan *buffer* `+12 jam` (`12 * 60 * 60 * 1000` ms) untuk mencegah pergeseran tanggal akibat zona waktu (UTC vs WIB).

3. **Aturan Status Anomali:**
   * **Patokan Jam Masuk (Input Manual):** `07:30`.
   * **WFO & WFH:** Terlambat $\le 300$ menit dicatat sebagai `Terlambat X menit`. Terlambat $> 300$ menit atau salah satu waktu (`cekIn` / `cekOut`) kosong otomatis ditandai sebagai **`Lupa Absen`** (`LUPA_ABSEN` saat impor Excel).
   * **Dinas Luar (DL):** Dikecualikan dari hitungan keterlambatan (wajib `cekIn` dan `cekOut`).
   * **Upacara:** Jika jatuh pada hari Sabtu/Minggu tanpa `cekIn`, ditandai **`Tidak Upacara`**. Jika pada hari kerja tanpa `cekIn`/`cekOut` lengkap, ditandai **`Lupa Absen`**.

4. **Sinkronisasi Otomatis Cuti Saat Impor Presensi:**
   * Jika baris Excel berstatus `Cuti`, sistem mengecek tabel `pengajuan_cuti` pada tanggal yang bersangkutan. Jika sudah ada, `id_cuti` ditautkan agar tidak duplikat. Jika belum ada dan kolom keterangan (`row[6]`) terisi, sistem otomatis membuat entri cuti baru berstatus `Disetujui` (`1` hari kerja).

---

### D. Pencatatan & Saldo Cuti Tahunan (N, N-1, N-2)
*File rujukan: `src/app/admin/cuti/hitung-cuti.ts` & `src/app/admin/cuti/cuti-utils.ts`*

1. **Sifat Fitur:** Aplikasi berfungsi sebagai pencatatan arsip administratif oleh Admin TU (bukan sistem pengajuan dan persetujuan berjenjang oleh pegawai).
2. **Mekanisme Saldo 3 Tahun:**
   * Sistem menghitung akumulasi kuota cuti tahunan dalam rentang 3 tahun: tahun berjalan (`N`), 1 tahun sebelumnya (`N-1`), dan 2 tahun sebelumnya (`N-2`), dengan batas maksimal gabungan `ANNUAL_CUTI_QUOTA * 3` (36 hari).
   * **Aturan Migrasi Saldo (`LAST_IMPORTED_BALANCE_YEAR`):** Untuk tahun $\le$ `LAST_IMPORTED_BALANCE_YEAR`, jika baris data belum ada di tabel `sisa_cuti`, saldo dianggap `0`. Untuk tahun $>$ `LAST_IMPORTED_BALANCE_YEAR`, sistem otomatis memberikan kuota penuh (`ANNUAL_CUTI_QUOTA` / 12 hari).

---

### E. Ekspor Tukin 38 Kolom & Impor Kinerja
*File rujukan: `src/app/admin/tukin/excel-actions.ts`*

1. **Format Ekspor (`getExportDataTukin`):**
   * Menghasilkan file `.xlsx` dengan nama sheet **`PNS & PPPK`** dan susunan **38 kolom standar** sesuai template resmi Tata Usaha.
   * **Klasifikasi Cuti Lintas Bulan:** Sistem menghitung `selisihBulan` antara periode laporan Tukin dengan bulan mulai cuti (`tglMulai`) untuk memisahkan otomatis jumlah hari/kejadian ke dalam kolom **Bulan I** (`selisihBulan === 0`), **Bulan II** (`selisihBulan === 1`), **Bulan III** (`selisihBulan === 2`), dan **> 3 Bulan** (`selisihBulan > 2`).
2. **Alur Impor Penilaian Kinerja (`prosesImportExcel`):**
   * Saat mengunggah file Excel penilaian SKP (`Hasil Kerja` & `Perilaku Kerja`), kolom `dibayarkan` pada `tukin_bulanan` mula-mula diisi sebesar `nominalKinerja`. Admin wajib menjalankan proses kalkulasi akhir (tombol kalkulasi di halaman Tukin) setelah data presensi dan kinerja lengkap agar `dibayarkan` menjumlahkan `nominalKinerja + nominalKehadiran`.

---

### F. Konstanta Master Data Kepegawaian
*File rujukan: `src/lib/constants.ts`*

* **Daftar Tim Kerja (`DAFTAR_TIM`):** Dikelola terpusat dalam satu array konstanta berisi 16 tim/sub-bagian kerja (meliputi bidang Kesehatan Kerja, Sistem Manajemen Mutu K3, Keselamatan Kerja, Pengembangan Personel K3, Tata Usaha, serta penugasan lintas unit seperti Dit. Wasuji, Dit. Sistem, dan Sesditjen Binwasnaker).
* **Jabatan Tim (`DAFTAR_JABATAN_TIM`):** Hanya memiliki 3 nilai eksplisit: `"Kasubbag TU"`, `"Ketua Tim"`, dan `"Wakil Ketua Tim"`. Pegawai pelaksana/staf dibiarkan `null` agar sesuai dengan data nominatif resmi.
* **Status Pegawai (`DAFTAR_STATUS`):** `"Aktif"`, `"Cuti"`, dan `"Tugas Belajar"`.

---

## 3. Catatan Pemeliharaan & Pengembangan Lanjutan (Next Steps)

1. **Normalisasi Nama Pegawai (`cleanName` di `src/app/admin/presensi/actions.ts`):**
   * Terdapat pengecualian pemetaan nama (*hardcoded mapping*) untuk pegawai yang memiliki perbedaan penulisan ejaan antara mesin presensi/Excel dan database master (`dinannisazuhra` dan `andimuhadhim`). Tambahkan pengecualian serupa pada fungsi `cleanName` apabila terdapat pegawai baru dengan perbedaan ejaan nama pada file Excel presensi.
2. **Pengembangan Fitur Perhitungan Uang Makan (Pending Konfirmasi):**
   * Fitur perhitungan Uang Makan belum diimplementasikan penuh karena masih menunggu konfirmasi tarif pajak final dari pembimbing lapangan (**Mba Nisa**).
   * Rancangan aturan dasar:
     * Dihitung dari jumlah hari hadir kerja (`WFO + WFH`) dikalikan tarif harian per golongan, lalu dikurangi PPh Pasal 21:
       * **Golongan II:** Rp35.000/hari *(tarif pajak sementara diasumsikan 5%, menunggu konfirmasi apakah 0% atau 5%)*.
       * **Golongan III:** Rp37.000/hari (pajak 5%).
       * **Golongan IV:** Rp41.000/hari (pajak 15%).
3. **Pembaruan Halaman Struktur Organisasi:**
   * Halaman daftar pegawai/struktur organisasi dapat dikelompokkan berdasarkan `namaTimKerja` (atau `DAFTAR_TIM`) dengan hierarki Direktur di puncak, Kasubbag TU di jalur struktural kanan, serta blok Tim Kerja yang dipimpin oleh Ketua Tim dan Wakil Ketua Tim.