'use server';

import { db } from '@/lib/db';
import {
  masterJabatan,
  masterKelasJabatan,
  masterPangkatGolongan,
  pegawai,
  riwayatAngkaKredit,
  tukinBulanan,
} from '@/db/schema';
import { eq, ilike } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

const JENIS_KEPEGAWAIAN = ['PNS', 'PPPK', 'NON-ASN'] as const;
type JenisKepegawaian = typeof JENIS_KEPEGAWAIAN[number];

export async function tambahMasterJabatan(formData: FormData) {
  const namaJabatan = String(formData.get('namaJabatan') || '').trim();
  const idKelasJabatan = String(formData.get('idKelasJabatan') || '');
  const jenisJabatan = String(formData.get('jenisJabatan') || '').trim();

  if (!namaJabatan || !idKelasJabatan) {
    throw new Error('Nama jabatan dan kelas jabatan wajib diisi.');
  }
  const [kelasValid] = await db.select({ id: masterKelasJabatan.id })
    .from(masterKelasJabatan)
    .where(eq(masterKelasJabatan.id, idKelasJabatan))
    .limit(1);
  if (!kelasValid) {
    throw new Error('Kelas jabatan tidak ditemukan.');
  }

  const [existing] = await db.select({ id: masterJabatan.id })
    .from(masterJabatan)
    .where(ilike(masterJabatan.namaJabatan, namaJabatan))
    .limit(1);
  if (existing) {
    throw new Error('Nama jabatan tersebut sudah ada di master.');
  }

  const [inserted] = await db.insert(masterJabatan)
    .values({
      namaJabatan,
      idKelasJabatan,
      jenisJabatan: jenisJabatan || null,
    })
    .onConflictDoNothing()
    .returning({ id: masterJabatan.id });
  if (!inserted) {
    throw new Error('Jabatan tidak berhasil disimpan karena nama tersebut sudah terdaftar.');
  }

  revalidatePath('/admin/manajemen-kinerja/master-pangkat-golongan');
  revalidatePath('/admin/pegawai');
}

export async function hapusMasterJabatan(id: string) {
  if (!id) {
    throw new Error('ID master jabatan tidak valid.');
  }

  const [master] = await db.select({
    id: masterJabatan.id,
    namaJabatan: masterJabatan.namaJabatan,
  })
    .from(masterJabatan)
    .where(eq(masterJabatan.id, id))
    .limit(1);

  if (!master) {
    throw new Error('Master jabatan tidak ditemukan.');
  }

  const [pegawaiTerkait, tukinTerkait] = await Promise.all([
    db.select({ id: pegawai.id })
      .from(pegawai)
      .where(eq(pegawai.idJabatan, id))
      .limit(1),
    db.select({ id: tukinBulanan.id })
      .from(tukinBulanan)
      .where(eq(tukinBulanan.idMasterJabatan, id))
      .limit(1),
  ]);

  if (pegawaiTerkait.length > 0 || tukinTerkait.length > 0) {
    throw new Error(
      `Jabatan "${master.namaJabatan}" tidak dapat dihapus karena masih dipakai oleh data pegawai atau riwayat Tukin.`,
    );
  }

  const [deleted] = await db.delete(masterJabatan)
    .where(eq(masterJabatan.id, id))
    .returning({ id: masterJabatan.id });

  if (!deleted) {
    throw new Error('Master jabatan gagal dihapus.');
  }

  revalidatePath('/admin/manajemen-kinerja/master-pangkat-golongan');
  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath('/admin/pegawai');
}

function parseAngkaKredit(value: FormDataEntryValue | null, required: boolean) {
  const rawValue = String(value ?? '').trim();
  if (!rawValue && !required) return null;

  const parsedValue = Number(rawValue);
  if (!Number.isFinite(parsedValue) || parsedValue <= 0 || parsedValue > 9999.99) {
    throw new Error('Angka kredit minimal harus lebih dari 0 dan maksimal 9999,99.');
  }
  return parsedValue.toFixed(2);
}

