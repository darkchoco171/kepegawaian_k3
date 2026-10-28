export function kalkulasiKinerja(hasilKerja: string, perilakuKerja: string) {
  const kombinasi = `${hasilKerja}|${perilakuKerja}`;

  switch (kombinasi) {
    case 'Di Atas Ekspektasi|Di Atas Ekspektasi':
      return { capaianKinerja: 'Sangat Baik', persentaseKinerja: 0.70 };
    case 'Sesuai Ekspektasi|Di Atas Ekspektasi':
    case 'Di Atas Ekspektasi|Sesuai Ekspektasi':
    case 'Sesuai Ekspektasi|Sesuai Ekspektasi':
      return { capaianKinerja: 'Baik', persentaseKinerja: 0.70 };
    case 'Di Bawah Ekspektasi|Di Atas Ekspektasi':
    case 'Di Bawah Ekspektasi|Sesuai Ekspektasi':
      return { capaianKinerja: 'Butuh Perbaikan', persentaseKinerja: 0.595 };
    case 'Di Atas Ekspektasi|Di Bawah Ekspektasi':
    case 'Sesuai Ekspektasi|Di Bawah Ekspektasi':
      return { capaianKinerja: 'Kurang/Miss Conduct', persentaseKinerja: 0.42 };
    case 'Di Bawah Ekspektasi|Di Bawah Ekspektasi':
      return { capaianKinerja: 'Sangat Kurang', persentaseKinerja: 0.42 };
    default:
      return { capaianKinerja: 'Baik', persentaseKinerja: 0.70 };
  }
}

export function getPersentaseKonversiCpak(predikat: string) {
  switch (predikat) {
    case 'Sangat Baik':
      return 1.5;
    case 'Baik':
      return 1;
    case 'Butuh Perbaikan':
      return 0.75;
    case 'Kurang/Miss Conduct':
    case 'Sangat Kurang':
      return 0.5;
    default:
      throw new Error(`Predikat kinerja tidak memiliki konversi CPAK: ${predikat}`);
  }
}

export function hitungCapaianPakBulanan(koefisienTahunan: number, predikat: string) {
  return (koefisienTahunan / 12) * getPersentaseKonversiCpak(predikat);
}

export function hitungCapaianPakTahunan(koefisienTahunan: number, predikat: string) {
  return koefisienTahunan * getPersentaseKonversiCpak(predikat);
}

export type CapaianPakAkumulasiEvent = {
  idPegawai: string;
  tahun: number;
  bulan: number;
  idMasterJenjang: string;
  nilaiAk: number;
  predikat?: string;
  koefisienTahunan?: number;
  idRiwayat?: string;
};

export function hitungAkumulasiCapaianPak(events: CapaianPakAkumulasiEvent[]) {
  const sortedEvents = [...events].sort(
    (a, b) =>
      a.idPegawai.localeCompare(b.idPegawai) ||
      a.tahun - b.tahun ||
      a.bulan - b.bulan,
  );
  const akumulasiByRiwayat = new Map<string, number>();
  const eventsPerTahun = new Map<string, CapaianPakAkumulasiEvent[]>();

  for (const event of sortedEvents) {
    const key = `${event.idPegawai}:${event.tahun}`;
    const eventsTahun = eventsPerTahun.get(key) ?? [];
    eventsTahun.push(event);
    eventsPerTahun.set(key, eventsTahun);
  }

  const capaianTahunan = [...eventsPerTahun.values()].map((eventsTahun) => {
    const bulanan = eventsTahun.filter((event) => event.bulan >= 1 && event.bulan <= 12);
    const riwayat = eventsTahun.filter((event) => event.idRiwayat);
    const eventTerakhir = bulanan.at(-1);
    let eventTahunan = riwayat[0];

    if (eventTerakhir) {
      if (!eventTerakhir.predikat || eventTerakhir.koefisienTahunan === undefined) {
        throw new Error('Predikat dan koefisien tahunan CPAK terakhir harus tersedia.');
      }

      eventTahunan = {
          ...eventTerakhir,
          nilaiAk: hitungCapaianPakTahunan(
            eventTerakhir.koefisienTahunan,
            eventTerakhir.predikat,
          ),
          idRiwayat: riwayat[0]?.idRiwayat,
      };
    }

    return eventTahunan;
  }).filter((event): event is CapaianPakAkumulasiEvent => Boolean(event))
    .sort(
      (a, b) =>
        a.idPegawai.localeCompare(b.idPegawai) ||
        a.tahun - b.tahun ||
        a.bulan - b.bulan,
    );

  const saldoPerPegawai = new Map<string, { idMasterJenjang: string; totalAkumulasi: number }>();

  for (const event of capaianTahunan) {
    const saldo = saldoPerPegawai.get(event.idPegawai);
    const totalSebelumnya =
      saldo?.idMasterJenjang === event.idMasterJenjang
        ? saldo.totalAkumulasi
        : 0;
    const totalAkumulasi = Number((totalSebelumnya + event.nilaiAk).toFixed(3));

    saldoPerPegawai.set(event.idPegawai, {
      idMasterJenjang: event.idMasterJenjang,
      totalAkumulasi,
    });
    if (event.idRiwayat) {
      akumulasiByRiwayat.set(event.idRiwayat, totalAkumulasi);
    }
  }

  return akumulasiByRiwayat;
}

export function kalkulasiKehadiran(nominalDasar: number, persentasePotongan: number) {
  const persentaseKehadiran = Math.max(0, 30 - persentasePotongan * 0.3);
  const nominalKehadiran = nominalDasar * persentaseKehadiran / 100;
  const nominalMaksKehadiran = nominalDasar * 0.3;

  return {
    persentaseKehadiran,
    nominalKehadiran,
    jumlahPotonganKehadiran: Math.max(0, nominalMaksKehadiran - nominalKehadiran),
  };
}

export function kalkulasiKehadiranDariPersentasePotongan(
  nominalDasar: number,
  totalPotongan: number,
) {
  const persentasePotongan = Math.min(totalPotongan, 100);
  const persentaseKehadiran = 100 - persentasePotongan;
  const nominalMaksKehadiran = nominalDasar * 0.3;
  const nominalKehadiran = nominalMaksKehadiran * (persentaseKehadiran / 100);

  return {
    persentasePotongan,
    persentaseKehadiran,
    nominalKehadiran,
    jumlahPotonganKehadiran: nominalMaksKehadiran - nominalKehadiran,
  };
}

export function hitungTukinDibayarkan(nominalKinerja: number, nominalKehadiran: number) {
  return nominalKinerja + nominalKehadiran;
}
