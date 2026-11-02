'use server';

import { db } from '@/lib/db';
import {
  tukinBulanan,
  pegawai,
  masterJabatan,
  masterKelasJabatan,
  rekapPresensiBulanan,
  masterPangkatGolongan,
  masterJenjang,
  capaianPakBulanan,
  riwayatAngkaKredit,
} from '@/db/schema';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { hitungCapaianPakBulanan, kalkulasiKinerja } from '@/lib/tukin/calculation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

async function hitungTargetAkJenjang(idMasterJenjang: string | null) {
  if (!idMasterJenjang) return 0;

  const [hasil] = await db
    .select({
      total: sql<string>`coalesce(sum(${masterPangkatGolongan.angkaKreditMinimal}), 0)`,
    })
    .from(masterPangkatGolongan)
    .where(eq(masterPangkatGolongan.idMasterJenjang, idMasterJenjang));

  return Number(hasil?.total ?? 0);
}

async function simpanCapaianPakBulanan({
  idPegawai,
  idMasterJenjang,
  bulan,
  tahun,
  predikat,
  nilaiAkBulanan,
}: {
  idPegawai: string;
  idMasterJenjang: string;
  bulan: number;
  tahun: number;
  predikat: string;
  nilaiAkBulanan: number;
}) {
  await db
    .insert(capaianPakBulanan)
    .values({
      idPegawai,
      idMasterJenjang,
      bulan,
      tahun,
      predikat,
      nilaiAkBulanan: nilaiAkBulanan.toFixed(3),
    })
    .onConflictDoUpdate({
      target: [
        capaianPakBulanan.idPegawai,
        capaianPakBulanan.bulan,
        capaianPakBulanan.tahun,
      ],
      set: {
        idMasterJenjang,
        predikat,
        nilaiAkBulanan: nilaiAkBulanan.toFixed(3),
        updatedAt: new Date(),
      },
    });
}

type PenilaianKerja = 'Di Atas Ekspektasi' | 'Sesuai Ekspektasi' | 'Di Bawah Ekspektasi';

const pilihanPenilaianKerja: PenilaianKerja[] = [
    'Di Atas Ekspektasi',
    'Sesuai Ekspektasi',
    'Di Bawah Ekspektasi',
];

function isPenilaianKerja(value: string): value is PenilaianKerja {
    return pilihanPenilaianKerja.includes(value as PenilaianKerja);
}

type DataPegawaiKinerja = {
    idJabatan: string | null;
    baseTukin: string | null;
    idMasterJenjang: string | null;
    koefisienTahunan: string | null;
};

