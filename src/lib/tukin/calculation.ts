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
