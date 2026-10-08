'use server';

import { db } from '@/lib/db';
import { pegawai, riwayatDiklat, riwayatPendidikan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

// FUNGSI 1: TAMBAH PEGAWAI
export async function simpanPegawaiBaru(formData: FormData) {
  const status = formData.get('status') as string;
  const keterangan = status === 'Aktif' ? null : status;

  const [pegawaiBaru] = await db.insert(pegawai).values({
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
  }).returning({ id: pegawai.id });

  const pendidikanJenjang = formData.getAll('pendidikanJenjang').map(value => String(value).trim());
  const pendidikanInstitusi = formData.getAll('pendidikanInstitusi').map(value => String(value).trim());
  const pendidikanProgramStudi = formData.getAll('pendidikanProgramStudi').map(value => String(value).trim());
  const riwayatPendidikanBaru = pendidikanJenjang
    .map((jenjang, index) => ({
      idPegawai: pegawaiBaru.id,
      jenjang: jenjang || null,
      namaInstitusi: pendidikanInstitusi[index] || null,
      programStudi: pendidikanProgramStudi[index] || null,
    }))
    .filter((pendidikan, index) =>
      pendidikan.jenjang || pendidikanInstitusi[index] || pendidikanProgramStudi[index],
    );

  if (riwayatPendidikanBaru.length > 0) {
    await db.insert(riwayatPendidikan).values(riwayatPendidikanBaru);
  }

  const diklatNama = formData.getAll('diklatNama').map(value => String(value).trim());
  const diklatTahun = formData.getAll('diklatTahun').map(value => String(value).trim());
  const riwayatDiklatBaru = diklatNama
    .map((namaDiklat, index) => {
      const tahunValue = diklatTahun[index];
      const tahunDiklat = tahunValue ? Number(tahunValue) : null;

      if (tahunDiklat !== null && !Number.isInteger(tahunDiklat)) {
        throw new Error('Tahun diklat harus berupa angka bulat.');
      }

      return {
        idPegawai: pegawaiBaru.id,
        namaDiklat,
        tahunDiklat,
      };
    })
    .filter(diklat => diklat.namaDiklat.length > 0);

  if (riwayatDiklatBaru.length > 0) {
    await db.insert(riwayatDiklat).values(riwayatDiklatBaru);
  }

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