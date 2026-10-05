/**
 * Skema database Sistem Kepegawaian BKK3
 * Stack: Neon (PostgreSQL) + Drizzle ORM + Next.js/TypeScript
 *
 * Catatan sebelum migrate:
 * - Semua PK pakai UUID (defaultRandom() -> gen_random_uuid()). Pastikan
 *   extension pgcrypto aktif di database: CREATE EXTENSION IF NOT EXISTS pgcrypto;
 * - Status PNS/PPPK seorang pegawai TIDAK disimpan langsung di tabel pegawai,
 *   melainkan diturunkan dari relasi pegawai.idGolongan -> master_pangkat_golongan.jenisKepegawaian.
 * - "Bulan ke berapa" untuk Cuti Sakit/Cuti Besar (II, III, dst) SENGAJA
 *   tidak disimpan sebagai kolom terpisah di pengajuan_cuti -- dihitung
 *   dinamis dari selisih bulan (periode rekap vs tgl_mulai) saat generate
 *   rekap_presensi_bulanan.
 */

import {
  pgTable,
  pgEnum,
  uuid,
  varchar,
  text,
  integer,
  numeric,
  boolean,
  date,
  time,
  timestamp,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================================
// ENUMS
// ============================================================

export const roleEnum = pgEnum('role', ['admin', 'pegawai']);
export const jenisKelaminEnum = pgEnum('jenis_kelamin', ['L', 'P']);
export const jenisKepegawaianEnum = pgEnum('jenis_kepegawaian', ['PNS', 'PPPK']);
export const sistemKerjaEnum = pgEnum('sistem_kerja', [
  'WFO', 'WFH', 'Dinas Luar', 'Cuti', 'Upacara', 'Alpa',
]);
export const jenisCutiEnum = pgEnum('jenis_cuti', [
  'Tahunan', 'Sakit', 'Besar', 'Melahirkan', 'Alasan Penting', 'Gugur Kandungan', 'Lainnya',
]);
export const statusPengajuanEnum = pgEnum('status_pengajuan', [
  'Diajukan', 'Disetujui', 'Ditolak',
]);

// ============================================================
// MASTER DATA
// ============================================================

export const masterKelasJabatan = pgTable('master_kelas_jabatan', {
  id: uuid('id').primaryKey().defaultRandom(),
  kelasJabatan: integer('kelas_jabatan').notNull(),
  baseTukin: numeric('base_tukin', { precision: 15, scale: 2 }).notNull(),
}, (table) => ({
  kelasJabatanUnique: uniqueIndex('master_kelas_jabatan_kelas_jabatan_unique').on(table.kelasJabatan),
}));

export const masterJabatan = pgTable('master_jabatan', {
  id: uuid('id').primaryKey().defaultRandom(),
  // nullable: jabatan spt "Pengemudi"/"Petugas Kebersihan" yg belum terklasifikasi kelasnya
  idKelasJabatan: uuid('id_kelas_jabatan').references(() => masterKelasJabatan.id),
  namaJabatan: text('nama_jabatan').notNull(),
  jenisJabatan: text('jenis_jabatan'),
}, (table) => ({
  namaJabatanUnique: uniqueIndex('master_jabatan_nama_jabatan_unique').on(table.namaJabatan),
}));

export const masterPangkatGolongan = pgTable('master_pangkat_golongan', {
  id: uuid('id').primaryKey().defaultRandom(),
  // satu-satunya tempat status PNS/PPPK disimpan -- pegawai TIDAK punya kolom
  // ini sendiri, statusnya otomatis ikut lewat relasi pegawai.idGolongan
  jenisKepegawaian: varchar('jenis_kepegawaian', { enum: ['PNS', 'PPPK', 'NON-ASN'] }),
  pangkat: text('pangkat'),
  golongan: varchar('golongan', { length: 10 }).notNull(),
  // NULL = belum ada aturan AK utk golongan/jabatan ini (masih pending konfirmasi -> lihat TODO di atas)
  angkaKreditMinimal: numeric('angka_kredit_minimal', { precision: 6, scale: 2 }),
  // urutan naik (1,2,3,...) supaya sistem bisa cari "jenjang berikutnya" otomatis
  // utk fitur warning kekurangan AK (mis. Pertama -> Muda butuh 100, Muda -> Madya butuh 200)
  urutanJenjang: integer('urutan_jenjang').notNull(),
}, (table) => ({
  golonganUnique: uniqueIndex('master_pangkat_golongan_golongan_unique').on(table.golongan),
  urutanJenjangUnique: uniqueIndex('master_pangkat_golongan_urutan_jenjang_unique').on(table.urutanJenjang),
}));

// ============================================================
// USERS & PEGAWAI
// ============================================================

export const pegawai = pgTable('pegawai', {
  id: uuid('id').primaryKey().defaultRandom(),
  idJabatan: uuid('id_jabatan').references(() => masterJabatan.id),
  idGolongan: uuid('id_golongan').references(() => masterPangkatGolongan.id),
  namaLengkap: text('nama_lengkap').notNull(),
  jabatanTim: text('jabatan_tim'),
  nip: varchar('nip', { length: 20 }).notNull(),
  tempatLahir: text('tempat_lahir'),
  tglLahir: date('tgl_lahir'),
  agama: text('agama'),
  jenisKelamin: jenisKelaminEnum('jenis_kelamin'),
  statusPernikahan: text('status_pernikahan'),
  // TMT -- dipakai hitung masa kerja & threshold SLKS (10/20/30 th) secara DINAMIS.
  tanggalMulaiKerja: date('tanggal_mulai_kerja'),
  kontak: varchar('kontak', { length: 30 }),
  keterangan: text('keterangan'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  nipUnique: uniqueIndex('pegawai_nip_unique').on(table.nip),
}));

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  password: text('password').notNull(), // hashed, login pakai NIP (ambil dr relasi pegawai) + password ini
  role: roleEnum('role').notNull().default('admin'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  idPegawaiUnique: uniqueIndex('users_id_pegawai_unique').on(table.idPegawai),
}));

