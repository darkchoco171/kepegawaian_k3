import React from 'react';
import { User, Briefcase, CheckCircle2 } from 'lucide-react';
import { db } from '@/lib/db';
import { pegawai} from '@/db/schema';
import { ilike } from 'drizzle-orm';

export default async function ProfilPage() {
  const p = await db.query.pegawai.findFirst({
    where: ilike(pegawai.namaLengkap, '%Raffi Wahyu%'),
    with: {
      jabatan: {
        with: {
          kelasJabatan: true,
        }
      },
      golongan: true,
    }
  });

  // Kalau ternyata database pegawai beneran kosong
  if (!p) {
    return (
      <div className="p-10 text-center text-slate-500">
        Data pegawai masih kosong. Silakan tambah data pegawai dulu di menu Data Pegawai.
      </div>
    );
  }

  const j = p.jabatan;
  const g = p.golongan;

  // Karena kita bypass tabel users, kita bikin pura-pura statusnya aktif
  const roleAkses = 'Administrator';
  const isActive = true;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* HEADER PROFIL */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#1a4b8c] to-blue-600 text-white font-extrabold text-3xl flex items-center justify-center shadow-md">
          {p.namaLengkap.charAt(0)}
        </div>
        <div className="space-y-1 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h1 className="text-2xl font-bold text-slate-800">{p.namaLengkap}</h1>
            <span className={`border px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 justify-center ${isActive ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              <CheckCircle2 className="w-3.5 h-3.5" /> {isActive ? 'Akun Aktif' : 'Non-Aktif'}
            </span>
          </div>
          <p className="text-sm font-mono text-slate-500">NIP. {p.nip}</p>
          <p className="text-xs text-slate-600 font-medium pt-1">
            Role Akses: <span className="uppercase font-bold text-[#1a4b8c] bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{roleAkses}</span>
          </p>
        </div>
      </div>

      {/* DETAIL INFORMASI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Kolom Kiri: Informasi Pribadi */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
            <User className="w-4 h-4 text-[#1a4b8c]" /> Informasi Pribadi
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Tempat, Tgl Lahir</span><span className="font-medium text-slate-800">{p.tempatLahir || '-'}, {p.tglLahir || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Jenis Kelamin</span><span className="font-medium text-slate-800">{p.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Agama</span><span className="font-medium text-slate-800">{p.agama || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Status Pernikahan</span><span className="font-medium text-slate-800">{p.statusPernikahan || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Kontak / Telepon</span><span className="font-medium text-slate-800">{p.kontak || '-'}</span></div>
          </div>
        </div>

        {/* Kolom Kanan: Kepegawaian */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
            <Briefcase className="w-4 h-4 text-[#1a4b8c]" /> Jabatan & Kepegawaian
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex flex-col gap-0.5">
              <span className="text-slate-500 text-xs">Jabatan Saat Ini</span>
              <span className="font-bold text-slate-800">{j?.namaJabatan || 'Belum diset'}</span>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-slate-500">Pangkat / Golongan</span><span className="font-medium text-slate-800">{g?.pangkat || '-'} ({g?.golongan || '-'})</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Sub Bagian / Tim</span><span className="font-medium text-slate-800">{p.jabatanTim || '-'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Mulai Kerja (TMT)</span><span className="font-medium text-slate-800">{p.tanggalMulaiKerja || '-'}</span></div>
          </div>
        </div>

      </div>
    </div>
  );
}