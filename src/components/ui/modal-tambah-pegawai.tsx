'use client';

import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { simpanPegawaiBaru } from '@/app/admin/pegawai/actions';
import { DAFTAR_STATUS, DAFTAR_AGAMA } from '@/lib/constants';
import ComboboxTim from '@/components/ui/combobox-tim';

export default function ModalTambahPegawai() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendidikanRows, setPendidikanRows] = useState([{ id: 0 }]);
  const [diklatRows, setDiklatRows] = useState([{ id: 0 }]);
  const [nextPendidikanId, setNextPendidikanId] = useState(1);
  const [nextDiklatId, setNextDiklatId] = useState(1);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');
    try {
      const formData = new FormData(e.currentTarget);
      await simpanPegawaiBaru(formData);
      setIsOpen(false);
    } catch (error) {
      console.error('Gagal menyimpan data pegawai:', error);
      setSubmitError('Data pegawai gagal disimpan. Periksa kembali data lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button onClick={() => { setSubmitError(''); setIsOpen(true); }} className="flex items-center gap-2 bg-[#1a4b8c] hover:bg-[#123666] text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
        <Plus className="w-4 h-4" /> Tambah Pegawai
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          {/* Tambah max-h-[90vh] dan overflow-y-auto biar modalnya bisa di-scroll kalau layar kecil */}
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-bold text-slate-800 text-lg">Tambah Data Pegawai</h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 p-1"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Grup 1: Pekerjaan */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nama Lengkap & Gelar *</label>
                  <input type="text" name="namaLengkap" required className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NIP *</label>
                  <input type="text" name="nip" required minLength={18} maxLength={18} className="w-full px-4 py-2 border rounded-lg text-sm font-mono" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">TMT Kerja</label>
                  <input type="date" name="tanggalMulaiKerja" className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Sub Bagian / Tim</label>
                  <ComboboxTim name="jabatanTim" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status Kepegawaian</label>
                  <select name="status" className="w-full px-4 py-2 border rounded-lg text-sm">
                    {DAFTAR_STATUS.map(stat => <option key={stat} value={stat}>{stat}</option>)}
                  </select>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Grup 2: Data Diri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tempat Lahir</label>
                  <input type="text" name="tempatLahir" className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tanggal Lahir</label>
                  <input type="date" name="tglLahir" className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Jenis Kelamin</label>
                  <select name="jenisKelamin" className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    <option value="L">Laki-laki</option>
                    <option value="P">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Agama</label>
                  <select name="agama" className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    {DAFTAR_AGAMA.map(agm => <option key={agm} value={agm}>{agm}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Status Pernikahan</label>
                  <select name="statusPernikahan" className="w-full px-4 py-2 border rounded-lg text-sm">
                    <option value="">-- Pilih --</option>
                    <option value="Belum Kawin">Belum Kawin</option>
                    <option value="Kawin">Kawin</option>
                    <option value="Cerai Hidup">Cerai Hidup</option>
                    <option value="Cerai Mati">Cerai Mati</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Kontak / No. HP</label>
                  <input type="tel" name="kontak" className="w-full px-4 py-2 border rounded-lg text-sm" />
                </div>
              </div>

              {/* Grup 3: Data Diklat & Pendidikan */}
              <div className="space-y-5">
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">Riwayat Pendidikan</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setPendidikanRows(rows => [...rows, { id: nextPendidikanId }]);
                        setNextPendidikanId(id => id + 1);
                      }}
                      className="text-xs font-semibold text-[#1a4b8c] hover:underline"
                    >
                      + Tambah Pendidikan
                    </button>
                  </div>
                  {pendidikanRows.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-slate-100 p-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Jenjang</label>
                        <input type="text" name="pendidikanJenjang" placeholder="Contoh: S1" className="w-full px-4 py-2 border rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nama Institusi</label>
                        <input type="text" name="pendidikanInstitusi" className="w-full px-4 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Program Studi</label>
                          <input type="text" name="pendidikanProgramStudi" className="w-full px-4 py-2 border rounded-lg text-sm" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPendidikanRows(rows => rows.filter(item => item.id !== row.id))}
                          aria-label={`Hapus pendidikan ${index + 1}`}
                          title="Hapus pendidikan"
                          className="px-3 py-2 text-slate-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-700">Riwayat Diklat</h4>
                    <button
                      type="button"
                      onClick={() => {
                        setDiklatRows(rows => [...rows, { id: nextDiklatId }]);
                        setNextDiklatId(id => id + 1);
                      }}
                      className="text-xs font-semibold text-[#1a4b8c] hover:underline"
                    >
                      + Tambah Diklat
                    </button>
                  </div>
                  {diklatRows.map((row, index) => (
                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-slate-100 p-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 mb-1">Nama Diklat</label>
                        <input type="text" name="diklatNama" className="w-full px-4 py-2 border rounded-lg text-sm" />
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="block text-xs font-bold text-slate-600 mb-1">Tahun</label>
                          <input type="number" name="diklatTahun" step="1" className="w-full px-4 py-2 border rounded-lg text-sm" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setDiklatRows(rows => rows.filter(item => item.id !== row.id))}
                          aria-label={`Hapus diklat ${index + 1}`}
                          title="Hapus diklat"
                          className="px-3 py-2 text-slate-400 hover:text-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              </div>
              
              <hr className="border-slate-100" />

              {/* Grup 4: Data Jabatan */}

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {submitError && <p role="alert" className="mr-auto self-center text-sm text-red-600">{submitError}</p>}
                <button type="button" onClick={() => setIsOpen(false)} className="px-5 py-2 hover:bg-slate-100 rounded-lg text-sm font-semibold text-slate-600 transition">Batal</button>
                <button type="submit" disabled={isLoading} className="bg-[#1a4b8c] hover:bg-[#123666] text-white px-5 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50">
                  {isLoading ? 'Menyimpan...' : 'Simpan Data'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}