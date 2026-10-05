'use server';

import { db } from '@/lib/db';
import { pengajuanCuti } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function createCuti(formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const jenisCuti = formData.get('jenisCuti') as any;
  const tglMulai = formData.get('tglMulai') as string;
  const tglSelesai = formData.get('tglSelesai') as string;
  const jumlahHari = Number(formData.get('jumlahHari')) || 1;
  const alasan = formData.get('alasan') as string;

  if (!idPegawai || !tglMulai || !tglSelesai) return;

  await db.insert(pengajuanCuti).values({
    idPegawai,
    jenisCuti,
    tglMulai,
    tglSelesai,
    jumlahHari,
    alasan: alasan || null,
    statusPengajuan: 'Disetujui', // Default langsung disetujui karena diinput oleh Admin
  });

  revalidatePath('/admin/cuti');
}