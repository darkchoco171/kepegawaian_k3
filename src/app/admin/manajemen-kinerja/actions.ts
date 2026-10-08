'use server';

import { db } from '@/lib/db';
import { tukinBulanan, pegawai, masterJabatan, masterKelasJabatan, rekapPresensiBulanan } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Fungsi logika matriks penilaian kinerja excel
function kalkulasiKinerja(hasilKerja: string, perilakuKerja: string) {
  const kombinasi = `${hasilKerja}|${perilakuKerja}`;
  let capaianKinerja = 'Baik'; 
  let persentaseKinerja = 1.00; // Default Baik = 100% (1.0)

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

    default:
      capaianKinerja = 'Baik';
      persentaseKinerja = 1.00;
  }

  return { capaianKinerja, persentaseKinerja };
}

export async function simpanMasterKinerja(formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const bulan = Number(formData.get('bulan'));
  const tahun = Number(formData.get('tahun'));
  const hasilKerja = formData.get('hasilKerja') as string;
  const perilakuKerja = formData.get('perilakuKerja') as string;

  if (!idPegawai || !bulan || !tahun || !hasilKerja || !perilakuKerja) {
    throw new Error('Semua field form wajib diisi!');
  }

  // 1. Hitung capaian & persentase otomatis
  const { capaianKinerja, persentaseKinerja } = kalkulasiKinerja(hasilKerja, perilakuKerja);

  // 2. Ambil data jabatan & base tukin pegawai saat ini
  const dataPegawai = await db
    .select({
      idJabatan: pegawai.idJabatan,
      baseTukin: masterKelasJabatan.baseTukin,
    })
    .from(pegawai)
    .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
    .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

  if (!dataPegawai.length || !dataPegawai[0].idJabatan || !dataPegawai[0].baseTukin) {
    throw new Error('Data jabatan atau base tukin pegawai tidak ditemukan!');
  }

  const { idJabatan, baseTukin } = dataPegawai[0];
  const nominalDasarNum = Number(baseTukin);
  const nominalKinerjaNum = nominalDasarNum * persentaseKinerja;

  // Cek apakah rekap presensi bulanan sudah ada (opsional buat data pendukung tukin)
  const rekapPresensi = await db
    .select({ id: rekapPresensiBulanan.id })
    .from(rekapPresensiBulanan)
    .where(
      and(
        eq(rekapPresensiBulanan.idPegawai, idPegawai),
        eq(rekapPresensiBulanan.bulan, bulan),
        eq(rekapPresensiBulanan.tahun, tahun)
      )
    )
    .limit(1);

  const idRekap = rekapPresensi.length > 0 ? rekapPresensi[0].id : null;

  // 3. Upsert data ke tabel tukin_bulanan (berfungsi sebagai master data kinerja & tukin dasar)
  // Kalau idRekap null, kita handle supaya tabel tetap bisa nyimpen data kinerja murni
  await db
    .insert(tukinBulanan)
    .values({
      idPegawai,
      idMasterJabatan: idJabatan,
      idRekapPresensiBulanan: idRekap, // Boleh null/kosong kalau presensi belum digenerate
      bulan,
      tahun,
      nominalDasar: nominalDasarNum.toString(),
      hasilKerja,
      perilakuKerja,
      capaianKinerja,
      persentaseKinerja: persentaseKinerja.toString(),
      nominalKinerja: nominalKinerjaNum.toFixed(2),
      dibayarkan: nominalKinerjaNum.toFixed(2), // Sementara sebelum dikawinkan sama kehadiran
    })
    .onConflictDoUpdate({
      target: [tukinBulanan.idPegawai, tukinBulanan.bulan, tukinBulanan.tahun],
      set: {
        idMasterJabatan: idJabatan,
        ...(idRekap ? { idRekapPresensiBulanan: idRekap } : {}),
        nominalDasar: nominalDasarNum.toString(),
        hasilKerja,
        perilakuKerja,
        capaianKinerja,
        persentaseKinerja: persentaseKinerja.toString(),
        nominalKinerja: nominalKinerjaNum.toFixed(2),
        dibayarkan: nominalKinerjaNum.toFixed(2),
        updatedAt: new Date(),
      },
    });

  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath('/admin/tukin');
  redirect('/admin/manajemen-kinerja');
}