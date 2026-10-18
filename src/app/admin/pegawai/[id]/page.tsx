import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, GraduationCap, Award } from 'lucide-react';
import { db } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';
import { pegawai } from '@/db/schema';
import { getSisaCutiPegawai } from '@/app/admin/cuti/hitung-cuti';
import { pengajuanCuti } from '@/db/schema';
import { notFound } from 'next/navigation';

export default async function DetailPegawaiPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const idPegawai = params.id;

  // Tarik data SUPER LENGKAP beserta semua relasinya
  const data = await db.query.pegawai.findFirst({
    where: eq(pegawai.id, idPegawai),
    with: {
      jabatan: {
        with: {
          kelasJabatan: true, // Ambil grade (kelas jabatan)
        }
      },
      golongan: true,
      riwayatPendidikan: true, // Ambil data pendidikan
      riwayatDiklat: true,     // Ambil data diklat
    }
  });

  if (!data) return notFound();

  const status = data.keterangan ? data.keterangan : 'Aktif';
  // --- AMBIL SISA CUTI & RIWAYAT ---
  const sisaCuti = await getSisaCutiPegawai(data.id);
  const riwayatCuti = await db.query.pengajuanCuti.findMany({
    where: eq(pengajuanCuti.idPegawai, data.id),
    orderBy: [desc(pengajuanCuti.createdAt)],
  });

  const persentaseCuti = (sisaCuti.terpakai / sisaCuti.totalMaks) * 100;
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Tombol Kembali */}
      <Link href="/admin/pegawai" className="inline-flex items-center gap-2 text-sm text-[#1a4b8c] hover:underline font-semibold">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Data Pegawai
      </Link>

      {/* HEADER CARD: Foto & Info Utama */}
      <div className="bg-[#1a4b8c] rounded-2xl p-8 text-white flex items-center gap-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-full bg-white/10 rounded-l-full transform translate-x-10 scale-150 pointer-events-none"></div>
        
        <div className="w-24 h-24 bg-white text-[#1a4b8c] rounded-full flex items-center justify-center text-4xl font-bold shadow-lg z-10">
          {data.namaLengkap.charAt(0)}
        </div>
        <div className="z-10">
          <h2 className="text-3xl font-bold">{data.namaLengkap}</h2>
          <p className="text-blue-100 mt-1">{data.nip}</p>
          <div className="mt-3 inline-flex items-center px-3 py-1 bg-white/20 rounded-full text-xs font-semibold backdrop-blur-sm">
            Status: {status}
          </div>
        </div>
      </div>

      {/* GRID IDENTITAS & KEPEGAWAIAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* KOTAK 1: Identitas Diri */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-[#1a4b8c]" />
            <h3 className="text-lg font-bold text-slate-800">Identitas Diri</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tempat, Tanggal Lahir</p>
              <p className="font-semibold text-slate-800">{data.tempatLahir || '-'}, {data.tglLahir || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</p>
              <p className="font-semibold text-slate-800">{data.jenisKelamin === 'L' ? 'Laki-laki' : data.jenisKelamin === 'P' ? 'Perempuan' : '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Agama</p>
              <p className="font-semibold text-slate-800">{data.agama || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Pernikahan</p>
              <p className="font-semibold text-slate-800">{data.statusPernikahan || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kontak (No. HP)</p>
              <p className="font-semibold text-slate-800">{data.kontak || '-'}</p>
            </div>
          </div>
        </div>

        {/* KOTAK 2: Data Kepegawaian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Briefcase className="w-5 h-5 text-[#1a4b8c]" />
            <h3 className="text-lg font-bold text-slate-800">Data Kepegawaian</h3>
          </div>
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jabatan</p>
              <p className="font-semibold text-slate-800">{data.jabatan?.namaJabatan || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kelas Jabatan (Grade)</p>
              <p className="font-semibold text-[#1a4b8c]">
                {data.jabatan?.kelasJabatan ? `Kelas ${data.jabatan.kelasJabatan.kelasJabatan}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pangkat / Golongan</p>
              <p className="font-semibold text-slate-800">
                {data.golongan ? `${data.golongan.pangkat} (${data.golongan.golongan})` : '-'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tim (Sub Bagian)</p>
              <p className="font-semibold text-slate-800">{data.jabatanTim || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TMT Mulai Kerja</p>
              <p className="font-semibold text-slate-800">{data.tanggalMulaiKerja || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= WIDGET CUTI (DIPINDAH DARI PROFIL) ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* WIDGET SISA CUTI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <p className="text-[10px] font-bold tracking-widest text-[#1a4b8c] uppercase mb-1">Hak Tahunan</p>
          <h3 className="font-extrabold text-slate-800 text-lg mb-4">Cuti Pegawai</h3>
          
          <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Terpakai {sisaCuti.terpakai} dari {sisaCuti.totalMaks} hari</span>
            <span className="text-[#1a4b8c]">{sisaCuti.totalSisa} Tersisa</span>
          </div>

          {/* Rincian Sisa Per Tahun */}
          <div className="flex gap-2 mb-3 text-[10px] font-bold">
            <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded border border-emerald-100 flex-1 text-center">
              2026: {sisaCuti.sisaN} Hari
            </span>
            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-100 flex-1 text-center">
              2025: {sisaCuti.sisaN1} Hari
            </span>
            <span className="bg-amber-50 text-amber-600 px-2 py-1 rounded border border-amber-100 flex-1 text-center">
              2024: {sisaCuti.sisaN2} Hari
            </span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div 
              className="bg-[#1a4b8c] h-2.5 rounded-full transition-all" 
              style={{ width: `${Math.min(persentaseCuti, 100)}%` }}
            ></div>
          </div>
        </div>

        {/* WIDGET RIWAYAT CUTI */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col max-h-[300px]">
          <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mb-1">Riwayat</p>
          <h3 className="font-extrabold text-slate-800 text-sm mb-4 border-b border-slate-100 pb-3">Pengajuan Cuti</h3>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {riwayatCuti.length === 0 ? (
              <div className="p-4 text-center border border-dashed border-slate-200 rounded-lg text-slate-400 text-xs">
                Belum ada pengajuan cuti.
              </div>
            ) : (
              <ul className="space-y-3">
                {riwayatCuti.map((cuti) => (
                  <li key={cuti.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{cuti.jenisCuti} ({cuti.jumlahHari} Hari)</p>
                      <p className="text-[10px] text-slate-500">{cuti.tglMulai} s/d {cuti.tglSelesai}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded ${
                      cuti.statusPengajuan === 'Disetujui' ? 'bg-emerald-100 text-emerald-700' :
                      cuti.statusPengajuan === 'Ditolak' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {cuti.statusPengajuan}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* KOTAK 3: Riwayat Pendidikan & Diklat (Dibikin Full Width) */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Pendidikan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <GraduationCap className="w-5 h-5 text-[#1a4b8c]" />
            <h3 className="text-lg font-bold text-slate-800">Riwayat Pendidikan</h3>
          </div>
          {data.riwayatPendidikan && data.riwayatPendidikan.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="py-2 px-4">Jenjang</th>
                    <th className="py-2 px-4">Institusi</th>
                    <th className="py-2 px-4">Program Studi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.riwayatPendidikan.map((pend, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-700">{pend.jenjang}</td>
                      <td className="py-3 px-4 text-slate-600">{pend.namaInstitusi}</td>
                      <td className="py-3 px-4 text-slate-600">{pend.programStudi}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Belum ada data riwayat pendidikan.</p>
          )}
        </div>

        {/* Diklat */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-slate-100 pb-3">
            <Award className="w-5 h-5 text-[#1a4b8c]" />
            <h3 className="text-lg font-bold text-slate-800">Riwayat Diklat</h3>
          </div>
          {data.riwayatDiklat && data.riwayatDiklat.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="py-2 px-4">Nama Diklat</th>
                    <th className="py-2 px-4">Tahun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.riwayatDiklat.map((diklat, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-700">{diklat.namaDiklat}</td>
                      <td className="py-3 px-4 text-slate-600">{diklat.tahunDiklat}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">Belum ada data riwayat diklat.</p>
          )}
        </div>

      </div>
    </div>
  );
}