// src/app/admin/manajemen-kinerja/page.tsx
import { db } from '@/lib/db';
import {
  tukinBulanan,
  pegawai,
  masterJabatan,
  riwayatAngkaKredit,
  masterPangkatGolongan,
  masterJenjang,
  capaianPakBulanan,
} from '@/db/schema';
import { and, count, desc, eq, ilike, inArray, sql } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Target, CheckCircle2, Database } from 'lucide-react';
import { Edit } from 'lucide-react';
import TombolHapusKinerja from '@/components/ui/tombol-hapus-kinerja';
import KinerjaToolbar from '@/components/ui/kinerja-toolbar';
import Pagination from '@/components/ui/pagination';
import { hapusMasterKinerja, hapusAngkaKredit } from './actions';
import {
  hitungAkumulasiCapaianPak,
  type CapaianPakAkumulasiEvent,
} from '@/lib/tukin/calculation';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

const formatAngkaKredit = (angka: number) =>
  new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(angka);

export default async function ManajemenKinerjaPage(props: { searchParams: Promise<{ tab?: string; bulan?: string; page?: string; query?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'bulanan';
  const query = searchParams.query?.trim() || '';
  const requestedPage = Number(searchParams.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const limit = 10;
  const now = new Date();
  const currentBulan = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const requestedPeriod = searchParams.bulan || currentBulan;
  const periodMatch = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(requestedPeriod);
  const filterTahun = periodMatch ? Number(periodMatch[1]) : now.getFullYear();
  const filterBulan = periodMatch ? Number(periodMatch[2]) : now.getMonth() + 1;
  const selectedPeriod = periodMatch ? requestedPeriod : currentBulan;
  const kinerjaWhere = and(
    eq(tukinBulanan.bulan, filterBulan),
    eq(tukinBulanan.tahun, filterTahun),
    query ? ilike(pegawai.namaLengkap, `%${query}%`) : undefined
  );

  const [totalKinerjaResult, totalAngkaKreditResult] = await Promise.all([
    db.select({ value: count() })
      .from(tukinBulanan)
      .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
      .where(kinerjaWhere),
    db.select({ value: count() }).from(riwayatAngkaKredit),
  ]);
  const totalKinerja = totalKinerjaResult[0].value;
  const totalAngkaKredit = totalAngkaKreditResult[0].value;
  const totalHalamanKinerja = Math.ceil(totalKinerja / limit) || 1;
  const totalHalamanAngkaKredit = Math.ceil(totalAngkaKredit / limit) || 1;
  const halamanKinerja = Math.min(page, totalHalamanKinerja);
  const halamanAngkaKredit = Math.min(page, totalHalamanAngkaKredit);

  // --- TARIK DATA TAB 1: KINERJA BULANAN ---
  const listKinerja = await db
    .select({
      id: tukinBulanan.id,
      idPegawai: tukinBulanan.idPegawai,
      bulan: tukinBulanan.bulan,
      tahun: tukinBulanan.tahun,
      hasilKerja: tukinBulanan.hasilKerja,
      perilakuKerja: tukinBulanan.perilakuKerja,
      capaianKinerja: tukinBulanan.capaianKinerja,
      persentaseKinerja: tukinBulanan.persentaseKinerja,
      nominalKinerja: tukinBulanan.nominalKinerja,
      namaPegawai: pegawai.namaLengkap,
      nip: pegawai.nip,
      namaJabatan: masterJabatan.namaJabatan,
    })
    .from(tukinBulanan)
    .leftJoin(pegawai, eq(tukinBulanan.idPegawai, pegawai.id))
    .leftJoin(masterJabatan, eq(tukinBulanan.idMasterJabatan, masterJabatan.id))
    .where(kinerjaWhere)
    .orderBy(desc(tukinBulanan.tahun), desc(tukinBulanan.bulan), desc(tukinBulanan.id))
    .limit(limit)
    .offset((halamanKinerja - 1) * limit);

  // --- TARIK DATA TAB 2: ANGKA KREDIT TAHUNAN ---
  const listAngkaKredit = await db
    .select({
      id: riwayatAngkaKredit.id,
      idPegawai: riwayatAngkaKredit.idPegawai,
      tahunPenilaian: riwayatAngkaKredit.tahunPenilaian,
      nilaiPak: riwayatAngkaKredit.nilaiPak,
      namaPegawai: pegawai.namaLengkap,
      nip: pegawai.nip,
      pangkat: masterPangkatGolongan.pangkat,
      golongan: masterPangkatGolongan.golongan,
      namaJenjang: masterJenjang.namaJenjang,
      idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
    })
    .from(riwayatAngkaKredit)
    .leftJoin(pegawai, eq(riwayatAngkaKredit.idPegawai, pegawai.id))
    .leftJoin(masterPangkatGolongan, eq(riwayatAngkaKredit.idMasterPangkatGolongan, masterPangkatGolongan.id))
    .leftJoin(masterJenjang, eq(masterPangkatGolongan.idMasterJenjang, masterJenjang.id))
    .orderBy(desc(riwayatAngkaKredit.tahunPenilaian), desc(riwayatAngkaKredit.id))
    .limit(limit)
    .offset((halamanAngkaKredit - 1) * limit);

  const targetAkPerJenjang = await db
    .select({
      idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
      targetAk: sql<string>`coalesce(sum(${masterPangkatGolongan.angkaKreditMinimal}), 0)`,
    })
    .from(masterPangkatGolongan)
    .groupBy(masterPangkatGolongan.idMasterJenjang);
  const targetAkByJenjang = new Map(
    targetAkPerJenjang.map((item) => [item.idMasterJenjang, Number(item.targetAk)]),
  );

  const idPegawaiPadaHalaman = [...new Set(
    listAngkaKredit.map((item) => item.idPegawai),
  )];
  const eventsAkumulasi: CapaianPakAkumulasiEvent[] = [];

  if (idPegawaiPadaHalaman.length > 0) {
    const [riwayatAkumulasi, capaianBulananAkumulasi] = await Promise.all([
      db
        .select({
          id: riwayatAngkaKredit.id,
          idPegawai: riwayatAngkaKredit.idPegawai,
          tahun: riwayatAngkaKredit.tahunPenilaian,
          nilaiPak: riwayatAngkaKredit.nilaiPak,
          idMasterJenjang: masterPangkatGolongan.idMasterJenjang,
        })
        .from(riwayatAngkaKredit)
        .leftJoin(
          masterPangkatGolongan,
          eq(riwayatAngkaKredit.idMasterPangkatGolongan, masterPangkatGolongan.id),
        )
        .where(inArray(riwayatAngkaKredit.idPegawai, idPegawaiPadaHalaman)),
      db
        .select({
          idPegawai: capaianPakBulanan.idPegawai,
          idMasterJenjang: capaianPakBulanan.idMasterJenjang,
          bulan: capaianPakBulanan.bulan,
          tahun: capaianPakBulanan.tahun,
          predikat: capaianPakBulanan.predikat,
          nilaiAkBulanan: capaianPakBulanan.nilaiAkBulanan,
          koefisienTahunan: masterJenjang.koefisienTahunan,
        })
        .from(capaianPakBulanan)
        .leftJoin(
          masterJenjang,
          eq(capaianPakBulanan.idMasterJenjang, masterJenjang.id),
        )
        .where(inArray(capaianPakBulanan.idPegawai, idPegawaiPadaHalaman)),
    ]);

    const tahunDenganRincianBulanan = new Set(
      capaianBulananAkumulasi.map((item) => `${item.idPegawai}:${item.tahun}`),
    );

    for (const item of capaianBulananAkumulasi) {
      eventsAkumulasi.push({
        idPegawai: item.idPegawai,
        tahun: item.tahun,
        bulan: item.bulan,
        idMasterJenjang: item.idMasterJenjang,
        nilaiAk: Number(item.nilaiAkBulanan),
        predikat: item.predikat,
        koefisienTahunan: Number(item.koefisienTahunan),
      });
    }

    for (const item of riwayatAkumulasi) {
      if (!item.idMasterJenjang) continue;

      const adaRincianBulanan = tahunDenganRincianBulanan.has(
        `${item.idPegawai}:${item.tahun}`,
      );
      eventsAkumulasi.push({
        idPegawai: item.idPegawai,
        tahun: item.tahun,
        bulan: 13,
        idMasterJenjang: item.idMasterJenjang,
        nilaiAk: adaRincianBulanan ? 0 : Number(item.nilaiPak),
        idRiwayat: item.id,
      });
    }
  }

  const akumulasiPakByRiwayat = hitungAkumulasiCapaianPak(eventsAkumulasi);

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Penilaian & PAK</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data Hasil Kerja (Bulanan) dan Angka Kredit (Tahunan)</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'bulanan' ? (
            <Link href="/admin/manajemen-kinerja/input" className="flex items-center gap-2 bg-[#1a4b8c] hover:bg-[#123666] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
              <Plus className="w-4 h-4" /> Input Kinerja Bulanan
            </Link>
          ) : (
            <Link href="/admin/manajemen-kinerja/input-ak" className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
              <Target className="w-4 h-4" /> Input Angka Kredit
            </Link>
          )}
          <Link href="/admin/manajemen-kinerja/master-pangkat-golongan" className="flex items-center gap-2 border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-semibold transition">
            <Database className="w-4 h-4" /> Master Pangkat/Golongan
          </Link>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 px-1">
        <Link 
          href="/admin/manajemen-kinerja?tab=bulanan" 
          className={`px-4 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'bulanan' ? 'border-[#1a4b8c] text-[#1a4b8c]' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}
        >
          Kinerja Bulanan (Tukin)
        </Link>
        <Link 
          href="/admin/manajemen-kinerja?tab=angka-kredit" 
          className={`px-4 py-3 text-sm font-bold border-b-2 transition ${activeTab === 'angka-kredit' ? 'border-amber-600 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>
          Angka Kredit Tahunan (PAK)
        </Link>
      </div>

      {/* CONTENT AREA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* TAMPILAN TAB 1: KINERJA BULANAN */}
        {activeTab === 'bulanan' && (
          <>
            <KinerjaToolbar currentBulan={selectedPeriod} />
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <th className="py-3 px-4 whitespace-nowrap">Periode</th>
                    <th className="py-3 px-4">Pegawai & Jabatan</th>
                    <th className="py-3 px-4 whitespace-nowrap">Hasil Kerja</th>
                    <th className="py-3 px-4 whitespace-nowrap">Perilaku Kerja</th>
                    <th className="py-3 px-4 whitespace-nowrap">Predikat Capaian</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Nominal Kinerja (70%)</th>
                    <th className="py-3 px-4 text-center w-[1%] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listKinerja.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400 italic">Belum ada data kinerja.</td></tr>
                  ) : (
                    listKinerja.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">{item.bulan} / {item.tahun}</td>
                      <td className="py-3 px-4 min-w-[200px]">
                        <p className="font-bold text-slate-800 line-clamp-1">{item.namaPegawai}</p>
                        <p className="text-xs text-slate-500 line-clamp-1">NIP: {item.nip} • {item.namaJabatan || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.hasilKerja || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.perilakuKerja || '-'}</td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="bg-blue-50 text-[#1a4b8c] border border-blue-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                          {item.capaianKinerja} {Math.round(Number(item.persentaseKinerja) * 100)}%
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-600 text-right whitespace-nowrap">
                        {formatRupiah(Number(item.nominalKinerja))}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link href={`/admin/manajemen-kinerja/edit/${item.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="Edit Data">
                            <Edit className="w-4 h-4" />
                          </Link>
                          <TombolHapusKinerja id={item.id} actionFn={hapusMasterKinerja} tipe="kinerja" />
                        </div>
                      </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <Pagination totalPages={totalHalamanKinerja} currentPage={halamanKinerja} totalData={totalKinerja} />
          </>
        )}

        {/* TAMPILAN TAB 2: ANGKA KREDIT */}
        {activeTab === 'angka-kredit' && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                    <th className="py-3 px-4 whitespace-nowrap">Tahun</th>
                    <th className="py-3 px-4">Pegawai</th>
                    <th className="py-3 px-4">Pangkat/Gol saat dinilai</th>
                    <th className="py-3 px-4 font-mono text-center whitespace-nowrap">Akumulasi CPAK</th>
                    <th className="py-3 px-4 font-mono text-center whitespace-nowrap">Target AK Jenjang</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                    <th className="py-3 px-4 text-center w-[1%] whitespace-nowrap">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {listAngkaKredit.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-12 text-slate-400 italic">Belum ada riwayat Angka Kredit.</td></tr>
                  ) : (
                    listAngkaKredit.map((item) => {
                    const pak = akumulasiPakByRiwayat.get(item.id) ?? Number(item.nilaiPak);
                    const target = targetAkByJenjang.get(item.idMasterJenjang) ?? 0;
                    const isMemenuhi = target > 0 && pak >= target;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">{item.tahunPenilaian}</td>
                        <td className="py-3 px-4 min-w-[200px]">
                          <p className="font-bold text-slate-800 line-clamp-1">{item.namaPegawai}</p>
                          <p className="text-xs text-slate-500">NIP: {item.nip}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.pangkat || '-'} ({item.golongan || '-'})</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1a4b8c] text-center text-lg whitespace-nowrap">
                          <Link
                            href={`/admin/manajemen-kinerja/cpak/${item.idPegawai}/${item.tahunPenilaian}`}
                            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[#1a4b8c] underline decoration-dotted underline-offset-4 hover:bg-blue-50 hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                            title={`Lihat detail CPAK bulanan ${item.tahunPenilaian}`}
                          >
                            {formatAngkaKredit(pak)}
                            <span className="sr-only">Lihat detail CPAK bulanan</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="font-mono text-slate-700">
                            {target > 0 ? formatAngkaKredit(target) : 'Tidak tersedia'}
                          </span>
                          {item.namaJenjang && (
                            <span className="mt-1 block text-[10px] text-slate-500">
                              {item.namaJenjang}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {target <= 0 ? (
                            <span className="bg-slate-50 text-slate-500 border border-slate-200 px-2 py-1 rounded-lg text-xs font-bold">
                              Target tidak tersedia
                            </span>
                          ) : isMemenuhi ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Memenuhi
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold">
                              Kurang {formatAngkaKredit(target - pak)} Poin
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/admin/manajemen-kinerja/input-ak/${item.id}`} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" title="Edit Data">
                              <Edit className="w-4 h-4" />
                            </Link>
                            <TombolHapusKinerja id={item.id} actionFn={hapusAngkaKredit} tipe="ak" />
                          </div>
                        </td>
                      </tr>
                    );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <Pagination totalPages={totalHalamanAngkaKredit} currentPage={halamanAngkaKredit} totalData={totalAngkaKredit} />
          </>
        )}
      </div>
    </div>
  );
}