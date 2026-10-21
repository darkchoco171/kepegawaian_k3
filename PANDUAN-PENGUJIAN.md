# Panduan Pengujian SIMPEG K3

Dokumen ini berisi langkah pengujian per fitur, perintah pengujian otomatis yang tersedia, dan saran pengujian lanjutan.

> **Peringatan data:** Jalankan pengujian yang mengubah data hanya pada database development/test. Jangan gunakan database produksi. Gunakan akun, pegawai, NIP, periode, dan file khusus pengujian. Catat data awal dan bersihkan hanya data tes setelah selesai.

## 1. Persiapan

1. Pastikan aplikasi dapat dijalankan dan database yang dipakai adalah database development/test.
2. Siapkan akun pengujian yang dapat login. Untuk E2E, kredensial bisa disediakan melalui `E2E_ADMIN_NIP` dan `E2E_ADMIN_PASSWORD` pada environment atau `.env` lokal.
3. Siapkan pegawai tes dengan NIP unik dan data master jabatan/kelas/golongan yang valid.
4. Pilih periode tes yang tidak sedang dipakai untuk proses operasional.
5. Simpan salinan file impor tes dan catat hasil yang diharapkan sebelum menjalankan perubahan data.
6. Jangan mengimpor file presensi parsial pada pegawai/periode yang sudah memiliki rekap lengkap. Isi file impor dapat menjadi dasar pembaruan rekap.

## 2. Perintah dan tools pengujian yang tersedia

Jalankan dari root repository:

| Jenis | Perintah | Kegunaan |
|---|---|---|
| Unit test | `npm run test:unit` | Menguji fungsi/aturan terisolasi tanpa alur UI penuh. |
| Integration test | `npm run test:integration` | Menguji integrasi modul dengan database dan/atau bentuk ekspor. Perlu `DATABASE_URL` menuju database tes. |
| E2E | `npm run test:e2e` | Menjalankan alur browser menggunakan Playwright. Web server development akan dijalankan bila diperlukan. |
| E2E interaktif | `npm run test:e2e:ui` | Membuka Playwright UI untuk memilih dan mengamati tes. |
| Laporan E2E | `npm run test:e2e:report` | Membuka laporan hasil Playwright terakhir. |
| TypeScript | `npx tsc --noEmit` | Memeriksa tipe tanpa menghasilkan file build. |
| Lint | `npm run lint` | Memeriksa aturan dan konsistensi kode. |

Tes E2E yang menambah, mengubah, atau menghapus data dapat meninggalkan perubahan di database. Pastikan kredensial dan database tes sudah dipilih sebelum menjalankannya.

Saat ini integration test ekspor Tukin memeriksa layout workbook 38 kolom dan jumlah baris untuk periode yang memiliki data. Skenario cuti memeriksa kolom kategori cuti untuk cuti disetujui yang cocok dengan periode Tukin; tes akan **skip** jika database tes tidak memiliki data yang cocok. Karena itu, hasil skip bukan bukti bahwa skenario nilai cuti sudah teruji.

## 3. Langkah pengujian per fitur

### 3.1 Login, logout, dan profil

1. Buka halaman login dan masuk dengan akun tes yang aktif.
2. Pastikan berhasil masuk ke dashboard.
3. Coba login dengan NIP yang tidak terdaftar dan kata sandi yang salah; pastikan tidak berhasil dan pesan kesalahan ditampilkan.
4. Buka halaman Profil dan pastikan halaman dapat dimuat.
5. Uji tombol tampil/sembunyi pada setiap kolom kata sandi.
6. Uji ubah kata sandi dengan kata sandi saat ini yang salah; pastikan perubahan ditolak.
7. Uji kata sandi baru yang terlalu pendek dan konfirmasi yang berbeda; pastikan masing-masing ditolak.
8. Ubah kata sandi dengan nilai tes yang valid. Pastikan sesi berakhir, kata sandi lama tidak lagi bisa dipakai, dan kata sandi baru bisa dipakai.
9. Login kembali, lalu logout. Pastikan sesi berakhir dan halaman admin meminta login kembali.

### 3.2 Master jabatan, kelas jabatan, pangkat, dan golongan

1. Buka halaman pengelolaan master.
2. Tambahkan data master menggunakan nama/nilai unik khusus tes.
3. Pastikan data tersimpan dan muncul di daftar serta pilihan pada form pegawai.
4. Ubah data master, simpan, muat ulang halaman, dan pastikan nilainya tetap berubah.
5. Coba menyimpan nilai yang melanggar aturan unik/validasi; pastikan aplikasi menolak dengan pesan yang jelas.
6. Hubungkan master ke pegawai tes, lalu coba menghapus master yang masih digunakan; pastikan referensi tidak rusak.
7. Setelah tes selesai, hapus data master tes hanya bila sudah tidak direferensikan.

