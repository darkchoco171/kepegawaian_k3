'use server';

import { db } from '@/lib/db';
import { pegawai } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// FUNGSI 1: TAMBAH PEGAWAI
export async function simpanPegawaiBaru(formData: FormData) {
  const status = formData.get('status') as string;
  const keterangan = status === 'Aktif' ? null : status;

  await db.insert(pegawai).values({
    namaLengkap: formData.get('namaLengkap') as string,
    nip: formData.get('nip') as string,
    jabatanTim: (formData.get('jabatanTim') as string) || null,
    keterangan: keterangan,
    tempatLahir: (formData.get('tempatLahir') as string) || null,
    tglLahir: (formData.get('tglLahir') as string) || null,
    jenisKelamin: (formData.get('jenisKelamin') as 'L' | 'P') || null,
    agama: (formData.get('agama') as string) || null,
    statusPernikahan: (formData.get('statusPernikahan') as string) || null,
    tanggalMulaiKerja: (formData.get('tanggalMulaiKerja') as string) || null,
    kontak: (formData.get('kontak') as string) || null,
  });

  revalidatePath('/admin/pegawai');
}

// FUNGSI 2: EDIT PEGAWAI
export async function editPegawaiData(formData: FormData) {
  const id = formData.get('id') as string; // Butuh ID buat tau siapa yang diedit
  const status = formData.get('status') as string;
  const keterangan = status === 'Aktif' ? null : status;

  await db.update(pegawai).set({
    namaLengkap: formData.get('namaLengkap') as string,
    nip: formData.get('nip') as string,
    jabatanTim: (formData.get('jabatanTim') as string) || null,
    keterangan: keterangan,
    tempatLahir: (formData.get('tempatLahir') as string) || null,
    tglLahir: (formData.get('tglLahir') as string) || null,
    jenisKelamin: (formData.get('jenisKelamin') as 'L' | 'P') || null,
    agama: (formData.get('agama') as string) || null,
    statusPernikahan: (formData.get('statusPernikahan') as string) || null,
    tanggalMulaiKerja: (formData.get('tanggalMulaiKerja') as string) || null,
    kontak: (formData.get('kontak') as string) || null,
    updatedAt: new Date(), // Update timestamp
  }).where(eq(pegawai.id, id));

  revalidatePath('/admin/pegawai');
}

// FUNGSI 3: HAPUS PEGAWAI
export async function hapusPegawaiData(formData: FormData) {
  const id = formData.get('id') as string;

  await db.delete(pegawai).where(eq(pegawai.id, id));

  revalidatePath('/admin/pegawai');
}