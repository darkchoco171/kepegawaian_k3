'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  hapusMasterJabatan,
  hapusMasterPangkatGolongan,
  perbaruiAturanAngkaKredit,
  tambahMasterJabatan,
  tambahMasterPangkatGolongan,
} from '@/app/admin/manajemen-kinerja/master-pangkat-golongan-actions';

type KelasJabatanData = {
  id: string;
  kelasJabatan: number;
  baseTukin: string;
};

type MasterJabatanData = {
  id: string;
  namaJabatan: string;
  jenisJabatan: string | null;
  kelasJabatan: number | null;
};

type MasterPangkatGolonganData = {
  id: string;
  jenisKepegawaian: string | null;
  pangkat: string | null;
  golongan: string;
  angkaKreditMinimal: string | null;
  urutanJenjang: number;
};

const formatAngkaKredit = (value: string | null) => value === null
  ? 'Belum diatur'
  : Number(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function KelolaMasterPangkatGolongan({
  kelasJabatanOptions,
  jabatanData,
  data,
}: {
  kelasJabatanOptions: KelasJabatanData[];
  jabatanData: MasterJabatanData[];
  data: MasterPangkatGolonganData[];
}) {
  const router = useRouter();
  const [jenisKepegawaian, setJenisKepegawaian] = useState('PNS');
  const [error, setError] = useState('');
  const [jabatanError, setJabatanError] = useState('');
  const [jabatanDeleteError, setJabatanDeleteError] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [pending, startTransition] = useTransition();

  const handleCreateJabatan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setJabatanError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await tambahMasterJabatan(formData);
        form.reset();
        router.refresh();
      } catch (actionError) {
        console.error('Gagal menambah master jabatan:', actionError);
        setJabatanError(actionError instanceof Error
          ? actionError.message
          : 'Master jabatan gagal disimpan.');
      }
    });
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const form = event.currentTarget;
    const formData = new FormData(form);
    startTransition(async () => {
      try {
        await tambahMasterPangkatGolongan(formData);
        form.reset();
        setJenisKepegawaian('PNS');
        router.refresh();
      } catch (actionError) {
        console.error('Gagal menambah master pangkat/golongan:', actionError);
        setError(actionError instanceof Error
          ? actionError.message
          : 'Master pangkat/golongan gagal disimpan.');
      }
    });
  };

  const handleUpdateRule = (
    event: React.FormEvent<HTMLFormElement>,
    id: string,
  ) => {
    event.preventDefault();
    setError('');
    const formData = new FormData(event.currentTarget);
    formData.set('id', id);
    startTransition(async () => {
      try {
        await perbaruiAturanAngkaKredit(formData);
        router.refresh();
      } catch (actionError) {
        console.error('Gagal memperbarui aturan angka kredit:', actionError);
        setError(actionError instanceof Error
          ? actionError.message
          : 'Aturan angka kredit gagal diperbarui.');
      }
    });
  };

  const handleDelete = (item: MasterPangkatGolonganData) => {
    if (!window.confirm(
      `Yakin ingin menghapus master ${item.pangkat || ''} ${item.golongan}? Master yang sudah dipakai pegawai atau riwayat AK tidak dapat dihapus.`,
    )) {
      return;
    }

    setDeleteError('');
    startTransition(async () => {
      try {
        await hapusMasterPangkatGolongan(item.id);
        router.refresh();
      } catch (actionError) {
        console.error('Gagal menghapus master pangkat/golongan:', actionError);
        setDeleteError(actionError instanceof Error
          ? actionError.message
          : 'Master pangkat/golongan gagal dihapus.');
      }
    });
  };

  const handleDeleteJabatan = (item: MasterJabatanData) => {
    if (!window.confirm(
      `Yakin ingin menghapus master jabatan "${item.namaJabatan}"? Jabatan yang sudah dipakai pegawai atau riwayat Tukin tidak dapat dihapus.`,
    )) {
      return;
    }

    setJabatanDeleteError('');
    startTransition(async () => {
      try {
        await hapusMasterJabatan(item.id);
        router.refresh();
      } catch (actionError) {
        console.error('Gagal menghapus master jabatan:', actionError);
        setJabatanDeleteError(actionError instanceof Error
          ? actionError.message
          : 'Master jabatan gagal dihapus.');
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Tambah Master Jabatan</h3>
        <p className="mt-1 text-sm text-slate-500">Pilih kelas Tukin yang sesuai agar jabatan dapat dipakai untuk perhitungan kinerja.</p>

        <form onSubmit={handleCreateJabatan} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Nama Jabatan *</label>
            <input name="namaJabatan" required className="w-full rounded-lg border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Kelas Jabatan *</label>
            <select name="idKelasJabatan" required className="w-full rounded-lg border bg-white px-4 py-2 text-sm">
              <option value="">-- Pilih Kelas Jabatan --</option>
              {kelasJabatanOptions.map(kelas => (
                <option key={kelas.id} value={kelas.id}>
                  Kelas {kelas.kelasJabatan} (Rp {Number(kelas.baseTukin).toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Jenis Jabatan</label>
            <input name="jenisJabatan" className="w-full rounded-lg border px-4 py-2 text-sm" />
          </div>
          {jabatanError && <p role="alert" className="text-sm font-medium text-red-600 md:col-span-2">{jabatanError}</p>}
          <div className="md:col-span-2">
            <button type="submit" disabled={pending} className="rounded-lg bg-[#1a4b8c] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#123666] disabled:opacity-60">
              {pending ? 'Menyimpan...' : 'Simpan Master Jabatan'}
            </button>
          </div>
        </form>

        {jabatanDeleteError && <p role="alert" className="mt-4 text-sm font-medium text-red-600">{jabatanDeleteError}</p>}
        <div className="mt-6 overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-3">Jabatan</th><th className="px-4 py-3">Jenis</th><th className="px-4 py-3">Kelas Tukin</th><th className="px-4 py-3">Aksi</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {jabatanData.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.namaJabatan}</td>
                  <td className="px-4 py-3">{item.jenisJabatan || '-'}</td>
                  <td className="px-4 py-3">{item.kelasJabatan ?? 'Belum diatur'}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDeleteJabatan(item)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      aria-label={`Hapus master jabatan ${item.namaJabatan}`}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {jabatanData.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">Master jabatan belum tersedia.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-slate-800">Tambah Master Pangkat/Golongan</h3>
        <p className="mt-1 text-sm text-slate-500">
          Master baru dapat dipakai pada data pegawai setelah disimpan. Untuk PNS, aturan angka kredit minimal wajib dilengkapi.
        </p>

        <form onSubmit={handleCreate} className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Jenis Kepegawaian *</label>
            <select
              name="jenisKepegawaian"
              value={jenisKepegawaian}
              onChange={event => setJenisKepegawaian(event.target.value)}
              required
              className="w-full rounded-lg border px-4 py-2 text-sm"
            >
              <option value="PNS">PNS</option>
              <option value="PPPK">PPPK</option>
              <option value="NON-ASN">NON-ASN</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Pangkat *</label>
            <input name="pangkat" required className="w-full rounded-lg border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">Golongan *</label>
            <input name="golongan" required maxLength={10} className="w-full rounded-lg border px-4 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold text-slate-600">
              Angka Kredit Minimal{jenisKepegawaian === 'PNS' ? ' *' : ' (opsional)'}
            </label>
            <input
              name="angkaKreditMinimal"
              type="number"
              min="0.01"
              max="9999.99"
              step="0.01"
              required={jenisKepegawaian === 'PNS'}
              className="w-full rounded-lg border px-4 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-slate-500">
              Urutan jenjang diatur otomatis. Non-PNS tidak dimasukkan ke urutan kenaikan jenjang PNS.
            </p>
          </div>
          {error && <p role="alert" className="text-sm font-medium text-red-600 md:col-span-2">{error}</p>}
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-[#1a4b8c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#123666] disabled:opacity-60"
            >
              {pending ? 'Menyimpan...' : 'Simpan Master Pangkat/Golongan'}
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800">Master Pangkat/Golongan</h3>
          <p className="mt-1 text-sm text-slate-500">Aturan AK dapat dilengkapi atau diperbarui untuk record yang sudah ada.</p>
        </div>
        {deleteError && <p role="alert" className="px-6 pt-4 text-sm font-medium text-red-600">{deleteError}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Jenis</th>
                <th className="px-4 py-3">Pangkat</th>
                <th className="px-4 py-3">Golongan</th>
                <th className="px-4 py-3">Urutan</th>
                <th className="px-4 py-3">Angka Kredit Minimal</th>
                <th className="px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-slate-400">Master belum tersedia.</td></tr>
              ) : data.map(item => (
                <tr key={item.id}>
                  <td className="px-4 py-3">{item.jenisKepegawaian || '-'}</td>
                  <td className="px-4 py-3">{item.pangkat || '-'}</td>
                  <td className="px-4 py-3 font-semibold">{item.golongan}</td>
                  <td className="px-4 py-3">{item.urutanJenjang}</td>
                  <td className="px-4 py-3">
                    {item.jenisKepegawaian === 'PNS' ? (
                      <form onSubmit={event => handleUpdateRule(event, item.id)} className="flex items-center gap-2">
                        <input
                          name="angkaKreditMinimal"
                          type="number"
                          min="0.01"
                          max="9999.99"
                          step="0.01"
                          defaultValue={item.angkaKreditMinimal || ''}
                          required
                          className="w-32 rounded-lg border px-3 py-1.5"
                          aria-label={`Angka Kredit Minimal ${item.golongan}`}
                        />
                        <button
                          type="submit"
                          disabled={pending}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          Simpan
                        </button>
                      </form>
                    ) : (
                      <span className="text-slate-500">{formatAngkaKredit(item.angkaKreditMinimal)}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => handleDelete(item)}
                      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                      aria-label={`Hapus master ${item.golongan}`}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