export async function tambahMasterPangkatGolongan(formData: FormData) {
  const jenisValue = String(formData.get('jenisKepegawaian') || '');
  const pangkat = String(formData.get('pangkat') || '').trim();
  const golongan = String(formData.get('golongan') || '').trim();
  const angkaKreditMinimal = parseAngkaKredit(
    formData.get('angkaKreditMinimal'),
    jenisValue === 'PNS',
  );

  if (!JENIS_KEPEGAWAIAN.includes(jenisValue as JenisKepegawaian)) {
    throw new Error('Jenis kepegawaian tidak valid.');
  }
  if (!pangkat || !golongan || golongan.length > 10) {
    throw new Error('Pangkat dan golongan wajib diisi; golongan maksimal 10 karakter.');
  }

  const existing = await db.select({ id: masterPangkatGolongan.id })
    .from(masterPangkatGolongan)
    .where(ilike(masterPangkatGolongan.golongan, golongan))
    .limit(1);
  if (existing.length > 0) {
    throw new Error('Golongan tersebut sudah terdaftar di master.');
  }

  const jenisKepegawaian = jenisValue as JenisKepegawaian;
  for (let attempt = 0; attempt < 5; attempt++) {
    const [typeSequences, allSequences] = await Promise.all([
      db.select({ value: masterPangkatGolongan.urutanJenjang })
        .from(masterPangkatGolongan)
        .where(eq(masterPangkatGolongan.jenisKepegawaian, jenisKepegawaian)),
      db.select({ value: masterPangkatGolongan.urutanJenjang })
        .from(masterPangkatGolongan),
    ]);
    const nextSequence = jenisKepegawaian === 'PNS'
      ? Math.max(0, ...typeSequences.map(row => row.value)) + 1
      : Math.max(0, ...allSequences.map(row => row.value)) + 1;
    const usedSequences = new Set(allSequences.map(row => row.value));
    let urutanJenjang = nextSequence;
    while (usedSequences.has(urutanJenjang)) urutanJenjang++;

    const [inserted] = await db.insert(masterPangkatGolongan)
      .values({
        jenisKepegawaian,
        pangkat,
        golongan,
        angkaKreditMinimal,
        urutanJenjang,
      })
      .onConflictDoNothing()
      .returning({ id: masterPangkatGolongan.id });

    if (inserted) {
      revalidatePath('/admin/manajemen-kinerja/master-pangkat-golongan');
      revalidatePath('/admin/pegawai');
      return;
    }

    const [duplicateGolongan] = await db.select({ id: masterPangkatGolongan.id })
      .from(masterPangkatGolongan)
      .where(ilike(masterPangkatGolongan.golongan, golongan))
      .limit(1);
    if (duplicateGolongan) {
      throw new Error('Golongan tersebut sudah terdaftar di master.');
    }
  }

  throw new Error('Master gagal disimpan karena urutan jenjang berbenturan. Coba simpan kembali.');
}

export async function perbaruiAturanAngkaKredit(formData: FormData) {
  const id = String(formData.get('id') || '');
  const angkaKreditMinimal = parseAngkaKredit(formData.get('angkaKreditMinimal'), true);
  if (!id || !angkaKreditMinimal) {
    throw new Error('ID master dan angka kredit minimal wajib diisi.');
  }

  const [updated] = await db.update(masterPangkatGolongan)
    .set({ angkaKreditMinimal })
    .where(eq(masterPangkatGolongan.id, id))
    .returning({ id: masterPangkatGolongan.id });

  if (!updated) {
    throw new Error('Data master pangkat/golongan tidak ditemukan.');
  }

  revalidatePath('/admin/manajemen-kinerja/master-pangkat-golongan');
  revalidatePath('/admin/manajemen-kinerja');
}

export async function hapusMasterPangkatGolongan(id: string) {
  if (!id) {
    throw new Error('ID master pangkat/golongan tidak valid.');
  }

  const [master] = await db.select({
    id: masterPangkatGolongan.id,
    golongan: masterPangkatGolongan.golongan,
  })
    .from(masterPangkatGolongan)
    .where(eq(masterPangkatGolongan.id, id))
    .limit(1);

  if (!master) {
    throw new Error('Master pangkat/golongan tidak ditemukan.');
  }

  const [pegawaiTerkait, riwayatTerkait] = await Promise.all([
    db.select({ id: pegawai.id })
      .from(pegawai)
      .where(eq(pegawai.idGolongan, id))
      .limit(1),
    db.select({ id: riwayatAngkaKredit.id })
      .from(riwayatAngkaKredit)
      .where(eq(riwayatAngkaKredit.idMasterPangkatGolongan, id))
      .limit(1),
  ]);

  if (pegawaiTerkait.length > 0 || riwayatTerkait.length > 0) {
    throw new Error(
      `Golongan ${master.golongan} tidak dapat dihapus karena masih dipakai oleh data pegawai atau riwayat AK.`,
    );
  }

  const [deleted] = await db.delete(masterPangkatGolongan)
    .where(eq(masterPangkatGolongan.id, id))
    .returning({ id: masterPangkatGolongan.id });

  if (!deleted) {
    throw new Error('Master pangkat/golongan gagal dihapus.');
  }

  revalidatePath('/admin/manajemen-kinerja/master-pangkat-golongan');
  revalidatePath('/admin/manajemen-kinerja');
  revalidatePath('/admin/pegawai');
}
