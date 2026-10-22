'use server';

import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import {
  masterJabatan,
  masterPangkatGolongan,
  pegawai,
  riwayatDiklat,
  riwayatPendidikan,
  sisaCuti,
} from '@/db/schema';
import { and, eq, notInArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { ANNUAL_CUTI_QUOTA } from '@/app/admin/cuti/cuti-utils';

async function resolveMasterReferences(formData: FormData) {
  const namaJabatan = String(formData.get('namaJabatan') || '').trim();
  const idKelasJabatan = String(formData.get('idKelasJabatan') || '');
  const pangkat = String(formData.get('pangkat') || '').trim();
  const golongan = String(formData.get('golongan') || '').trim();
  const jenisKepegawaian = String(formData.get('jenisKepegawaian') || '');

  if (!namaJabatan || !idKelasJabatan || !pangkat || !golongan) {
    throw new Error('Jabatan, kelas jabatan, pangkat, dan golongan wajib diisi.');
  }
  if (!['PNS', 'PPPK', 'NON-ASN'].includes(jenisKepegawaian)) {
    throw new Error('Jenis kepegawaian tidak valid.');
  }

  const [jabatanMaster] = await db.select({
    id: masterJabatan.id,
    idKelasJabatan: masterJabatan.idKelasJabatan,
  })
    .from(masterJabatan)
    .where(eq(masterJabatan.namaJabatan, namaJabatan))
    .limit(1);

  if (!jabatanMaster) {
    throw new Error('Jabatan belum tersedia di master. Lengkapi data master jabatan terlebih dahulu.');
  }
  if (jabatanMaster.idKelasJabatan !== idKelasJabatan) {
    throw new Error('Kelas jabatan tidak sesuai dengan master untuk jabatan tersebut.');
  }

  const [golonganMaster] = await db.select({
    id: masterPangkatGolongan.id,
    pangkat: masterPangkatGolongan.pangkat,
    jenisKepegawaian: masterPangkatGolongan.jenisKepegawaian,
    angkaKreditMinimal: masterPangkatGolongan.angkaKreditMinimal,
  })
    .from(masterPangkatGolongan)
    .where(eq(masterPangkatGolongan.golongan, golongan))
    .limit(1);

  if (!golonganMaster) {
    throw new Error('Pangkat/golongan belum tersedia di master. Lengkapi data master beserta aturan AK terlebih dahulu.');
  }
  if (golonganMaster.pangkat?.toLocaleLowerCase('id-ID') !== pangkat.toLocaleLowerCase('id-ID')
    || golonganMaster.jenisKepegawaian !== jenisKepegawaian) {
    throw new Error('Pangkat/golongan atau jenis kepegawaian tidak sesuai dengan master.');
  }
  if (jenisKepegawaian === 'PNS' && golonganMaster.angkaKreditMinimal === null) {
    throw new Error('Aturan AK untuk pangkat/golongan ini belum dilengkapi. Lengkapi master terlebih dahulu.');
  }

  return { idJabatan: jabatanMaster.id, idGolongan: golonganMaster.id };
}

// FUNGSI 1: TAMBAH PEGAWAI
export async function simpanPegawaiBaru(formData: FormData) {
  const { idJabatan, idGolongan } = await resolveMasterReferences(formData);
  const status = formData.get('status') as string;
  const keterangan = status === 'Aktif' ? null : status;
  const pegawaiId = randomUUID();
  const currentYear = new Date().getFullYear();

  await db.batch([
    db.insert(pegawai).values({
      id: pegawaiId,
      namaLengkap: formData.get('namaLengkap') as string,
      nip: formData.get('nip') as string,
      idJabatan,
      idGolongan,
      jabatanTim: (formData.get('jabatanTim') as string) || null,
      keterangan: keterangan,
      tempatLahir: (formData.get('tempatLahir') as string) || null,
      tglLahir: (formData.get('tglLahir') as string) || null,
      jenisKelamin: (formData.get('jenisKelamin') as 'L' | 'P') || null,
      agama: (formData.get('agama') as string) || null,
      statusPernikahan: (formData.get('statusPernikahan') as string) || null,
      tanggalMulaiKerja: (formData.get('tanggalMulaiKerja') as string) || null,
      kontak: (formData.get('kontak') as string) || null,
    }),
    db.insert(sisaCuti).values(
      [currentYear - 2, currentYear - 1, currentYear].map((tahun) => ({
        idPegawai: pegawaiId,
        tahun,
        sisa: ANNUAL_CUTI_QUOTA,
      })),
    ),
  ]);
  const pegawaiBaru = { id: pegawaiId };

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
  const { idJabatan, idGolongan } = await resolveMasterReferences(formData);
  const id = formData.get('id') as string; // Butuh ID buat tau siapa yang diedit
  const status = formData.get('status') as string;
  const keterangan = status === 'Aktif' ? null : status;

  await db.update(pegawai).set({
    namaLengkap: formData.get('namaLengkap') as string,
    nip: formData.get('nip') as string,
    idJabatan,
    idGolongan,
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