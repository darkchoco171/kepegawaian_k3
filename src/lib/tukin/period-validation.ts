export function isBarisHeaderPresensi(row: unknown[] | null | undefined) {
  if (!row || row.length === 0 || row.every((cell) => cell === null)) {
    return true;
  }

  const kolomPertama = String(row[0] || '').trim().toLowerCase();
  const kolomKedua = String(row[1] || '').trim().toLowerCase();
  return kolomPertama === 'no' ||
    kolomKedua === 'nama pegawai' ||
    (kolomPertama === '1' && kolomKedua === '2');
}

export function getPresensiDiLuarPeriode(
  tanggalPresensi: string[],
  bulan: number,
  tahun: number,
) {
  const periode = `${tahun}-${String(bulan).padStart(2, '0')}`;
  return tanggalPresensi.find((tanggal) => tanggal.slice(0, 7) !== periode);
}

export function getPegawaiTanpaRekapPresensi(
  dataKinerja: { idPegawai: string }[],
  dataPresensi: { idPegawai: string }[],
) {
  const pegawaiDenganPresensi = new Set(dataPresensi.map(({ idPegawai }) => idPegawai));
  return dataKinerja
    .filter(({ idPegawai }) => !pegawaiDenganPresensi.has(idPegawai))
    .map(({ idPegawai }) => idPegawai);
}
