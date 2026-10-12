import { db } from '@/lib/db';
import { pegawai, masterPangkatGolongan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { simpanAngkaKredit } from '../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InputAngkaKreditPage() {
  // Ambil data pegawai beserta pangkat/golongan saat ini buat info di UI
  const allPegawai = await db.select({
    id: pegawai.id,
    namaLengkap: pegawai.namaLengkap,
    nip: pegawai.nip,
    pangkat: masterPangkatGolongan.pangkat,
    golongan: masterPangkatGolongan.golongan
  })
  .from(pegawai)
  .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/manajemen-kinerja?tab=angka-kredit" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Form Input Angka Kredit</h2>
          <p className="text-sm text-slate-500">Masukkan capaian PAK tahunan pegawai untuk syarat kenaikan pangkat</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {/* panggil Server Action di sini */}
        <form action={simpanAngkaKredit} className="space-y-5">
          
          {/* Pilih Pegawai */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pegawai</label>
            <select name="idPegawai" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50">
              <option value="">-- Pilih Pegawai --</option>
              {allPegawai.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.namaLengkap} (NIP: {p.nip}) {p.golongan ? `- ${p.golongan}` : ''}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-1">Target Angka Kredit (AK) akan otomatis dihitung oleh sistem berdasarkan Golongan/Pangkat pegawai saat ini.</p>
          </div>

          {/* Tahun Penilaian */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tahun Penilaian</label>
            <input 
              type="number" 
              name="tahunPenilaian" 
              defaultValue={new Date().getFullYear()} 
              required 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" 
            />
          </div>

          {/* Nilai PAK yang didapat */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Nilai Capaian Angka Kredit (PAK)</label>
            <input 
              type="number" 
              step="0.01" // Biar bisa input desimal kayak 12.50
              name="nilaiPak" 
              placeholder="Contoh: 15.50"
              required 
              className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none bg-slate-50" 
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Link href="/admin/manajemen-kinerja?tab=angka-kredit" className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold text-sm transition shadow-sm">
              Simpan Angka Kredit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}