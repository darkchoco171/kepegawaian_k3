import 'dotenv/config';
import { db } from './index'; 
import { pegawai, presensiHarian, pengajuanCuti } from './schema';
import * as xlsx from 'xlsx';

// ==========================================
// # HELPER FUNCTIONS (ANTI-ERROR)
// # ==========================================

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
    let hours = Math.floor(totalSeconds / 3600);
    let minutes = Math.floor((totalSeconds % 3600) / 60);
    let seconds = totalSeconds % 60;
    
    // FIX 1: Postgres gak terima jam >= 24
    if (hours >= 24) return null; 
    
    let timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    if (timeStr === '00:00:00') return null; // Anggap 00:00 itu lupa absen
    return timeStr;
  }
  const timeStr = String(excelTime).trim();
  const match = timeStr.match(/(\d{1,2}:\d{2}(?::\d{2})?)/);
  if (match) {
    const parts = match[1].split(':');
    let h = parseInt(parts[0]);
    if (h >= 24) return null; // FIX 1 juga
    let result = `${String(h).padStart(2, '0')}:${parts[1].padStart(2, '0')}:${parts[2] ? parts[2].padStart(2, '0') : '00'}`;
    if (result === '00:00:00') return null; 
    return result;
  }
  return null;
}

function formatDate(excelDate: any): string | null {
  if (!excelDate) return null;
  if (excelDate instanceof Date) {
    const d = new Date(excelDate.getTime() - (excelDate.getTimezoneOffset() * 60000));
    return d.toISOString().split('T')[0];
  }
  if (typeof excelDate === 'string') {
    const match = excelDate.match(/(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(excelDate);
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
  if (lower.includes('dinas luar')) return 'Dinas Luar';
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

// ==========================================
// # MAIN SEEDER
// # ==========================================

async function seedPresensi() {
  console.log("Membaca file Excel Data Presensi...");
  const workbook = xlsx.readFile('data_presensi.xlsx', { cellDates: true });
  const rows: any[][] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: null });

  console.log("Menarik data pegawai dari DB untuk pencocokan nama...");
  const dbPegawai = await db.select({ id: pegawai.id, nama: pegawai.namaLengkap }).from(pegawai);
  const mapPegawaiByName = new Map(dbPegawai.map(p => [cleanName(p.nama), p.id]));

  console.log("Memulai import data absensi harian...\n");
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  let currentNamaRaw: string | null = null;
  let currentIdPegawai: string | null = null;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as any[];
    if (!row || row.length === 0 || row.every(cell => cell === null)) continue;

    const col0 = String(row[0] || '').trim().toLowerCase();
    const col1 = String(row[1] || '').trim().toLowerCase();
    if (col0 === 'no' || col1 === 'nama pegawai' || (col0 === '1' && col1 === '2')) continue;

    const namaCell = row[1] ? String(row[1]).trim() : null;
    const tglCell = row[3];

    if (namaCell) {
      currentNamaRaw = namaCell;
      const normalizedExcelName = cleanName(namaCell);
      currentIdPegawai = mapPegawaiByName.get(normalizedExcelName) || null;
    }

    if (!currentIdPegawai || !tglCell) {
      skipCount++;
      continue;
    }

    const tanggalString = formatDate(tglCell);
    if (!tanggalString) {
      skipCount++;
      continue;
    }

    const sistemKerjaRaw = row[5] ? String(row[5]).trim() : 'WFO'; 
    const sistemKerja = mapSistemKerja(sistemKerjaRaw);
    const keteranganCti = row[6] ? String(row[6]).trim() : null;
    
    const cekIn = formatTime(row[7]);
    const cekOut = formatTime(row[8]);
    const isLupaAbsen = (sistemKerja === 'WFO' || sistemKerja === 'WFH') && (!cekIn || !cekOut);

    let idCuti = null;
    if (sistemKerja === 'Cuti' && keteranganCti) {
      try {
        const jenisCuti = mapJenisCuti(keteranganCti);
        const [newCuti] = await db.insert(pengajuanCuti).values({
          idPegawai: currentIdPegawai,
          jenisCuti,
          tglMulai: tanggalString,
          tglSelesai: tanggalString,
          jumlahHari: 1,
          alasan: `Input via Seeder - ${keteranganCti}`,
          statusPengajuan: 'Disetujui',
        }).returning({ id: pengajuanCuti.id });
        idCuti = newCuti.id;
      } catch (cutiErr) {
         // Abaikan error cuti
      }
    }

    // FIX 2: Pake Math.trunc() biar angka desimal di Excel di buang, gak bikin error integer di DB
    const dataToInsert = {
      idPegawai: currentIdPegawai,
      tgl: tanggalString,
      sistemKerja,
      cekIn,
      cekOut,
      jamHarusCheckout: formatTime(row[9]),
      jamMasukStandar: formatTime(row[10]),
      jamToleransiMasuk: formatTime(row[11]),
      jamPulangStandar: formatTime(row[12]),
      jamToleransiPulang: formatTime(row[13]),
      terlambat: Math.trunc(cleanNumber(row[14]) || 0),
      menitKerja: Math.trunc(cleanNumber(row[15]) || 0),
      kekuranganJamKerja: Math.trunc(cleanNumber(row[16]) || 0),
      jumlahMenitKekuranganHarian: Math.trunc(cleanNumber(row[17]) || 0),
      persentasePotonganHarian: cleanNumber(row[18])?.toFixed(4) || "0.0000",
      statusAnomali: isLupaAbsen ? 'LUPA_ABSEN' : null,
      idCuti,
    };

    try {
      await db.insert(presensiHarian).values(dataToInsert)
      .onConflictDoUpdate({
        target: [presensiHarian.idPegawai, presensiHarian.tgl],
        set: {
          sistemKerja: dataToInsert.sistemKerja, 
          cekIn: dataToInsert.cekIn, 
          cekOut: dataToInsert.cekOut, 
          terlambat: dataToInsert.terlambat,
          statusAnomali: dataToInsert.statusAnomali, 
          idCuti: dataToInsert.idCuti
        }
      });
      successCount++;
    } catch (error: any) {
      errorCount++;
      // Print error detail biar kita tau kolom mana yang error
      if (errorCount <= 5) {
        console.error(`\n[Error di Excel Baris ${i+2}] Pegawai: ${currentNamaRaw} | Tgl: ${tanggalString}`);
        console.error("Data yang dikirim:", JSON.stringify(dataToInsert));
        console.error("Pesan DB:", error.message);
      }
    }
  }

  console.log(`\nProses Seeding Absen Selesai.`);
  console.log(`Berhasil = ${successCount} hari absen | Dilewati = ${skipCount} | Gagal Insert = ${errorCount}`);
  process.exit(0);
}

seedPresensi().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});