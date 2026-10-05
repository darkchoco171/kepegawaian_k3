import React from 'react';
import { CalendarDays, Plus, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { db } from '@/lib/db';
import { pengajuanCuti, pegawai } from '@/db/schema';
import { count, eq, ilike, and, desc } from 'drizzle-orm';
import ModalTambahCuti from '@/components/ui/modal-tambah-cuti';
import CutiToolbar from '@/components/ui/cuti-toolbar';
import Link from 'next/link';

export default async function CutiPage(
  props: { searchParams: Promise<{ page?: string; query?: string; jenis?: string }> }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || '';
  const jenis = searchParams.jenis || '';
  const limit = 10;
  const offset = (page - 1) * limit;
  // Tarik daftar pegawai untuk dropdown di modal
  const daftarPegawai = await db.query.pegawai.findMany({
    orderBy: (pegawai, { asc }) => [asc(pegawai.namaLengkap)],
  });

  // --- SUSUN KONDISI QUERY ---
  const conditions = [];
  if (jenis) conditions.push(eq(pengajuanCuti.jenisCuti, jenis as any));
  if (query) conditions.push(ilike(pegawai.namaLengkap, `%${query}%`));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // --- TARIK DATA (PAGINATION) ---
  const dataCuti = await db.select({
      id: pengajuanCuti.id,
      jenisCuti: pengajuanCuti.jenisCuti,
      tglMulai: pengajuanCuti.tglMulai,
      tglSelesai: pengajuanCuti.tglSelesai,
      jumlahHari: pengajuanCuti.jumlahHari,
      alasan: pengajuanCuti.alasan,
      statusPengajuan: pengajuanCuti.statusPengajuan,
      pegawai: {
        namaLengkap: pegawai.namaLengkap,
        nip: pegawai.nip
      }
    })
    .from(pengajuanCuti)
    .leftJoin(pegawai, eq(pengajuanCuti.idPegawai, pegawai.id))
    .where(whereClause)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(pengajuanCuti.createdAt));

  // --- HITUNG TOTAL DATA & STATISTIK ---
  const totalRes = await db.select({ value: count() })
    .from(pengajuanCuti)
    .leftJoin(pegawai, eq(pengajuanCuti.idPegawai, pegawai.id))
    .where(whereClause);
  const totalData = totalRes[0].value;
  const totalPages = Math.ceil(totalData / limit) || 1;

  // Hitung statistik status pengajuan
  const statsDisetujui = await db.select({ value: count() }).from(pengajuanCuti).where(eq(pengajuanCuti.statusPengajuan, 'Disetujui'));
  const statsDiajukan = await db.select({ value: count() }).from(pengajuanCuti).where(eq(pengajuanCuti.statusPengajuan, 'Diajukan'));
  const statsDitolak = await db.select({ value: count() }).from(pengajuanCuti).where(eq(pengajuanCuti.statusPengajuan, 'Ditolak'));

  // Helper Pagination URL
  const createPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (jenis) params.set('jenis', jenis);
    params.set('page', targetPage.toString());
    return `/admin/cuti?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Pengajuan Cuti</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola dan setujui permohonan cuti pegawai Biro Kelembagaan K3</p>
        </div>
        <div className="flex items-center gap-3">
          <ModalTambahCuti daftarPegawai={daftarPegawai} />
        </div>
      </div>

      {/* STATS KECIL CUTI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disetujui</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{statsDisetujui[0].value}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Menunggu Persetujuan</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{statsDiajukan[0].value}</h3>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ditolak</p>
            <h3 className="text-2xl font-extrabold text-slate-800">{statsDitolak[0].value}</h3>
          </div>
        </div>
      </div>

      {/* TABLE & TOOLBAR SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <CutiToolbar />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Pegawai</th>
                <th className="py-4 px-6">Jenis Cuti</th>
                <th className="py-4 px-6">Tanggal Mulai - Selesai</th>
                <th className="py-4 px-6">Durasi</th>
                <th className="py-4 px-6">Alasan</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataCuti.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                    Belum ada data pengajuan cuti yang tercatat.
                  </td>
                </tr>
              ) : (
                dataCuti.map((item) => {
                  const statusColor = 
                    item.statusPengajuan === 'Disetujui' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                    item.statusPengajuan === 'Diajukan' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                    'bg-red-50 text-red-600 border-red-200';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-6">
                        <p className="font-bold text-slate-800">{item.pegawai?.namaLengkap || 'Pegawai Dihapus'}</p>
                        <p className="text-[10px] text-slate-500">{item.pegawai?.nip || '-'}</p>
                      </td>
                      <td className="py-3 px-6 font-medium text-slate-700">{item.jenisCuti}</td>
                      <td className="py-3 px-6 text-slate-600 text-xs">{item.tglMulai} s/d {item.tglSelesai}</td>
                      <td className="py-3 px-6 font-bold text-slate-800">{item.jumlahHari} Hari</td>
                      <td className="py-3 px-6 text-slate-500 max-w-[180px] truncate" title={item.alasan || ''}>
                        {item.alasan || '-'}
                      </td>
                      <td className="py-3 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${statusColor}`}>
                          {item.statusPengajuan}
                        </span>
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
          <p>Menampilkan halaman {page} dari {totalPages} (Total {totalData} pengajuan)</p>
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