import { db } from './index';
import { pegawai, pengajuanCuti, presensiHarian } from './schema';
import { eq, and, lte, gte } from 'drizzle-orm';

// 71 Data detail riwayat cuti hasil ekstrak otomatis dari Excel
const riwayatCutiExcel = [
  {"namaLengkap": "dr. Muzakir, M.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-15", "tglSelesai": "2026-06-15", "jumlahHari": 1, "alasan": "Data Rekap 15 Juni 2026"},
  {"namaLengkap": "Eef Saefulloh, S.Si., M.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-03-02", "tglSelesai": "2026-03-17", "jumlahHari": 12, "alasan": "Data Rekap 2 - 17 Maret 2026"},
  {"namaLengkap": "Dr. dr. Sudi Astono, M.S.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-01", "tglSelesai": "2026-06-12", "jumlahHari": 12, "alasan": "Data Rekap Cuti Besar"},
  {"namaLengkap": "Dr. Daafi Armanda, S.T., M.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-13", "tglSelesai": "2026-07-14", "jumlahHari": 2, "alasan": "Data Rekap 13-14 Juli 2026"},
  {"namaLengkap": "Dr. Daafi Armanda, S.T., M.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-09-24", "tglSelesai": "2026-09-24", "jumlahHari": 1, "alasan": "Data Rekap 24 Sept 2026"},
  {"namaLengkap": "dr. Erdiana Muliawaty Hasoloan Lahi, M.Si.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-04", "tglSelesai": "2026-06-05", "jumlahHari": 2, "alasan": "Data Rekap 4-5 Juni 2026"},
  {"namaLengkap": "dr. Erdiana Muliawaty Hasoloan Lahi, M.Si.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-31", "tglSelesai": "2026-07-31", "jumlahHari": 1, "alasan": "Data Rekap 31 Juli 2026"},
  {"namaLengkap": "dr. Erdiana Muliawaty Hasoloan Lahi, M.Si.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-03", "tglSelesai": "2026-08-24", "jumlahHari": 2, "alasan": "Data Rekap 3 dan 24 Agustus 2026"},
  {"namaLengkap": "Fennia Herma Yunita, S.K.M., M.K.K.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-13", "tglSelesai": "2026-07-13", "jumlahHari": 1, "alasan": "Data Rekap 13 Juli 2026"},
  {"namaLengkap": "Supriadi S.T., M.H.", "jenisCuti": "Tahunan", "tglMulai": "2026-03-16", "tglSelesai": "2026-03-17", "jumlahHari": 2, "alasan": "Data Rekap 16-17 Maret 2026"},
  {"namaLengkap": "Supriadi S.T., M.H.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-26", "jumlahHari": 2, "alasan": "Data Rekap 25-26 Mei 2026"},
  {"namaLengkap": "Supriadi S.T., M.H.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-01", "tglSelesai": "2026-07-03", "jumlahHari": 3, "alasan": "Data Rekap 1-3 Juli 2026"},
  {"namaLengkap": "Hadi Prayitno S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-03-30", "tglSelesai": "2026-03-31", "jumlahHari": 2, "alasan": "Data Rekap 30-31 Maret 2026"},
  {"namaLengkap": "Hadi Prayitno S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-04-01", "tglSelesai": "2026-04-02", "jumlahHari": 2, "alasan": "Data Rekap 1-2 April 2026"},
  {"namaLengkap": "Umi Muroah Dwi Yugowati S.Si.", "jenisCuti": "Tahunan", "tglMulai": "2026-04-02", "tglSelesai": "2026-04-06", "jumlahHari": 2, "alasan": "Data Rekap 2-6 April 2026"},
  {"namaLengkap": "Rivaz Rihardian S.Ikom", "jenisCuti": "Tahunan", "tglMulai": "2026-09-21", "tglSelesai": "2026-09-30", "jumlahHari": 8, "alasan": "Data Rekap 21-30 Sept 2026"},
  {"namaLengkap": "Rivaz Rihardian S.Ikom", "jenisCuti": "Tahunan", "tglMulai": "2026-10-01", "tglSelesai": "2026-10-02", "jumlahHari": 2, "alasan": "Data Rekap 1-2 Okt 2026"},
  {"namaLengkap": "Astri Ardani S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-02-04", "tglSelesai": "2026-02-04", "jumlahHari": 1, "alasan": "Data Rekap 4 Feb 2026"},
  {"namaLengkap": "Beti Adika Putri S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-15", "tglSelesai": "2026-06-15", "jumlahHari": 1, "alasan": "Data Rekap 15 Juni 2026"},
  {"namaLengkap": "Beti Adika Putri S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-20", "tglSelesai": "2026-07-21", "jumlahHari": 2, "alasan": "Data Rekap 20-21 Juli 2026"},
  {"namaLengkap": "Amelia Yuswidyastika S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-18", "tglSelesai": "2026-05-29", "jumlahHari": 8, "alasan": "Data Rekap 18-29 Mei 2026"},
  {"namaLengkap": "Amelia Yuswidyastika S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-24", "tglSelesai": "2026-08-24", "jumlahHari": 1, "alasan": "Data Rekap 24 Agustus 2026"},
  {"namaLengkap": "Fatma Fitriana Sakinah S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-03-16", "tglSelesai": "2026-03-17", "jumlahHari": 2, "alasan": "Data Rekap 16-17 Maret 2026"},
  {"namaLengkap": "Fatma Fitriana Sakinah S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-26", "jumlahHari": 2, "alasan": "Data Rekap 25-26 Mei 2026"},
  {"namaLengkap": "Resty Wulandari S.K.M., M.K.K.K.", "jenisCuti": "Tahunan", "tglMulai": "2026-03-30", "tglSelesai": "2026-03-31", "jumlahHari": 2, "alasan": "Data Rekap 30-31 Maret 2026"},
  {"namaLengkap": "Resty Wulandari S.K.M., M.K.K.K.", "jenisCuti": "Tahunan", "tglMulai": "2026-04-01", "tglSelesai": "2026-04-02", "jumlahHari": 2, "alasan": "Data Rekap 1-2 April 2026"},
  {"namaLengkap": "Resty Wulandari S.K.M., M.K.K.K.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-13", "tglSelesai": "2026-07-13", "jumlahHari": 1, "alasan": "Data Rekap 13 Juli 2026"},
  {"namaLengkap": "Siska Nina Asri A.Md.", "jenisCuti": "Tahunan", "tglMulai": "2026-02-04", "tglSelesai": "2026-02-04", "jumlahHari": 1, "alasan": "Data Rekap 4 Feb 2026"},
  {"namaLengkap": "Siska Nina Asri A.Md.", "jenisCuti": "Tahunan", "tglMulai": "2026-04-28", "tglSelesai": "2026-04-28", "jumlahHari": 1, "alasan": "Data Rekap 28 April 2026"},
  {"namaLengkap": "Siska Nina Asri A.Md.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-25", "tglSelesai": "2026-06-25", "jumlahHari": 1, "alasan": "Data Rekap 25 Juni 2026"},
  {"namaLengkap": "Siska Nina Asri A.Md.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-13", "tglSelesai": "2026-07-14", "jumlahHari": 2, "alasan": "Data Rekap 13-14 Juli 2026"},
  {"namaLengkap": "Siska Nina Asri A.Md.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-26", "tglSelesai": "2026-08-26", "jumlahHari": 1, "alasan": "Data Rekap 26 Agustus 2026"},
  {"namaLengkap": "Rahmi Fidyatun Nida S.E.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-24", "tglSelesai": "2026-08-24", "jumlahHari": 1, "alasan": "Data Rekap 24 Agustus 2026"},
  {"namaLengkap": "Dinar Anggita Restuti S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-12", "tglSelesai": "2026-08-12", "jumlahHari": 1, "alasan": "Data Rekap 12 Agustus 2026"},
  {"namaLengkap": "Nisa Hanif Widyanti S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-15", "tglSelesai": "2026-06-15", "jumlahHari": 1, "alasan": "Data Rekap 15 Juni 2026"},
  {"namaLengkap": "Nisa Hanif Widyanti S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-24", "tglSelesai": "2026-08-24", "jumlahHari": 1, "alasan": "Data Rekap 24 Agustus 2026"},
  {"namaLengkap": "Johannes Pakpahan S. Psi.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-20", "tglSelesai": "2026-07-20", "jumlahHari": 1, "alasan": "Data Rekap 20 Juli 2026"},
  {"namaLengkap": "Gunawan Wibiksana S.H.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-11", "tglSelesai": "2026-06-12", "jumlahHari": 2, "alasan": "Data Rekap 11-12 Juni 2026"},
  {"namaLengkap": "Andi Muh. Adhim", "jenisCuti": "Tahunan", "tglMulai": "2026-05-26", "tglSelesai": "2026-05-29", "jumlahHari": 2, "alasan": "Data Rekap 26-29 Mei 2026"},
  {"namaLengkap": "Andi Muh. Adhim", "jenisCuti": "Tahunan", "tglMulai": "2026-09-04", "tglSelesai": "2026-09-07", "jumlahHari": 2, "alasan": "Data Rekap 4-7 Sept 2026"},
  {"namaLengkap": "Din Anisa Zuhra S.I.Kom", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-26", "jumlahHari": 2, "alasan": "Data Rekap 25-26 Mei 2026"},
  {"namaLengkap": "Rizky Adrian Noer S.K.M", "jenisCuti": "Tahunan", "tglMulai": "2026-02-18", "tglSelesai": "2026-02-20", "jumlahHari": 3, "alasan": "Data Rekap 18-20 Feb 2026"},
  {"namaLengkap": "Rizky Adrian Noer S.K.M", "jenisCuti": "Tahunan", "tglMulai": "2026-03-25", "tglSelesai": "2026-03-27", "jumlahHari": 3, "alasan": "Data Rekap 25-27 Maret 2026"},
  {"namaLengkap": "Rizky Adrian Noer S.K.M", "jenisCuti": "Tahunan", "tglMulai": "2026-06-10", "tglSelesai": "2026-06-11", "jumlahHari": 2, "alasan": "Data Rekap 10-11 Juni 2026"},
  {"namaLengkap": "Rizky Adrian Noer S.K.M", "jenisCuti": "Tahunan", "tglMulai": "2026-09-09", "tglSelesai": "2026-09-09", "jumlahHari": 1, "alasan": "Data Rekap 9 Sept 2026"},
  {"namaLengkap": "Meka Cintia A.Md", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-26", "jumlahHari": 2, "alasan": "Data Rekap 25-26 Mei 2026"},
  {"namaLengkap": "Meka Cintia A.Md", "jenisCuti": "Tahunan", "tglMulai": "2026-06-02", "tglSelesai": "2026-06-02", "jumlahHari": 1, "alasan": "Data Rekap 2 Juni 2026"},
  {"namaLengkap": "Meka Cintia A.Md", "jenisCuti": "Tahunan", "tglMulai": "2026-07-13", "tglSelesai": "2026-07-15", "jumlahHari": 3, "alasan": "Data Rekap 13-15 Juli 2026"},
  {"namaLengkap": "Meka Cintia A.Md", "jenisCuti": "Tahunan", "tglMulai": "2026-08-26", "tglSelesai": "2026-08-27", "jumlahHari": 2, "alasan": "Data Rekap 26-27 Agustus 2026"},
  {"namaLengkap": "Disky Arfani S.E", "jenisCuti": "Tahunan", "tglMulai": "2026-06-15", "tglSelesai": "2026-06-17", "jumlahHari": 2, "alasan": "Data Rekap 15-17 Juni 2026"},
  {"namaLengkap": "Disky Arfani S.E", "jenisCuti": "Tahunan", "tglMulai": "2026-08-24", "tglSelesai": "2026-08-26", "jumlahHari": 2, "alasan": "Data Rekap 24-26 Agustus 2026"},
  {"namaLengkap": "Bella Destasari, S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-01-02", "tglSelesai": "2026-01-02", "jumlahHari": 1, "alasan": "Data Rekap 2 Jan 2026"},
  {"namaLengkap": "Bella Destasari, S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-03-16", "tglSelesai": "2026-03-17", "jumlahHari": 2, "alasan": "Data Rekap 16-17 Maret 2026"},
  {"namaLengkap": "Bella Destasari, S.K.M.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-26", "jumlahHari": 2, "alasan": "Data Rekap 25-26 Mei 2026"},
  {"namaLengkap": "Harjito, S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-01-02", "tglSelesai": "2026-01-02", "jumlahHari": 1, "alasan": "Data Rekap 2 Jan 2026"},
  {"namaLengkap": "Harjito, S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-04-20", "tglSelesai": "2026-04-20", "jumlahHari": 1, "alasan": "Data Rekap 20 April 2026"},
  {"namaLengkap": "Harjito, S.T.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-26", "tglSelesai": "2026-08-26", "jumlahHari": 1, "alasan": "Data Rekap 26 Agustus 2026"},
  {"namaLengkap": "Raden Wahyu Hartadji, S.Kom.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-29", "tglSelesai": "2026-05-29", "jumlahHari": 1, "alasan": "Data Rekap 29 Mei 2026"},
  {"namaLengkap": "Raden Wahyu Hartadji, S.Kom.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-01", "tglSelesai": "2026-06-02", "jumlahHari": 2, "alasan": "Data Rekap 1-2 Juni 2026"},
  {"namaLengkap": "Raden Wahyu Hartadji, S.Kom.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-03", "tglSelesai": "2026-08-03", "jumlahHari": 1, "alasan": "Data Rekap 3 Agustus 2026"},
  {"namaLengkap": "Achmad Farich Husni, S.Kom.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-26", "jumlahHari": 2, "alasan": "Data Rekap 25-26 Mei 2026"},
  {"namaLengkap": "Anisa Rahmah, S.Pd.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-06", "tglSelesai": "2026-07-06", "jumlahHari": 1, "alasan": "Data Rekap 6 Juli 2026"},
  {"namaLengkap": "Anisa Rahmah, S.Pd.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-10", "tglSelesai": "2026-08-31", "jumlahHari": 2, "alasan": "Data Rekap 10 & 31 Agustus 2026"},
  {"namaLengkap": "Anisa Rahmah, S.Pd.", "jenisCuti": "Tahunan", "tglMulai": "2026-09-01", "tglSelesai": "2026-09-01", "jumlahHari": 1, "alasan": "Data Rekap 1 Sept 2026"},
  {"namaLengkap": "Sukisno, S.Pd.", "jenisCuti": "Tahunan", "tglMulai": "2026-02-27", "tglSelesai": "2026-02-27", "jumlahHari": 1, "alasan": "Data Rekap 27 Feb 2026"},
  {"namaLengkap": "Sukisno, S.Pd.", "jenisCuti": "Tahunan", "tglMulai": "2026-05-25", "tglSelesai": "2026-05-29", "jumlahHari": 3, "alasan": "Data Rekap 25-29 Mei 2026"},
  {"namaLengkap": "Sukisno, S.Pd.", "jenisCuti": "Tahunan", "tglMulai": "2026-08-18", "tglSelesai": "2026-08-18", "jumlahHari": 1, "alasan": "Data Rekap 18 Agustus 2026"},
  {"namaLengkap": "Retno Indah Puspita, A.Md.", "jenisCuti": "Tahunan", "tglMulai": "2026-06-18", "tglSelesai": "2026-06-18", "jumlahHari": 1, "alasan": "Data Rekap 18 Juni 2026"},
  {"namaLengkap": "Nuria Utamiarti S.E., M.Si.", "jenisCuti": "Tahunan", "tglMulai": "2026-04-29", "tglSelesai": "2026-04-29", "jumlahHari": 1, "alasan": "Data Rekap 29 April 2026"},
  {"namaLengkap": "Windu Jatiarso, S.T., M.Si.", "jenisCuti": "Tahunan", "tglMulai": "2026-07-06", "tglSelesai": "2026-07-22", "jumlahHari": 2, "alasan": "Data Rekap 6 & 22 Juli 2026"},
  {"namaLengkap": "dr. Tresye Widiastuty Paidi", "jenisCuti": "Tahunan", "tglMulai": "2026-08-24", "tglSelesai": "2026-08-24", "jumlahHari": 1, "alasan": "Data Rekap 24 Agustus 2026"}
];

// Helper pembersih string biar gampang nyocokin nama
function cleanName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function seedRiwayatCuti() {
  console.log('Mulai insert 71 data riwayat cuti dari Excel...');
  
  const semuaPegawai = await db.query.pegawai.findMany({
    columns: { id: true, namaLengkap: true }
  });

  const mapPegawai = new Map(semuaPegawai.map(p => [cleanName(p.namaLengkap), p.id]));
  let inserted = 0;
  let notFound = 0;

  for (const cuti of riwayatCutiExcel) {
    const cleanedName = cleanName(cuti.namaLengkap);
    let idPegawai = mapPegawai.get(cleanedName);

    if (!idPegawai) {
       const firstTwoNames = cuti.namaLengkap.split(' ').slice(0,2).join('').toLowerCase().replace(/[^a-z]/g, '');
       for (const [key, id] of mapPegawai.entries()) {
           if (key.includes(firstTwoNames)) {
               idPegawai = id; break;
           }
       }
    }

    if (idPegawai) {
      // 1. CEK APAKAH CUTI DI TANGGAL INI UDAH ADA DARI DATA ABSENSI
      const existingCuti = await db.query.pengajuanCuti.findFirst({
        where: and(
          eq(pengajuanCuti.idPegawai, idPegawai),
          // Cek Overlap: TglMulai DB <= TglSelesai Excel AND TglSelesai DB >= TglMulai Excel
          lte(pengajuanCuti.tglMulai, cuti.tglSelesai),
          gte(pengajuanCuti.tglSelesai, cuti.tglMulai)
        )
      });

      // 2. KALAU BENTROK (Udah ada di absensi), SKIP DATA EXCEL INI
      if (existingCuti) {
        console.log(`⏩ Skip: Cuti ${cuti.namaLengkap} tgl ${cuti.tglMulai} udah tercatat dari absensi (Jenis: ${existingCuti.jenisCuti}).`);
        continue;
      }

      // 3. KALAU AMAN (Belum ada di absensi), BARU INSERT DATA EXCEL
      const [newCuti] = await db.insert(pengajuanCuti).values({
        idPegawai: idPegawai,
        jenisCuti: cuti.jenisCuti as any,
        tglMulai: cuti.tglMulai,
        tglSelesai: cuti.tglSelesai,
        jumlahHari: cuti.jumlahHari,
        alasan: cuti.alasan,
        statusPengajuan: 'Disetujui', 
      }).returning({ id: pengajuanCuti.id });

      // 4. SINKRONKAN KE PRESENSI HARIAN (jika presensi di tanggal ini sudah ada)
      if (newCuti) {
        await db.update(presensiHarian)
          .set({
            sistemKerja: 'Cuti',
            idCuti: newCuti.id,
          })
          .where(
            and(
              eq(presensiHarian.idPegawai, idPegawai),
              gte(presensiHarian.tgl, cuti.tglMulai),
              lte(presensiHarian.tgl, cuti.tglSelesai)
            )
          );
      }

      inserted++;
    } else {
      console.log(`Skip: Pegawai "${cuti.namaLengkap}" ga ketemu di DB.`);
      notFound++;
    }
  }

  console.log(`✅ Berhasil! ${inserted} riwayat cuti berhasil masuk.`);
  if (notFound > 0) console.log(`❌ ${notFound} data diskip.`);
  
  process.exit(0);
}

seedRiwayatCuti().catch(console.error);