import { db } from '@/lib/db';
import { tukinBulanan, pegawai, masterJabatan } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Award, Calendar, User } from 'lucide-react';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default async function ManajemenKinerjaPage() {
  // Ambil semua data kinerja yang sudah diinput
  const listKinerja = await db
    .select({
      id: tukinBulanan.id,
      bulan: tukinBulanan.bulan,
      tahun: tukinBulanan.tahun,
      hasilKerja: tukinBulanan.hasilKerja,
      perilakuKerja: tukinBulanan.perilakuKerja,
      capaianKinerja: tukinBulanan.capaianKinerja,
      persentaseKinerja: tukinBulanan.persentaseKinerja,
      nominalKinerja: tukinBulanan.nominalKinerja,
      namaPegawai: pegawai.namaLengkap,
      nip: pegawai.nip,
      namaJabatan: masterJabatan.namaJabatan,
    })
    .from(tukinBulanan)
    .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
    .leftJoin(masterJabatan, eq(tukinBulanan.idMasterJabatan, masterJabatan.id))
    .orderBy(desc(tukinBulanan.tahun), desc(tukinBulanan.bulan));

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Penilaian Kinerja</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data Hasil Kerja dan Perilaku Kerja pegawai secara independen</p>
        </div>
        <Link 
          href="/admin/manajemen-kinerja/input" 
          className="flex items-center gap-2 bg-[#1a4b8c] hover:bg-[#123666] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Input Penilaian Baru
        </Link>
      </div>

      {/* TABEL DATA KINERJA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Periode</th>
                <th className="py-4 px-6">Pegawai & Jabatan</th>
                <th className="py-4 px-6">Hasil Kerja</th>
                <th className="py-4 px-6">Perilaku Kerja</th>
                <th className="py-4 px-6">Predikat Capaian</th>
                <th className="py-4 px-6 text-right">Nominal Kinerja (70%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listKinerja.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    Belum ada data penilaian kinerja yang tersimpan.
                  </td>
                </tr>
              ) : (
                listKinerja.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-bold text-slate-700">
                      {item.bulan} / {item.tahun}
                    </td>
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-800">{item.namaPegawai}</p>
                      <p className="text-xs text-slate-500">NIP: {item.nip} • {item.namaJabatan || '-'}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-600">{item.hasilKerja || '-'}</td>
                    <td className="py-4 px-6 text-slate-600">{item.perilakuKerja || '-'}</td>
                    <td className="py-4 px-6">
                      <span className="bg-blue-50 text-[#1a4b8c] border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {item.capaianKinerja} ({Number(item.persentaseKinerja) * 100}%)
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold text-emerald-600 text-right">
                      {formatRupiah(Number(item.nominalKinerja))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}