async function ambilDataPegawaiKinerja(idPegawai: string): Promise<DataPegawaiKinerja | undefined> {
    const [data] = await db
      .select({
        idJabatan: pegawai.idJabatan,
        baseTukin: masterKelasJabatan.baseTukin,
        idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
        koefisienTahunan: masterJenjang.koefisienTahunan,
      })
    .from(pegawai)
    .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
    .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .leftJoin(masterJenjang, eq(masterPangkatGolongan.idMasterJenjang, masterJenjang.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

  return data;
}

async function simpanPenilaianKinerja({
  idPegawai,
  bulan,
  tahun,
  hasilKerja,
  perilakuKerja,
  dataPegawai: dataPegawaiDisiapkan,
  idRekap: idRekapDisiapkan,
}: {
  idPegawai: string;
  bulan: number;
  tahun: number;
  hasilKerja: PenilaianKerja;
  perilakuKerja: PenilaianKerja;
  dataPegawai?: DataPegawaiKinerja;
  idRekap?: string | null;
}) {
  const dataPegawai = dataPegawaiDisiapkan ?? await ambilDataPegawaiKinerja(idPegawai);
  if (!dataPegawai?.idJabatan || !dataPegawai.baseTukin) {
    throw new Error('Data jabatan atau base tukin pegawai tidak ditemukan!');
  }

  const { idJabatan, baseTukin } = dataPegawai;
  const { capaianKinerja, persentaseKinerja } = kalkulasiKinerja(hasilKerja, perilakuKerja);
  const nominalDasarNum = Number(baseTukin);
  const nominalKinerjaNum = nominalDasarNum * persentaseKinerja;
  const { idMasterJenjang, koefisienTahunan } = dataPegawai;

  let idRekap = idRekapDisiapkan;
  if (idRekap === undefined) {
    const [rekapPresensi] = await db
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
    idRekap = rekapPresensi?.id ?? null;
  }

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

  if (idMasterJenjang && koefisienTahunan) {
    await simpanCapaianPakBulanan({
      idPegawai,
      idMasterJenjang,
      bulan,
      tahun,
      predikat: capaianKinerja,
      nilaiAkBulanan: hitungCapaianPakBulanan(Number(koefisienTahunan), capaianKinerja),
    });
  }
}

export async function simpanMasterKinerja(formData: FormData) {
  const idPegawai = formData.get('idPegawai');
  const bulan = Number(formData.get('bulan'));
  const tahun = Number(formData.get('tahun'));
  const hasilKerja = formData.get('hasilKerja');
  const perilakuKerja = formData.get('perilakuKerja');

  if (
    typeof idPegawai !== 'string' ||
    !idPegawai ||
    !Number.isInteger(bulan) ||
    bulan < 1 ||
    bulan > 12 ||
    !Number.isInteger(tahun) ||
    typeof hasilKerja !== 'string' ||
    !isPenilaianKerja(hasilKerja) ||
    typeof perilakuKerja !== 'string' ||
    !isPenilaianKerja(perilakuKerja)
  ) {
    throw new Error('Semua field form wajib diisi dengan nilai yang valid!');
  }

  await simpanPenilaianKinerja({
    idPegawai,
    bulan,
    tahun,
    hasilKerja,
    perilakuKerja,
  });

  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath('/admin/tukin');
  redirect('/admin/manajemen-kinerja');
}

export type SimpanKinerjaMassalState = {
  success?: string;
  error?: string;
};

export async function simpanKinerjaMassal(
  _previousState: SimpanKinerjaMassalState,
  formData: FormData,
): Promise<SimpanKinerjaMassalState> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return { error: 'Hanya admin yang dapat menyimpan penilaian kinerja.' };
  }

  const bulan = Number(formData.get('bulan'));
  const tahun = Number(formData.get('tahun'));
  const idPegawaiValues = formData.getAll('idPegawai');
  const hasilKerjaValues = formData.getAll('hasilKerja');
  const perilakuKerjaValues = formData.getAll('perilakuKerja');

  if (
    !Number.isInteger(bulan) ||
    bulan < 1 ||
    bulan > 12 ||
    !Number.isInteger(tahun) ||
    tahun < 1900 ||
    tahun > 9999 ||
    idPegawaiValues.length === 0 ||
    idPegawaiValues.length !== hasilKerjaValues.length ||
    idPegawaiValues.length !== perilakuKerjaValues.length ||
    idPegawaiValues.some((id) => typeof id !== 'string' || !id) ||
    new Set(idPegawaiValues).size !== idPegawaiValues.length
  ) {
    return { error: 'Data periode atau daftar pegawai tidak valid. Muat ulang halaman lalu coba lagi.' };
  }

  const penilaian = idPegawaiValues.map((id, index) => {
    const hasil = hasilKerjaValues[index];
    const perilaku = perilakuKerjaValues[index];
    return {
      idPegawai: id as string,
      hasilKerja: typeof hasil === 'string' ? hasil.trim() : '',
      perilakuKerja: typeof perilaku === 'string' ? perilaku.trim() : '',
    };
  });
  const belumLengkap = penilaian.filter(({ hasilKerja, perilakuKerja }) =>
    Boolean(hasilKerja) !== Boolean(perilakuKerja),
  );
  if (belumLengkap.length > 0) {
    return { error: 'Lengkapi kedua penilaian pada setiap baris yang mulai diisi.' };
  }

  const penilaianLengkap = penilaian.filter(({ hasilKerja, perilakuKerja }) =>
    hasilKerja && perilakuKerja,
  );
  if (penilaianLengkap.length === 0) {
    return { error: 'Belum ada penilaian lengkap untuk disimpan.' };
  }
  if (penilaianLengkap.some(({ hasilKerja, perilakuKerja }) =>
    !isPenilaianKerja(hasilKerja) ||
    !isPenilaianKerja(perilakuKerja),
  )) {
    return { error: 'Ada nilai penilaian yang tidak valid. Periksa kembali isian.' };
  }

  const idPegawaiTerpilih = penilaianLengkap.map(({ idPegawai }) => idPegawai);
  let tersimpan = 0;
  try {
    const [dataPegawaiList, rekapPresensiList] = await Promise.all([
      db
        .select({
          id: pegawai.id,
          idJabatan: pegawai.idJabatan,
          baseTukin: masterKelasJabatan.baseTukin,
          idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
          koefisienTahunan: masterJenjang.koefisienTahunan,
        })
        .from(pegawai)
        .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
        .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
        .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
        .leftJoin(masterJenjang, eq(masterPangkatGolongan.idMasterJenjang, masterJenjang.id))
        .where(inArray(pegawai.id, idPegawaiTerpilih)),
      db
        .select({
          id: rekapPresensiBulanan.id,
          idPegawai: rekapPresensiBulanan.idPegawai,
        })
        .from(rekapPresensiBulanan)
        .where(and(
          inArray(rekapPresensiBulanan.idPegawai, idPegawaiTerpilih),
          eq(rekapPresensiBulanan.bulan, bulan),
          eq(rekapPresensiBulanan.tahun, tahun),
        )),
    ]);
    const dataPegawaiById = new Map(dataPegawaiList.map(({ id, ...data }) => [id, data]));
    const idRekapByPegawai = new Map(rekapPresensiList.map(({ idPegawai, id }) => [idPegawai, id]));

    const pegawaiTidakValid = penilaianLengkap.find(({ idPegawai }) => {
      const data = dataPegawaiById.get(idPegawai);
      return !data?.idJabatan || !data.baseTukin;
    });
    if (pegawaiTidakValid) {
      return {
        error: `Pegawai ${pegawaiTidakValid.idPegawai} belum memiliki jabatan atau Tukin dasar.`,
      };
    }

    for (const item of penilaianLengkap) {
      const dataPegawai = dataPegawaiById.get(item.idPegawai);
      if (!dataPegawai || !isPenilaianKerja(item.hasilKerja) || !isPenilaianKerja(item.perilakuKerja)) {
        return { error: 'Data penilaian berubah atau tidak valid. Muat ulang halaman lalu coba lagi.' };
      }

      await simpanPenilaianKinerja({
        ...item,
        bulan,
        tahun,
        hasilKerja: item.hasilKerja,
        perilakuKerja: item.perilakuKerja,
        dataPegawai,
        idRekap: idRekapByPegawai.get(item.idPegawai) ?? null,
      });
      tersimpan++;
    }
  } catch (error) {
    console.error('Gagal menyimpan input kinerja massal:', error);
    return {
      error: `Penyimpanan berhenti setelah ${tersimpan} dari ${penilaianLengkap.length} penilaian. ${error instanceof Error ? error.message : 'Terjadi kesalahan database.'}`,
    };
  }

  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath('/admin/manajemen-kinerja/input-massal');
  revalidatePath('/admin/tukin');
  return {
    success: `Berhasil menyimpan ${tersimpan} penilaian untuk periode ${bulan}/${tahun}. ${idPegawaiValues.length - penilaianLengkap.length} baris kosong tidak diubah.`,
  };
}

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
      idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
    })
    .from(pegawai)
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .leftJoin(masterJenjang, eq(masterPangkatGolongan.idMasterJenjang, masterJenjang.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

    if (dataPegawai.length === 0 || !dataPegawai[0].idGolongan) {
      throw new Error('Gagal: Golongan/Pangkat pegawai belum diatur di master data!');
    }

    const currentGolongan = dataPegawai[0];

    const targetAkNum = await hitungTargetAkJenjang(currentGolongan.idMasterJenjang);

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
    const [dataKinerja] = await db
      .select({
        idPegawai: tukinBulanan.idPegawai,
        bulan: tukinBulanan.bulan,
        tahun: tukinBulanan.tahun,
      })
      .from(tukinBulanan)
      .where(eq(tukinBulanan.id, id))
      .limit(1);

    if (dataKinerja) {
      await db
        .delete(capaianPakBulanan)
        .where(and(
          eq(capaianPakBulanan.idPegawai, dataKinerja.idPegawai),
          eq(capaianPakBulanan.bulan, dataKinerja.bulan),
          eq(capaianPakBulanan.tahun, dataKinerja.tahun),
        ));
    }

    await db.delete(tukinBulanan).where(eq(tukinBulanan.id, id));
    revalidatePath('/admin/manajemen-kinerja');
    if (dataKinerja) {
      revalidatePath(`/admin/manajemen-kinerja/cpak/${dataKinerja.idPegawai}/${dataKinerja.tahun}`);
    }
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

  // kalkulasiKinerja
  const { capaianKinerja, persentaseKinerja } = kalkulasiKinerja(hasilKerja, perilakuKerja);

  const [dataKinerjaLama] = await db
    .select({
      idPegawai: tukinBulanan.idPegawai,
      bulan: tukinBulanan.bulan,
      tahun: tukinBulanan.tahun,
    })
    .from(tukinBulanan)
    .where(eq(tukinBulanan.id, id))
    .limit(1);

  if (!dataKinerjaLama) {
    throw new Error('Data kinerja yang akan diperbarui tidak ditemukan.');
  }

  const dataPegawai = await db
    .select({
      idJabatan: pegawai.idJabatan,
      baseTukin: masterKelasJabatan.baseTukin,
      idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
      koefisienTahunan: masterJenjang.koefisienTahunan,
    })
    .from(pegawai)
    .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
    .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .leftJoin(masterJenjang, eq(masterPangkatGolongan.idMasterJenjang, masterJenjang.id))
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

  const { idMasterJenjang, koefisienTahunan } = dataPegawai[0];
  if (idMasterJenjang && koefisienTahunan) {
    await simpanCapaianPakBulanan({
      idPegawai,
      idMasterJenjang,
      bulan,
      tahun,
      predikat: capaianKinerja,
      nilaiAkBulanan: hitungCapaianPakBulanan(Number(koefisienTahunan), capaianKinerja),
    });
  } else {
    await db
      .delete(capaianPakBulanan)
      .where(and(
        eq(capaianPakBulanan.idPegawai, idPegawai),
        eq(capaianPakBulanan.bulan, bulan),
        eq(capaianPakBulanan.tahun, tahun),
      ));
  }

  if (
    dataKinerjaLama.idPegawai !== idPegawai ||
    dataKinerjaLama.bulan !== bulan ||
    dataKinerjaLama.tahun !== tahun
  ) {
    await db
      .delete(capaianPakBulanan)
      .where(and(
        eq(capaianPakBulanan.idPegawai, dataKinerjaLama.idPegawai),
        eq(capaianPakBulanan.bulan, dataKinerjaLama.bulan),
        eq(capaianPakBulanan.tahun, dataKinerjaLama.tahun),
      ));
  }

  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath(`/admin/manajemen-kinerja/cpak/${dataKinerjaLama.idPegawai}/${dataKinerjaLama.tahun}`);
  revalidatePath(`/admin/manajemen-kinerja/cpak/${idPegawai}/${tahun}`);
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
      idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
    })
    .from(pegawai)
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id))
    .leftJoin(masterJenjang, eq(masterPangkatGolongan.idMasterJenjang, masterJenjang.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

    if (dataPegawai.length === 0 || !dataPegawai[0].idGolongan) throw new Error('Gagal: Golongan belum diatur!');

    const targetAkNum = await hitungTargetAkJenjang(dataPegawai[0].idMasterJenjang);

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

// --- FUNGSI GET DATA (READ) UNTUK TABEL & PAGINATION ---
export async function getKinerjaBulananList(page = 1, filterBulan?: number, filterTahun?: number) {
  const limit = 10; // Tampilkan 10 baris per halaman
  const offset = (page - 1) * limit;

  // 1. Siapin array kondisi (biar filternya dinamis)
  const conditions = [];
  
  // Kalau admin milih bulan di toolbar, masukin ke filter
  if (filterBulan) {
    conditions.push(eq(tukinBulanan.bulan, filterBulan));
  }
  
  // Kalau admin milih tahun, masukin ke filter
  if (filterTahun) {
    conditions.push(eq(tukinBulanan.tahun, filterTahun));
  }

  try {
    // 2. Tarik Data Utama (dilengkapi Limit & Offset)
    const data = await db
      .select({
        id: tukinBulanan.id,
        bulan: tukinBulanan.bulan,
        tahun: tukinBulanan.tahun,
        hasilKerja: tukinBulanan.hasilKerja,
        perilakuKerja: tukinBulanan.perilakuKerja,
        capaianKinerja: tukinBulanan.capaianKinerja,
        persentaseKinerja: tukinBulanan.persentaseKinerja,
        nominalKinerja: tukinBulanan.nominalKinerja,
        namaPegawai: pegawai.namaLengkap,
        nip: pegawai.nip,
      })
      .from(tukinBulanan)
      .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .limit(limit)
      .offset(offset)
      .orderBy(desc(tukinBulanan.tahun), desc(tukinBulanan.bulan)); // Urutin dari yang terbaru

    // 3. Tarik Total Data Keseluruhan (buat ngitung butuh berapa halaman pagination)
    const [{ count }] = await db
      .select({ count: sql`count(*)` })
      .from(tukinBulanan)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
      
    const totalPages = Math.ceil(Number(count) / limit);

    return { data, totalPages };
  } catch (error: any) {
    console.error('Error getKinerjaBulananList:', error);
    throw new Error('Gagal menarik data kinerja bulanan');
  }
}