export const riwayatPendidikan = pgTable('riwayat_pendidikan', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  jenjang: text('jenjang'),
  namaInstitusi: text('nama_institusi'),
  programStudi: text('program_studi'),
});

export const riwayatDiklat = pgTable('riwayat_diklat', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  namaDiklat: text('nama_diklat').notNull(),
  tahunDiklat: integer('tahun_diklat'),
});

// ============================================================
// PRESENSI & CUTI
// ============================================================

export const presensiHarian = pgTable('presensi_harian', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  tgl: date('tgl').notNull(),
  sistemKerja: sistemKerjaEnum('sistem_kerja').notNull(),
  cekIn: time('cek_in'),
  cekOut: time('cek_out'), // NULL kalau belum/tidak checkout -- JANGAN diisi 00:00
  jamHarusCheckout: time('jam_harus_checkout'),
  jamMasukStandar: time('jam_masuk_standar'),
  jamToleransiMasuk: time('jam_toleransi_masuk'),
  jamPulangStandar: time('jam_pulang_standar'),
  jamToleransiPulang: time('jam_toleransi_pulang'),
  terlambat: integer('terlambat'), // menit
  menitKerja: integer('menit_kerja'),
  kekuranganJamKerja: integer('kekurangan_jam_kerja'),
  jumlahMenitKekuranganHarian: integer('jumlah_menit_kekurangan_harian'),
  // catatan: kolom di bawah bersifat informatif per-hari (tangga 0,5%/30 menit).
  // %Pot BULANAN di rekap_presensi_bulanan pakai rumus poin terpisah dari mba Nisa,
  // BUKAN hasil SUM dari kolom ini.
  persentasePotonganHarian: numeric('persentase_potongan_harian', { precision: 6, scale: 4 }),
  statusAnomali: text('status_anomali'), // mis. 'belum_checkout'
  idCuti: uuid('id_cuti').references(() => pengajuanCuti.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pegawaiTglUnique: uniqueIndex('presensi_harian_pegawai_tgl_unique').on(table.idPegawai, table.tgl),
}));

