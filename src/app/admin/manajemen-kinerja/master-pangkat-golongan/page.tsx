import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { masterJabatan, masterKelasJabatan, masterPangkatGolongan } from '@/db/schema';
import { asc, eq } from 'drizzle-orm';
import KelolaMasterPangkatGolongan from '@/components/ui/kelola-master-pangkat-golongan';

export default async function MasterPangkatGolonganPage() {
  const [data, jabatanData, kelasJabatanOptions] = await Promise.all([
    db.select({
      id: masterPangkatGolongan.id,
      jenisKepegawaian: masterPangkatGolongan.jenisKepegawaian,
      pangkat: masterPangkatGolongan.pangkat,
      golongan: masterPangkatGolongan.golongan,
      angkaKreditMinimal: masterPangkatGolongan.angkaKreditMinimal,
      urutanJenjang: masterPangkatGolongan.urutanJenjang,
    })
      .from(masterPangkatGolongan)
      .orderBy(asc(masterPangkatGolongan.urutanJenjang)),
    db.select({
      id: masterJabatan.id,
      namaJabatan: masterJabatan.namaJabatan,
      jenisJabatan: masterJabatan.jenisJabatan,
      kelasJabatan: masterKelasJabatan.kelasJabatan,
    })
      .from(masterJabatan)
      .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
      .orderBy(asc(masterJabatan.namaJabatan)),
    db.select({
      id: masterKelasJabatan.id,
      kelasJabatan: masterKelasJabatan.kelasJabatan,
      baseTukin: masterKelasJabatan.baseTukin,
    })
      .from(masterKelasJabatan)
      .orderBy(asc(masterKelasJabatan.kelasJabatan)),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Master Pangkat/Golongan & Aturan AK</h2>
          <p className="mt-1 text-sm text-slate-500">
            Kelola referensi pangkat/golongan yang digunakan pada data pegawai dan target Angka Kredit.
          </p>
        </div>
        <Link
          href="/admin/manajemen-kinerja?tab=angka-kredit"
          className="inline-flex items-center gap-2 self-start rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:self-auto"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Manajemen Kinerja
        </Link>
      </div>

      <KelolaMasterPangkatGolongan
        data={data}
        jabatanData={jabatanData}
        kelasJabatanOptions={kelasJabatanOptions}
      />
    </div>
  );
}
