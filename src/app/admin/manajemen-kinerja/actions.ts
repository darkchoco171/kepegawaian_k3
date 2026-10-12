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

import { riwayatAngkaKredit, masterPangkatGolongan } from '@/db/schema';

// Fungsi buat nyimpen atau update Angka Kredit Tahunan Pegawai
export async function simpanAngkaKredit(formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const tahunPenilaian = Number(formData.get('tahunPenilaian'));
  const nilaiPak = Number(formData.get('nilaiPak'));

  if (!idPegawai || !tahunPenilaian || !nilaiPak) {
    throw new Error('Gagal: Pastikan Pegawai, Tahun, dan Nilai PAK sudah diisi!');
  }

  try {
    // 1. Cari data pegawai dan urutan golongannya saat ini
    const dataPegawai = await db.select({
      idGolongan: pegawai.idGolongan,
      urutanJenjang: masterPangkatGolongan.urutanJenjang
    })
    .from(pegawai)
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

    if (dataPegawai.length === 0 || !dataPegawai[0].idGolongan) {
      throw new Error('Gagal: Golongan/Pangkat pegawai belum diatur di master data!');
    }

    const currentGolongan = dataPegawai[0];

    // 2. Cari target AK (Angka Kredit) untuk jenjang BERSYARAT berikutnya
    let targetAkNum = 0;
    if (currentGolongan.urutanJenjang) {
      const nextGolongan = await db.select()
        .from(masterPangkatGolongan)
        .where(eq(masterPangkatGolongan.urutanJenjang, currentGolongan.urutanJenjang + 1))
        .limit(1);

      if (nextGolongan.length > 0 && nextGolongan[0].angkaKreditMinimal) {
        targetAkNum = Number(nextGolongan[0].angkaKreditMinimal);
      }
    }

    // 3. Insert atau Update (Upsert) data ke riwayat_angka_kredit
    await db.insert(riwayatAngkaKredit)
      .values({
        idPegawai,
        idMasterPangkatGolongan: currentGolongan.idGolongan,
        tahunPenilaian,
        nilaiPak: nilaiPak.toString(),
        targetAk: targetAkNum.toString()
      })
      .onConflictDoUpdate({
        target: [riwayatAngkaKredit.idPegawai, riwayatAngkaKredit.tahunPenilaian],
        set: {
          idMasterPangkatGolongan: currentGolongan.idGolongan,
          nilaiPak: nilaiPak.toString(),
          targetAk: targetAkNum.toString(),
          createdAt: new Date(),
        }
      });

    revalidatePath('/admin/manajemen-kinerja');

  } catch (error: any) {
    console.error('Error simpan PAK:', error);
    throw new Error(error.message);
  }
  redirect('/admin/manajemen-kinerja?tab=angka-kredit');
}

// Fungsi Hapus Penilaian Kinerja Bulanan
export async function hapusMasterKinerja(id: string) {
  try {
    await db.delete(tukinBulanan).where(eq(tukinBulanan.id, id));
    revalidatePath('/admin/manajemen-kinerja');
    return { status: 'success', message: 'Data kinerja berhasil dihapus!' };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}

// Fungsi Hapus Angka Kredit Tahunan
export async function hapusAngkaKredit(id: string) {
  try {
    await db.delete(riwayatAngkaKredit).where(eq(riwayatAngkaKredit.id, id));
    revalidatePath('/admin/manajemen-kinerja');
    return { status: 'success', message: 'Data Angka Kredit berhasil dihapus!' };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}

// --- FUNGSI UPDATE KINERJA BULANAN ---
export async function updateMasterKinerja(id: string, formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const bulan = Number(formData.get('bulan'));
  const tahun = Number(formData.get('tahun'));
  const hasilKerja = formData.get('hasilKerja') as string;
  const perilakuKerja = formData.get('perilakuKerja') as string;

  if (!idPegawai || !bulan || !tahun || !hasilKerja || !perilakuKerja) {
    throw new Error('Semua field form wajib diisi!');
  }

  // kalkulasiKinerja ini ngambil dari fungsi yang udah lu bikin di atas ya
  const { capaianKinerja, persentaseKinerja } = kalkulasiKinerja(hasilKerja, perilakuKerja);

  const dataPegawai = await db
    .select({ idJabatan: pegawai.idJabatan, baseTukin: masterKelasJabatan.baseTukin })
    .from(pegawai)
    .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
    .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

  if (!dataPegawai.length || !dataPegawai[0].idJabatan || !dataPegawai[0].baseTukin) {
    throw new Error('Data jabatan atau base tukin pegawai tidak ditemukan!');
  }

  const { idJabatan, baseTukin } = dataPegawai[0];
  const nominalKinerjaNum = Number(baseTukin) * persentaseKinerja;

  const rekapPresensi = await db
    .select({ id: rekapPresensiBulanan.id })
    .from(rekapPresensiBulanan)
    .where(and(eq(rekapPresensiBulanan.idPegawai, idPegawai), eq(rekapPresensiBulanan.bulan, bulan), eq(rekapPresensiBulanan.tahun, tahun)))
    .limit(1);

  await db.update(tukinBulanan)
    .set({
      idPegawai,
      idMasterJabatan: idJabatan,
      idRekapPresensiBulanan: rekapPresensi.length > 0 ? rekapPresensi[0].id : null,
      bulan,
      tahun,
      nominalDasar: baseTukin.toString(),
      hasilKerja,
      perilakuKerja,
      capaianKinerja,
      persentaseKinerja: persentaseKinerja.toString(),
      nominalKinerja: nominalKinerjaNum.toFixed(2),
      dibayarkan: nominalKinerjaNum.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(tukinBulanan.id, id));

  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath('/admin/tukin');
  redirect('/admin/manajemen-kinerja?tab=bulanan');
}

// --- FUNGSI UPDATE ANGKA KREDIT ---
export async function updateAngkaKredit(id: string, formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const tahunPenilaian = Number(formData.get('tahunPenilaian'));
  const nilaiPak = Number(formData.get('nilaiPak'));

  if (!idPegawai || !tahunPenilaian || !nilaiPak) throw new Error('Gagal: Pastikan form diisi!');

  try {
    const dataPegawai = await db.select({
      idGolongan: pegawai.idGolongan,
      urutanJenjang: masterPangkatGolongan.urutanJenjang
    })
    .from(pegawai)
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

    if (dataPegawai.length === 0 || !dataPegawai[0].idGolongan) throw new Error('Gagal: Golongan belum diatur!');

    let targetAkNum = 0;
    if (dataPegawai[0].urutanJenjang) {
      const nextGolongan = await db.select()
        .from(masterPangkatGolongan)
        .where(eq(masterPangkatGolongan.urutanJenjang, dataPegawai[0].urutanJenjang + 1))
        .limit(1);

      if (nextGolongan.length > 0 && nextGolongan[0].angkaKreditMinimal) {
        targetAkNum = Number(nextGolongan[0].angkaKreditMinimal);
      }
    }

    await db.update(riwayatAngkaKredit)
      .set({
        idPegawai,
        idMasterPangkatGolongan: dataPegawai[0].idGolongan,
        tahunPenilaian,
        nilaiPak: nilaiPak.toString(),
        targetAk: targetAkNum.toString(),
      })
      .where(eq(riwayatAngkaKredit.id, id));

    revalidatePath('/admin/manajemen-kinerja');
  } catch (error: any) {
    throw new Error(error.message);
  }
  redirect('/admin/manajemen-kinerja?tab=angka-kredit');
}
