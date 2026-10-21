import assert from 'node:assert/strict';
import test from 'node:test';
import {
  hitungTukinDibayarkan,
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
