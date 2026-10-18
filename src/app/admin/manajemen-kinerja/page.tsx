// src/app/admin/manajemen-kinerja/page.tsx
import { db } from '@/lib/db';
import { tukinBulanan, pegawai, masterJabatan, riwayatAngkaKredit, masterPangkatGolongan } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import Link from 'next/link';
import { Plus, Target, CheckCircle2 } from 'lucide-react';
import { Edit } from 'lucide-react';
import TombolHapusKinerja from '@/components/ui/tombol-hapus-kinerja';
import { hapusMasterKinerja, hapusAngkaKredit } from './actions';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(angka);
};

export default async function ManajemenKinerjaPage(props: { searchParams: Promise<{ tab?: string }> }) {
  const searchParams = await props.searchParams;
  const activeTab = searchParams.tab || 'bulanan';

  // --- TARIK DATA TAB 1: KINERJA BULANAN ---
  const listKinerja = await db
    .select({
      id: tukinBulanan.id,
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
    .orderBy(desc(tukinBulanan.tahun), desc(tukinBulanan.bulan));

  // --- TARIK DATA TAB 2: ANGKA KREDIT TAHUNAN ---
  const listAngkaKredit = await db
    .select({
      id: riwayatAngkaKredit.id,
      tahunPenilaian: riwayatAngkaKredit.tahunPenilaian,
      nilaiPak: riwayatAngkaKredit.nilaiPak,
      targetAk: riwayatAngkaKredit.targetAk,
      namaPegawai: pegawai.namaLengkap,
      nip: pegawai.nip,
      pangkat: masterPangkatGolongan.pangkat,
      golongan: masterPangkatGolongan.golongan,
    })
    .from(riwayatAngkaKredit)
    .leftJoin(pegawai, eq(riwayatAngkaKredit.idPegawai, pegawai.id))
    .leftJoin(masterPangkatGolongan, eq(riwayatAngkaKredit.idMasterPangkatGolongan, masterPangkatGolongan.id))
    .orderBy(desc(riwayatAngkaKredit.tahunPenilaian));

  return (
    <div className="space-y-6">
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Manajemen Penilaian & PAK</h2>
          <p className="text-sm text-slate-500 mt-1">Kelola data Hasil Kerja (Bulanan) dan Angka Kredit (Tahunan)</p>
        </div>
        
        {/* Tombol Berubah Sesuai Tab */}
        {activeTab === 'bulanan' ? (
          <Link href="/admin/manajemen-kinerja/input" className="flex items-center gap-2 bg-[#1a4b8c] hover:bg-[#123666] text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
            <Plus className="w-4 h-4" /> Input Kinerja Bulanan
          </Link>
        ) : (
          // Nanti lu bisa bikin halaman modal khusus buat form input angka kredit
          <Link href="/admin/manajemen-kinerja/input-ak" className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition shadow-sm">
            <Target className="w-4 h-4" /> Input Angka Kredit
          </Link>
        )}
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
        )}

        {/* TAMPILAN TAB 2: ANGKA KREDIT */}
        {activeTab === 'angka-kredit' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <th className="py-3 px-4 whitespace-nowrap">Tahun</th>
                  <th className="py-3 px-4">Pegawai</th>
                  <th className="py-3 px-4">Pangkat/Gol saat dinilai</th>
                  <th className="py-3 px-4 font-mono text-center whitespace-nowrap">Capaian PAK</th>
                  <th className="py-3 px-4 font-mono text-center whitespace-nowrap">Target Naik Jenjang</th>
                  <th className="py-3 px-4 text-center whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-center w-[1%] whitespace-nowrap">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {listAngkaKredit.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-slate-400 italic">Belum ada riwayat Angka Kredit.</td></tr>
                ) : (
                  listAngkaKredit.map((item) => {
                    const pak = Number(item.nilaiPak);
                    const target = Number(item.targetAk);
                    const isMemenuhi = target > 0 && pak >= target;

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">{item.tahunPenilaian}</td>
                        <td className="py-3 px-4 min-w-[200px]">
                          <p className="font-bold text-slate-800 line-clamp-1">{item.namaPegawai}</p>
                          <p className="text-xs text-slate-500">NIP: {item.nip}</p>
                        </td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{item.pangkat || '-'} ({item.golongan || '-'})</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1a4b8c] text-center text-lg whitespace-nowrap">{pak}</td>
                        <td className="py-3 px-4 font-mono text-slate-400 text-center whitespace-nowrap">{target > 0 ? target : 'Maksimal'}</td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {isMemenuhi ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg text-xs font-bold">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Memenuhi
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-lg text-xs font-bold">
                              Kurang {target - pak} Poin
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
        )}
      </div>
    </div>
  );
}