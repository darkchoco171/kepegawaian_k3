// src/app/admin/tukin/excel-actions.ts
'use server';

import { db } from '@/lib/db';
import { tukinBulanan, rekapPresensiBulanan, masterKelasJabatan, masterJabatan, pegawai, masterPangkatGolongan } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';

// Fungsi bantu kalkulasi matriks kinerja
function kalkulasiKinerja(hasilKerja: string, perilakuKerja: string) {
  const kombinasi = `${hasilKerja}|${perilakuKerja}`;
  let capaianKinerja = 'Baik'; 
  let persentaseKinerja = 1.00;

  switch (kombinasi) {
    case 'Di Atas Ekspektasi|Di Atas Ekspektasi':
      capaianKinerja = 'Sangat Baik';
      persentaseKinerja = 1.00;
      break;
    case 'Sesuai Ekspektasi|Di Atas Ekspektasi':
    case 'Di Atas Ekspektasi|Sesuai Ekspektasi':
    case 'Sesuai Ekspektasi|Sesuai Ekspektasi':
      capaianKinerja = 'Baik';
      persentaseKinerja = 1.00;
      break;
    case 'Di Bawah Ekspektasi|Di Atas Ekspektasi':
    case 'Di Bawah Ekspektasi|Sesuai Ekspektasi':
      capaianKinerja = 'Butuh Perbaikan';
      persentaseKinerja = 0.60;
      break;
    case 'Di Atas Ekspektasi|Di Bawah Ekspektasi':
    case 'Sesuai Ekspektasi|Di Bawah Ekspektasi':
      capaianKinerja = 'Kurang/Miss Conduct';
      persentaseKinerja = 0.42;
      break;
    case 'Di Bawah Ekspektasi|Di Bawah Ekspektasi':
      capaianKinerja = 'Sangat Kurang';
      persentaseKinerja = 0.42;
      break;
    default:
      capaianKinerja = 'Baik';
      persentaseKinerja = 1.00;
  }
  return { capaianKinerja, persentaseKinerja };
}

