'use client';

import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { editPegawaiData } from '@/app/admin/pegawai/actions';

const DAFTAR_TIM = [
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Kesehatan Kerja",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Teknik Kesehatan Kerja",
    "Evaluasi dan Pengembangan Manajemen Kelembagaan K3 Bidang Pembinaan Kesehatan Kerja",
    "Sistem Manajemen Mutu K3",
    "Akreditasi dan Standardisasi Lembaga Audit Sistem Manajemen Mutu K3",
    "Evaluasi Audit Sistem Manajemen Mutu K3",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Keselamatan Kerja",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Teknik Keselamatan Kerja",
    "Akreditasi dan Pengembangan Kelembagaan K3 Bidang Pembinaan Keselamatan Kerja",
    "Standardisasi dan Pengembangan Personel K3",
    "Standardisasi, Evaluasi dan Pengembangan Personel K3 Bidang Mekanik",
    "Standardisasi, Evaluasi, dan Pengembangan Personel K3 Bidang Teknik dan Lingkungan Kerja",
    "Dit. Wasuji",
    "Dit. Sistem",
    "Dit. Sesditjen Binwasnaker",
    "Tata Usaha"
    ];
const DAFTAR_STATUS = ["Aktif", "Cuti", "Tugas Belajar"];
const DAFTAR_AGAMA = ["Islam", "Kristen Protestan", "Katolik", "Hindu", "Buddha", "Konghucu"];

export default function ModalEditPegawai({ pegawai }: { pegawai: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Status awal berdasarkan kolom keterangan di database
  const statusAktif = pegawai.keterangan ? pegawai.keterangan : 'Aktif';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await editPegawaiData(formData);
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      {/* Tombol Ikon Edit */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-500 hover:text-white text-amber-600 border border-amber-200 px-3 py-1.5 rounded text-xs font-semibold transition"
        title="Edit Pegawai"
      >
        <Pencil className="w-3.5 h-3.5" /> Edit
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-lg">Edit Data Pegawai</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* ID Tersembunyi buat acuan Drizzle update */}
              <input type="hidden" name="id" value={pegawai.id} />

              {/* Grup 1: Pekerjaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap & Gelar *</label>
                  <input type="text" name="namaLengkap" defaultValue={pegawai.namaLengkap} required className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NIP *</label>
                  <input type="text" name="nip" defaultValue={pegawai.nip} required minLength={18} maxLength={18} className="w-full px-4 py-2 border rounded-lg text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">TMT Kerja</label>
                  <input type="date" name="tanggalMulaiKerja" defaultValue={pegawai.tanggalMulaiKerja || ''} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sub Bagian / Tim</label>
                  <select name="jabatanTim" defaultValue={pegawai.jabatanTim || ''} required className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    {DAFTAR_TIM.map(tim => <option key={tim} value={tim}>{tim}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status Kepegawaian</label>
                  <select name="status" defaultValue={statusAktif} className="w-full px-4 py-2 border rounded-lg text-sm">
                    {DAFTAR_STATUS.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Grup 2: Data Diri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tempat Lahir</label>
                  <input type="text" name="tempatLahir" defaultValue={pegawai.tempatLahir || ''} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Lahir</label>
                  <input type="date" name="tglLahir" defaultValue={pegawai.tglLahir || ''} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Kelamin</label>
                  <select name="jenisKelamin" defaultValue={pegawai.jenisKelamin || ''} className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Agama</label>
                  <select name="agama" defaultValue={pegawai.agama || ''} className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    {DAFTAR_AGAMA.map(agm => <option key={agm} value={agm}>{agm}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status Pernikahan</label>
                  <select name="statusPernikahan" defaultValue={pegawai.statusPernikahan || ''} className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kontak / No. HP</label>
                  <input type="tel" name="kontak" defaultValue={pegawai.kontak || ''} className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 transition">Batal</button>
                <button type="submit" disabled={isLoading} className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}