export const pengajuanCuti = pgTable('pengajuan_cuti', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  jenisCuti: jenisCutiEnum('jenis_cuti').notNull(),
  tglMulai: date('tgl_mulai').notNull(),
  tglSelesai: date('tgl_selesai').notNull(),
  jumlahHari: integer('jumlah_hari').notNull(),
  alasan: text('alasan'),
  keteranganCuti: text('keterangan_cuti'),
  // default 'Disetujui' krn sementara ADMIN yg input langsung (proxy utk pegawai).
  // Alur pengajuan mandiri pegawai (status 'Diajukan' -> approval) menyusul
  // begitu role pegawai ditambahkan -- struktur kolomnya sudah siap dari sekarang.
  statusPengajuan: statusPengajuanEnum('status_pengajuan').notNull().default('Disetujui'),
  diajukanOleh: uuid('diajukan_oleh').references(() => users.id),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ============================================================
// REKAP & TUKIN
// ============================================================

export const rekapPresensiBulanan = pgTable('rekap_presensi_bulanan', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  bulan: integer('bulan').notNull(),
  tahun: integer('tahun').notNull(),
  hariKerja: integer('hari_kerja').notNull().default(0),
  totalMenitTerlambat: integer('total_menit_terlambat').notNull().default(0),
  jumlahLupaAbsen: integer('jumlah_lupa_absen').notNull().default(0),
  jumlahAlpa: integer('jumlah_alpa').notNull().default(0), // sempat hilang di desain awal, sudah ditambahkan
  jumlahCtGugurKandunganGt1Bln: integer('jumlah_ct_gugur_kandungan_gt1bln').notNull().default(0),
  cutiSakitBulanII: boolean('cuti_sakit_bulan_ii').notNull().default(false),
  cutiSakitBulanIII: boolean('cuti_sakit_bulan_iii').notNull().default(false),
  cutiSakitGt3Bln: boolean('cuti_sakit_gt3bln').notNull().default(false),
  ctBesarBulanI: boolean('ct_besar_bulan_i').notNull().default(false),
  ctBesarBulanII: boolean('ct_besar_bulan_ii').notNull().default(false),
  ctBesarBulanIII: boolean('ct_besar_bulan_iii').notNull().default(false),
  jumlahTdkUpc: integer('jumlah_tdk_upc').notNull().default(0),
  // hasil rumus poin: (menit_terlambat*0.01) + (lupa_absen*1) + (alpa*3) + ... dst
  persentasePotongan: numeric('persentase_potongan', { precision: 6, scale: 4 }).notNull(),
  persentaseKehadiran: numeric('persentase_kehadiran', { precision: 7, scale: 4 }).notNull(),
  nominalKehadiran: numeric('nominal_kehadiran', { precision: 15, scale: 2 }).notNull(),
  jumlahPotonganKehadiran: numeric('jumlah_potongan_kehadiran', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pegawaiPeriodeUnique: uniqueIndex('rekap_presensi_bulanan_pegawai_periode_unique').on(table.idPegawai, table.bulan, table.tahun),
}));

export const tukinBulanan = pgTable('tukin_bulanan', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  // snapshot jabatan saat itu -- jabatan pegawai bisa berubah, histori tukin ttp
  // mencatat jabatan yg berlaku waktu itu
  idMasterJabatan: uuid('id_master_jabatan').notNull().references(() => masterJabatan.id),
  idRekapPresensiBulanan: uuid('id_rekap_presensi_bulanan').notNull().references(() => rekapPresensiBulanan.id),
  bulan: integer('bulan').notNull(),
  tahun: integer('tahun').notNull(),
  // SNAPSHOT dari master_kelas_jabatan.base_tukin saat itu -- kalau base_tukin
  // direvisi di kemudian hari, histori bulan lama TIDAK ikut berubah
  nominalDasar: numeric('nominal_dasar', { precision: 15, scale: 2 }).notNull(),
  hasilKerja: text('hasil_kerja'),
  perilakuKerja: text('perilaku_kerja'),
  capaianKinerja: text('capaian_kinerja').notNull(), // predikat, mis. 'Baik'
  persentaseKinerja: numeric('persentase_kinerja', { precision: 7, scale: 4 }).notNull(),
  nominalKinerja: numeric('nominal_kinerja', { precision: 15, scale: 2 }).notNull(),
  dibayarkan: numeric('dibayarkan', { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  pegawaiPeriodeUnique: uniqueIndex('tukin_bulanan_pegawai_periode_unique').on(table.idPegawai, table.bulan, table.tahun),
}));

export const riwayatAngkaKredit = pgTable('riwayat_angka_kredit', {
  id: uuid('id').primaryKey().defaultRandom(),
  idPegawai: uuid('id_pegawai').notNull().references(() => pegawai.id),
  // golongan pegawai pada saat penilaian -- dipakai cari target AK jenjang berikutnya
  idMasterPangkatGolongan: uuid('id_master_pangkat_golongan').references(() => masterPangkatGolongan.id),
  tahunPenilaian: integer('tahun_penilaian').notNull(),
  nilaiPak: numeric('nilai_pak', { precision: 6, scale: 2 }).notNull(),
  targetAk: numeric('target_ak', { precision: 8, scale: 2 }), // snapshot target AK jenjang berikutnya saat itu
  createdAt: timestamp('created_at').notNull().defaultNow(),
  // NB: sengaja TIDAK di-FK ke tukin_bulanan lagi -- AK itu proses TAHUNAN,
  // tukin itu BULANAN, jadi dilepas supaya tidak lahir 12 baris AK per tahun tanpa perlu.
}, (table) => ({
  pegawaiTahunUnique: uniqueIndex('riwayat_angka_kredit_pegawai_tahun_unique').on(table.idPegawai, table.tahunPenilaian),
}));

