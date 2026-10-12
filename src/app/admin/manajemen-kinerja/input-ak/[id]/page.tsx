import { db } from '@/lib/db';
import { pegawai, masterPangkatGolongan, riwayatAngkaKredit } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateAngkaKredit } from '../../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function EditAngkaKreditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const idAk = params.id;

  const dataAk = await db.query.riwayatAngkaKredit.findFirst({
    where: eq(riwayatAngkaKredit.id, idAk),
  });

  if (!dataAk) return notFound();

  const allPegawai = await db.select({
    id: pegawai.id, namaLengkap: pegawai.namaLengkap, nip: pegawai.nip,
    pangkat: masterPangkatGolongan.pangkat, golongan: masterPangkatGolongan.golongan
  }).from(pegawai).leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id));

  // Bind ID
  const updateDataAk = updateAngkaKredit.bind(null, idAk);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/manajemen-kinerja?tab=angka-kredit" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Edit Angka Kredit</h2>
          <p className="text-sm text-slate-500">Ubah capaian PAK pegawai</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form action={updateDataAk} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pegawai</label>
            <select name="idPegawai" defaultValue={dataAk.idPegawai} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50">
              {allPegawai.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaLengkap} (NIP: {p.nip}) {p.golongan ? `- ${p.golongan}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tahun Penilaian</label>
            <input type="number" name="tahunPenilaian" defaultValue={dataAk.tahunPenilaian} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nilai Capaian Angka Kredit (PAK)</label>
            <input type="number" step="0.01" name="nilaiPak" defaultValue={Number(dataAk.nilaiPak)} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Link href="/admin/manajemen-kinerja?tab=angka-kredit" className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
              Update Angka Kredit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}