import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hitungTukinDibayarkan,
  hitungCapaianPakBulanan,
  hitungCapaianPakTahunan,
  hitungAkumulasiCapaianPak,
  getPersentaseKonversiCpak,
  kalkulasiKehadiran,
  kalkulasiKehadiranDariPersentasePotongan,
  kalkulasiKinerja,
} from '../../src/lib/tukin/calculation';

const baseTukin = 4_595_150;

test('kalkulasiKinerja follows the full result and behavior matrix', () => {
  const cases = [
    ['Di Atas Ekspektasi', 'Di Atas Ekspektasi', 'Sangat Baik', 0.70, '3216605.00'],
    ['Sesuai Ekspektasi', 'Di Atas Ekspektasi', 'Baik', 0.70, '3216605.00'],
    ['Di Atas Ekspektasi', 'Sesuai Ekspektasi', 'Baik', 0.70, '3216605.00'],
    ['Sesuai Ekspektasi', 'Sesuai Ekspektasi', 'Baik', 0.70, '3216605.00'],
    ['Di Bawah Ekspektasi', 'Di Atas Ekspektasi', 'Butuh Perbaikan', 0.595, '2734114.25'],
    ['Di Bawah Ekspektasi', 'Sesuai Ekspektasi', 'Butuh Perbaikan', 0.595, '2734114.25'],
    ['Di Atas Ekspektasi', 'Di Bawah Ekspektasi', 'Kurang/Miss Conduct', 0.42, '1929963.00'],
    ['Sesuai Ekspektasi', 'Di Bawah Ekspektasi', 'Kurang/Miss Conduct', 0.42, '1929963.00'],
    ['Di Bawah Ekspektasi', 'Di Bawah Ekspektasi', 'Sangat Kurang', 0.42, '1929963.00'],
  ] as const;

  for (const [hasilKerja, perilakuKerja, capaianKinerja, persentaseKinerja, nominalExpected] of cases) {
    assert.deepEqual(
      kalkulasiKinerja(hasilKerja, perilakuKerja),
      { capaianKinerja, persentaseKinerja },
    );
    assert.equal(
      (baseTukin * persentaseKinerja).toFixed(2),
      nominalExpected,
    );
  }
});

test('getPersentaseKonversiCpak maps performance predicates to BKN conversion rates', () => {
  assert.equal(getPersentaseKonversiCpak('Sangat Baik'), 1.5);
  assert.equal(getPersentaseKonversiCpak('Baik'), 1);
  assert.equal(getPersentaseKonversiCpak('Butuh Perbaikan'), 0.75);
  assert.equal(getPersentaseKonversiCpak('Kurang/Miss Conduct'), 0.5);
  assert.equal(getPersentaseKonversiCpak('Sangat Kurang'), 0.5);
  assert.throws(() => getPersentaseKonversiCpak('Tidak diketahui'), /tidak memiliki konversi CPAK/);
});

test('hitungCapaianPakBulanan applies the monthly coefficient and CPAK conversion', () => {
  assert.equal(hitungCapaianPakBulanan(12.5, 'Sangat Baik').toFixed(3), '1.563');
  assert.equal(hitungCapaianPakBulanan(12.5, 'Baik').toFixed(3), '1.042');
  assert.equal(hitungCapaianPakBulanan(12.5, 'Butuh Perbaikan').toFixed(3), '0.781');
  assert.equal(hitungCapaianPakBulanan(12.5, 'Sangat Kurang').toFixed(3), '0.521');
});

test('hitungCapaianPakTahunan applies the final predicate to all 12 months', () => {
  assert.equal(hitungCapaianPakTahunan(37.5, 'Baik'), 37.5);
  assert.equal(hitungCapaianPakTahunan(37.5, 'Sangat Baik'), 56.25);
});

