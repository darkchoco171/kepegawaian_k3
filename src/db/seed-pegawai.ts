import 'dotenv/config';
import { db } from './index'; 
import { 
  pegawai, 
  riwayatPendidikan, 
  riwayatDiklat, 
  masterJabatan, 
  masterPangkatGolongan 
} from './schema';
import * as xlsx from 'xlsx';

function parsePendidikan(text: string | null) {
  if (!text || text === "-" || text.trim() === "") return null;
  const cleanText = text.trim();
  const firstSpaceIndex = cleanText.indexOf(" ");

  return firstSpaceIndex === -1 
    ? { jenjang: cleanText, programStudi: "-" }
    : { jenjang: cleanText.substring(0, firstSpaceIndex), programStudi: cleanText.substring(firstSpaceIndex + 1) };
}

async function seedPegawai() {
  const workbook = xlsx.readFile('data_pegawai_bersih.xlsx', { cellDates: true });
  const rows: any[] = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: null });

  const masterJbt = await db.select().from(masterJabatan);
  const masterGol = await db.select().from(masterPangkatGolongan);

  const mapJabatan = new Map(masterJbt.map(j => [j.namaJabatan.toLowerCase().trim(), j.id]));
  const mapGolongan = new Map(masterGol.map(g => {
    const pangkatVal = g.pangkat ? g.pangkat.toLowerCase().trim() : '';
    const golonganVal = g.golongan ? g.golongan.toLowerCase().trim() : '';
    return [`${pangkatVal}|${golonganVal}`, g.id];
  }));

  let successCount = 0;
  let skipCount = 0;

  for (const [index, row] of rows.entries()) {
    const rowNum = index + 2; 

    if (!row.nip || !row.nama_lengkap) {
      skipCount++;
      continue;
    }

    const idJabatan = row.nama_jabatan ? mapJabatan.get(String(row.nama_jabatan).toLowerCase().trim()) : null;
    
    let idGolongan = null;
    if (row.pangkat || row.golongan) {
      const pangkatExcel = row.pangkat ? String(row.pangkat).replace('Tk.I', 'Tk. I').toLowerCase().trim() : '';
      const golonganExcel = row.golongan ? String(row.golongan).toLowerCase().trim() : '';
      idGolongan = mapGolongan.get(`${pangkatExcel}|${golonganExcel}`) || null;
    }

    if (!idJabatan) {
      console.log(`[Baris ${rowNum}] DILEWATI: Jabatan '${row.nama_jabatan}' belum ada di master.`);
      skipCount++;
      continue; 
    }

    if ((row.pangkat || row.golongan) && !idGolongan) {
      console.log(`[Baris ${rowNum}] DILEWATI: Pangkat/Gol '${row.pangkat}' / '${row.golongan}' belum ada di master.`);
      skipCount++;
      continue; 
    }

    const rawNikah = row.status_pernikahan ? String(row.status_pernikahan).trim().toLowerCase() : '';
    let statusNikahClean = null;
    if (rawNikah.includes('kawin') || rawNikah.includes('nikah')) {
      statusNikahClean = rawNikah.includes('belum') ? 'Belum Kawin' : 'Kawin';
    }

    try {
      const [newPegawai] = await db.insert(pegawai).values({
        idJabatan,
        idGolongan,
        jabatanTim: row.jabatan_tim ? String(row.jabatan_tim).trim() : null,
        nip: String(row.nip).trim(),
        namaLengkap: String(row.nama_lengkap).trim(),
        tempatLahir: row.tempat_lahir ? String(row.tempat_lahir).trim() : null,
        tglLahir: row.tgl_lahir ? new Date(row.tgl_lahir).toISOString().split('T')[0] : null,
        agama: row.agama ? String(row.agama).trim() : null,
        jenisKelamin: row.jenis_kelamin ? (String(row.jenis_kelamin).trim().toUpperCase().charAt(0) as 'L' | 'P') : null,
        statusPernikahan: statusNikahClean,
        tanggalMulaiKerja: row.tmt_kerja ? new Date(row.tmt_kerja).toISOString().split('T')[0] : null,
        kontak: row.kontak ? String(row.kontak).trim() : null,
        keterangan: row.keterangan ? String(row.keterangan).trim() : null
      }).returning({ id: pegawai.id });

      const idPegBaru = newPegawai.id;

      for (let i = 1; i <= 2; i++) {
        const eduText = row[`pendidikan_${i}`];
        const parsedEdu = parsePendidikan(eduText ? String(eduText) : null);
        
        if (parsedEdu) {
          await db.insert(riwayatPendidikan).values({
            idPegawai: idPegBaru,
            jenjang: parsedEdu.jenjang,
            programStudi: parsedEdu.programStudi,
            namaInstitusi: "-"
          });
        }
      }

      for (let i = 1; i <= 3; i++) {
        const nmDiklat = row[`nama_diklat_${i}`];
        const thnDiklat = row[`tahun_diklat_${i}`];

        if (nmDiklat && String(nmDiklat).trim() !== "-" && String(nmDiklat).trim() !== "") {
          await db.insert(riwayatDiklat).values({
            idPegawai: idPegBaru,
            namaDiklat: String(nmDiklat).trim(),
            tahunDiklat: thnDiklat && !isNaN(parseInt(thnDiklat)) ? parseInt(thnDiklat) : null,
          });
        }
      }

      console.log(`[Baris ${rowNum}] BERHASIL: ${row.nama_lengkap}`);
      successCount++;

    } catch (error) {
      console.error(`[Baris ${rowNum}] ERROR insert:`, error);
    }
  }

  console.log(`\nSelesai! Berhasil = ${successCount} | Dilewati = ${skipCount}`);
  process.exit(0);
}

seedPegawai().catch((err) => {
  console.error("Fatal Error:", err);
  process.exit(1);
});