### 3.3 Data pegawai

1. Tambahkan pegawai tes dengan NIP unik dan relasi master yang valid.
2. Pastikan pegawai tampil di daftar dan dapat ditemukan melalui pencarian NIP/nama.
3. Buka detail pegawai dan periksa data pribadi serta relasi jabatan/golongan.
4. Ubah beberapa kolom, simpan, muat ulang, lalu pastikan nilai terbaru tetap tampil.
5. Coba membuat pegawai dengan NIP yang sudah terpakai; pastikan duplikasi ditolak.
6. Hapus hanya pegawai tes. Pastikan pegawai lain tidak ikut terhapus dan dampak penghapusan terhadap data terkait sesuai aturan aplikasi.

### 3.4 Impor presensi dan rekap bulanan

1. Pilih periode pengujian di halaman Presensi dan unduh template.
2. Isi file lengkap untuk pegawai tes dengan tanggal dan variasi jenis presensi yang didukung.
3. Impor file, lalu periksa pesan hasil proses.
4. Pastikan data harian tersimpan untuk pegawai, tanggal, dan jenis presensi yang tepat.
5. Cocokkan rekap bulanan dengan baris dalam file yang diimpor.
6. Impor ulang file lengkap yang sama; periksa apakah hasil tetap konsisten dan tidak menghasilkan duplikasi yang tidak diinginkan.
7. Uji file tidak valid—misalnya NIP tidak dikenal, tanggal tidak valid, atau format kolom salah—dan pastikan kegagalan dilaporkan dengan benar.
8. Pastikan data presensi tersebut dapat dipakai dalam kalkulasi Tukin periode yang sama.

### 3.5 Pengajuan, persetujuan, dan saldo cuti

1. Gunakan pegawai tes dengan saldo cuti yang diketahui.
2. Ajukan cuti dengan rentang tanggal yang valid; pastikan status awalnya **Diajukan**.
3. Setujui pengajuan dan pastikan status berubah menjadi **Disetujui**.
4. Periksa dampaknya pada saldo dan/atau presensi sesuai alur aplikasi.
5. Buat pengajuan tes lain dan tolak; pastikan status menjadi **Ditolak** dan tidak memberi dampak seperti pengajuan disetujui.
6. Uji batas validasi, seperti tanggal berakhir sebelum tanggal mulai atau permintaan melebihi saldo; pastikan ditolak dengan pesan yang sesuai.
7. Uji rentang yang melewati akhir pekan atau pergantian tahun, lalu cocokkan jumlah hari kerja dan alokasi saldo dengan aturan yang berlaku.
8. Muat ulang halaman dan pastikan status serta saldo tetap tersimpan dengan konsisten.

### 3.6 Manajemen kinerja bulanan

1. Masukkan penilaian kerja dan perilaku untuk pegawai tes dan periode tertentu.
2. Simpan, muat ulang, dan pastikan nilai serta kategori tersimpan.
3. Ubah penilaian pada pegawai/periode yang sama; pastikan data diperbarui sesuai perilaku aplikasi dan tidak terduplikasi.
4. Periksa persentase perhitungan dan kategori yang ditampilkan. Untuk kategori yang tampil dibulatkan, pastikan nilai dasar perhitungan tetap sesuai aturan bisnis.
5. Jalankan kalkulasi Tukin untuk periode itu dan cocokkan komponen kinerja dengan hasil penilaian.

### 3.7 Angka Kredit (PAK)

1. Masukkan data PAK untuk pegawai tes pada tahun pengujian.
2. Simpan dan muat ulang halaman; pastikan data tetap ada.
3. Tambah atau ubah catatan PAK, lalu cocokkan ringkasan/total dengan catatan yang tersimpan.
4. Periksa tampilan informasi jenjang atau target berikutnya jika tersedia untuk pegawai tersebut.
5. Uji input tidak valid dan pastikan pengguna menerima hasil validasi yang jelas.

### 3.8 Kalkulasi Tukin

1. Pastikan pegawai tes memiliki kelas jabatan/base Tukin dan data pendukung untuk periode yang sama.
2. Pastikan data presensi, cuti yang relevan, dan kinerja sudah tersedia.
3. Jalankan kalkulasi Tukin dan catat nilai tiap komponen.
4. Cocokkan base Tukin, persentase kinerja, komponen kehadiran, potongan, dan total dengan aturan yang berlaku.
5. Uji pegawai yang datanya tidak lengkap; pastikan aplikasi tidak menyajikan hasil yang tampak valid tanpa penanganan yang tepat.
6. Ubah salah satu input tes, kalkulasi ulang, lalu pastikan nilai hasil ikut diperbarui.

