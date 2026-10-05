import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { db } from '@/lib/db';
import { pegawai } from '@/db/schema';
import { count, eq, ilike, and, or } from 'drizzle-orm';
import PegawaiToolbar from '@/components/ui/pegawai-toolbar';
import ModalEditPegawai from '@/components/ui/modal-edit-pegawai';
import FormHapusPegawai from '@/components/ui/form-hapus-pegawai';

export default async function DataPegawaiPage(
  props: { searchParams: Promise<{ page?: string; query?: string; tim?: string }> }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || '';
  const tim = searchParams.tim || '';
  const limit = 10;
  const offset = (page - 1) * limit;

  // 1. Susun Kondisi Filter & Search untuk Drizzle ORM
  const conditions = [];

  if (query) {
    conditions.push(
      or(
        ilike(pegawai.namaLengkap, `%${query}%`),
        ilike(pegawai.nip, `%${query}%`)
      )
    );
  }

  if (tim) {
    conditions.push(eq(pegawai.jabatanTim, tim));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 2. Tarik Data Pegawai sesuai Filter & Pagination
  const dataPegawai = await db.query.pegawai.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: (pegawai, { asc }) => [asc(pegawai.namaLengkap)],
  });

  // 3. Hitung Total Data untuk Pagination yang akurat
  const totalRes = await db.select({ value: count() }).from(pegawai).where(whereClause);
  const totalPegawai = totalRes[0].value;
  const totalPages = Math.ceil(totalPegawai / limit) || 1;

  // Helper buat bikin URL pagination yang nyimpen state search & filter
  const createPageUrl = (targetPage: number) => {
    const params = new URLSearchParams();
    if (query) params.set('query', query);
    if (tim) params.set('tim', tim);
    params.set('page', targetPage.toString());
    return `/admin/pegawai?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      {/* TOOLBAR (Search, Filter, Tombol Tambah) */}
      <PegawaiToolbar />

      {/* TABLE SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Nama & NIP</th>
                <th className="py-4 px-6">Tim (Sub Bagian)</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">L/P</th>
                <th className="py-4 px-6">Kontak</th>
                <th className="py-4 px-6 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dataPegawai.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-500 italic">
                    {query || tim ? 'Tidak ada pegawai yang sesuai dengan pencarian / filter.' : 'Belum ada data pegawai.'}
                  </td>
                </tr>
              ) : (
                dataPegawai.map((peg) => {
                  const status = peg.keterangan ? peg.keterangan : 'Aktif';
                  const statusColor = status === 'Aktif' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-amber-50 text-amber-600 border-amber-200';

                  return (
                    <tr key={peg.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-6">
                        <p className="font-bold text-slate-800">{peg.namaLengkap}</p>
                        <p className="text-[10px] text-slate-500">{peg.nip}</p>
                      </td>
                      <td className="py-3 px-6 text-slate-600 font-medium max-w-xs truncate">{peg.jabatanTim || '-'}</td>
                      <td className="py-3 px-6">
                        <span className={`inline-block max-w-[200px] truncate px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-600">{peg.jenisKelamin || '-'}</td>
                      <td className="py-3 px-6 text-slate-600">{peg.kontak || '-'}</td>
                      <td className="py-3 px-6 text-center space-x-2 whitespace-nowrap">
                        <Link 
                          href={`/admin/pegawai/${peg.id}`}
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-[#1a4b8c] hover:text-white text-slate-600 px-3 py-1.5 rounded text-xs font-semibold transition"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </Link>
                        <ModalEditPegawai pegawai={peg} />
                        <FormHapusPegawai id={peg.id} nama={peg.namaLengkap} />
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
          <p>Menampilkan halaman {page} dari {totalPages} (Total {totalPegawai} pegawai)</p>
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