// 1. NAMA FUNGSI TETAP UTUH (getExportDataTukin), TAPI ISI FORMATNYA 38 KOLOM RESMI MBA NISA
export async function getExportDataTukin(bulan: number, tahun: number) {
  const dataTukin = await db
    .select({
      namaPegawai: pegawai.namaLengkap,
      nip: pegawai.nip,
      golongan: masterPangkatGolongan.golongan,
      status: masterPangkatGolongan.jenisKepegawaian,
      kelasJabatan: masterKelasJabatan.kelasJabatan,
      nominalDasar: tukinBulanan.nominalDasar,
      hariKerja: rekapPresensiBulanan.hariKerja,
      totalMenitTerlambat: rekapPresensiBulanan.totalMenitTerlambat,
      jumlahLupaAbsen: rekapPresensiBulanan.jumlahLupaAbsen,
      jumlahAlpa: rekapPresensiBulanan.jumlahAlpa,
      persentasePotongan: rekapPresensiBulanan.persentasePotongan,
      persentaseKehadiran: rekapPresensiBulanan.persentaseKehadiran,
      nominalKehadiran: rekapPresensiBulanan.nominalKehadiran,
      jumlahPotonganKehadiran: rekapPresensiBulanan.jumlahPotonganKehadiran,
      hasilKerja: tukinBulanan.hasilKerja,
      perilakuKerja: tukinBulanan.perilakuKerja,
      capaianKinerja: tukinBulanan.capaianKinerja,
      persentaseKinerja: tukinBulanan.persentaseKinerja,
      nominalKinerja: tukinBulanan.nominalKinerja,
      dibayarkan: tukinBulanan.dibayarkan,
    })
    .from(tukinBulanan)
    .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .leftJoin(masterJabatan, eq(tukinBulanan.idMasterJabatan, masterJabatan.id))
    .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
    .leftJoin(rekapPresensiBulanan, eq(tukinBulanan.idRekapPresensiBulanan, rekapPresensiBulanan.id))
    .where(and(eq(tukinBulanan.bulan, bulan), eq(tukinBulanan.tahun, tahun)));

  // Susun header baris 1 s.d 6 persis template asli
  const sheetData: any[][] = [
    // ['FORM PEMBAYARAN TUNJANGAN KINERJA PEGAWAI KEMENTERIAN KETENAGAKERJAAN'],
    // ['DIREKTORAT BINA SISTEM PENGAWASAN KETENAGAKERJAAN'],
    // [`BULAN ${bulan} TAHUN ${tahun}`],
    // [],
    Array.from({ length: 38 }, (_, i) => i + 1), // Nomor kolom 1-38
    [
      'No', 'Nama Pegawai', 'NIP', 'GOL', 'Kelas Jabatan', 'Nominal Tukin', 'Status', 'Hari Kerja',
      'Terlambat (Menit)', 'Lupa Absen', 'Alpa', 'Dinas Luar', 'CT Gugur Kandungan', 'CT Gugur Kandungan >1 Bulan',
      'Cuti Thn', 'Cuti Melahirkan', 'Cuti Sakit Bulan I', 'Cuti Sakit Bulan II', 'Cuti Sakit Bulan III',
      'Cuti Sakit > 3 Bulan', 'CT B/ CT AP < 1 Bln', 'CT Bsr Bln I', 'CT Besar Bln II', 'CT Besar Bln III',
      'TB', 'Diklat', 'TDK UPC', 'Jumlah WFO', '% Pot', 'Persentase Kehadiran (30%)',
      'Nominal Kehadiran', 'Jumlah Potongan Kehadiran', 'Hasil Kerja', 'Perilaku Kerja',
      'Capaian Kinerja', 'Persentase Kinerja (70%)', 'Nominal Kinerja', 'Dibayarkan'
    ]
  ];

  // Masukkan baris data pegawai
  dataTukin.forEach((item, index) => {
    sheetData.push([
      index + 1,
      item.namaPegawai || '-',
      `'${item.nip}`,
      item.golongan || '-',
      Number(item.kelasJabatan) || 0,
      Number(item.nominalDasar) || 0,
      item.status || 'PNS',
      item.hariKerja || 0,
      item.totalMenitTerlambat || 0,
      item.jumlahLupaAbsen || 0,
      item.jumlahAlpa || 0,
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      Number(item.persentasePotongan) || 0,
      Number(item.persentaseKehadiran) || 0,
      Number(item.nominalKehadiran) || 0,
      Number(item.jumlahPotonganKehadiran) || 0,
      item.hasilKerja || '-',
      item.perilakuKerja || '-',
      item.capaianKinerja || '-',
      Number(item.persentaseKinerja) || 0,
      Number(item.nominalKinerja) || 0,
      Number(item.dibayarkan) || 0,
    ]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'PNS & PPPK');

  // Return base64 string supaya gampang di-download di sisi frontend
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
}

// 2. FUNGSI IMPORT EXCEL TETAP UTUH NAMANYA
export async function prosesImportExcel(dataExcel: any[], bulanPilih: number = new Date().getMonth() + 1, tahunPilih: number = new Date().getFullYear()) {
  try {
    let successCount = 0;
    let failCount = 0;

    for (const row of dataExcel) {
      const nip = row['NIP']?.toString();
      const hasilKerja = row['Hasil Kerja'];
      const perilakuKerja = row['Perilaku Kerja'];

      if (!nip || !hasilKerja || !perilakuKerja) {
        failCount++;
        continue;
      }

      const dataPegawai = await db
        .select({
          idPegawai: pegawai.id,
          idJabatan: pegawai.idJabatan,
          baseTukin: masterKelasJabatan.baseTukin,
        })
        .from(pegawai)
        .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
        .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
        .where(eq(pegawai.nip, nip))
        .limit(1);

      if (dataPegawai.length === 0 || !dataPegawai[0].baseTukin) {
        failCount++;
        continue;
      }

      const { idPegawai, idJabatan, baseTukin } = dataPegawai[0];
      if (!idPegawai || !idJabatan || !baseTukin) {
        failCount++;
        continue;
      }

      const { capaianKinerja, persentaseKinerja } = kalkulasiKinerja(hasilKerja, perilakuKerja);

      const nominalDasarNum = Number(baseTukin);
      const nominalKinerjaNum = nominalDasarNum * persentaseKinerja;

      const rekapPresensi = await db
        .select({ id: rekapPresensiBulanan.id })
        .from(rekapPresensiBulanan)
        .where(and(eq(rekapPresensiBulanan.idPegawai, idPegawai), eq(rekapPresensiBulanan.bulan, bulanPilih), eq(rekapPresensiBulanan.tahun, tahunPilih)))
        .limit(1);

      await db
        .insert(tukinBulanan)
        .values({
          idPegawai,
          idMasterJabatan: idJabatan,
          idRekapPresensiBulanan: rekapPresensi.length > 0 ? rekapPresensi[0].id : null,
          bulan: bulanPilih,
          tahun: tahunPilih,
          nominalDasar: nominalDasarNum.toString(),
          hasilKerja,
          perilakuKerja,
          capaianKinerja,
          persentaseKinerja: persentaseKinerja.toString(),
          nominalKinerja: nominalKinerjaNum.toFixed(2),
          dibayarkan: nominalKinerjaNum.toFixed(2),
        })
        .onConflictDoUpdate({
          target: [tukinBulanan.idPegawai, tukinBulanan.bulan, tukinBulanan.tahun],
          set: {
            idMasterJabatan: idJabatan,
            ...(rekapPresensi.length > 0 ? { idRekapPresensiBulanan: rekapPresensi[0].id } : {}),
            hasilKerja,
            perilakuKerja,
            capaianKinerja,
            persentaseKinerja: persentaseKinerja.toString(),
            nominalKinerja: nominalKinerjaNum.toFixed(2),
            dibayarkan: nominalKinerjaNum.toFixed(2),
            updatedAt: new Date(),
          },
        });

      successCount++;
    }

    revalidatePath('/admin/tukin');
    return { 
      status: 'success', 
      message: `Import Berhasil! ${successCount} data diproses, ${failCount} baris diabaikan.` 
    };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}