// ============================================================
// RELATIONS
// ============================================================

export const masterKelasJabatanRelations = relations(masterKelasJabatan, ({ many }) => ({
  jabatan: many(masterJabatan),
}));

export const masterJabatanRelations = relations(masterJabatan, ({ one, many }) => ({
  kelasJabatan: one(masterKelasJabatan, {
    fields: [masterJabatan.idKelasJabatan],
    references: [masterKelasJabatan.id],
  }),
  pegawai: many(pegawai),
  tukinBulanan: many(tukinBulanan),
}));

export const masterPangkatGolonganRelations = relations(masterPangkatGolongan, ({ many }) => ({
  pegawai: many(pegawai),
  riwayatAngkaKredit: many(riwayatAngkaKredit),
}));

export const pegawaiRelations = relations(pegawai, ({ one, many }) => ({
  jabatan: one(masterJabatan, {
    fields: [pegawai.idJabatan],
    references: [masterJabatan.id],
  }),
  golongan: one(masterPangkatGolongan, {
    fields: [pegawai.idGolongan],
    references: [masterPangkatGolongan.id],
  }),
  user: one(users, {
    fields: [pegawai.id],
    references: [users.idPegawai],
  }),
  riwayatPendidikan: many(riwayatPendidikan),
  riwayatDiklat: many(riwayatDiklat),
  presensiHarian: many(presensiHarian),
  pengajuanCuti: many(pengajuanCuti),
  rekapPresensiBulanan: many(rekapPresensiBulanan),
  tukinBulanan: many(tukinBulanan),
  riwayatAngkaKredit: many(riwayatAngkaKredit),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  pegawai: one(pegawai, {
    fields: [users.idPegawai],
    references: [pegawai.id],
  }),
  cutiDiajukan: many(pengajuanCuti, { relationName: 'diajukanOleh' }),
  cutiDisetujui: many(pengajuanCuti, { relationName: 'approvedBy' }),
}));

export const riwayatPendidikanRelations = relations(riwayatPendidikan, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [riwayatPendidikan.idPegawai],
    references: [pegawai.id],
  }),
}));

export const riwayatDiklatRelations = relations(riwayatDiklat, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [riwayatDiklat.idPegawai],
    references: [pegawai.id],
  }),
}));

export const presensiHarianRelations = relations(presensiHarian, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [presensiHarian.idPegawai],
    references: [pegawai.id],
  }),
  cuti: one(pengajuanCuti, {
    fields: [presensiHarian.idCuti],
    references: [pengajuanCuti.id],
  }),
}));

export const pengajuanCutiRelations = relations(pengajuanCuti, ({ one, many }) => ({
  pegawai: one(pegawai, {
    fields: [pengajuanCuti.idPegawai],
    references: [pegawai.id],
  }),
  diajukanOlehUser: one(users, {
    fields: [pengajuanCuti.diajukanOleh],
    references: [users.id],
    relationName: 'diajukanOleh',
  }),
  approvedByUser: one(users, {
    fields: [pengajuanCuti.approvedBy],
    references: [users.id],
    relationName: 'approvedBy',
  }),
  presensiTerkait: many(presensiHarian),
}));

export const rekapPresensiBulananRelations = relations(rekapPresensiBulanan, ({ one, many }) => ({
  pegawai: one(pegawai, {
    fields: [rekapPresensiBulanan.idPegawai],
    references: [pegawai.id],
  }),
  tukinBulanan: many(tukinBulanan),
}));

export const tukinBulananRelations = relations(tukinBulanan, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [tukinBulanan.idPegawai],
    references: [pegawai.id],
  }),
  jabatan: one(masterJabatan, {
    fields: [tukinBulanan.idMasterJabatan],
    references: [masterJabatan.id],
  }),
  rekapPresensiBulanan: one(rekapPresensiBulanan, {
    fields: [tukinBulanan.idRekapPresensiBulanan],
    references: [rekapPresensiBulanan.id],
  }),
}));

export const riwayatAngkaKreditRelations = relations(riwayatAngkaKredit, ({ one }) => ({
  pegawai: one(pegawai, {
    fields: [riwayatAngkaKredit.idPegawai],
    references: [pegawai.id],
  }),
  golongan: one(masterPangkatGolongan, {
    fields: [riwayatAngkaKredit.idMasterPangkatGolongan],
    references: [masterPangkatGolongan.id],
  }),
}));