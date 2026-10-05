import React from 'react';
import { ArrowLeft, Wallet, Calendar, User, Award, FileText, CheckCircle } from 'lucide-react';
import { db } from '@/lib/db';
import { tukinBulanan, pegawai, masterJabatan, masterKelasJabatan, rekapPresensiBulanan } from '@/db/schema';
import { eq } from 'drizzle-orm';
import Link from 'next/link';

// Helper buat format Rupiah
const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default async function DetailTukinPage(
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  const tukinId = params.id;

  // Tarik data tukin berdasarkan ID, beserta relasi lengkapnya (pegawai, jabatan, kelas jabatan, rekap presensi)
  const dataTukin = await db.query.tukinBulanan.findFirst({
    where: eq(tukinBulanan.id, tukinId),
    with: {
      pegawai: {
        with: {
          golongan: true,
        }
      },
      jabatan: {
        with: {
          kelasJabatan: true,
        }
      },
      rekapPresensiBulanan: true,
    }
  });

  if (!dataTukin) {
    return (
      <div className="p-10 text-center">
        <p className="text-slate-500 mb-4">Data Rincian Tukin tidak ditemukan.</p>
        <Link href="/admin/tukin" className="bg-[#1a4b8c] text-white px-4 py-2 rounded-lg text-sm font-semibold">
          Kembali ke Daftar Tukin
        </Link>
      </div>
    );
  }

  const p = dataTukin.pegawai;
  const j = dataTukin.jabatan;
  const kj = j?.kelasJabatan;
  const r = dataTukin.rekapPresensiBulanan;

  const namaBulanList = ["", "Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const namaBulanStr = namaBulanList[dataTukin.bulan] || dataTukin.bulan;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* TOMBOL KEMBALI & HEADER */}
      <div className="flex items-center justify-between">
        <Link 
          href="/admin/tukin"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-[#1a4b8c] transition bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Tukin
        </Link>
        <span className="bg-blue-50 text-[#1a4b8c] border border-blue-200 px-3 py-1 rounded-full text-xs font-bold">
          Periode: {namaBulanStr} {dataTukin.tahun}
        </span>
      </div>

      {/* KARTU UTAMA: TOTAL DITERIMA */}
      <div className="bg-gradient-to-r from-[#1a4b8c] to-[#123666] rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <p className="text-xs uppercase tracking-wider text-blue-200 font-semibold">Total Tukin Bersih Dibayarkan</p>
          <h1 className="text-3xl font-extrabold mt-1">{formatRupiah(Number(dataTukin.dibayarkan))}</h1>
          <p className="text-xs text-blue-100 mt-2">Predikat Kinerja: <span className="font-bold underline">{dataTukin.capaianKinerja}</span> ({Number(dataTukin.persentaseKinerja) * 100}%)</p>
        </div>
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-right">
          <p className="text-[10px] uppercase text-blue-200">Base Tukin (Nominal Dasar)</p>
          <p className="text-lg font-bold font-mono">{formatRupiah(Number(dataTukin.nominalDasar))}</p>
        </div>
      </div>

      {/* INFORMASI PEGAWAI & JABATAN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
            <User className="w-4 h-4 text-[#1a4b8c]" /> Identitas Pegawai
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Nama Lengkap</span><span className="font-bold text-slate-800">{p?.namaLengkap}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">NIP</span><span className="font-mono text-slate-700">{p?.nip}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pangkat / Golongan</span><span className="text-slate-700">{p?.golongan?.pangkat || '-'} ({p?.golongan?.golongan || '-'})</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Sub Bagian / Tim</span><span className="text-slate-700">{p?.jabatanTim || '-'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
            <Award className="w-4 h-4 text-[#1a4b8c]" /> Jabatan & Kelas Jabatan
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex flex-col gap-1">
              <span className="text-slate-500 text-xs font-semibold">Jabatan</span>
              <span className="font-bold text-slate-800 leading-snug">{j?.namaJabatan || '-'}</span>
            </div>
            <div className="flex justify-between"><span className="text-slate-500">Hasil Kerja</span><span className="text-slate-700">{dataTukin.hasilKerja || 'Memenuhi Target'}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Perilaku Kerja</span><span className="text-slate-700">{dataTukin.perilakuKerja || 'Baik'}</span></div>
          </div>
        </div>
      </div>

      {/* RINCIAN KOMPONEN PRESENSI & POTONGAN */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2 border-b pb-3">
          <Calendar className="w-4 h-4 text-[#1a4b8c]" /> Rekapitulasi Presensi & Potongan Bulanan
        </h3>

        {r ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Hari Kerja</p>
              <p className="text-xl font-extrabold text-slate-800 mt-1">{r.hariKerja} Hari</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Terlambat</p>
              <p className="text-xl font-extrabold text-amber-600 mt-1">{r.totalMenitTerlambat} Menit</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Lupa Absen</p>
              <p className="text-xl font-extrabold text-purple-600 mt-1">{r.jumlahLupaAbsen} Kali</p>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
              <p className="text-[10px] uppercase font-bold text-slate-400">Alpa / Tanpa Keterangan</p>
              <p className="text-xl font-extrabold text-red-600 mt-1">{r.jumlahAlpa} Hari</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 italic py-4 text-center">Belum ada data rekap presensi bulanan yang terhubung.</p>
        )}

        {r && (
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex items-center justify-between text-sm mt-4">
            <span className="text-slate-600 font-medium">Persentase Kehadiran & Potongan Presensi</span>
            <span className="font-bold text-[#1a4b8c]">{Number(r.persentaseKehadiran)}% Kehadiran (Potongan: {formatRupiah(Number(r.jumlahPotonganKehadiran))})</span>
          </div>
        )}
      </div>

    </div>
  );
}