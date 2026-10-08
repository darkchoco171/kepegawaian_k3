import { db } from '@/lib/db';
import { pegawai } from '@/db/schema';
import { simpanMasterKinerja } from '../actions';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function InputMasterKinerjaPage() {
  const allPegawai = await db.select({
    id: pegawai.id,
    namaLengkap: pegawai.namaLengkap,
    nip: pegawai.nip,
  }).from(pegawai);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/manajemen-kinerja" className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Form Input Penilaian Kinerja</h2>
          <p className="text-sm text-slate-500">Masukkan penilaian hasil dan perilaku kerja pegawai secara berkala</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <form action={simpanMasterKinerja} className="space-y-5">
          {/* Pilih Pegawai */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pegawai</label>
            <select name="idPegawai" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
              <option value="">-- Pilih Pegawai --</option>
              {allPegawai.map((p) => (
                <option key={p.id} value={p.id}>{p.namaLengkap} (NIP: {p.nip})</option>
              ))}
            </select>
          </div>

          {/* Periode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Bulan</label>
              <select name="bulan" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>Bulan {i + 1}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Tahun</label>
              <input type="number" name="tahun" defaultValue={new Date().getFullYear()} required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50" />
            </div>
          </div>

          {/* Hasil Kerja */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Hasil Kerja</label>
            <select name="hasilKerja" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
              <option value="">-- Pilih Penilaian Hasil Kerja --</option>
              <option value="Di Atas Ekspektasi">Di Atas Ekspektasi</option>
              <option value="Sesuai Ekspektasi">Sesuai Ekspektasi</option>
              <option value="Di Bawah Ekspektasi">Di Bawah Ekspektasi</option>
            </select>
          </div>

          {/* Perilaku Kerja */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Perilaku Kerja</label>
            <select name="perilakuKerja" required className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a4b8c] outline-none bg-slate-50">
              <option value="">-- Pilih Penilaian Perilaku Kerja --</option>
              <option value="Di Atas Ekspektasi">Di Atas Ekspektasi</option>
              <option value="Sesuai Ekspektasi">Sesuai Ekspektasi</option>
              <option value="Di Bawah Ekspektasi">Di Bawah Ekspektasi</option>
            </select>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3">
            <Link href="/admin/manajemen-kinerja" className="px-5 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-semibold text-sm hover:bg-slate-50 transition">
              Batal
            </Link>
            <button type="submit" className="px-6 py-2.5 bg-[#1a4b8c] hover:bg-[#123666] text-white rounded-xl font-semibold text-sm transition shadow-sm">
              Simpan Penilaian Kinerja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}