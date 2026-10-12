import { db } from '@/lib/db';
import { pegawai, tukinBulanan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { updateMasterKinerja } from '../../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function EditMasterKinerjaPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const idKinerja = params.id;

  const dataKinerja = await db.query.tukinBulanan.findFirst({
    where: eq(tukinBulanan.id, idKinerja),
  });

  if (!dataKinerja) return notFound();

  const allPegawai = await db.select({ id: pegawai.id, namaLengkap: pegawai.namaLengkap, nip: pegawai.nip }).from(pegawai);
  
  // Bind ID ke Server Action
  const updateDataKinerja = updateMasterKinerja.bind(null, idKinerja);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/manajemen-kinerja?tab=bulanan" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Edit Penilaian Kinerja</h2>
          <p className="text-sm text-slate-500">Ubah data penilaian kinerja yang sudah tersimpan</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form action={updateDataKinerja} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pegawai</label>
            <select name="idPegawai" defaultValue={dataKinerja.idPegawai} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
              {allPegawai.map((p) => (
                <option key={p.id} value={p.id}>{p.namaLengkap} (NIP: {p.nip})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Bulan</label>
              <select name="bulan" defaultValue={dataKinerja.bulan} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tahun</label>
              <input type="number" name="tahun" defaultValue={dataKinerja.tahun} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Hasil Kerja</label>
            <select name="hasilKerja" defaultValue={dataKinerja.hasilKerja || ''} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
              <option value="Di Atas Ekspektasi">Di Atas Ekspektasi</option>
              <option value="Sesuai Ekspektasi">Sesuai Ekspektasi</option>
              <option value="Di Bawah Ekspektasi">Di Bawah Ekspektasi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Perilaku Kerja</label>
            <select name="perilakuKerja" defaultValue={dataKinerja.perilakuKerja || ''} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
              <option value="Di Atas Ekspektasi">Di Atas Ekspektasi</option>
              <option value="Sesuai Ekspektasi">Sesuai Ekspektasi</option>
              <option value="Di Bawah Ekspektasi">Di Bawah Ekspektasi</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Link href="/admin/manajemen-kinerja?tab=bulanan" className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-[#1a4b8c] hover:bg-[#123666] text-white rounded-xl font-semibold text-sm transition shadow-sm">
              Update Kinerja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}