### 3.9 Ekspor Tukin dan data cuti

1. Siapkan data Tukin untuk periode tes dan pengajuan cuti **Disetujui** yang beririsan dengan periode itu.
2. Siapkan cuti **Diajukan** atau **Ditolak** sebagai data pembanding.
3. Ekspor workbook untuk periode yang sama.
4. Buka workbook dan periksa sheet, header, 38 kolom, jumlah pegawai, dan format NIP.
5. Cocokkan nilai pada kolom cuti dengan jenis/status/tanggal cuti di aplikasi.
6. Pastikan cuti yang tidak memenuhi status atau periode tidak terhitung.
7. Uji periode tanpa cuti yang cocok dan periksa nilai kosong/nol sesuai aturan ekspor.
8. Bandingkan beberapa baris ekspor dengan data sumber untuk memastikan tidak ada salah pemetaan kolom.

## 4. Pengujian lintas fitur yang disarankan

Lakukan alur penuh memakai pegawai dan periode tes:

1. Siapkan master kelas jabatan, jabatan, dan pangkat/golongan.
2. Buat pegawai tes yang terhubung ke master.
3. Impor presensi lengkap dan pastikan rekap bulanan terbentuk.
4. Ajukan dan setujui cuti, lalu periksa pengaruhnya pada saldo/rekap.
5. Masukkan penilaian kinerja bulanan.
6. Hitung Tukin untuk periode tersebut.
7. Ekspor Tukin dan cocokkan hasil dengan input presensi, cuti, kinerja, dan base Tukin.
8. Catat setiap hasil yang diharapkan dan aktual serta bersihkan data tes setelah memastikan tidak ada dependensi yang tertinggal.

## 5. Saran pengujian lanjutan

1. **Integration test ekspor dengan fixture terkontrol:** siapkan atau sediakan data tes yang aman untuk pegawai, Tukin, dan cuti disetujui agar tes kolom cuti tidak sering berakhir `skip`.
2. **Integration test impor presensi:** uji insert/update, idempotensi impor ulang, validasi baris, dan konsistensi rekap dengan database tes.
3. **Integration test perubahan password:** verifikasi kata sandi salah ditolak, hash baru tersimpan, kata sandi lama gagal, dan kata sandi baru berhasil tanpa mengekspos nilai rahasia dalam log.
4. **Integration test alur cuti:** cek status, saldo, presensi, pembatalan/perubahan status bila didukung, serta transaksi saat terjadi kegagalan.
5. **Regression test:** jalankan kembali unit, integration, dan E2E setelah perubahan fitur untuk memastikan alur lama tidak rusak.
6. **Otorisasi:** pastikan halaman dan action sensitif menolak pengguna tanpa sesi atau dengan role yang tidak sesuai.
7. **Validasi dan ketahanan:** uji input kosong, batas angka/tanggal, file rusak, header hilang, NIP duplikat, dan data master yang tidak tersedia.
8. **Performa:** ukur waktu impor file besar, daftar pegawai besar, kalkulasi satu periode, dan pembuatan workbook.
9. **Aksesibilitas dan usability:** periksa label form, pesan error, navigasi keyboard, kontras, ukuran layar, serta ikon tampil/sembunyi password.
10. **Backup dan pemulihan:** verifikasi prosedur backup/restore pada database non-produksi.
11. **UAT:** minta operator mencoba alur kerja dengan data latihan dan mencatat apakah istilah, langkah, serta hasil sesuai pekerjaan sehari-hari.

## 6. Format pencatatan hasil

Gunakan tabel ini untuk setiap skenario:

| Tanggal | Fitur/skenario | Data tes | Hasil yang diharapkan | Hasil aktual | Status | Catatan/tautan bukti |
|---|---|---|---|---|---|---|
| YYYY-MM-DD | Contoh: ekspor Tukin + cuti disetujui | Pegawai tes, periode tes | Nilai cuti tampil pada kolom yang sesuai | Isi setelah pengujian | Belum diuji/Lulus/Gagal/Skip | Pesan error, screenshot, atau nama file |

Untuk skenario **Gagal**, catat langkah reproduksi, pesan yang tampil, dan apakah data tetap konsisten. Untuk **Skip**, tulis alasan dan data/fixture yang perlu disiapkan agar skenario bisa dijalankan.
