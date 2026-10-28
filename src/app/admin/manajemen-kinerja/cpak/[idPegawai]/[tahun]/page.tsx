import { ArrowLeft, Edit } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { and, asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  capaianPakBulanan,
  masterJabatan,
  masterJenjang,
  pegawai,
  tukinBulanan,
} from '@/db/schema';
import TombolHapusKinerja from '@/components/ui/tombol-hapus-kinerja';
import { hapusMasterKinerja } from '../../../actions';
import { hitungCapaianPakTahunan } from '@/lib/tukin/calculation';

const formatAngkaKredit = (nilai: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 3 }).format(nilai);

export default async function DetailCapaianPakPage(props: {
  params: Promise<{ idPegawai: string; tahun: string }>;
}) {
  const { idPegawai, tahun: tahunParam } = await props.params;
  const tahun = Number(tahunParam);

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idPegawai) ||
    !Number.isInteger(tahun) ||
    tahun < 1900 ||
    tahun > 9999
  ) {
    notFound();
  }

  const [dataPegawai] = await db
    .select({
      namaPegawai: pegawai.namaLengkap,
      nip: pegawai.nip,
    })
    .from(pegawai)
    .where(eq(pegawai.id, idPegawai))
    .limit(1);

  if (!dataPegawai) notFound();

  const daftarCapaian = await db
    .select({
      id: capaianPakBulanan.id,
      idKinerja: tukinBulanan.id,
      bulan: capaianPakBulanan.bulan,
      tahun: capaianPakBulanan.tahun,
      predikat: capaianPakBulanan.predikat,
      nilaiAkBulanan: capaianPakBulanan.nilaiAkBulanan,
      namaJenjang: masterJenjang.namaJenjang,
      koefisienTahunan: masterJenjang.koefisienTahunan,
      hasilKerja: tukinBulanan.hasilKerja,
      perilakuKerja: tukinBulanan.perilakuKerja,
      namaJabatan: masterJabatan.namaJabatan,
    })
    .from(capaianPakBulanan)
    .leftJoin(pegawai, eq(capaianPakBulanan.idPegawai, pegawai.id))
    .leftJoin(
      tukinBulanan,
      and(
        eq(tukinBulanan.idPegawai, capaianPakBulanan.idPegawai),
        eq(tukinBulanan.bulan, capaianPakBulanan.bulan),
        eq(tukinBulanan.tahun, capaianPakBulanan.tahun),
      ),
    )
    .leftJoin(masterJabatan, eq(tukinBulanan.idMasterJabatan, masterJabatan.id))
    .leftJoin(masterJenjang, eq(capaianPakBulanan.idMasterJenjang, masterJenjang.id))
    .where(and(
      eq(capaianPakBulanan.idPegawai, idPegawai),
      eq(capaianPakBulanan.tahun, tahun),
    ))
    .orderBy(asc(capaianPakBulanan.bulan));

  const capaianTerakhir = daftarCapaian[daftarCapaian.length - 1];
  if (capaianTerakhir && capaianTerakhir.koefisienTahunan === null) {
    throw new Error('Koefisien tahunan jenjang CPAK tidak ditemukan.');
  }
  const totalCapaian = capaianTerakhir
    ? hitungCapaianPakTahunan(
        Number(capaianTerakhir.koefisienTahunan),
        capaianTerakhir.predikat,
      )
    : 0;
  const bulanTerisi = new Set(daftarCapaian.map((item) => item.bulan)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/manajemen-kinerja?tab=angka-kredit"
          className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50"
          aria-label="Kembali ke Angka Kredit Tahunan"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            Detail CPAK Bulanan {tahun}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {dataPegawai.namaPegawai} · NIP: {dataPegawai.nip}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Proyeksi CPAK tahun {tahun} (12 bulan)
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-[#1a4b8c]">
            {formatAngkaKredit(totalCapaian)} Poin
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Berdasarkan predikat terakhir yang tercatat ({capaianTerakhir?.predikat || '-'}).
            Rincian di bawah tetap menampilkan nilai tiap bulan.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Periode penilaian tersedia
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-800">
            {bulanTerisi} dari 12 bulan
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <th className="whitespace-nowrap px-4 py-3">Periode</th>
                <th className="px-4 py-3">Pegawai & Jabatan</th>
                <th className="whitespace-nowrap px-4 py-3">Hasil Kerja</th>
                <th className="whitespace-nowrap px-4 py-3">Perilaku Kerja</th>
                <th className="whitespace-nowrap px-4 py-3">Predikat Capaian</th>
                <th className="whitespace-nowrap px-4 py-3 text-right">Nilai CPAK Bulanan</th>
                <th className="w-[1%] whitespace-nowrap px-4 py-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {daftarCapaian.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center italic text-slate-400">
                    Belum ada rincian CPAK bulanan untuk tahun ini. Penilaian yang disimpan
                    sebelum otomasi CPAK tidak dihitung ulang otomatis, dan nilai PAK tahunan
                    tidak bisa dipecah menjadi data bulanan tanpa rincian penilaiannya.
                  </td>
                </tr>
              ) : (
                daftarCapaian.map((item) => (
                  <tr key={item.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3 font-bold text-slate-700">
                      {new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(
                        new Date(item.tahun, item.bulan - 1, 1),
                      )}{' '}
                      {item.tahun}
                    </td>
                    <td className="min-w-[200px] px-4 py-3">
                      <p className="line-clamp-1 font-bold text-slate-800">
                        {dataPegawai.namaPegawai}
                      </p>
                      <p className="line-clamp-1 text-xs text-slate-500">
                        NIP: {dataPegawai.nip} · {item.namaJabatan || '-'}
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Jenjang CPAK: {item.namaJenjang || 'Tidak tersedia'}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {item.hasilKerja || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                      {item.perilakuKerja || '-'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3">
                      <span className="rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1a4b8c]">
                        {item.predikat}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {formatAngkaKredit(Number(item.nilaiAkBulanan))}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-center">
                      {item.idKinerja ? (
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/admin/manajemen-kinerja/edit/${item.idKinerja}`}
                            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                            title="Edit Data Kinerja"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <TombolHapusKinerja
                            id={item.idKinerja}
                            actionFn={hapusMasterKinerja}
                            tipe="kinerja"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
          Menampilkan {bulanTerisi} periode CPAK untuk tahun {tahun}.
        </div>
      </div>
    </div>
  );
}
