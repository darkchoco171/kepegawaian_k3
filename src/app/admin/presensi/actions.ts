'use server';

import { db } from '@/lib/db';
import { presensiHarian } from '@/db/schema';
import { revalidatePath } from 'next/cache';

export async function importPresensiData(formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const tgl = formData.get('tgl') as string;
  const cekIn = formData.get('cekIn') as string;
  const cekOut = formData.get('cekOut') as string;
  
  // Sesuai enum sistem_kerja di skema
  const sistemKerja = formData.get('sistemKerja') as 'WFO' | 'WFH' | 'Dinas Luar' | 'Cuti' | 'Upacara' | 'Alpa';
  const statusAnomali = formData.get('statusAnomali') as string;

  if (!idPegawai || !tgl) return;

  await db.insert(presensiHarian).values({
    idPegawai,
    tgl,
    sistemKerja: sistemKerja || 'WFO',
    cekIn: cekIn || null,
    cekOut: cekOut || null,
    statusAnomali: statusAnomali || null,
  });

  revalidatePath('/admin/presensi');
}