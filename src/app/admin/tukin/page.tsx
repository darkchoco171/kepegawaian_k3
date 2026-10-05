import React from 'react';
import { Download, Calculator, Wallet, Users, ArrowUpRight } from 'lucide-react';
import { db } from '@/lib/db';
import { tukinBulanan, pegawai } from '@/db/schema';
import { count, eq, ilike, and, desc } from 'drizzle-orm';
import TukinToolbar from '@/components/ui/tukin-toolbar';
import Link from 'next/link';

// Helper buat ubah angka jadi format Rupiah (Rp)
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default async function TukinPage(
  props: { searchParams: Promise<{ page?: string; query?: string; bulan?: string }> }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || '';
  const limit = 10;
  const offset = (page - 1) * limit;

  // --- LOGIKA FILTER BULAN & TAHUN ---
  const dateNow = new Date();
  const defaultBulan = `${dateNow.getFullYear()}-${String(dateNow.getMonth() + 1).padStart(2, '0')}`;
  const bulanQuery = searchParams.bulan || defaultBulan;
  
  // Pecah "2026-09" jadi tahun = 2026, bulan = 9
  const [tahunStr, bulanStr] = bulanQuery.split('-');
  const filterTahun = Number(tahunStr);
  const filterBulan = Number(bulanStr);

  // --- SUSUN KONDISI QUERY ---
  const conditions = [
    eq(tukinBulanan.bulan, filterBulan),
    eq(tukinBulanan.tahun, filterTahun)
  ];
  
  if (query) conditions.push(ilike(pegawai.namaLengkap, `%${query}%`));
  const whereClause = and(...conditions);

  // --- TARIK DATA (PAGINATION) ---
  const dataTukin = await db.select({
      id: tukinBulanan.id,
      capaianKinerja: tukinBulanan.capaianKinerja,
      persentaseKinerja: tukinBulanan.persentaseKinerja,
      nominalDasar: tukinBulanan.nominalDasar,
      dibayarkan: tukinBulanan.dibayarkan,
      pegawai: {
        namaLengkap: pegawai.namaLengkap,
        nip: pegawai.nip
      }
    })
    .from(tukinBulanan)
    .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(tukinBulanan.dibayarkan));

  // --- HITUNG TOTAL DATA & STATISTIK ---
  const totalRes = await db.select({ value: count() })
    .from(tukinBulanan)
    .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
    .where(whereClause);
  const totalData = totalRes[0].value;
  const totalPages = Math.ceil(totalData / limit) || 1;

  // Tarik semua data bulan ini (tanpa limit) buat ngitung total anggaran Tukin
  const allTukinBulanIni = await db.select({ dibayarkan: tukinBulanan.dibayarkan })
    .from(tukinBulanan)
    .where(and(eq(tukinBulanan.bulan, filterBulan), eq(tukinBulanan.tahun, filterTahun)));
    
  const totalAnggaran = allTukinBulanIni.reduce((acc, curr) => acc + Number(curr.dibayarkan || 0), 0);

  // Helper untuk Tombol Next/Prev URL
  const createPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (bulanQuery) params.set('bulan', bulanQuery);
    params.set('page', targetPage.toString());
    return `/admin/tukin?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tunjangan Kinerja Bulanan</h2>
          <p className="text-sm text-slate-500 mt-1">Rekap dan kalkulasi Tukin pegawai berdasarkan absensi dan kinerja</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          
          {/* Tombol Generate Tukin (Bisa dibuat action/modal ke depannya) */}
          <button className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
            <Calculator className="w-4 h-4" />
            Kalkulasi Tukin
          </button>
        </div>
      </div>

      {/* STATS KECIL TUKIN */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1a4b8c] flex items-center justify-center font-bold">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Anggaran Tukin</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{formatRupiah(totalAnggaran)}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penerima Tukin</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{allTukinBulanIni.length} Pegawai</h3>
          </div>
        </div>
      </div>

      {/* TABLE & TOOLBAR SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <TukinToolbar />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Pegawai</th>
                <th className="py-4 px-6">Predikat Kinerja</th>
                <th className="py-4 px-6">% Kinerja</th>
                <th className="py-4 px-6">Tukin Dasar</th>
                <th className="py-4 px-6 text-right">Nominal Dibayarkan</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataTukin.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                    Belum ada data Tukin untuk bulan ini. Silakan lakukan Kalkulasi Tukin.
                  </td>
                </tr>
              ) : (
                dataTukin.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-6">
                      <p className="font-bold text-slate-800">{item.pegawai?.namaLengkap || 'Pegawai Dihapus'}</p>
                      <p className="text-[10px] text-slate-500">{item.pegawai?.nip || '-'}</p>
                    </td>
                    <td className="py-3 px-6">
                      <span className="bg-blue-50 text-[#1a4b8c] border border-blue-200 px-2.5 py-0.5 rounded text-[10px] font-bold">
                        {item.capaianKinerja}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-bold text-slate-700">{Number(item.persentaseKinerja) * 100}%</td>
                    <td className="py-3 px-6 font-mono text-slate-500">{formatRupiah(Number(item.nominalDasar))}</td>
                    <td className="py-3 px-6 font-mono font-bold text-emerald-600 text-right">
                      {formatRupiah(Number(item.dibayarkan))}
                    </td>
                    <td className="py-3 px-6 text-center">
                      <Link 
                        href={`/admin/tukin/${item.id}`}
                        className="inline-flex items-center gap-1 text-[#1a4b8c] hover:text-[#123666] px-3 py-1.5 rounded text-xs font-semibold transition bg-slate-50 hover:bg-slate-100 border border-slate-200">
                        Rincian <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <p>Menampilkan halaman {page} dari {totalPages}</p>
          <div className="flex gap-1">
            {page > 1 ? (
              <Link href={createPageUrl(page - 1)} className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 font-semibold">Sebelumnya</Link>
            ) : (
              <button disabled className="px-3 py-1 border border-slate-100 text-slate-300 rounded">Sebelumnya</button>
            )}
            
            <span className="px-3 py-1 border border-[#1a4b8c] rounded bg-[#1a4b8c] text-white font-bold">{page}</span>
            
            {page < totalPages ? (
              <Link href={createPageUrl(page + 1)} className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 font-semibold">Selanjutnya</Link>
            ) : (
              <button disabled className="px-3 py-1 border border-slate-100 text-slate-300 rounded">Selanjutnya</button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}