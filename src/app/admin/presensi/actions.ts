'use server';

import { eq, and, lte, gte } from 'drizzle-orm';
import { db } from '@/lib/db';
import { presensiHarian, pegawai, masterJabatan, masterKelasJabatan, rekapPresensiBulanan, pengajuanCuti } from '@/db/schema';
import { revalidatePath } from 'next/cache';
import * as xlsx from 'xlsx';

export async function importPresensiData(formData: FormData) {
  const idPegawai = formData.get('idPegawai') as string;
  const tgl = formData.get('tgl') as string;
  const cekIn = formData.get('cekIn') as string;
  const cekOut = formData.get('cekOut') as string;

  // Normalisasi string sistem kerja (bikin uppercase atau trim biar aman)
  const rawSistemKerja = (formData.get('sistemKerja') as string) || 'WFO';
  const sistemKerja = rawSistemKerja.trim();

  let statusAnomali: string | null = null;

  if (!idPegawai || !tgl) return;

  // Cek apakah weekend (Sabtu / Minggu)
  const dateObj = new Date(tgl);
  const dayOfWeek = dateObj.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // --- LOGIKA OTOMATIS STATUS ANOMALI ---
  if (sistemKerja.toLowerCase() === 'upacara') {
    if (isWeekend) {
      if (!cekIn) {
        statusAnomali = 'Tidak Upacara';
      }
    } else {
      if (!cekIn || !cekOut) {
        statusAnomali = 'Lupa Absen';
      }
    }
  } else if (['WFO', 'WFH', 'DL', 'Dinas Luar'].includes(sistemKerja)) {
    // Semua kategori ini wajib check-in dan check-out
    if (!cekIn || !cekOut) {
      statusAnomali = 'Lupa Absen';
    } else {
      // Khusus WFO & WFH, hitung menit terlambat (DL kebal dari hitungan telat)
      if (['WFO', 'WFH'].includes(sistemKerja.toUpperCase())) {
        const [jamMasukH, jamMasukM] = [7, 30]; // Jam masuk kantor 07:30
        const [cekInH, cekInM] = cekIn.split(':').map(Number);

        if (!isNaN(cekInH) && !isNaN(cekInM)) {
          const totalMenitJadwal = jamMasukH * 60 + jamMasukM;
          const totalMenitAbsen = cekInH * 60 + cekInM;
          const selisihMenit = totalMenitAbsen - totalMenitJadwal;

          if (selisihMenit > 300) {
            statusAnomali = 'Lupa Absen'; // Telat > 300 menit otomatis jadi Lupa Absen
          } else if (selisihMenit > 0) {
            statusAnomali = `Terlambat ${selisihMenit} menit`;
          }
        }
      }
    }
  }

  // Simpan ke database
  await db.insert(presensiHarian).values({
    idPegawai,
    tgl,
    sistemKerja: (sistemKerja === 'DL' ? 'Dinas Luar' : sistemKerja) as any,
    cekIn: cekIn || null,
    cekOut: cekOut || null,
    statusAnomali: statusAnomali,
  });

  revalidatePath('/admin/presensi');
}

// ==========================================
// # HELPER FUNCTIONS (ANTI-ERROR & TIMEZONE SAFE)
// ==========================================

const cleanName = (name: string) => {
  if (!name) return '';
  let n = String(name).toLowerCase();
  if (n.includes('din anisa') || n.includes('din annisa')) return 'dinannisazuhra';
  if (n.includes('andi muh')) return 'andimuhadhim';
  n = n.replace(/^(dr\.|drg\.|prof\.|ir\.|hj\.|h\.)\s*/g, '');
  n = n.split(',')[0];
  n = n.replace(/\b(s\.[a-z]+(\.[a-z]+)*)\b/g, '');
  n = n.replace(/\b(m\.[a-z]+(\.[a-z]+)*)\b/g, '');
  n = n.replace(/\b(a\.md)\b/g, '');
  return n.replace(/[^a-z]/g, '');
};

function cleanNumber(val: any): number | null {
  if (val === null || val === undefined || val === '*' || val === '') return null;
  if (typeof val === 'string' && (val.startsWith('#') || val.trim() === '')) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}

