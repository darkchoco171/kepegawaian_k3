import React from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import Link from 'next/link';
import { db } from '@/lib/db';
import { pegawai, pengajuanCuti } from '@/db/schema';
import { count, eq, desc } from 'drizzle-orm';
import WidgetUltahSlks from '@/components/ui/widget-ultah-slks';

export default async function AdminDashboardPage() {
  // 1. Tarik Data Total Pegawai
  const semuaPegawai = await db.query.pegawai.findMany();
  const totalPegawai = semuaPegawai.length;
  const totalAktif = semuaPegawai.filter(p => !p.keterangan || p.keterangan === 'Aktif').length;
  const totalCuti = semuaPegawai.filter(p => p.keterangan === 'Cuti').length;

  // 2. Tarik Data Cuti (Menunggu Persetujuan / 'Diajukan')
  const cutiMenungguRes = await db.select({ value: count() })
    .from(pengajuanCuti)
    .where(eq(pengajuanCuti.statusPengajuan, 'Diajukan'));
  const totalCutiMenunggu = cutiMenungguRes[0].value;

  // 3. Tarik 4 Cuti Terbaru untuk tabel "Perlu Tindakan"
  const cutiTerbaru = await db.query.pengajuanCuti.findMany({
    limit: 4,
    orderBy: [desc(pengajuanCuti.createdAt)],
    with: {
      pegawai: true,
    }
  });

  // 4. Tarik 5 Pegawai untuk tabel "Ringkasan"
  const ringkasanPegawai = await db.query.pegawai.findMany({
    limit: 5,
    orderBy: [desc(pegawai.createdAt)],
    with: {
      jabatan: true,
    }
  });

  return (
    <div className="space-y-6">
      {/* HERO SECTION (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Welcome Card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-full bg-[#eef4ff] rounded-l-full opacity-50 pointer-events-none transform translate-x-10 scale-150"></div>
          
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-[#1a4b8c] tracking-widest uppercase mb-2">Panel Administrator • 2026</p>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">Selamat datang, Raffi Wahyu Kusuma</h2>
            <p className="text-sm text-slate-600 max-w-xl mb-8">
              Kelola data pegawai, tunjangan kinerja, dan pengajuan cuti di lingkungan Dit. Kelembagaan Keselamatan dan Kesehatan Kerja.
            </p>
            <div className="flex gap-3">
              <Link href="/admin/pegawai" className="bg-[#1a4b8c] hover:bg-[#123666] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition">
                Kelola Pegawai
              </Link>
              <Link href="/admin/cuti" className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2">
                Tinjau Cuti 
                {totalCutiMenunggu > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{totalCutiMenunggu}</span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* JDIH Card */}
        <a 
          href="https://jdih.kemnaker.go.id/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="bg-[#1a4b8c] hover:bg-[#123666] transition-all duration-300 rounded-2xl p-8 text-white relative flex flex-col justify-center shadow-md cursor-pointer group">
          <ExternalLink className="absolute top-6 right-6 w-5 h-5 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all" />
          <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-4 border border-white/20">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-lg font-bold mb-2">JDIH Kemnaker</h3>
          <p className="text-sm text-blue-100 opacity-90">
            Jaringan Dokumentasi & Informasi Hukum
            (dasar hukum kepegawaian, TUKIN, dan cuti ASN).
          </p>
        </a>
      </div>

      {/* 4 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-36 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Total Pegawai</p>
          <h3 className="text-3xl font-extrabold mt-2 mb-1 text-[#1a4b8c]">{totalPegawai}</h3>
          <p className="text-xs text-slate-500">{totalAktif} aktif - {totalCuti} cuti</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-36 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Pengajuan Cuti</p>
          <h3 className="text-3xl font-extrabold mt-2 mb-1 text-amber-500">{totalCutiMenunggu}</h3>
          <p className="text-xs text-slate-500">Menunggu persetujuan</p>
        </div>
        {/* Note: Total Tukin & Rata-rata hadir sementara di-hardcode sampai fitur hitung Tukin beres */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-36 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Total Tukin</p>
          <h3 className="text-3xl font-extrabold mt-2 mb-1 text-emerald-600">Rp 0</h3>
          <p className="text-xs text-slate-500">Periode Bulan Ini</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between h-36 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">Rata-Rata Hadir</p>
          <h3 className="text-3xl font-extrabold mt-2 mb-1 text-[#1a4b8c]">0%</h3>
          <p className="text-xs text-slate-500">Seluruh pegawai aktif</p>
        </div>
      </div>

      {/* Panggil Widget-nya di sini */}
      <WidgetUltahSlks />

      {/* CUTI TERBARU ROW */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex justify-between items-end mb-6">
          <div>
            <p className="text-[10px] font-bold text-[#1a4b8c] tracking-widest uppercase mb-1">Perlu Tindakan</p>
            <h3 className="text-lg font-bold text-slate-800">Pengajuan Cuti Terbaru</h3>
          </div>
          <Link href="/admin/cuti" className="text-sm font-semibold text-[#1a4b8c] hover:underline">Lihat semua →</Link>
        </div>
        <div className="space-y-4">
          {cutiTerbaru.length === 0 ? (
            <p className="text-sm text-slate-500 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">Belum ada pengajuan cuti baru.</p>
          ) : (
            cutiTerbaru.map((cuti) => (
              <div key={cuti.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0 pb-4 last:pb-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-[#1a4b8c] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                    {cuti.pegawai?.namaLengkap.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{cuti.pegawai?.namaLengkap}</h4>
                    <p className="text-xs text-slate-500">
                      Cuti {cuti.jenisCuti} ({cuti.jumlahHari} hari) - Mulai {cuti.tglMulai}
                    </p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${
                  cuti.statusPengajuan === 'Diajukan' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                  cuti.statusPengajuan === 'Disetujui' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                  'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {cuti.statusPengajuan}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* TABLE PEGAWAI */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-200 flex justify-between items-end">
          <div>
            <p className="text-[10px] font-bold text-[#1a4b8c] tracking-widest uppercase mb-1">Ringkasan</p>
            <h3 className="text-lg font-bold text-slate-800">Pegawai Terbaru</h3>
          </div>
          <Link href="/admin/pegawai" className="text-sm font-semibold text-[#1a4b8c] hover:underline">Kelola →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 bg-slate-50">
                <th className="py-4 px-6">Pegawai</th>
                <th className="py-4 px-6">Sub Bagian</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ringkasanPegawai.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-6 text-slate-500 text-sm">Belum ada data pegawai.</td>
                </tr>
              ) : (
                ringkasanPegawai.map((peg) => {
                  const status = peg.keterangan ? peg.keterangan : 'Aktif';
                  const statCol = status === 'Aktif' 
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                    : 'bg-amber-50 text-amber-600 border-amber-200';

                  return (
                    <tr key={peg.id} className="hover:bg-slate-50 transition cursor-pointer">
                      <td className="py-4 px-6 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#1a4b8c] text-white flex items-center justify-center font-bold text-xs">
                          {peg.namaLengkap.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-xs">{peg.namaLengkap}</p>
                          <p className="text-[10px] text-slate-500">{peg.jabatan?.namaJabatan || peg.nip}</p>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">{peg.jabatanTim || '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statCol}`}>
                          {status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                         <Link href={`/admin/pegawai/${peg.id}`} className="text-[#1a4b8c] hover:underline text-xs font-semibold">
                           Detail
                         </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}