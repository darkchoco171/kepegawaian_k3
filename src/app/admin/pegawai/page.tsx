import React from 'react';
import Link from 'next/link';
import { Eye } from 'lucide-react';
import { db } from '@/lib/db';
import { masterJabatan, masterKelasJabatan, masterPangkatGolongan, pegawai } from '@/db/schema';
import { asc, count, eq, ilike, and, or } from 'drizzle-orm';
import PegawaiToolbar from '@/components/ui/pegawai-toolbar';
import ModalEditPegawai from '@/components/ui/modal-edit-pegawai';
import FormHapusPegawai from '@/components/ui/form-hapus-pegawai';
import Pagination from '@/components/ui/pagination';
import BaganOrganisasi from '@/components/ui/bagan-organisasi';

export default async function DataPegawaiPage(
  props: { searchParams: Promise<{ page?: string; query?: string; tim?: string; view?: string }> }
) {
  const searchParams = await props.searchParams;
  const page = Number(searchParams.page) || 1;
  const query = searchParams.query || '';
  const tim = searchParams.tim || '';
  const view = searchParams.view === 'struktur' ? 'struktur' : 'daftar';
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
    conditions.push(eq(pegawai.namaTimKerja, tim));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // 2. Tarik Data Pegawai sesuai Filter & Pagination
  const dataPegawai = await db.query.pegawai.findMany({
    where: whereClause,
    limit,
    offset,
    orderBy: (pegawai, { asc }) => [asc(pegawai.namaLengkap)],
    with: {
      jabatan: true,
      golongan: true,
      riwayatPendidikan: true,
      riwayatDiklat: true,
    },
  });

  const [kelasJabatanOptions, jabatanOptions, pangkatGolonganOptions] = await Promise.all([
    db.select({
      id: masterKelasJabatan.id,
      kelasJabatan: masterKelasJabatan.kelasJabatan,
      baseTukin: masterKelasJabatan.baseTukin,
    })
      .from(masterKelasJabatan)
      .orderBy(asc(masterKelasJabatan.kelasJabatan)),
    db.select({
      id: masterJabatan.id,
      namaJabatan: masterJabatan.namaJabatan,
    })
      .from(masterJabatan)
      .orderBy(asc(masterJabatan.namaJabatan)),
    db.select({
      id: masterPangkatGolongan.id,
      jenisKepegawaian: masterPangkatGolongan.jenisKepegawaian,
      pangkat: masterPangkatGolongan.pangkat,
      golongan: masterPangkatGolongan.golongan,
    })
      .from(masterPangkatGolongan)
      .orderBy(asc(masterPangkatGolongan.urutanJenjang)),
  ]);

  // 3. Hitung Total Data untuk Pagination yang akurat
  const totalRes = await db.select({ value: count() }).from(pegawai).where(whereClause);
  const totalPegawai = totalRes[0].value;
  const totalPages = Math.ceil(totalPegawai / limit) || 1;

  const dataStruktur = view === 'struktur'
    ? await db.query.pegawai.findMany({
      where: whereClause,
      orderBy: (pegawai, { asc }) => [asc(pegawai.namaLengkap)],
      with: { jabatan: true },
    })
    : [];
  const tabParams = new URLSearchParams();
  if (query) tabParams.set('query', query);
  if (tim) tabParams.set('tim', tim);
  const daftarHref = `/admin/pegawai${tabParams.size ? `?${tabParams.toString()}` : ''}`;
  tabParams.set('view', 'struktur');
  const strukturHref = `/admin/pegawai?${tabParams.toString()}`;

  return (
    <div className="space-y-6">
      {/* TOOLBAR (Search, Filter, Tombol Tambah) */}
      <PegawaiToolbar
        kelasJabatanOptions={kelasJabatanOptions}
        jabatanOptions={jabatanOptions}
        pangkatGolonganOptions={pangkatGolonganOptions}
      />

      <nav aria-label="Tampilan data pegawai" className="flex gap-2 border-b border-slate-200 px-1">
        <Link
          href={daftarHref}
          aria-current={view === 'daftar' ? 'page' : undefined}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            view === 'daftar'
              ? 'border-[#1a4b8c] text-[#1a4b8c]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Daftar Pegawai
        </Link>
        <Link
          href={strukturHref}
          aria-current={view === 'struktur' ? 'page' : undefined}
          className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
            view === 'struktur'
              ? 'border-[#1a4b8c] text-[#1a4b8c]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Struktur Organisasi
        </Link>
      </nav>

      {view === 'struktur' ? <BaganOrganisasi pegawai={dataStruktur} /> : (
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="py-4 px-6">Nama & NIP</th>
                <th className="py-4 px-6">Tim Kerja & Jabatan Tim</th>
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
                      <td className="max-w-xs truncate py-3 px-6">
                        <p className="font-medium text-slate-700">{peg.namaTimKerja || '-'}</p>
                        {peg.jabatanTim && <p className="mt-0.5 text-xs text-slate-500">{peg.jabatanTim}</p>}
                      </td>
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
                        <ModalEditPegawai
                          pegawai={peg}
                          kelasJabatanOptions={kelasJabatanOptions}
                          jabatanOptions={jabatanOptions}
                          pangkatGolonganOptions={pangkatGolonganOptions}
                        />
                        <FormHapusPegawai id={peg.id} nama={peg.namaLengkap} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        <Pagination totalPages={totalPages} currentPage={page} totalData={totalPegawai} totalLabel="pegawai" />
      </div>
      )}
    </div>
  );
}