function formatTime(excelTime: any): string | null {
  if (!excelTime || excelTime === '*') return null;
  if (typeof excelTime === 'number') {
    const totalSeconds = Math.round(excelTime * 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours >= 24) return null;
    const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (timeStr === '00:00:00') return null;
    return timeStr;
  }
  const timeStr = String(excelTime).trim();
  const match = timeStr.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (match) {
    const parts = match[1].split(':');
    const h = parseInt(parts[0]);
    if (h >= 24) return null;
    const result = `${String(h).padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2] ? parts[2].padStart(2, '0') : '00'}`;
    if (result === '00:00:00') return null;
    return result;
  }
  return null;
}

function formatDate(excelDate: any): string | null {
  if (!excelDate) return null;

  // 1. Jika bertipe number (Excel serial date code, misal 46237)
  if (typeof excelDate === 'number') {
    try {
      const dateObj = xlsx.SSF.parse_date_code(excelDate);
      if (dateObj) {
        const y = dateObj.y;
        const m = String(dateObj.m).padStart(2, '0');
        const d = String(dateObj.d).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // fallback
    }
  }

  // 2. Jika bertipe Date (karena cellDates: true)
  if (excelDate instanceof Date) {
    if (isNaN(excelDate.getTime())) return null;
    // Tambahkan buffer 12 jam (tengah hari) agar tidak terpeleset ke hari sebelumnya
    const safeDate = new Date(excelDate.getTime() + (12 * 60 * 60 * 1000));
    return safeDate.toISOString().split('T')[0];
  }

  // 3. Jika bertipe string
  if (typeof excelDate === 'string') {
    const trimmed = excelDate.trim();

    // Format ISO: YYYY-MM-DD
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (isoMatch) {
      return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
    }

    // Format DD/MM/YYYY atau DD-MM-YYYY (seperti di bar fx Excel: 03/08/2026)
    const dmyMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (dmyMatch) {
      const d = dmyMatch[1].padStart(2, '0');
      const m = dmyMatch[2].padStart(2, '0');
      const y = dmyMatch[3];
      return `${y}-${m}-${d}`;
    }

    // Format DD-MMM-YY atau DD-MMM-YYYY (seperti tampilan custom Excel: 03-Aug-26)
    const dMmmMatch = trimmed.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{2,4})$/);
    if (dMmmMatch) {
      const monthMap: Record<string, string> = {
        jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
        jun: '06', jul: '07', agu: '08', aug: '08', sep: '09', okt: '10', oct: '10',
        nov: '11', des: '12', dec: '12'
      };
      const d = dMmmMatch[1].padStart(2, '0');
      const mStr = dMmmMatch[2].toLowerCase();
      const m = monthMap[mStr];
      let y = dMmmMatch[3];
      if (y.length === 2) {
        y = Number(y) < 70 ? `20${y}` : `19${y}`;
      }
      if (m) {
        return `${y}-${m}-${d}`;
      }
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return null;
}

function mapSistemKerja(val: string): 'WFO' | 'WFH' | 'Dinas Luar' | 'Cuti' | 'Upacara' | 'Alpa' {
  const lower = (val || '').toLowerCase();
  if (lower.includes('wfo')) return 'WFO';
  if (lower.includes('wfh')) return 'WFH';
  if (lower.includes('dinas luar') || lower.includes('dl')) return 'Dinas Luar';
  if (lower.includes('alpa') || lower.includes('tidak hadir')) return 'Alpa';
  if (lower.includes('upacara')) return 'Upacara';
  if (lower.includes('cuti')) return 'Cuti';
  return 'WFO';
}

function mapJenisCuti(val: string): 'Tahunan' | 'Sakit' | 'Besar' | 'Melahirkan' | 'Alasan Penting' | 'Gugur Kandungan' | 'Lainnya' {
  const lower = (val || '').toLowerCase();
  if (lower.includes('tahunan')) return 'Tahunan';
  if (lower.includes('sakit')) return 'Sakit';
  if (lower.includes('besar')) return 'Besar';
  if (lower.includes('melahirkan')) return 'Melahirkan';
  if (lower.includes('alasan penting')) return 'Alasan Penting';
  if (lower.includes('gugur')) return 'Gugur Kandungan';
  return 'Lainnya';
}

export async function prosesImportPresensiExcel(formData: FormData) {
  try {
    const file = formData.get('file') as File;
    if (!file || !(file instanceof File)) {
      return { status: 'error', message: 'File Excel tidak ditemukan.' };
    }

    const bulanTarget = Number(formData.get('bulan')) || (new Date().getMonth() + 1);
    const tahunTarget = Number(formData.get('tahun')) || new Date().getFullYear();

    // 1. Baca Buffer Excel di Server
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const workbook = xlsx.read(buffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows: any[][] = xlsx.utils.sheet_to_json(sheet, { header: 1, defval: null });

    // 2. Ambil Data Master Pegawai
    const listPegawai = await db
      .select({
        id: pegawai.id,
        nip: pegawai.nip,
        namaLengkap: pegawai.namaLengkap,
        baseTukin: masterKelasJabatan.baseTukin,
      })
      .from(pegawai)
      .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
      .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id));

    const mapPegawaiByNip = new Map(listPegawai.filter(p => !!p.nip).map(p => [p.nip!.trim(), p]));
    const mapPegawaiByName = new Map(listPegawai.map(p => [cleanName(p.namaLengkap), p]));

    let insertedHarian = 0;
    const rekapBulanan: Record<string, any> = {};

    let currentPegawai: typeof listPegawai[0] | null = null;

    // 3. Loop baris Excel untuk simpan presensi_harian & hitung akumulasi
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any[];
      if (!row || row.length === 0 || row.every(cell => cell === null)) continue;

      const col0 = String(row[0] || '').trim().toLowerCase();
      const col1 = String(row[1] || '').trim().toLowerCase();
      if (col0 === 'no' || col1 === 'nama pegawai' || (col0 === '1' && col1 === '2')) continue;

      const namaCell = row[1] ? String(row[1]).trim() : null;
      const nipCell = row[2] ? String(row[2]).trim() : null;
      const tglCell = row[3];

      if (nipCell && mapPegawaiByNip.has(nipCell)) {
        currentPegawai = mapPegawaiByNip.get(nipCell)!;
      } else if (namaCell) {
        const normalized = cleanName(namaCell);
        currentPegawai = mapPegawaiByName.get(normalized) || null;
      }

      if (!currentPegawai || !tglCell) continue;

      const tanggalString = formatDate(tglCell);
      if (!tanggalString) continue;

      const sistemKerjaRaw = row[5] ? String(row[5]).trim() : 'WFO';
      const sistemKerja = mapSistemKerja(sistemKerjaRaw);
      const keteranganCti = row[6] ? String(row[6]).trim() : null;

      const cekIn = formatTime(row[7]);
      const cekOut = formatTime(row[8]);
      const isLupaAbsen = (sistemKerja === 'WFO' || sistemKerja === 'WFH') && (!cekIn || !cekOut);

      let statusAnomali: string | null = null;
      if (isLupaAbsen) {
        statusAnomali = 'LUPA_ABSEN';
      }

      let idCuti: string | null = null;
      if (sistemKerja === 'Cuti') {
        try {
          // 1. Cek apakah cuti untuk hari ini sudah ada sebelumnya di tabel pengajuan_cuti
          const existingCuti = await db.query.pengajuanCuti.findFirst({
            where: and(
              eq(pengajuanCuti.idPegawai, currentPegawai.id),
              lte(pengajuanCuti.tglMulai, tanggalString),
              gte(pengajuanCuti.tglSelesai, tanggalString)
            )
          });

          if (existingCuti) {
            // Gunakan ID cuti yang sudah ada agar tidak duplikat
            idCuti = existingCuti.id;
          } else if (keteranganCti) {
            // Jika belum ada, baru buat record cuti baru
            const jenisCuti = mapJenisCuti(keteranganCti);
            const [newCuti] = await db.insert(pengajuanCuti).values({
              idPegawai: currentPegawai.id,
              jenisCuti,
              tglMulai: tanggalString,
              tglSelesai: tanggalString,
              jumlahHari: 1,
              alasan: `Input via Import Presensi - ${keteranganCti}`,
              statusPengajuan: 'Disetujui',
            }).returning({ id: pengajuanCuti.id });
            idCuti = newCuti.id;
          }
        } catch {
          // Abaikan jika error
        }
      }

      const terlambat = Math.trunc(cleanNumber(row[14]) || 0);
      const persenPotonganHarian = cleanNumber(row[18]) || 0;

      const dataToInsert = {
        idPegawai: currentPegawai.id,
        tgl: tanggalString,
        sistemKerja,
        cekIn,
        cekOut,
        jamHarusCheckout: formatTime(row[9]),
        jamMasukStandar: formatTime(row[10]),
        jamToleransiMasuk: formatTime(row[11]),
        jamPulangStandar: formatTime(row[12]),
        jamToleransiPulang: formatTime(row[13]),
        terlambat,
        menitKerja: Math.trunc(cleanNumber(row[15]) || 0),
        kekuranganJamKerja: Math.trunc(cleanNumber(row[16]) || 0),
        jumlahMenitKekuranganHarian: Math.trunc(cleanNumber(row[17]) || 0),
        persentasePotonganHarian: persenPotonganHarian > 0 ? persenPotonganHarian.toString() : null,
        statusAnomali,
        idCuti,
      };

      await db.insert(presensiHarian).values(dataToInsert)
        .onConflictDoUpdate({
          target: [presensiHarian.idPegawai, presensiHarian.tgl],
          set: {
            sistemKerja: dataToInsert.sistemKerja,
            cekIn: dataToInsert.cekIn,
            cekOut: dataToInsert.cekOut,
            jamHarusCheckout: dataToInsert.jamHarusCheckout,
            jamMasukStandar: dataToInsert.jamMasukStandar,
            jamToleransiMasuk: dataToInsert.jamToleransiMasuk,
            jamPulangStandar: dataToInsert.jamPulangStandar,
            jamToleransiPulang: dataToInsert.jamToleransiPulang,
            terlambat: dataToInsert.terlambat,
            menitKerja: dataToInsert.menitKerja,
            kekuranganJamKerja: dataToInsert.kekuranganJamKerja,
            jumlahMenitKekuranganHarian: dataToInsert.jumlahMenitKekuranganHarian,
            persentasePotonganHarian: dataToInsert.persentasePotonganHarian,
            statusAnomali: dataToInsert.statusAnomali,
            idCuti: dataToInsert.idCuti,
          }
        });

      insertedHarian++;

      // Akumulasi rekap bulanan
      const idPeg = currentPegawai.id;
      if (!rekapBulanan[idPeg]) {
        rekapBulanan[idPeg] = {
          totalHariKerja: 0,
          totalPotonganPersen: 0,
          totalMenitTelat: 0,
          baseTukin: Number(currentPegawai.baseTukin || 0)
        };
      }
      rekapBulanan[idPeg].totalHariKerja += 1;
      rekapBulanan[idPeg].totalPotonganPersen += persenPotonganHarian;
      rekapBulanan[idPeg].totalMenitTelat += terlambat;
    }

    // 4. Upsert ke rekapPresensiBulanan
    for (const [idPegawai, dataRekap] of Object.entries(rekapBulanan)) {
      let totalPotongan = dataRekap.totalPotonganPersen;
      if (totalPotongan > 100) totalPotongan = 100;

      const persentaseKehadiranNum = 100 - totalPotongan;
      const maksimalKehadiran = dataRekap.baseTukin * 0.30;
      const nominalKehadiranNum = maksimalKehadiran * (persentaseKehadiranNum / 100);
      const potonganKehadiranNum = maksimalKehadiran - nominalKehadiranNum;

      await db
        .insert(rekapPresensiBulanan)
        .values({
          idPegawai,
          bulan: bulanTarget,
          tahun: tahunTarget,
          hariKerja: dataRekap.totalHariKerja,
          totalMenitTerlambat: dataRekap.totalMenitTelat,
          jumlahLupaAbsen: 0,
          jumlahAlpa: 0,
          jumlahCtGugurKandunganGt1Bln: 0,
          persentasePotongan: totalPotongan.toFixed(2),
          persentaseKehadiran: persentaseKehadiranNum.toFixed(2),
          nominalKehadiran: nominalKehadiranNum.toFixed(2),
          jumlahPotonganKehadiran: potonganKehadiranNum.toFixed(2),
        })
        .onConflictDoUpdate({
          target: [rekapPresensiBulanan.idPegawai, rekapPresensiBulanan.bulan, rekapPresensiBulanan.tahun],
          set: {
            hariKerja: dataRekap.totalHariKerja,
            totalMenitTerlambat: dataRekap.totalMenitTelat,
            persentasePotongan: totalPotongan.toFixed(2),
            persentaseKehadiran: persentaseKehadiranNum.toFixed(2),
            nominalKehadiran: nominalKehadiranNum.toFixed(2),
            jumlahPotonganKehadiran: potonganKehadiranNum.toFixed(2),
            updatedAt: new Date(),
          },
        });
    }

    revalidatePath('/admin/presensi');
    revalidatePath('/admin/tukin');
    revalidatePath('/admin/dashboard');

    return {
      status: 'success',
      message: `Berhasil mengimpor ${insertedHarian} data absensi harian untuk ${Object.keys(rekapBulanan).length} pegawai.`
    };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}