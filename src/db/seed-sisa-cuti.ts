import { db } from './index';
import { sisaCuti } from './schema';
import { eq } from 'drizzle-orm';

// Data rekap saldo Excel (Biar gampang, kosongin aja string-nya kalau di Excel kosong)
const rekapSaldoExcel = [
  { namaLengkap: "dr. Muzakir, M.K.M.", sisa2024: "", sisa2025: "", sisa2026: "11" },
  { namaLengkap: "Eef Saefulloh, S.Si., M.M.", sisa2024: "", sisa2025: "", sisa2026: "0" },
  { namaLengkap: "Dr. dr. Sudi Astono, M.S.", sisa2024: "", sisa2025: "", sisa2026: "0" },
  { namaLengkap: "Dr. Daafi Armanda, S.T., M.M.", sisa2024: "", sisa2025: "", sisa2026: "9" },
  { namaLengkap: "dr. Erdiana Muliawaty Hasoloan Lahi, M.Si.", sisa2024: "", sisa2025: "7", sisa2026: "12" },
  { namaLengkap: "Ahmad Fauzi Natakusuma, S.T., M.Si.", sisa2024: "", sisa2025: "6", sisa2026: "12" },
  { namaLengkap: "Yacob Benny, S.E., M.Si.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Tomy Mismahendra, S.Si., M.K.K.K.", sisa2024: "", sisa2025: "12", sisa2026: "12" },
  { namaLengkap: "Fennia Herma Yunita, S.K.M., M.K.K.", sisa2024: "", sisa2025: "6", sisa2026: "12" },
  { namaLengkap: "Supriadi S.T., M.H.", sisa2024: "", sisa2025: "", sisa2026: "5" },
  { namaLengkap: "Hadi Prayitno S.T.", sisa2024: "", sisa2025: "", sisa2026: "8" },
  { namaLengkap: "Umi Muroah Dwi Yugowati S.Si.", sisa2024: "", sisa2025: "", sisa2026: "10" },
  { namaLengkap: "Rivaz Rihardian S.Ikom", sisa2024: "", sisa2025: "1", sisa2026: "12" },
  { namaLengkap: "Astri Ardani S.T.", sisa2024: "", sisa2025: "11", sisa2026: "12" },
  { namaLengkap: "Beti Adika Putri S.K.M.", sisa2024: "", sisa2025: "", sisa2026: "9" },
  { namaLengkap: "Inayati Ulin Na'mah S.T., M.P.M.", sisa2024: "", sisa2025: "", sisa2026: "0" },
  { namaLengkap: "Amelia Yuswidyastika S.K.M.", sisa2024: "", sisa2025: "3", sisa2026: "12" },
  { namaLengkap: "Fatma Fitriana Sakinah S.T.", sisa2024: "8", sisa2025: "12", sisa2026: "12" },
  { namaLengkap: "Resty Wulandari S.K.M., M.K.K.K.", sisa2024: "0", sisa2025: "9", sisa2026: "12" },
  { namaLengkap: "Siska Nina Asri A.Md.", sisa2024: "", sisa2025: "3", sisa2026: "12" },
  { namaLengkap: "Rahmi Fidyatun Nida S.E.", sisa2024: "", sisa2025: "", sisa2026: "11" },
  { namaLengkap: "Fido Ringkas Januari S. Kom", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Rochimah Sulistiani Sarworo S.T.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Muchlis Yoga Maulana A.Md.Bns", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Dinar Anggita Restuti S.T.", sisa2024: "", sisa2025: "", sisa2026: "11" },
  { namaLengkap: "Nisa Hanif Widyanti S.T.", sisa2024: "", sisa2025: "", sisa2026: "10" },
  { namaLengkap: "Firda Zhafirah S.T.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Mohamad Ichsan Wibawa S.kom", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Johannes Pakpahan S. Psi.", sisa2024: "", sisa2025: "", sisa2026: "11" },
  { namaLengkap: "Naranthica Zulfa Febriani S.T.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Dewi Sani S.Kom", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Vikri Maulana S.I.Kom.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Gunawan Wibiksana S.H.", sisa2024: "", sisa2025: "", sisa2026: "10" },
  { namaLengkap: "Ridwan S.E.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Andi Muh. Adhim", sisa2024: "", sisa2025: "", sisa2026: "8" },
  { namaLengkap: "Din Anisa Zuhra S.I.Kom", sisa2024: "", sisa2025: "", sisa2026: "10" },
  { namaLengkap: "Rizky Adrian Noer S.K.M", sisa2024: "", sisa2025: "0", sisa2026: "7" },
  { namaLengkap: "Meka Cintia A.Md", sisa2024: "", sisa2025: "0", sisa2026: "10" },
  { namaLengkap: "Indri Juliastuti, A.Md.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Disky Arfani S.E", sisa2024: "", sisa2025: "8", sisa2026: "12" },
  { namaLengkap: "Bella Destasari, S.K.M.", sisa2024: "", sisa2025: "", sisa2026: "7" },
  { namaLengkap: "Imam Lukman Hakim, S.K.M.", sisa2024: "", sisa2025: "", sisa2026: "12" },
  { namaLengkap: "Harjito, S.T.", sisa2024: "", sisa2025: "", sisa2026: "9" },
  { namaLengkap: "Raden Wahyu Hartadji, S.Kom.", sisa2024: "8", sisa2025: "12", sisa2026: "12" },
  { namaLengkap: "Achmad Farich Husni, S.Kom.", sisa2024: "", sisa2025: "", sisa2026: "10" },
  { namaLengkap: "Anisa Rahmah, S.Pd.", sisa2024: "7", sisa2025: "12", sisa2026: "12" },
  { namaLengkap: "Sukisno, S.Pd.", sisa2024: "", sisa2025: "7", sisa2026: "12" },
  { namaLengkap: "Retno Indah Puspita, A.Md.", sisa2024: "", sisa2025: "", sisa2026: "11" },
  { namaLengkap: "Nuria Utamiarti S.E., M.Si.", sisa2024: "", sisa2025: "", sisa2026: "11" },
  { namaLengkap: "Windu Jatiarso, S.T., M.Si.", sisa2024: "4", sisa2025: "12", sisa2026: "12" },
  { namaLengkap: "Raffi Wahyu Kusuma, S.ST., M.M.", sisa2024: "4", sisa2025: "12", sisa2026: "12" },
  { namaLengkap: "dr. Tresye Widiastuty Paidi", sisa2024: "2", sisa2025: "12", sisa2026: "12" }
];

// Helper pembersih string biar gampang nyocokin nama
function cleanName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function seedSaldoCuti() {
  console.log('Bersihin data lama di tabel sisa_cuti..');

  await db.delete(sisaCuti);
  console.log('Tabel sisa_cuti berhasil dibersihkan..');
  
  console.log('Mulai insert Jatah Awal Cuti dari Excel..');
  
  const semuaPegawai = await db.query.pegawai.findMany({
    columns: { id: true, namaLengkap: true }
  });

  const mapPegawai = new Map(semuaPegawai.map(p => [cleanName(p.namaLengkap), p.id]));
  const insertPayload = [];
  let notFound = 0;
  let skipped = 0;

  for (const row of rekapSaldoExcel) {
    const cleanedName = cleanName(row.namaLengkap);
    let idPegawai = mapPegawai.get(cleanedName);

    if (!idPegawai) {
       const firstTwoNames = row.namaLengkap.split(' ').slice(0,2).join('').toLowerCase().replace(/[^a-z]/g, '');
       for (const [key, id] of mapPegawai.entries()) {
           if (key.includes(firstTwoNames)) {
               idPegawai = id; break;
           }
       }
    }

    if (idPegawai) {
      // PROTEKSI ANTI-DOUBLE: Cek apakah pegawai ini udah punya saldo di DB
      const existingSaldo = await db.query.sisaCuti.findFirst({
        where: eq(sisaCuti.idPegawai, idPegawai)
      });

      if (existingSaldo) {
         console.log(`Skip: Saldo cuti ${row.namaLengkap} udah ada di database.`);
         skipped++;
         continue; // Lewatin pegawai ini, lanjut ke yang berikutnya
      }

      const saldoPerTahun = [
        { tahun: 2024, nilai: row.sisa2024 },
        { tahun: 2025, nilai: row.sisa2025 },
        { tahun: 2026, nilai: row.sisa2026 },
      ];

      for (const { tahun, nilai } of saldoPerTahun) {
        if (nilai === "" || nilai === null || nilai === undefined) continue;

        const sisa = Number(nilai);
        if (!Number.isFinite(sisa) || sisa <= 0) continue;

        insertPayload.push({ idPegawai, tahun, sisa });
      }
    } else {
      console.log(`❌ Skip: Pegawai "${row.namaLengkap}" ga ketemu di DB.`);
      notFound++;
    }
  }

  if (insertPayload.length > 0) {
    try {
      await db.insert(sisaCuti).values(insertPayload);
      console.log(`Berhasil! ${insertPayload.length} baris jatah cuti awal berhasil masuk.`);
    } catch (error) {
      console.error('❌ Gagal nge-seed sisa cuti:', error);
    }
  } else {
    console.log('Semua data jatah awal udah terisi, ga ada yang ditambahin.');
  }

  if (notFound > 0) console.log(`${notFound} pegawai ga ketemu di DB.`);
  if (skipped > 0) console.log(`${skipped} pegawai di-skip karena datanya udah ada.`);
  
  process.exit(0);
}

seedSaldoCuti().catch(console.error);