test('hitungAkumulasiCapaianPak carries forward the same jenjang and resets after promotion', () => {
  const akumulasi = hitungAkumulasiCapaianPak([
    { idPegawai: 'pegawai-1', tahun: 2025, bulan: 13, idMasterJenjang: 'madya', nilaiAk: 367.91, idRiwayat: 'pak-2025' },
    { idPegawai: 'pegawai-1', tahun: 2026, bulan: 1, idMasterJenjang: 'madya', nilaiAk: 3.125, predikat: 'Baik', koefisienTahunan: 37.5 },
    { idPegawai: 'pegawai-1', tahun: 2026, bulan: 10, idMasterJenjang: 'madya', nilaiAk: 4.6875, predikat: 'Sangat Baik', koefisienTahunan: 37.5 },
    { idPegawai: 'pegawai-1', tahun: 2026, bulan: 13, idMasterJenjang: 'madya', nilaiAk: 0, idRiwayat: 'pak-2026' },
    { idPegawai: 'pegawai-1', tahun: 2027, bulan: 1, idMasterJenjang: 'utama', nilaiAk: 2.5, predikat: 'Baik', koefisienTahunan: 2.5 },
    { idPegawai: 'pegawai-1', tahun: 2027, bulan: 13, idMasterJenjang: 'utama', nilaiAk: 0, idRiwayat: 'pak-2027' },
    { idPegawai: 'pegawai-2', tahun: 2025, bulan: 13, idMasterJenjang: 'madya', nilaiAk: 100, idRiwayat: 'pegawai-2-pak-2025' },
    { idPegawai: 'pegawai-2', tahun: 2026, bulan: 13, idMasterJenjang: 'madya', nilaiAk: 20, idRiwayat: 'pegawai-2-pak-2026' },
  ]);

  assert.equal(akumulasi.get('pak-2025'), 367.91);
  assert.equal(akumulasi.get('pak-2026'), 424.16);
  assert.equal(akumulasi.get('pak-2027'), 2.5);
  assert.equal(akumulasi.get('pegawai-2-pak-2025'), 100);
  assert.equal(akumulasi.get('pegawai-2-pak-2026'), 120);
});

test('kalkulasiKehadiran deducts percentage points from the 30% attendance component', () => {
  const result = kalkulasiKehadiran(baseTukin, 10);

  assert.deepEqual(
    {
      persentaseKehadiran: result.persentaseKehadiran,
      nominalKehadiran: result.nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: result.jumlahPotonganKehadiran.toFixed(2),
    },
    {
      persentaseKehadiran: 27,
      nominalKehadiran: '1240690.50',
      jumlahPotonganKehadiran: '137854.50',
    },
  );
});

test('kalkulasiKehadiran returns the full 30% component without deductions', () => {
  const result = kalkulasiKehadiran(baseTukin, 0);

  assert.deepEqual(
    {
      persentaseKehadiran: result.persentaseKehadiran,
      nominalKehadiran: result.nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: result.jumlahPotonganKehadiran.toFixed(2),
    },
    {
      persentaseKehadiran: 30,
      nominalKehadiran: '1378545.00',
      jumlahPotonganKehadiran: '0.00',
    },
  );
});

test('kalkulasiKehadiran never pays a negative attendance amount', () => {
  const result = kalkulasiKehadiran(baseTukin, 200);

  assert.deepEqual(
    {
      persentaseKehadiran: result.persentaseKehadiran,
      nominalKehadiran: result.nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: result.jumlahPotonganKehadiran.toFixed(2),
    },
    {
      persentaseKehadiran: 0,
      nominalKehadiran: '0.00',
      jumlahPotonganKehadiran: '1378545.00',
    },
  );
});

test('kalkulasiKehadiranDariPersentasePotongan deducts within the 30% component', () => {
  const result = kalkulasiKehadiranDariPersentasePotongan(baseTukin, 10);

  assert.deepEqual(
    {
      persentasePotongan: result.persentasePotongan,
      persentaseKehadiran: result.persentaseKehadiran,
      nominalKehadiran: result.nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: result.jumlahPotonganKehadiran.toFixed(2),
    },
    {
      persentasePotongan: 10,
      persentaseKehadiran: 90,
      nominalKehadiran: '1240690.50',
      jumlahPotonganKehadiran: '137854.50',
    },
  );
});

test('kalkulasiKehadiranDariPersentasePotongan caps deductions at 100%', () => {
  const result = kalkulasiKehadiranDariPersentasePotongan(baseTukin, 120);

  assert.deepEqual(
    {
      persentasePotongan: result.persentasePotongan,
      persentaseKehadiran: result.persentaseKehadiran,
      nominalKehadiran: result.nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: result.jumlahPotonganKehadiran.toFixed(2),
    },
    {
      persentasePotongan: 100,
      persentaseKehadiran: 0,
      nominalKehadiran: '0.00',
      jumlahPotonganKehadiran: '1378545.00',
    },
  );
});

test('hitungTukinDibayarkan combines performance and attendance amounts', () => {
  const { persentaseKinerja } = kalkulasiKinerja('Sesuai Ekspektasi', 'Sesuai Ekspektasi');
  const { nominalKehadiran } = kalkulasiKehadiran(baseTukin, 10);
  const nominalKinerja = baseTukin * persentaseKinerja;

  assert.equal(
    hitungTukinDibayarkan(nominalKinerja, nominalKehadiran).toFixed(2),
    '4457295.50',
  );
});
