'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { presensiHarian, pegawai, masterJabatan, masterKelasJabatan, rekapPresensiBulanan } from '@/db/schema';
import { revalidatePath } from 'next/cache';

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

export async function prosesImportPresensiExcel(dataExcel: any[], bulanTarget: number, tahunTarget: number) {
  try {
    // 1. Ambil data master pegawai buat nyari ID dan Base Tukin dari NIP
    const listPegawai = await db
      .select({
        id: pegawai.id,
        nip: pegawai.nip,
        baseTukin: masterKelasJabatan.baseTukin,
      })
      .from(pegawai)
      .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
      .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id));

    // 2. Siapkan wadah (object) buat ngerekap akumulasi data harian per ID Pegawai
    const rekapBulanan: Record<string, any> = {};

    let dataDiproses = 0;

    // 3. Loop satu per satu baris Excel
    for (const row of dataExcel) {
      // Ambil NIP, pastikan formatnya string
      let nipRaw = row['NIP']?.toString();
      
      // Skip kalau barisnya NIP kosong atau cuma angka dummy (misal: "3" atau tulisan "NIP")
      if (!nipRaw || nipRaw === '3' || nipRaw.toLowerCase() === 'nip') continue;

      // Hapus spasi barangkali ada salah ketik
      nipRaw = nipRaw.trim();

      // Cocokin NIP Excel sama Database
      const matchedPegawai = listPegawai.find(p => p.nip === nipRaw);
      if (!matchedPegawai) continue; // Skip kalau NIP nggak terdaftar

      const idPegawai = matchedPegawai.id;
      
      // Ambil nilai potongan harian (kolom S di Excel)
      const persenPotonganHarian = Number(row['Persentase Potongan Harian'] || 0);
      const telatMenit = Number(row['Terlambat'] || 0);
      
      // Kalau pegawai ini belum ada di wadah rekap, kita bikin dulu
      if (!rekapBulanan[idPegawai]) {
        rekapBulanan[idPegawai] = {
          totalHariKerja: 0,
          totalPotonganPersen: 0,
          totalMenitTelat: 0,
          baseTukin: Number(matchedPegawai.baseTukin || 0)
        };
      }
      
      // Tambahin akumulasinya
      rekapBulanan[idPegawai].totalHariKerja += 1;
      rekapBulanan[idPegawai].totalPotonganPersen += persenPotonganHarian;
      rekapBulanan[idPegawai].totalMenitTelat += telatMenit;
      
      dataDiproses++;
    }

    let successCount = 0;

    // 4. Save akumulasi tadi ke tabel rekapPresensiBulanan
    for (const [idPegawai, dataRekap] of Object.entries(rekapBulanan)) {
      let totalPotongan = dataRekap.totalPotonganPersen;
      if (totalPotongan > 100) totalPotongan = 100; // Maksimal potongan 100%

      const persentaseKehadiranNum = 100 - totalPotongan;
      // Duit presensi = 30% dari Base Tukin
      const maksimalKehadiran = dataRekap.baseTukin * 0.30;
      const nominalKehadiranNum = maksimalKehadiran * (persentaseKehadiranNum / 100);
      const potonganKehadiranNum = maksimalKehadiran - nominalKehadiranNum;

      await db
        .insert(rekapPresensiBulanan)
        .values({
          idPegawai: idPegawai as string,
          bulan: bulanTarget,
          tahun: tahunTarget,
          hariKerja: dataRekap.totalHariKerja,
          totalMenitTerlambat: dataRekap.totalMenitTelat,
          jumlahLupaAbsen: 0,
          jumlahAlpa: 0,
          jumlahCtGugurKandunganGt1Bln: 0, // Dikosongkan aja kalau dari Excel nggak ada
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
            // updatedAt: new Date(),
          },
        });
        
        successCount++;
    }

    // Refresh halaman biar datanya lgsg update di UI
    revalidatePath('/admin/presensi');
    revalidatePath('/admin/tukin');
    
    return { 
      status: 'success', 
      message: `Mantap, Sal! Berhasil ngerekap ${dataDiproses} baris absen buat ${successCount} pegawai. Duit Tukin udah auto-sinkron!` 
    };
  } catch (error: any) {
    return { status: 'error', message: error.message };
  }
}