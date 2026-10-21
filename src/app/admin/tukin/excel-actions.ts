// src/app/admin/tukin/excel-actions.ts
'use server';

import { db } from '@/lib/db';
import { tukinBulanan, rekapPresensiBulanan, masterKelasJabatan, masterJabatan, pegawai, masterPangkatGolongan, pengajuanCuti } from '@/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import * as XLSX from 'xlsx';
import { kalkulasiKinerja } from '@/lib/tukin/calculation';

function hitungHariKerjaDalamRentang(tglMulai: string, tglSelesai: string) {
  let jumlah = 0;
  const tanggal = new Date(`${tglMulai}T00:00:00Z`);
  const batas = new Date(`${tglSelesai}T00:00:00Z`);

  while (tanggal <= batas) {
    const hari = tanggal.getUTCDay();
    if (hari !== 0 && hari !== 6) jumlah++;
    tanggal.setUTCDate(tanggal.getUTCDate() + 1);
  }

  return jumlah;
}

// 1. NAMA FUNGSI TETAP UTUH (getExportDataTukin), TAPI ISI FORMATNYA 38 KOLOM RESMI MBA NISA
export async function getExportDataTukin(bulan: number, tahun: number) {
  const dataTukin = await db
    .select({
      idPegawai: tukinBulanan.idPegawai,
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
      jumlahTdkUpc: rekapPresensiBulanan.jumlahTdkUpc,
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

  const idPegawai = [...new Set(dataTukin.map((item) => item.idPegawai))];
  const dataCuti = idPegawai.length > 0
    ? await db
      .select({
        idPegawai: pengajuanCuti.idPegawai,
        jenisCuti: pengajuanCuti.jenisCuti,
        tglMulai: pengajuanCuti.tglMulai,
        tglSelesai: pengajuanCuti.tglSelesai,
      })
      .from(pengajuanCuti)
      .where(and(
        inArray(pengajuanCuti.idPegawai, idPegawai),
        eq(pengajuanCuti.statusPengajuan, 'Disetujui'),
      ))
    : [];
  const cutiByPegawai = new Map<string, typeof dataCuti>();
  for (const cuti of dataCuti) {
    const cutiPegawai = cutiByPegawai.get(cuti.idPegawai) || [];
    cutiPegawai.push(cuti);
    cutiByPegawai.set(cuti.idPegawai, cutiPegawai);
  }

  const bulanMulai = `${tahun}-${String(bulan).padStart(2, '0')}-01`;
  const bulanSelesai = new Date(Date.UTC(tahun, bulan, 0)).toISOString().slice(0, 10);
  const bulanPeriode = tahun * 12 + bulan;

  // Susun header baris 1 s.d 6 persis template asli
  const sheetData: (string | number)[][] = [
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
    const cutiPegawai = cutiByPegawai.get(item.idPegawai) || [];
    const cutiPeriode = cutiPegawai.map((cuti) => {
      const mulai = cuti.tglMulai > bulanMulai ? cuti.tglMulai : bulanMulai;
      const selesai = cuti.tglSelesai < bulanSelesai ? cuti.tglSelesai : bulanSelesai;
      const jumlahHariPeriode = mulai <= selesai
        ? hitungHariKerjaDalamRentang(mulai, selesai)
        : 0;
      const periodeMulaiCuti = Number(cuti.tglMulai.slice(0, 4)) * 12
        + Number(cuti.tglMulai.slice(5, 7));

      return {
        ...cuti,
        jumlahHariPeriode,
        selisihBulan: bulanPeriode - periodeMulaiCuti,
      };
    });
    const cutiSakitBulanI = cutiPeriode
      .filter((cuti) => cuti.jenisCuti === 'Sakit' && cuti.selisihBulan === 0)
      .reduce((total, cuti) => total + cuti.jumlahHariPeriode, 0);
    const cutiBesarAPKurangSebulan = cutiPeriode
      .filter((cuti) =>
        (cuti.jenisCuti === 'Besar' || cuti.jenisCuti === 'Alasan Penting')
        && hitungHariKerjaDalamRentang(cuti.tglMulai, cuti.tglSelesai) < 30)
      .reduce((total, cuti) => total + cuti.jumlahHariPeriode, 0);
    const cutiGugurKandunganLebihSebulan = cutiPeriode
      .filter((cuti) => cuti.jenisCuti === 'Gugur Kandungan' && cuti.selisihBulan > 0)
      .length;
    const cutiSakitBulanII = cutiPeriode.some((cuti) => cuti.jenisCuti === 'Sakit' && cuti.selisihBulan === 1);
    const cutiSakitBulanIII = cutiPeriode.some((cuti) => cuti.jenisCuti === 'Sakit' && cuti.selisihBulan === 2);
    const cutiSakitLebihTigaBulan = cutiPeriode.some((cuti) => cuti.jenisCuti === 'Sakit' && cuti.selisihBulan > 2);
    const cutiBesarBulanI = cutiPeriode.some((cuti) => cuti.jenisCuti === 'Besar' && cuti.selisihBulan === 0);
    const cutiBesarBulanII = cutiPeriode.some((cuti) => cuti.jenisCuti === 'Besar' && cuti.selisihBulan === 1);
    const cutiBesarBulanIII = cutiPeriode.some((cuti) => cuti.jenisCuti === 'Besar' && cuti.selisihBulan === 2);

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
      0,
      cutiPeriode
        .filter((cuti) => cuti.jenisCuti === 'Gugur Kandungan')
        .reduce((total, cuti) => total + cuti.jumlahHariPeriode, 0),
      cutiGugurKandunganLebihSebulan,
      cutiPeriode
        .filter((cuti) => cuti.jenisCuti === 'Tahunan')
        .reduce((total, cuti) => total + cuti.jumlahHariPeriode, 0),
      cutiPeriode
        .filter((cuti) => cuti.jenisCuti === 'Melahirkan')
        .reduce((total, cuti) => total + cuti.jumlahHariPeriode, 0),
      cutiSakitBulanI,
      Number(cutiSakitBulanII),
      Number(cutiSakitBulanIII),
      Number(cutiSakitLebihTigaBulan),
      cutiBesarAPKurangSebulan,
      Number(cutiBesarBulanI),
      Number(cutiBesarBulanII),
      Number(cutiBesarBulanIII),
      0, 0, item.jumlahTdkUpc || 0, 0,
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