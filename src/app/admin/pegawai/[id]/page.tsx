import React from 'react';
import Link from 'next/link';
import { ArrowLeft, User, Briefcase, GraduationCap, Award } from 'lucide-react';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { pegawai } from '@/db/schema';
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