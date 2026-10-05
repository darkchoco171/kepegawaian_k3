import React from 'react';
import { Download, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { presensiHarian, pegawai } from '@/db/schema';
import { count, eq, ilike, and, gte, lte, desc } from 'drizzle-orm';
import ModalImportPresensi from '@/components/ui/modal-import-presensi';
import PresensiToolbar from '@/components/ui/presensi-toolbar';
import Link from 'next/link';

export default async function PresensiPage(
  props: { searchParams: Promise<{ page?: string; query?: string; bulan?: string }> }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || '';
  const limit = 10;
  const offset = (page - 1) * limit;

  // --- LOGIKA FILTER BULAN ---
  const dateNow = new Date();
  const yyyyNow = dateNow.getFullYear();
  const mmNow = String(dateNow.getMonth() + 1).padStart(2, '0');
  const defaultBulan = `${yyyyNow}-${mmNow}`;
  
  const bulanQuery = searchParams.bulan || defaultBulan;
  const [tahun, bulan] = bulanQuery.split('-');
  
  // Cari tanggal 1 dan tanggal terakhir di bulan yang dipilih
  const startDate = `${tahun}-${bulan}-01`;
  const lastDay = new Date(Number(tahun), Number(bulan), 0).getDate();
  const endDate = `${tahun}-${bulan}-${lastDay}`;

  // --- SUSUN KONDISI QUERY ---
  const conditions = [];
  // Filter supaya tgl >= tanggal 1 DAN tgl <= tanggal terakhir
  conditions.push(gte(presensiHarian.tgl, startDate));
  conditions.push(lte(presensiHarian.tgl, endDate));
  
  if (query) conditions.push(ilike(pegawai.namaLengkap, `%${query}%`));
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // --- TARIK DATA (PAGINATION) ---
  const dataPresensi = await db.select({
      id: presensiHarian.id,
      tgl: presensiHarian.tgl,
      sistemKerja: presensiHarian.sistemKerja,
      cekIn: presensiHarian.cekIn,
      cekOut: presensiHarian.cekOut,
      statusAnomali: presensiHarian.statusAnomali,
      pegawai: {
        namaLengkap: pegawai.namaLengkap,
        nip: pegawai.nip
      }
    })
    .from(presensiHarian)
    .leftJoin(pegawai, eq(presensiHarian.idPegawai, pegawai.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(presensiHarian.tgl), desc(presensiHarian.cekIn));

  // --- HITUNG TOTAL DATA & STATISTIK ---
  const totalRes = await db.select({ value: count() })
    .from(presensiHarian)
    .leftJoin(pegawai, eq(presensiHarian.idPegawai, pegawai.id))
    .where(whereClause);
  const totalData = totalRes[0].value;
  const totalPages = Math.ceil(totalData / limit) || 1;

  const statsRes = await db.select({ sistemKerja: presensiHarian.sistemKerja, jumlah: count() })
    .from(presensiHarian)
    .leftJoin(pegawai, eq(presensiHarian.idPegawai, pegawai.id))
    .where(whereClause)
    .groupBy(presensiHarian.sistemKerja);

  let statHadir = 0, statCuti = 0, statAlpa = 0;
  statsRes.forEach(row => {
    if (row.sistemKerja === 'WFO' || row.sistemKerja === 'WFH') statHadir += row.jumlah;
    if (row.sistemKerja === 'Cuti') statCuti += row.jumlah;
    if (row.sistemKerja === 'Alpa') statAlpa += row.jumlah;
  });

  // Helper untuk Tombol Next/Prev URL
  const createPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (bulanQuery) params.set('bulan', bulanQuery);
    params.set('page', targetPage.toString());
    return `/admin/presensi?${params.toString()}`;
  };

  const daftarPegawai = await db.query.pegawai.findMany({
    orderBy: (pegawai, { asc }) => [asc(pegawai.namaLengkap)],
  });

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Rekap Presensi Harian</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor kehadiran harian pegawai Biro Kelembagaan K3</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
            <Download className="w-4 h-4" />
            Export Excel
          </button>
          <ModalImportPresensi daftarPegawai={daftarPegawai} />
        </div>
      </div>

      {/* STATS KECIL PRESENSI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Hadir (WFO/WFH)</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{statHadir}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Cuti</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{statCuti}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alpa</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{statAlpa}</h3>
          </div>
        </div>
      </div>

      {/* TABLE & TOOLBAR SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <PresensiToolbar />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Pegawai</th>
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6">Sistem Kerja</th>
                <th className="py-4 px-6">Cek In</th>
                <th className="py-4 px-6">Cek Out</th>
                <th className="py-4 px-6">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataPresensi.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                    Belum ada data presensi pada bulan ini.
                  </td>
                </tr>
              ) : (
                dataPresensi.map((item) => {
                  const statusWarna = 
                    item.sistemKerja === 'WFO' || item.sistemKerja === 'WFH' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    item.sistemKerja === 'Alpa' ? 'bg-red-50 text-red-600 border-red-200' :
                    item.sistemKerja === 'Cuti' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                    'bg-slate-50 text-slate-600 border-slate-200';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-6">
                        <p className="font-bold text-slate-800">{item.pegawai?.namaLengkap || 'Pegawai Dihapus'}</p>
                        <p className="text-[10px] text-slate-500">{item.pegawai?.nip || '-'}</p>
                      </td>
                      <td className="py-3 px-6 text-slate-600">{item.tgl}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${statusWarna}`}>
                          {item.sistemKerja}
                        </span>
                      </td>
                      <td className="py-3 px-6 font-mono text-slate-700">{item.cekIn || '-'}</td>
                      <td className="py-3 px-6 font-mono text-slate-700">{item.cekOut || '-'}</td>
                      <td className="py-3 px-6 text-slate-500 max-w-[150px] truncate" title={item.statusAnomali || ''}>
                        {item.statusAnomali || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* PAGINATION */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <p>Menampilkan halaman {page} dari {totalPages} (Total {totalData} data absen)</p>
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