'use server';

import { db } from '@/lib/db';
import { pegawai, riwayatDiklat, riwayatPendidikan } from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';
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

  const pendidikanIds = formData.getAll('pendidikanId').map(value => String(value));
  const pendidikanJenjang = formData.getAll('pendidikanJenjang').map(value => String(value).trim());
  const pendidikanInstitusi = formData.getAll('pendidikanInstitusi').map(value => String(value).trim());
  const pendidikanProgramStudi = formData.getAll('pendidikanProgramStudi').map(value => String(value).trim());
  const pendidikanRows = pendidikanJenjang
    .map((jenjang, index) => ({
      id: pendidikanIds[index] || '',
      jenjang: jenjang || null,
      namaInstitusi: pendidikanInstitusi[index] || null,
      programStudi: pendidikanProgramStudi[index] || null,
    }))
    .filter(row => row.jenjang || row.namaInstitusi || row.programStudi);
  const existingPendidikan = await db.query.riwayatPendidikan.findMany({
    where: eq(riwayatPendidikan.idPegawai, id),
    columns: { id: true },
  });
  const existingPendidikanIds = new Set(existingPendidikan.map(row => row.id));

  if (pendidikanRows.some(row => row.id && !existingPendidikanIds.has(row.id))) {
    throw new Error('Data riwayat pendidikan tidak valid.');
  }

  const retainedPendidikanIds = pendidikanRows.flatMap(row => row.id ? [row.id] : []);
  if (retainedPendidikanIds.length > 0) {
    await db.delete(riwayatPendidikan).where(and(
      eq(riwayatPendidikan.idPegawai, id),
      notInArray(riwayatPendidikan.id, retainedPendidikanIds),
    ));
  } else {
    await db.delete(riwayatPendidikan).where(eq(riwayatPendidikan.idPegawai, id));
  }

  const pendidikanBaru = [];
  for (const row of pendidikanRows) {
    if (row.id) {
      await db.update(riwayatPendidikan)
        .set({ jenjang: row.jenjang, namaInstitusi: row.namaInstitusi, programStudi: row.programStudi })
        .where(and(eq(riwayatPendidikan.id, row.id), eq(riwayatPendidikan.idPegawai, id)));
    } else {
      pendidikanBaru.push({
        idPegawai: id,
        jenjang: row.jenjang,
        namaInstitusi: row.namaInstitusi,
        programStudi: row.programStudi,
      });
    }
  }
  if (pendidikanBaru.length > 0) {
    await db.insert(riwayatPendidikan).values(pendidikanBaru);
  }

  const diklatIds = formData.getAll('diklatId').map(value => String(value));
  const diklatNama = formData.getAll('diklatNama').map(value => String(value).trim());
  const diklatTahun = formData.getAll('diklatTahun').map(value => String(value).trim());
  const diklatRows = diklatNama
    .map((namaDiklat, index) => {
      const tahunValue = diklatTahun[index];
      const tahunDiklat = tahunValue ? Number(tahunValue) : null;
      if (tahunDiklat !== null && !Number.isInteger(tahunDiklat)) {
        throw new Error('Tahun diklat harus berupa angka bulat.');
      }

      return {
        id: diklatIds[index] || '',
        namaDiklat,
        tahunDiklat,
      };
    })
    .filter(row => row.namaDiklat.length > 0);
  const existingDiklat = await db.query.riwayatDiklat.findMany({
    where: eq(riwayatDiklat.idPegawai, id),
    columns: { id: true },
  });
  const existingDiklatIds = new Set(existingDiklat.map(row => row.id));

  if (diklatRows.some(row => row.id && !existingDiklatIds.has(row.id))) {
    throw new Error('Data riwayat diklat tidak valid.');
  }

  const retainedDiklatIds = diklatRows.flatMap(row => row.id ? [row.id] : []);
  if (retainedDiklatIds.length > 0) {
    await db.delete(riwayatDiklat).where(and(
      eq(riwayatDiklat.idPegawai, id),
      notInArray(riwayatDiklat.id, retainedDiklatIds),
    ));
  } else {
    await db.delete(riwayatDiklat).where(eq(riwayatDiklat.idPegawai, id));
  }

  const diklatBaru = [];
  for (const row of diklatRows) {
    if (row.id) {
      await db.update(riwayatDiklat)
        .set({ namaDiklat: row.namaDiklat, tahunDiklat: row.tahunDiklat })
        .where(and(eq(riwayatDiklat.id, row.id), eq(riwayatDiklat.idPegawai, id)));
    } else {
      diklatBaru.push({
        idPegawai: id,
        namaDiklat: row.namaDiklat,
        tahunDiklat: row.tahunDiklat,
      });
    }
  }
  if (diklatBaru.length > 0) {
    await db.insert(riwayatDiklat).values(diklatBaru);
  }

  revalidatePath('/admin/pegawai');
  revalidatePath(`/admin/pegawai/${id}`);
}

// FUNGSI 3: HAPUS PEGAWAI
export async function hapusPegawaiData(formData: FormData) {
  const id = formData.get('id') as string;

  await db.delete(pegawai).where(eq(pegawai.id, id));

  revalidatePath('/admin/pegawai');
}