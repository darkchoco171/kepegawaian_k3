import 'dotenv/config';
import { db } from './index';
import { presensiHarian, pengajuanCuti, rekapPresensiBulanan, pegawai, masterPangkatGolongan } from './schema';
import { eq, and, gte, lte } from 'drizzle-orm';

async function generateRekapBulanan() {
  const BULAN = 8;
  const TAHUN = 2026;
  const startDate = `${TAHUN}-08-01`;
  const endDate = `${TAHUN}-08-31`;

  console.log(`Menarik data absen & cuti harian periode ${BULAN}/${TAHUN}...`);

  const allPegawai = await db.select()
    .from(pegawai)
    .leftJoin(masterPangkatGolongan, eq(pegawai.idGolongan, masterPangkatGolongan.id));

  const listPegawai = allPegawai.filter(item => {
    const p = item.pegawai;
    const gol = item.master_pangkat_golongan;
    const ket = (p.keterangan || "").toUpperCase();
    const jenisPeg = (gol?.jenisKepegawaian || "").toUpperCase();

    const isExcluded = 
      ket.includes("P3K") || ket.includes("BINA WASUJI") || 
      ket.includes("RIKSA") || ket.includes("SISTEM") || 
      ket.includes("SETDITJEN") || jenisPeg === "NON-ASN" || !gol;

    return !isExcluded;
  }).map(item => item.pegawai);

  const dataAbsen = await db.select()
    .from(presensiHarian)
    .where(and(gte(presensiHarian.tgl, startDate), lte(presensiHarian.tgl, endDate)));

  const dataCuti = await db.select().from(pengajuanCuti);

  console.log(`Dapat ${dataAbsen.length} baris presensi. Memulai agregasi...`);

  const rekapMap: Record<string, any> = {};
  const TOTAL_HARI_KERJA_AGUSTUS = 19; 

  for (const p of listPegawai) {
    rekapMap[p.id] = {
      idPegawai: p.id, bulan: BULAN, tahun: TAHUN,
      hariKerja: TOTAL_HARI_KERJA_AGUSTUS,
      totalMenitTerlambat: 0,
      jumlahLupaAbsen: 0, jumlahAlpa: 0, jumlahTdkUpc: 0,
      cutiSakitBulanIi: false, cutiSakitBulanIii: false, cutiSakitGt3bln: false,
      ctBesarBulanI: false, ctBesarBulanIi: false, ctBesarBulanIii: false,
      jumlahCtGugurKandunganGt1bln: 0,
    };
  }

  for (const absen of dataAbsen) {
    if (!rekapMap[absen.idPegawai]) continue;
    const item = rekapMap[absen.idPegawai];

    if (absen.cekIn) item.jumlahHadirAktual += 1;

    // FIX: Terlambat HANYA WFO & WFH
    if (absen.sistemKerja === 'WFO' || absen.sistemKerja === 'WFH') {
      item.totalMenitTerlambat += Number(absen.terlambat || 0);
    }

    // FIX: Lupa Absen dihitung dari WFO, WFH, DAN Dinas Luar
    if (
      (absen.sistemKerja === 'WFO' || absen.sistemKerja === 'WFH' || absen.sistemKerja === 'Dinas Luar') && 
      (!absen.cekIn || !absen.cekOut)
    ) {
      item.jumlahLupaAbsen += 1;
    }

    if (absen.sistemKerja === 'Alpa') item.jumlahAlpa += 1;
    if (absen.statusAnomali === 'TDK_UPC') item.jumlahTdkUpc += 1;
  }

  for (const cuti of dataCuti) {
    if (!rekapMap[cuti.idPegawai]) continue;
    const item = rekapMap[cuti.idPegawai];
    
    const tglMulai = new Date(cuti.tglMulai);
    const startMonth = tglMulai.getMonth() + 1;
    const startYear = tglMulai.getFullYear();
    const diffMonths = (TAHUN - startYear) * 12 + (BULAN - startMonth);
    
    if (cuti.jenisCuti === 'Sakit') {
      if (diffMonths === 1) item.cutiSakitBulanIi = true;
      if (diffMonths === 2) item.cutiSakitBulanIii = true;
      if (diffMonths > 2) item.cutiSakitGt3bln = true;
    } else if (cuti.jenisCuti === 'Besar') {
      if (diffMonths === 0) item.ctBesarBulanI = true;
      if (diffMonths === 1) item.ctBesarBulanIi = true;
      if (diffMonths === 2) item.ctBesarBulanIii = true;
    } else if (cuti.jenisCuti === 'Gugur Kandungan' && diffMonths > 0) {
      item.jumlahCtGugurKandunganGt1bln += 1;
    }
  }

  const dataToInsert = Object.values(rekapMap).map(rekap => {
    // FIX: Pakai parseFloat dan fallback 0 biar gak NaN
    const potMenitTelat = parseFloat(rekap.totalMenitTerlambat || 0) * 0.01;
    const potLupaAbsen = parseFloat(rekap.jumlahLupaAbsen || 0) * 1;
    const potAlpa = parseFloat(rekap.jumlahAlpa || 0) * 3;
    const potGugurKandungan = parseFloat(rekap.jumlahCtGugurKandunganGt1bln || 0) * 1;
    const potTdkUpc = parseFloat(rekap.jumlahTdkUpc || 0) * 3;

    let potCuti = 0;
    if (rekap.cutiSakitBulanIi) potCuti += 50;
    if (rekap.cutiSakitBulanIii) potCuti += 75;
    if (rekap.cutiSakitGt3bln) potCuti += 100;
    if (rekap.ctBesarBulanI) potCuti += 50;
    if (rekap.ctBesarBulanIi) potCuti += 75;
    if (rekap.ctBesarBulanIii) potCuti += 90;

    const totalPotonganPersen = potMenitTelat + potLupaAbsen + potAlpa + potGugurKandungan + potTdkUpc + potCuti;
    const persentaseKehadiran = Math.max(0, 30 - (totalPotonganPersen * 0.3));

    return {
      idPegawai: rekap.idPegawai, bulan: rekap.bulan, tahun: rekap.tahun,
      hariKerja: rekap.hariKerja,
      totalMenitTerlambat: rekap.totalMenitTerlambat,
      jumlahLupaAbsen: rekap.jumlahLupaAbsen,
      jumlahAlpa: rekap.jumlahAlpa,
      jumlahTdkUpc: rekap.jumlahTdkUpc,
      cutiSakitBulanIi: rekap.cutiSakitBulanIi,
      cutiSakitBulanIii: rekap.cutiSakitBulanIii,
      cutiSakitGt3bln: rekap.cutiSakitGt3bln,
      ctBesarBulanI: rekap.ctBesarBulanI,
      ctBesarBulanIi: rekap.ctBesarBulanIi,
      ctBesarBulanIii: rekap.ctBesarBulanIii,
      jumlahCtGugurKandunganGt1bln: rekap.jumlahCtGugurKandunganGt1bln,
      persentasePotongan: totalPotonganPersen.toFixed(4),
      persentaseKehadiran: persentaseKehadiran.toFixed(4),
      nominalKehadiran: "0.00",
      jumlahPotonganKehadiran: "0.00"
    };
  });

  if (dataToInsert.length > 0) {
    try {
      await db.delete(rekapPresensiBulanan)
        .where(and(eq(rekapPresensiBulanan.bulan, BULAN), eq(rekapPresensiBulanan.tahun, TAHUN)));
      await db.insert(rekapPresensiBulanan).values(dataToInsert);
      console.log("Berhasil generate rekap presensi bulanan!");
    } catch (error) {
      console.error("Gagal insert rekap:", error);
    }
  }
  process.exit(0);
}

generateRekapBulanan();