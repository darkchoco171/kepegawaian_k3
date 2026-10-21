# Panduan Penggunaan SIMPEG K3

Panduan ini menjelaskan alur penggunaan panel administrator untuk mengelola data pegawai, presensi, cuti, kinerja, Angka Kredit (PAK), dan Tunjangan Kinerja (Tukin).

> Gunakan aplikasi sesuai hak akses yang diberikan. Jangan membagikan kata sandi atau memasukkan data produksi saat berlatih/pengujian.

## Daftar Isi

1. [Masuk dan navigasi](#1-masuk-dan-navigasi)
2. [Alur kerja yang disarankan](#2-alur-kerja-yang-disarankan)
3. [Menyiapkan master jabatan dan pangkat/golongan](#3-menyiapkan-master-jabatan-dan-pangkatgolongan)
4. [Mengelola data pegawai](#4-mengelola-data-pegawai)
5. [Mengimpor presensi](#5-mengimpor-presensi)
6. [Mencatat cuti](#6-mencatat-cuti)
7. [Memasukkan kinerja bulanan](#7-memasukkan-kinerja-bulanan)
8. [Memasukkan Angka Kredit tahunan](#8-memasukkan-angka-kredit-tahunan)
9. [Menghitung dan mengekspor Tukin](#9-menghitung-dan-mengekspor-tukin)
10. [Arti beberapa perhitungan](#10-arti-beberapa-perhitungan)
11. [Kendala umum dan pemeriksaan](#11-kendala-umum-dan-pemeriksaan)
12. [Catatan batasan fitur](#12-catatan-batasan-fitur)

## 1. Masuk dan navigasi

1. Buka alamat aplikasi yang diberikan administrator sistem.
2. Masuk melalui halaman login menggunakan akun administrator.
3. Setelah masuk, gunakan menu di bagian atas:
   - **Dasbor**
   - **Data Pegawai**
   - **Manajemen Kinerja**
   - **Presensi**
   - **Tunjangan Kinerja**
   - **Manajemen Cuti**
4. Menu nama/profil administrator membuka halaman profil. Tombol **Keluar** mengakhiri sesi.
5. Penggantian kata sandi tersedia di halaman **Profil** dan tidak wajib saat login.

Dasbor menampilkan ringkasan pegawai dan pengajuan cuti terbaru. Gunakan menu modul untuk mengelola atau memeriksa data lebih lanjut.

## 2. Alur kerja yang disarankan

Untuk menyiapkan perhitungan Tukin bulanan, gunakan urutan berikut:

1. Pastikan master jabatan, kelas jabatan, dan pangkat/golongan sudah tersedia.
2. Tambahkan atau periksa data pegawai dan pastikan relasi ke master benar.
3. Impor presensi untuk pegawai dan periode yang akan diproses.
4. Catat cuti yang disetujui melalui **Manajemen Cuti**.
5. Masukkan penilaian kinerja pegawai untuk bulan dan tahun yang sama.
6. Buka **Tunjangan Kinerja**, pilih periode, kemudian jalankan **Kalkulasi Tukin**.
7. Periksa rincian pegawai dan nilai yang dibayarkan.
8. Jika diperlukan, gunakan **Export** untuk mengunduh workbook Excel.

Angka Kredit (PAK) adalah pencatatan tahunan dan dapat dikelola terpisah dari alur Tukin bulanan.

## 3. Menyiapkan master jabatan dan pangkat/golongan

Master diperlukan agar data pegawai dapat dihubungkan ke kelas Tukin dan aturan Angka Kredit.

1. Buka **Manajemen Kinerja**.
2. Pilih **Master Pangkat/Golongan**.
3. Pada bagian **Tambah Master Jabatan**:
   - Isi **Nama Jabatan**.
   - Pilih **Kelas Jabatan** dengan base Tukin yang sesuai.
   - Isi **Jenis Jabatan** bila diperlukan.
   - Klik **Simpan Master Jabatan**.
4. Pada bagian **Tambah Master Pangkat/Golongan**:
   - Pilih **Jenis Kepegawaian**.
   - Isi nama pangkat dan golongan.
   - Untuk PNS, isi **Angka Kredit Minimal**; untuk jenis lain kolom ini opsional.
   - Klik **Simpan Master Pangkat/Golongan**.
5. Periksa tabel master setelah data tersimpan.

Urutan jenjang diatur otomatis oleh aplikasi ketika master baru dibuat. Periksa urutannya karena target AK jenjang berikutnya mengacu pada urutan tersebut. Untuk master PNS yang sudah ada, nilai **Angka Kredit Minimal** dapat dilengkapi atau diperbarui dari tabel master dengan tombol **Simpan**.

Master dapat dihapus melalui tombol **Hapus**. Penghapusan akan ditolak jika master masih digunakan pegawai atau riwayat terkait. Periksa dampaknya sebelum menghapus data master.

> Kelas jabatan/base Tukin dipilih dari daftar yang tersedia. Jika kelas atau nominal dasar yang dibutuhkan tidak tersedia, minta administrator sistem mengelola sumber data kelas jabatan.

## 4. Mengelola data pegawai

### Menambahkan pegawai

1. Buka **Data Pegawai**, lalu klik **Tambah Pegawai**.
2. Isi data pekerjaan:
   - **Nama Lengkap & Gelar**
   - **NIP** (18 digit)
   - **Jabatan**
   - **Kelas Jabatan**
   - **Pangkat**
   - **Golongan**
   - **Jenis Kepegawaian**
3. Pastikan jabatan, kelas jabatan, pangkat, golongan, dan jenis kepegawaian sesuai dengan master yang tersedia. Jika belum tersedia, buat master terlebih dahulu.
4. Lengkapi data lain bila ada, misalnya tim, status kepegawaian, kontak, data diri, pendidikan, dan diklat.
5. Klik **Simpan Data** pada formulir.
6. Cari nama/NIP pegawai pada tabel. Gunakan **Detail** untuk melihat informasi lebih lengkap.

Saat pegawai baru dibuat, aplikasi juga menyiapkan saldo cuti awal. Periksa saldo pada halaman detail pegawai atau modul cuti.

### Mencari, mengedit, dan menghapus pegawai

- Gunakan kotak **Cari nama atau NIP...** dan filter subbagian/tim pada halaman Data Pegawai.
- Klik **Edit** untuk memperbarui data. Relasi jabatan dan pangkat/golongan tetap harus cocok dengan master.
- Klik **Hapus** hanya setelah memastikan data memang boleh dihapus. Penghapusan dapat menghilangkan data terkait pegawai.

## 5. Mengimpor presensi

1. Buka **Presensi**.
2. Pilih bulan pada kolom **Periode** terlebih dahulu.
3. Klik **Download Template** untuk mendapatkan format Excel.
4. Isi workbook dengan data presensi yang sesuai template. Kolom yang digunakan antara lain:
   - Nama pegawai dan/atau NIP
   - Tanggal
   - Sistem kerja
   - Keterangan cuti, bila sistem kerja adalah Cuti
   - Jam masuk/keluar dan nilai presensi lain yang tersedia di template
5. Simpan file sebagai `.xlsx` atau `.xls`.
6. Klik **Import Data Absen**, pilih file, lalu tunggu pesan hasil proses.
7. Periksa tabel presensi untuk periode tersebut dan cari pegawai yang diuji.

Sistem kerja yang dikenali meliputi WFO, WFH, Dinas Luar, Cuti, Upacara, dan Alpa. Pastikan tanggal, nama/NIP, dan nilai pada kolom sesuai format template.

> **Penting:** impor memperbarui presensi harian pada tanggal yang ada di file. Rekap bulanan yang dihasilkan dari proses impor dihitung dari baris file yang sedang diimpor. Karena itu, hindari mengimpor file parsial untuk pegawai/periode yang sudah memiliki rekap lengkap: rekapnya dapat berubah mengikuti isi file parsial tersebut. Simpan salinan file sumber sebelum impor.

## 6. Mencatat cuti

1. Buka **Manajemen Cuti**.
2. Klik **Ajukan Cuti Baru**.
3. Cari dan pilih pegawai menggunakan nama atau NIP.
4. Pilih jenis cuti:
   - Tahunan
   - Sakit
   - Besar
   - Melahirkan
   - Alasan Penting
   - Gugur Kandungan
   - Lainnya
5. Tentukan tanggal mulai dan tanggal selesai. **Jumlah Hari Kerja** dihitung otomatis.
6. Isi alasan bila diperlukan, lalu klik **Simpan Pengajuan**.
7. Baca pesan hasil penyimpanan. Periksa status, durasi, saldo, dan presensi pada tabel cuti/presensi.

Hari kerja dihitung Senin–Jumat. Akhir pekan tidak masuk hitungan, tetapi hari libur nasional belum dikecualikan secara otomatis. Rentang yang seluruhnya jatuh pada akhir pekan tidak dapat disimpan.

Pengajuan Tahunan dan Sakit menggunakan saldo tahunan. Sistem mengalokasikan pemakaian dari saldo N-2, lalu N-1, kemudian N. Cuti jenis lain tidak mengurangi saldo tahunan pada alur ini. Sistem menolak rentang yang bertabrakan dengan pengajuan cuti pegawai yang sudah ada.

Setelah cuti tersimpan, sistem mencatat presensi harian berstatus **Cuti** untuk hari kerja dalam rentang tersebut dan memperbarui rekap bulanan terkait. Jika pesan memberi tahu bahwa data utama tersimpan tetapi rekap gagal diperbarui, minta administrator memeriksa rekap sebelum menghitung Tukin.

## 7. Memasukkan kinerja bulanan

1. Buka **Manajemen Kinerja** pada tab **Kinerja Bulanan (Tukin)**.
2. Klik **Input Kinerja Bulanan**.
3. Pilih pegawai, bulan, dan tahun.
4. Pilih **Hasil Kerja** dan **Perilaku Kerja**:
   - Di Atas Ekspektasi
   - Sesuai Ekspektasi
   - Di Bawah Ekspektasi
5. Klik **Simpan Penilaian Kinerja**.
6. Periksa periode, predikat, persentase, dan nominal pada tabel.

Satu pegawai memiliki satu catatan kinerja per periode. Menyimpan kembali pegawai dan periode yang sama memperbarui catatan yang ada.

## 8. Memasukkan Angka Kredit tahunan

1. Buka **Manajemen Kinerja**, lalu pilih tab **Angka Kredit Tahunan (PAK)**.
2. Klik **Input Angka Kredit**.
3. Pilih pegawai, isi **Tahun Penilaian**, dan masukkan **Nilai Capaian Angka Kredit (PAK)**.
4. Klik **Simpan Angka Kredit**.
5. Periksa nilai PAK dan target AK pada tabel.

Target dihitung berdasarkan pangkat/golongan pegawai dan aturan AK minimal pada jenjang berikutnya. Pastikan master pangkat/golongan dan urutan jenjang telah benar sebelum menginput PAK.

## 9. Menghitung dan mengekspor Tukin

### Menghitung Tukin

1. Buka **Tunjangan Kinerja**.
2. Pilih bulan dan tahun yang akan diproses.
3. Pastikan catatan kinerja sudah tersimpan untuk pegawai dan periode yang sama.
4. Klik **Kalkulasi Tukin**, lalu konfirmasi dialog.
5. Baca pesan hasil kalkulasi.
6. Periksa nilai pada tabel. Klik **Detail** pada pegawai untuk melihat base Tukin, predikat kinerja, nominal kinerja, dan rekap presensi.
7. Jika ada perubahan kinerja/presensi/cuti, selesaikan pembaruan sumber data terlebih dahulu, kemudian jalankan kalkulasi kembali.

Kalkulasi Tukin memproses pegawai yang memiliki data kinerja di bulan tersebut. Jika rekap presensi tidak ditemukan, komponen kehadiran pada proses kalkulasi massal menjadi nol.

### Mengekspor Excel

1. Pilih periode yang diinginkan pada kolom **Periode**.
2. Klik **Export**.
3. Simpan file `Rekap_Tukin_<bulan>_<tahun>.xlsx`.
4. Periksa identitas pegawai, angka kinerja, presensi, cuti, dan total pembayaran sebelum menggunakan file lebih lanjut.

Export berisi pegawai dengan catatan Tukin untuk periode yang dipilih. Kolom cuti menggunakan pengajuan berstatus **Disetujui** yang beririsan dengan periode export; pengajuan yang belum disetujui atau ditolak tidak dimasukkan.

## 10. Arti beberapa perhitungan

### Kinerja

| Hasil Kerja | Perilaku Kerja | Predikat | Persentase perhitungan |
|---|---|---|---:|
| Di Atas | Di Atas | Sangat Baik | 70% |
| Di Atas/Sesuai | Sesuai/Di Atas | Baik | 70% |
| Di Bawah | Di Atas/Sesuai | Butuh Perbaikan | 59,5% |
| Di Atas/Sesuai | Di Bawah | Kurang/Miss Conduct | 42% |
| Di Bawah | Di Bawah | Sangat Kurang | 42% |

Untuk predikat **Butuh Perbaikan**, persentase perhitungan adalah **59,5%**; tampilan dibulatkan menjadi **60%**. Nominal kinerja tetap dihitung dari 59,5%.

### Kehadiran dan total Tukin

Komponen kehadiran memiliki batas maksimal 30% dari base Tukin. Rumus rekap dapat berbeda bergantung pada jalur pembentukan rekap (impor presensi atau pembaruan rekap setelah input cuti). Periksa rincian dan hasil Excel terhadap aturan operasional yang berlaku, terutama jika data presensi dan cuti pada periode yang sama berasal dari jalur berbeda.

Pada kalkulasi Tukin massal, nilai dibayarkan merupakan nominal kinerja ditambah nominal kehadiran dari rekap yang terhubung.

### Kolom cuti Excel

Beberapa kolom export menyajikan jumlah hari cuti pada periode, sedangkan beberapa kolom lanjutan merupakan penanda kategori/bulan cuti. Periksa nama header dan nilai di file setelah export. Jika arti kategori institusi berbeda dari pemetaan aplikasi, konfirmasikan definisinya kepada pengelola sebelum menggunakan data sebagai laporan resmi.

## 11. Kendala umum dan pemeriksaan

| Kendala | Yang perlu diperiksa |
|---|---|
| Pegawai gagal disimpan karena master tidak sesuai | Pastikan nama jabatan, kelas, pangkat, golongan, dan jenis kepegawaian sesuai master. Tambahkan master terlebih dahulu bila belum tersedia. |
| Master jabatan tidak dapat dihapus | Master masih dipakai pegawai atau riwayat Tukin. Ubah relasi yang menggunakan master terlebih dahulu sesuai prosedur organisasi. |
| Master pangkat/golongan tidak dapat dihapus | Master masih dipakai pegawai atau riwayat Angka Kredit. |
| Jumlah hari cuti nol | Rentang tanggal mungkin hanya mencakup akhir pekan. Pilih rentang yang memiliki hari kerja. |
| Cuti Tahunan/Sakit ditolak | Periksa saldo N-2, N-1, dan N untuk tahun cuti. |
| Pengajuan cuti tidak dapat disimpan | Periksa kelengkapan data, validitas tanggal, saldo, dan kemungkinan rentang bertabrakan dengan pengajuan lain. |
| Tukin tidak muncul | Pastikan penilaian kinerja sudah tersimpan untuk pegawai, bulan, dan tahun yang dipilih. |
| Nominal kehadiran nol | Pastikan rekap presensi periode tersedia dan terkait. |
| Kolom cuti di export nol | Pastikan pegawai memiliki catatan Tukin pada periode export dan pengajuan cutinya berstatus Disetujui serta beririsan dengan periode tersebut. |
| Rekap berubah setelah impor presensi | Periksa apakah file impor hanya berisi sebagian data pegawai/periode; impor parsial dapat membentuk ulang rekap berdasarkan baris file itu. |

## 12. Catatan batasan fitur

- Entri cuti melalui formulir administrator saat ini langsung disimpan dengan status **Disetujui**; formulir tersebut bukan alur persetujuan bertahap.
- Perhitungan jumlah hari kerja belum mengecualikan hari libur nasional.
- Pastikan file impor presensi mencakup data lengkap yang diperlukan untuk membentuk rekap periode dengan benar.
- Angka ringkasan Tukin dan rata-rata kehadiran pada Dasbor belum menjadi sumber verifikasi perhitungan; verifikasi nominal melalui halaman Tukin, rincian pegawai, dan file export.
- Gunakan periode/pegawai uji dan database non-produksi untuk mencoba impor atau menguji perubahan yang dapat mengubah data.
