import Link from 'next/link';
import { Users } from 'lucide-react';

type PegawaiOrganisasi = {
  id: string;
  namaLengkap: string;
  nip: string;
  namaTimKerja: string | null;
  jabatanTim: string | null;
  jabatan: {
    namaJabatan: string;
    jenisJabatan: string | null;
  } | null;
};

const STRUKTUR_BAGIAN = [
  {
    nama: 'Bidang Keselamatan Kerja',
    tim: [
      'Akreditasi dan Pengembangan Kelembagaan K3 Bidang Keselamatan Kerja',
      'Akreditasi dan Pengembangan Kelembagaan K3 Bidang Pembinaan Keselamatan Kerja',
    ],
  },
  {
    nama: 'Sistem Manajemen Mutu K3',
    tim: [
      'Sistem Manajemen Mutu K3',
      'Akreditasi dan Standardisasi Lembaga Audit Sistem Manajemen Mutu K3',
      'Evaluasi Audit Sistem Manajemen Mutu K3',
    ],
  },
  {
    nama: 'Pengembangan Personel K3',
    tim: [
      'Standardisasi dan Pengembangan Personel K3',
      'Standardisasi, Evaluasi dan Pengembangan Personel K3 Bidang Mekanik',
      'Standardisasi, Evaluasi, dan Pengembangan Personel K3 Bidang Teknik dan Lingkungan Kerja',
    ],
  },
  {
    nama: 'Bidang Kesehatan Kerja',
    tim: [
      'Akreditasi dan Pengembangan Kelembagaan K3 Bidang Kesehatan Kerja',
      'Akreditasi dan Pengembangan Kelembagaan K3 Bidang Teknik Kesehatan Kerja',
      'Evaluasi dan Pengembangan Manajemen Kelembagaan K3 Bidang Pembinaan Kesehatan Kerja',
    ],
  },
] as const;

function KartuPegawai({ pegawai }: { pegawai: PegawaiOrganisasi }) {
  return (
    <Link
      href={`/admin/pegawai/${pegawai.id}`}
      className="block min-w-0 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-[#1a4b8c]/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a4b8c]"
      aria-label={`Buka profil ${pegawai.namaLengkap}`}
    >
      <span className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-sm font-bold text-[#1a4b8c]">
          {pegawai.namaLengkap.charAt(0)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block line-clamp-2 text-sm font-bold leading-5 text-slate-800">{pegawai.namaLengkap}</span>
          <span className="mt-1 block line-clamp-2 text-xs leading-4 text-slate-500">
            {pegawai.jabatan?.namaJabatan || 'Jabatan belum diisi'}
          </span>
        </span>
      </span>
      <span className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        {pegawai.jabatanTim ? (
          <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
            {pegawai.jabatanTim}
          </span>
        ) : <span className="text-[10px] text-slate-400">NIP</span>}
        <span className="break-all font-mono text-[10px] text-slate-400">{pegawai.nip}</span>
      </span>
    </Link>
  );
}

function KartuUnit({
  judul,
  pegawai,
  gridClassName = 'grid-cols-1',
}: {
  judul: string;
  pegawai: PegawaiOrganisasi[];
  gridClassName?: string;
}) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex min-h-14 items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
        <h4 className="min-w-0 text-sm font-bold leading-5 text-slate-800">{judul}</h4>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#1a4b8c]" aria-label={`${pegawai.length} pegawai`}>
          <Users className="h-3.5 w-3.5" />
          {pegawai.length}
        </span>
      </header>
      {pegawai.length > 0 ? (
        <div className={`grid min-w-0 gap-2 p-3 ${gridClassName}`}>
          {pegawai.map((item) => <KartuPegawai key={item.id} pegawai={item} />)}
        </div>
      ) : (
        <p className="p-5 text-sm text-slate-500">Belum ada pegawai pada unit ini untuk filter yang dipilih.</p>
      )}
    </section>
  );
}

