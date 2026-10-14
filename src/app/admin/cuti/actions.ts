'use server';

import { db } from '@/lib/db';
import { pengajuanCuti, presensiHarian } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { eq, and, lte, gte } from 'drizzle-orm';

export async function createCuti(formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const jenisCuti = formData.get('jenisCuti') as any;
  const tglMulai = formData.get('tglMulai') as string;
  const tglSelesai = formData.get('tglSelesai') as string;
  const jumlahHari = Number(formData.get('jumlahHari')) || 1;
  const alasan = formData.get('alasan') as string;

  if (!idPegawai || !tglMulai || !tglSelesai) {
    return { success: false, message: 'Harap lengkapi semua data wajib!' };
  }

  if (tglMulai > tglSelesai) {
    return { success: false, message: 'Tanggal selesai tidak boleh lebih awal dari tanggal mulai!' };
  }

  // 1. CEK OVERLAP: Cegah input dobel jika sudah ada cuti di rentang tanggal tersebut
  const existingCuti = await db.query.pengajuanCuti.findFirst({
    where: and(
      eq(pengajuanCuti.idPegawai, idPegawai),
      lte(pengajuanCuti.tglMulai, tglSelesai),
      gte(pengajuanCuti.tglSelesai, tglMulai)
    )
  });

  if (existingCuti) {
    return {
      success: false,
      message: `Pegawai ini sudah memiliki cuti (${existingCuti.jenisCuti}) pada rentang ${existingCuti.tglMulai} s/d ${existingCuti.tglSelesai}. Silahkan periksa kembali agar tidak terjadi duplikasi!`
    };
  }

  // 2. Simpan data cuti baru
  const [newCuti] = await db.insert(pengajuanCuti).values({
    idPegawai,
    jenisCuti,
    tglMulai,
    tglSelesai,
    jumlahHari,
    alasan: alasan || null,
    statusPengajuan: 'Disetujui', // Default langsung disetujui karena diinput oleh Admin
  }).returning({ id: pengajuanCuti.id });

  // 3. Sinkronkan ke presensi_harian jika ada log presensi pada rentang tanggal tersebut
  await db.update(presensiHarian)
    .set({
      sistemKerja: 'Cuti',
      idCuti: newCuti.id,
    })
    .where(
      and(
        eq(presensiHarian.idPegawai, idPegawai),
        gte(presensiHarian.tgl, tglMulai),
        lte(presensiHarian.tgl, tglSelesai)
      )
    );

  revalidatePath('/admin/cuti');
  revalidatePath('/admin/presensi');
  return { success: true, message: 'Pengajuan cuti berhasil disimpan!' };
}