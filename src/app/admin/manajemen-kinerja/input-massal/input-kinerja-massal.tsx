'use client';

import { useActionState } from 'react';
import { simpanKinerjaMassal, type SimpanKinerjaMassalState } from '../actions';

type EmployeeRow = {
  id: string;
  namaLengkap: string;
  nip: string;
  hasilKerja: string | null;
  perilakuKerja: string | null;
};

const pilihanPenilaian = [
  'Di Atas Ekspektasi',
  'Sesuai Ekspektasi',
  'Di Bawah Ekspektasi',
];

const initialState: SimpanKinerjaMassalState = {};

export default function InputKinerjaMassal({
  bulan,
  tahun,
  employees,
}: {
  bulan: number;
  tahun: number;
  employees: EmployeeRow[];
}) {
  const [state, formAction, isPending] = useActionState(simpanKinerjaMassal, initialState);
  const belumDinilai = employees.filter((employee) =>
    !employee.hasilKerja || !employee.perilakuKerja,
  ).length;

  return (
    <form action={formAction} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <input type="hidden" name="bulan" value={bulan} />
      <input type="hidden" name="tahun" value={tahun} />

      <div className="flex flex-col gap-2 border-b border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-slate-800">Periode {String(bulan).padStart(2, '0')}/{tahun}</p>
          <p className="text-xs text-slate-500">
            Baris yang dibiarkan kosong tidak diubah. Penilaian yang sudah tersimpan dapat diperbarui.
          </p>
        </div>
        <p className={`text-sm font-semibold ${belumDinilai ? 'text-amber-700' : 'text-emerald-700'}`}>
          {belumDinilai
            ? `${belumDinilai} pegawai belum lengkap`
            : 'Semua pegawai sudah dinilai'}
        </p>
      </div>

      {state.error && (
        <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="m-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <th className="px-4 py-3">Pegawai</th>
              <th className="px-4 py-3">Hasil Kerja</th>
              <th className="px-4 py-3">Perilaku Kerja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-10 text-center text-slate-500">
                  Belum ada data pegawai.
                </td>
              </tr>
            ) : employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-slate-50">
                <td className="px-4 py-3">
                  <input type="hidden" name="idPegawai" value={employee.id} />
                  <p className="font-semibold text-slate-800">{employee.namaLengkap}</p>
                  <p className="text-xs text-slate-500">NIP: {employee.nip}</p>
                </td>
                <td className="px-4 py-3">
                  <select
                    name="hasilKerja"
                    defaultValue={employee.hasilKerja ?? ''}
                    aria-label={`Hasil kerja ${employee.namaLengkap}`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
                  >
                    <option value="">-- Belum dinilai --</option>
                    {pilihanPenilaian.map((pilihan) => (
                      <option key={pilihan} value={pilihan}>{pilihan}</option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    name="perilakuKerja"
                    defaultValue={employee.perilakuKerja ?? ''}
                    aria-label={`Perilaku kerja ${employee.namaLengkap}`}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
                  >
                    <option value="">-- Belum dinilai --</option>
                    {pilihanPenilaian.map((pilihan) => (
                      <option key={pilihan} value={pilihan}>{pilihan}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          Predikat dan nominal kinerja dihitung otomatis berdasarkan dua penilaian tersebut.
        </p>
        <button
          type="submit"
          disabled={isPending || employees.length === 0}
          className="rounded-xl bg-[#1a4b8c] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#123666] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Menyimpan...' : 'Simpan Penilaian Lengkap'}
        </button>
      </div>
    </form>
  );
}