export default function BaganOrganisasi({ pegawai }: { pegawai: PegawaiOrganisasi[] }) {
  if (pegawai.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
        <Users className="mx-auto h-10 w-10 text-slate-300" />
        <p className="mt-3 font-semibold text-slate-700">Tidak ada pegawai untuk filter ini.</p>
        <p className="mt-1 text-sm text-slate-500">Ubah kata pencarian atau filter tim kerja.</p>
      </div>
    );
  }

  const direktur = pegawai.filter((item) =>
    item.jabatan?.namaJabatan.toLowerCase().startsWith('direktur')
  );
  const pegawaiLain = pegawai.filter((item) => !direktur.includes(item));
  const tataUsaha = pegawaiLain
    .filter((item) => item.namaTimKerja === 'Tata Usaha')
    .sort((a, b) => Number(b.jabatanTim === 'Kasubbag TU') - Number(a.jabatanTim === 'Kasubbag TU'));
  const namaTimTerstruktur = new Set<string>(STRUKTUR_BAGIAN.flatMap((bagian) => bagian.tim));
  const pegawaiTim = pegawaiLain.filter((item) =>
    item.namaTimKerja !== null && namaTimTerstruktur.has(item.namaTimKerja)
  );
  const pimpinanTanpaTim = pegawaiLain.filter((item) =>
    !item.namaTimKerja && (item.jabatanTim === 'Ketua Tim' || item.jabatanTim === 'Wakil Ketua Tim')
  );
  const totalPegawaiDitampilkan = direktur.length + tataUsaha.length + pegawaiTim.length + pimpinanTanpaTim.length;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#1a4b8c]">Bagan Organisasi</p>
          <h3 className="mt-1 text-lg font-extrabold leading-snug text-slate-900 sm:text-xl">
            Direktorat Kelembagaan Keselamatan dan Kesehatan Kerja
          </h3>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
          <span className="font-semibold">{totalPegawaiDitampilkan} pegawai ditampilkan</span>
          <span>Klik kartu untuk membuka profil</span>
        </div>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-sm">
          {direktur.length > 0 ? (
            <section className="overflow-hidden rounded-2xl border border-[#1a4b8c] bg-[#1a4b8c] p-3 shadow-md sm:p-4">
              <h4 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.16em] text-blue-100">Direktur</h4>
              <div className="grid gap-2">
                {direktur.map((item) => <KartuPegawai key={item.id} pegawai={item} />)}
              </div>
            </section>
          ) : (
            <div className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 text-center">
              <p className="font-bold text-slate-700">Data pimpinan belum tersedia</p>
              <p className="mt-1 text-xs text-slate-500">Jabatan direktur belum tercatat pada data yang dipilih.</p>
            </div>
          )}
        </div>

        {tataUsaha.length > 0 && (
          <>
            <div aria-hidden="true" className="h-7 w-px bg-slate-300" />
            <KartuUnit
              judul="Subbagian Tata Usaha"
              pegawai={tataUsaha}
              gridClassName="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
            />
          </>
        )}
      </div>

      {(tataUsaha.length > 0 || pegawaiTim.length > 0) && (
        <div className="relative mt-8 pt-5">
          {tataUsaha.length > 0 && (
            <div aria-hidden="true" className="absolute -top-8 left-1/2 h-[calc(2rem+1px)] w-px bg-slate-300" />
          )}
          <div aria-hidden="true" className="absolute left-[25%] right-[25%] top-0 hidden h-px bg-slate-300 md:block xl:hidden" />
          <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-0 hidden h-px bg-slate-300 xl:block" />
          <div className="grid items-start gap-x-0 gap-y-6 md:grid-cols-2 xl:grid-cols-4">
            {STRUKTUR_BAGIAN.map((bagian) => (
              <section key={bagian.nama} className="relative min-w-0 px-2">
                <div aria-hidden="true" className="absolute -top-5 left-1/2 h-[calc(1.25rem+1px)] w-px bg-slate-300" />
                <header className="mb-3 rounded-xl border border-[#1a4b8c]/15 bg-blue-50 px-3 py-3 text-center">
                  <h4 className="text-xs font-bold uppercase leading-5 tracking-wide text-[#1a4b8c]">{bagian.nama}</h4>
                </header>
                <div className="space-y-3">
                  {bagian.tim.map((namaTimKerja) => {
                    const anggota = pegawaiTim
                      .filter((item) => item.namaTimKerja === namaTimKerja)
                      .sort((a, b) => {
                        const urutanPeran = (jabatanTim: string | null) =>
                          jabatanTim === 'Ketua Tim' ? 0 : jabatanTim === 'Wakil Ketua Tim' ? 1 : 2;
                        return urutanPeran(a.jabatanTim) - urutanPeran(b.jabatanTim)
                          || a.namaLengkap.localeCompare(b.namaLengkap, 'id');
                      });

                    return anggota.length > 0 ? (
                      <KartuUnit key={namaTimKerja} judul={namaTimKerja} pegawai={anggota} />
                    ) : null;
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      )}
      {pimpinanTanpaTim.length > 0 && (
        <div className="mt-5">
          <KartuUnit judul="Ketua/Wakil Tim Belum Ditetapkan" pegawai={pimpinanTanpaTim} />
        </div>
      )}
      {tataUsaha.length === 0 && pegawaiTim.length === 0 && pimpinanTanpaTim.length === 0 && (
        <p className="text-sm text-slate-500">Belum ada pegawai dengan subbagian/tim kerja yang ditetapkan.</p>
      )}
    </section>
  );
}
