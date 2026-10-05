'use client';

import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet } from 'lucide-react';
import { importPresensiData } from '@/app/admin/presensi/actions';

export default function ModalImportPresensi({ daftarPegawai }: { daftarPegawai: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await importPresensiData(formData);
    setIsLoading(false);
    setIsOpen(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#1a4b8c] hover:bg-[#123666] text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
      >
        <Upload className="w-4 h-4" />
        Input Presensi
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" /> Input Presensi Manual
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Pegawai *</label>
                <select name="idPegawai" required className="w-full px-4 py-2 border rounded-lg text-sm bg-white">
                  <option value="">-- Pilih Nama Pegawai --</option>
                  {daftarPegawai.map((p) => (
                    <option key={p.id} value={p.id}>{p.namaLengkap} ({p.nip})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Absen *</label>
                <input type="date" name="tgl" required className="w-full px-4 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Sistem Kerja *</label>
                <select name="sistemKerja" required className="w-full px-4 py-2 border rounded-lg text-sm bg-white">
                  <option value="WFO">WFO (Work From Office)</option>
                  <option value="WFH">WFH (Work From Home)</option>
                  <option value="Dinas Luar">Dinas Luar</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Upacara">Upacara</option>
                  <option value="Alpa">Alpa</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jam Cek In</label>
                  <input type="time" name="cekIn" className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jam Cek Out</label>
                  <input type="time" name="cekOut" className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Catatan / Status Anomali</label>
                <input type="text" name="statusAnomali" placeholder="Misal: Lupa absen pulang, Terlambat..." className="w-full px-4 py-2 border rounded-lg text-sm" />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">Batal</button>
                <button type="submit" disabled={isLoading} className="bg-[#1a4b8c] hover:bg-[#123666] text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {isLoading ? 'Menyimpan...' : 'Simpan Presensi'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}