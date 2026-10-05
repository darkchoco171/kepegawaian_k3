'use client';

import React, { useState } from 'react';
import { Plus, X, CalendarDays, Search } from 'lucide-react';
import { createCuti } from '@/app/admin/cuti/actions';

export default function ModalTambahCuti({ daftarPegawai }: { daftarPegawai: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPegawai, setSearchPegawai] = useState('');

  // Filter daftar pegawai secara real-time berdasarkan ketikan (nama atau NIP)
  const filteredPegawai = daftarPegawai.filter(p => 
    p.namaLengkap.toLowerCase().includes(searchPegawai.toLowerCase()) ||
    p.nip.toLowerCase().includes(searchPegawai.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    await createCuti(formData);
    setIsLoading(false);
    setIsOpen(false);
    setSearchPegawai(''); // Reset search
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-[#1a4b8c] hover:bg-[#123666] text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Ajukan Cuti Baru
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-[#1a4b8c]" /> Form Pengajuan Cuti Pegawai
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* PILIH PEGAWAI DENGAN FITUR SEARCH */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Pilih Pegawai *</label>
                
                {/* Kotak Input Search Kecil */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={searchPegawai}
                    onChange={(e) => setSearchPegawai(e.target.value)}
                    placeholder="Ketik nama atau NIP untuk mencari..." 
                    className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-[#1a4b8c] bg-slate-50"
                  />
                </div>

                {/* Dropdown Hasil Filter */}
                <select name="idPegawai" required size={4} className="w-full px-3 py-2 border rounded-lg text-sm bg-white font-medium">
                  {filteredPegawai.length === 0 ? (
                    <option value="" disabled>Pegawai tidak ditemukan...</option>
                  ) : (
                    filteredPegawai.map((p) => (
                      <option key={p.id} value={p.id} className="py-1 px-2 hover:bg-slate-100 rounded">
                        {p.namaLengkap} — NIP. {p.nip}
                      </option>
                    ))
                  )}
                </select>
                <p className="text-[10px] text-slate-400 mt-1">Gunakan kotak pencarian di atas untuk menyaring nama pegawai dengan cepat.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Cuti *</label>
                <select name="jenisCuti" required className="w-full px-4 py-2 border rounded-lg text-sm bg-white">
                  <option value="Tahunan">Tahunan</option>
                  <option value="Sakit">Sakit</option>
                  <option value="Besar">Besar</option>
                  <option value="Melahirkan">Melahirkan</option>
                  <option value="Alasan Penting">Alasan Penting</option>
                  <option value="Gugur Kandungan">Gugur Kandungan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Mulai *</label>
                  <input type="date" name="tglMulai" required className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Selesai *</label>
                  <input type="date" name="tglSelesai" required className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Jumlah Hari *</label>
                <input type="number" name="jumlahHari" defaultValue={1} min={1} required className="w-full px-4 py-2 border rounded-lg text-sm" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Alasan Cuti</label>
                <textarea name="alasan" rows={2} placeholder="Masukkan alasan atau keterangan cuti..." className="w-full px-4 py-2 border rounded-lg text-sm resize-none"></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600">Batal</button>
                <button type="submit" disabled={isLoading} className="bg-[#1a4b8c] hover:bg-[#123666] text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {isLoading ? 'Menyimpan...' : 'Simpan Pengajuan'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}