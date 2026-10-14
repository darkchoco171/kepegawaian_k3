'use client';

import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { editPegawaiData } from '@/app/admin/pegawai/actions';
import { DAFTAR_STATUS, DAFTAR_AGAMA } from '@/lib/constants';
import ComboboxTim from '@/components/ui/combobox-tim';

type PendidikanFormRow = {
  key: string;
  id: string;
  jenjang: string;
  namaInstitusi: string;
  programStudi: string;
};

type DiklatFormRow = {
  key: string;
  id: string;
  namaDiklat: string;
  tahunDiklat: string;
};

type PegawaiEditData = {
  id: string;
  namaLengkap: string;
  nip: string;
  tanggalMulaiKerja: string | null;
  jabatanTim: string | null;
  keterangan: string | null;
  tempatLahir: string | null;
  tglLahir: string | null;
  jenisKelamin: 'L' | 'P' | null;
  agama: string | null;
  statusPernikahan: string | null;
  kontak: string | null;
  riwayatPendidikan: Array<{
    id: string;
    jenjang: string | null;
    namaInstitusi: string | null;
    programStudi: string | null;
  }>;
  riwayatDiklat: Array<{
    id: string;
    namaDiklat: string;
    tahunDiklat: number | null;
  }>;
};



export default function ModalEditPegawai({ pegawai }: { pegawai: PegawaiEditData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendidikanRows, setPendidikanRows] = useState<PendidikanFormRow[]>(() =>
    pegawai.riwayatPendidikan.map(pendidikan => ({
      key: pendidikan.id,
      id: pendidikan.id,
      jenjang: pendidikan.jenjang || '',
      namaInstitusi: pendidikan.namaInstitusi || '',
      programStudi: pendidikan.programStudi || '',
    })),
  );
  const [diklatRows, setDiklatRows] = useState<DiklatFormRow[]>(() =>
    pegawai.riwayatDiklat.map(diklat => ({
      key: diklat.id,
      id: diklat.id,
      namaDiklat: diklat.namaDiklat || '',
      tahunDiklat: diklat.tahunDiklat?.toString() || '',
    })),
  );

  // Status awal berdasarkan kolom keterangan di database
  const statusAktif = pegawai.keterangan ? pegawai.keterangan : 'Aktif';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setSubmitError('');
    try {
      const formData = new FormData(e.currentTarget);
      await editPegawaiData(formData);
      setIsOpen(false);
    } catch (error) {
      console.error('Gagal mengubah data pegawai:', error);
      setSubmitError('Perubahan gagal disimpan. Periksa kembali data lalu coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Tombol Ikon Edit */}
      <button 
        onClick={() => { setSubmitError(''); setIsOpen(true); }} 
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
                  <ComboboxTim name="jabatanTim" defaultValue={pegawai.jabatanTim || ''} />
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

              <hr className="border-slate-100" />

              {/* Riwayat Pendidikan */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700">Riwayat Pendidikan</h4>
                  <button
                    type="button"
                    onClick={() => setPendidikanRows(rows => [
                      ...rows,
                      { key: `baru-${Date.now()}-${rows.length}`, id: '', jenjang: '', namaInstitusi: '', programStudi: '' },
                    ])}
                    className="text-xs font-semibold text-[#1a4b8c] hover:underline"
                  >
                    + Tambah Pendidikan
                  </button>
                </div>
                {pendidikanRows.map((row, index) => (
                  <div key={row.key} className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-lg border border-slate-100 p-3">
                    <input type="hidden" name="pendidikanId" value={row.id} />
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Jenjang</label>
                      <input type="text" name="pendidikanJenjang" defaultValue={row.jenjang} placeholder="Contoh: S1" className="w-full px-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Institusi</label>
                      <input type="text" name="pendidikanInstitusi" defaultValue={row.namaInstitusi} className="w-full px-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Program Studi</label>
                        <input type="text" name="pendidikanProgramStudi" defaultValue={row.programStudi} className="w-full px-4 py-2 border rounded-lg text-sm" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setPendidikanRows(rows => rows.filter(item => item.key !== row.key))}
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

              {/* Riwayat Diklat */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-700">Riwayat Diklat</h4>
                  <button
                    type="button"
                    onClick={() => setDiklatRows(rows => [
                      ...rows,
                      { key: `baru-${Date.now()}-${rows.length}`, id: '', namaDiklat: '', tahunDiklat: '' },
                    ])}
                    className="text-xs font-semibold text-[#1a4b8c] hover:underline"
                  >
                    + Tambah Diklat
                  </button>
                </div>
                {diklatRows.map((row, index) => (
                  <div key={row.key} className="grid grid-cols-1 md:grid-cols-2 gap-3 rounded-lg border border-slate-100 p-3">
                    <input type="hidden" name="diklatId" value={row.id} />
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nama Diklat</label>
                      <input type="text" name="diklatNama" defaultValue={row.namaDiklat} className="w-full px-4 py-2 border rounded-lg text-sm" />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-bold text-slate-600 mb-1">Tahun</label>
                        <input type="number" name="diklatTahun" defaultValue={row.tahunDiklat} step="1" className="w-full px-4 py-2 border rounded-lg text-sm" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setDiklatRows(rows => rows.filter(item => item.key !== row.key))}
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

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                {submitError && <p role="alert" className="mr-auto self-center text-sm text-red-600">{submitError}</p>}
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