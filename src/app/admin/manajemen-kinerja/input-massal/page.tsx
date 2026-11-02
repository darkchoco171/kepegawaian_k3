import { and, asc, eq } from 'drizzle-orm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { db } from '@/lib/db';
import { pegawai, tukinBulanan } from '@/db/schema';
import InputKinerjaMassal from './input-kinerja-massal';

type Props = {
  searchParams: Promise<{ bulan?: string }>;
};

export default async function InputKinerjaMassalPage({ searchParams }: Props) {
  const params = await searchParams;
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const requestedPeriod = params.bulan ?? currentPeriod;
  const periodMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(requestedPeriod);
  const period = periodMatch ? requestedPeriod : currentPeriod;
  const [tahun, bulan] = period.split('-').map(Number);

  const employees = await db
    .select({
      id: pegawai.id,
      namaLengkap: pegawai.namaLengkap,
      nip: pegawai.nip,
      hasilKerja: tukinBulanan.hasilKerja,
      perilakuKerja: tukinBulanan.perilakuKerja,
    })
    .from(pegawai)
    .leftJoin(
      tukinBulanan,
      and(
        eq(tukinBulanan.idPegawai, pegawai.id),
        eq(tukinBulanan.bulan, bulan),
        eq(tukinBulanan.tahun, tahun),
      ),
    )
    .orderBy(asc(pegawai.namaLengkap));

  const completedCount = employees.filter((employee) =>
    employee.hasilKerja && employee.perilakuKerja,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/admin/manajemen-kinerja?bulan=${period}`}
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
          aria-label="Kembali ke manajemen kinerja"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Input Kinerja Massal</h2>
          <p className="mt-1 text-sm text-slate-500">
            Isi penilaian hasil kerja dan perilaku kerja untuk satu periode.
          </p>
        </div>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <label htmlFor="bulan" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-600">
            Periode penilaian
          </label>
          <input
            id="bulan"
            name="bulan"
            type="month"
            defaultValue={period}
            required
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4b8c]"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Tampilkan Periode
        </button>
        <p className="text-sm text-slate-500">
          {completedCount} dari {employees.length} pegawai sudah memiliki penilaian pada periode ini.
        </p>
      </form>

      <InputKinerjaMassal
        bulan={bulan}
        tahun={tahun}
        employees={employees}
      />
    </div>
  );
}
