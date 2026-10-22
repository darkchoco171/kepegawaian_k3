'use server';

import { randomUUID } from 'node:crypto';
import { getServerSession } from 'next-auth';
import { and, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db';
import {
  alokasiSaldoCuti,
  jenisCutiEnum,
  masterJabatan,
  masterKelasJabatan,
  pegawai,
  pengajuanCuti,
  presensiHarian,
  rekapPresensiBulanan,
  sisaCuti,
  tukinBulanan,
} from '@/db/schema';
import { revalidatePath } from 'next/cache';
import { authOptions } from '@/lib/auth-options';
import { kalkulasiKehadiran } from '@/lib/tukin/calculation';
import {
  allocateCutiByYear,
  allocateLegacyCutiRefund,
  ANNUAL_CUTI_QUOTA,
  getCutiBucketYears,
  getWeekdayDates,
  getWeekdaysByYear,
  LAST_IMPORTED_BALANCE_YEAR,
} from './cuti-utils';

type JenisCuti = (typeof jenisCutiEnum.enumValues)[number];

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value ? null : date;
}

function addMonth(year: number, month: number, offset: number) {
  const date = new Date(Date.UTC(year, month - 1 + offset, 1));
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 };
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month).padStart(2, '0')}`;
}

async function updateMonthlyRecaps(idPegawai: string, leave: {
  jenisCuti: JenisCuti;
  tglMulai: string;
  tglSelesai: string;
}, weekdays: string[]) {
  const affectedMonths = new Map<string, { year: number; month: number }>();
  const addAffectedMonth = (year: number, month: number) => {
    affectedMonths.set(monthKey(year, month), { year, month });
  };

  for (const date of weekdays) {
    addAffectedMonth(Number(date.slice(0, 4)), Number(date.slice(5, 7)));
  }

  const startYear = Number(leave.tglMulai.slice(0, 4));
  const startMonth = Number(leave.tglMulai.slice(5, 7));
  const affectedOffsets = leave.jenisCuti === 'Sakit'
    ? [1, 2, 3]
    : leave.jenisCuti === 'Besar'
      ? [0, 1, 2]
      : leave.jenisCuti === 'Gugur Kandungan'
        ? [1]
        : [];

  for (const offset of affectedOffsets) {
    const month = addMonth(startYear, startMonth, offset);
    addAffectedMonth(month.year, month.month);
  }

  const [pegawaiTukin] = await db
    .select({ baseTukin: masterKelasJabatan.baseTukin })
    .from(pegawai)
    .leftJoin(masterJabatan, eq(pegawai.idJabatan, masterJabatan.id))
    .leftJoin(masterKelasJabatan, eq(masterJabatan.idKelasJabatan, masterKelasJabatan.id))
    .where(eq(pegawai.id, idPegawai))
    .limit(1);
  const nominalDasar = Number(pegawaiTukin?.baseTukin || 0);

  const approvedCuti = await db
    .select({
      jenisCuti: pengajuanCuti.jenisCuti,
      tglMulai: pengajuanCuti.tglMulai,
    })
    .from(pengajuanCuti)
    .where(and(
      eq(pengajuanCuti.idPegawai, idPegawai),
      eq(pengajuanCuti.statusPengajuan, 'Disetujui'),
    ));

  const queries = [];
  for (const { year, month } of affectedMonths.values()) {
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
    const monthEnd = new Date(Date.UTC(year, month, 0)).toISOString().slice(0, 10);
    const dailyRows = await db
      .select({
        sistemKerja: presensiHarian.sistemKerja,
        cekIn: presensiHarian.cekIn,
        cekOut: presensiHarian.cekOut,
        terlambat: presensiHarian.terlambat,
        statusAnomali: presensiHarian.statusAnomali,
      })
      .from(presensiHarian)
      .where(and(
        eq(presensiHarian.idPegawai, idPegawai),
        gte(presensiHarian.tgl, monthStart),
        lte(presensiHarian.tgl, monthEnd),
      ));

    const totalMenitTerlambat = dailyRows.reduce((total, row) =>
      total + (row.sistemKerja === 'WFO' || row.sistemKerja === 'WFH' ? Number(row.terlambat || 0) : 0), 0);
    const jumlahLupaAbsen = dailyRows.filter((row) =>
      ['WFO', 'WFH', 'Dinas Luar'].includes(row.sistemKerja) && (!row.cekIn || !row.cekOut)).length;
    const jumlahAlpa = dailyRows.filter((row) => row.sistemKerja === 'Alpa').length;
    const jumlahTdkUpc = dailyRows.filter((row) => row.statusAnomali === 'TDK_UPC').length;

    const cutiFlags = {
      cutiSakitBulanII: false,
      cutiSakitBulanIII: false,
      cutiSakitGt3Bln: false,
      ctBesarBulanI: false,
      ctBesarBulanII: false,
      ctBesarBulanIII: false,
      jumlahCtGugurKandunganGt1Bln: 0,
    };

    for (const cuti of approvedCuti) {
      const cutiYear = Number(cuti.tglMulai.slice(0, 4));
      const cutiMonth = Number(cuti.tglMulai.slice(5, 7));
      const monthDiff = (year - cutiYear) * 12 + (month - cutiMonth);

      if (cuti.jenisCuti === 'Sakit') {
        if (monthDiff === 1) cutiFlags.cutiSakitBulanII = true;
        if (monthDiff === 2) cutiFlags.cutiSakitBulanIII = true;
        if (monthDiff > 2) cutiFlags.cutiSakitGt3Bln = true;
      } else if (cuti.jenisCuti === 'Besar') {
        if (monthDiff === 0) cutiFlags.ctBesarBulanI = true;
        if (monthDiff === 1) cutiFlags.ctBesarBulanII = true;
        if (monthDiff === 2) cutiFlags.ctBesarBulanIII = true;
      } else if (cuti.jenisCuti === 'Gugur Kandungan' && monthDiff > 0) {
        cutiFlags.jumlahCtGugurKandunganGt1Bln += 1;
      }
    }

    const potonganCuti =
      (cutiFlags.cutiSakitBulanII ? 50 : 0) +
      (cutiFlags.cutiSakitBulanIII ? 75 : 0) +
      (cutiFlags.cutiSakitGt3Bln ? 100 : 0) +
      (cutiFlags.ctBesarBulanI ? 50 : 0) +
      (cutiFlags.ctBesarBulanII ? 75 : 0) +
      (cutiFlags.ctBesarBulanIII ? 90 : 0);
    const persentasePotongan =
      totalMenitTerlambat * 0.01 +
      jumlahLupaAbsen +
      jumlahAlpa * 3 +
      jumlahTdkUpc * 3 +
      cutiFlags.jumlahCtGugurKandunganGt1Bln +
      potonganCuti;
    const { persentaseKehadiran, nominalKehadiran, jumlahPotonganKehadiran } =
      kalkulasiKehadiran(nominalDasar, persentasePotongan);

    queries.push(db.insert(rekapPresensiBulanan).values({
      idPegawai,
      bulan: month,
      tahun: year,
      hariKerja: getWeekdayDates(monthStart, monthEnd).length,
      totalMenitTerlambat,
      jumlahLupaAbsen,
      jumlahAlpa,
      jumlahTdkUpc,
      ...cutiFlags,
      persentasePotongan: persentasePotongan.toFixed(4),
      persentaseKehadiran: persentaseKehadiran.toFixed(4),
      nominalKehadiran: nominalKehadiran.toFixed(2),
      jumlahPotonganKehadiran: jumlahPotonganKehadiran.toFixed(2),
      updatedAt: new Date(),
    }).onConflictDoUpdate({
      target: [
        rekapPresensiBulanan.idPegawai,
        rekapPresensiBulanan.bulan,
        rekapPresensiBulanan.tahun,
      ],
      set: {
        hariKerja: getWeekdayDates(monthStart, monthEnd).length,
        totalMenitTerlambat,
        jumlahLupaAbsen,
        jumlahAlpa,
        jumlahTdkUpc,
        ...cutiFlags,
        persentasePotongan: persentasePotongan.toFixed(4),
        persentaseKehadiran: persentaseKehadiran.toFixed(4),
        nominalKehadiran: nominalKehadiran.toFixed(2),
        jumlahPotonganKehadiran: jumlahPotonganKehadiran.toFixed(2),
        updatedAt: new Date(),
      },
    }));
  }

  if (queries.length > 0) {
    const [first, ...rest] = queries;
    if (first) await db.batch([first, ...rest]);
  }

  return [...affectedMonths.values()];
}

async function updateMonthlyTukin(
  idPegawai: string,
  affectedMonths: { year: number; month: number }[],
) {
  for (const { month, year } of affectedMonths) {
    const [rekap] = await db
      .select({
        id: rekapPresensiBulanan.id,
        nominalKehadiran: rekapPresensiBulanan.nominalKehadiran,
      })
      .from(rekapPresensiBulanan)
      .where(and(
        eq(rekapPresensiBulanan.idPegawai, idPegawai),
        eq(rekapPresensiBulanan.bulan, month),
        eq(rekapPresensiBulanan.tahun, year),
      ))
      .limit(1);
    const [tukin] = await db
      .select({
        id: tukinBulanan.id,
        nominalKinerja: tukinBulanan.nominalKinerja,
      })
      .from(tukinBulanan)
      .where(and(
        eq(tukinBulanan.idPegawai, idPegawai),
        eq(tukinBulanan.bulan, month),
        eq(tukinBulanan.tahun, year),
      ))
      .limit(1);

    if (rekap && tukin) {
      await db.update(tukinBulanan)
        .set({
          idRekapPresensiBulanan: rekap.id,
          dibayarkan: (
            Number(tukin.nominalKinerja || 0) + Number(rekap.nominalKehadiran || 0)
          ).toFixed(2),
          updatedAt: new Date(),
        })
        .where(eq(tukinBulanan.id, tukin.id));
    }
  }
}

export async function createCuti(formData: FormData) {
  const idPegawai = String(formData.get('idPegawai') || '');
  const jenisCutiValue = String(formData.get('jenisCuti') || '');
  const tglMulai = String(formData.get('tglMulai') || '');
  const tglSelesai = String(formData.get('tglSelesai') || '');
  const alasan = String(formData.get('alasan') || '').trim();

  if (!idPegawai || !tglMulai || !tglSelesai) {
    return { success: false, message: 'Harap lengkapi semua data wajib!' };
  }

  if (!jenisCutiEnum.enumValues.includes(jenisCutiValue as JenisCuti)) {
    return { success: false, message: 'Jenis cuti tidak valid.' };
  }
  const jenisCuti = jenisCutiValue as JenisCuti;

  const startDate = parseIsoDate(tglMulai);
  const endDate = parseIsoDate(tglSelesai);
  if (!startDate || !endDate || tglMulai > tglSelesai) {
    return { success: false, message: 'Rentang tanggal cuti tidak valid.' };
  }

  const weekdays = getWeekdayDates(tglMulai, tglSelesai);
  if (weekdays.length === 0) {
    return { success: false, message: 'Rentang tanggal cuti tidak mencakup hari kerja Senin–Jumat.' };
  }
  try {
    const weekdaysByYear = getWeekdaysByYear(tglMulai, tglSelesai);
    const deductsAnnualBalance = jenisCuti === 'Tahunan' || jenisCuti === 'Sakit';
    const sisaRows = await db
      .select()
      .from(sisaCuti)
      .where(eq(sisaCuti.idPegawai, idPegawai));
    const rowByYear = new Map(sisaRows.map((row) => [row.tahun, row]));
    const balanceYears = new Set<number>();
    for (const year of weekdaysByYear.keys()) {
      for (const balanceYear of getCutiBucketYears(year)) {
        balanceYears.add(balanceYear);
      }
    }

    const remainingByYear = new Map<number, number>();
    const newBalanceIds = new Map<number, string>();
    for (const year of balanceYears) {
      const stored = rowByYear.get(year);
      if (stored) {
        remainingByYear.set(year, stored.sisa);
      } else if (year > LAST_IMPORTED_BALANCE_YEAR) {
        remainingByYear.set(year, ANNUAL_CUTI_QUOTA);
        newBalanceIds.set(year, randomUUID());
      } else {
        remainingByYear.set(year, 0);
      }
    }

    const balanceAllocation = deductsAnnualBalance
      ? allocateCutiByYear(weekdaysByYear, new Map(remainingByYear))
      : new Map<number, number>();
    if (!balanceAllocation) {
      return {
        success: false,
        message: `Saldo cuti Tahunan/Sakit tidak mencukupi untuk ${weekdays.length} hari kerja. Periksa saldo N-2, N-1, dan N untuk setiap tahun cuti.`,
      };
    }

    const existingCuti = await db.query.pengajuanCuti.findFirst({
      where: and(
        eq(pengajuanCuti.idPegawai, idPegawai),
        lte(pengajuanCuti.tglMulai, tglSelesai),
        gte(pengajuanCuti.tglSelesai, tglMulai),
      ),
    });

    if (existingCuti) {
      return {
        success: false,
        message: `Pegawai ini sudah memiliki cuti (${existingCuti.jenisCuti}) pada rentang ${existingCuti.tglMulai} s/d ${existingCuti.tglSelesai}. Silakan periksa agar tidak terjadi duplikasi.`,
      };
    }

    const newCutiId = randomUUID();
    const balanceInserts = [...newBalanceIds.entries()].map(([tahun, id]) => ({
      id,
      idPegawai,
      tahun,
      sisa: remainingByYear.get(tahun) || 0,
      updatedAt: new Date(),
    }));
    const balanceUpdates = [...balanceAllocation.entries()]
      .flatMap(([tahun, jumlahPotong]) => {
        const row = rowByYear.get(tahun);
        if (!row) {
          const id = newBalanceIds.get(tahun);
          return id ? [db.update(sisaCuti)
            .set({
              sisa: (remainingByYear.get(tahun) || 0) - jumlahPotong,
              updatedAt: new Date(),
            })
            .where(eq(sisaCuti.id, id))] : [];
        }

        return [db.update(sisaCuti)
          .set({
            sisa: row.sisa - jumlahPotong,
            updatedAt: new Date(),
          })
          .where(eq(sisaCuti.id, row.id))];
      });

    const attendanceRows = weekdays.map((tgl) => ({
      idPegawai,
      tgl,
      sistemKerja: 'Cuti' as const,
      cekIn: null,
      cekOut: null,
      terlambat: 0,
      menitKerja: 0,
      kekuranganJamKerja: 0,
      jumlahMenitKekuranganHarian: 0,
      persentasePotonganHarian: null,
      statusAnomali: null,
      idCuti: newCutiId,
    }));
    const mutations = [
      ...(balanceInserts.length > 0 ? [db.insert(sisaCuti).values(balanceInserts)] : []),
      ...balanceUpdates,
      db.insert(pengajuanCuti).values({
        id: newCutiId,
        idPegawai,
        jenisCuti,
        tglMulai,
        tglSelesai,
        jumlahHari: weekdays.length,
        alasan: alasan || null,
        statusPengajuan: 'Disetujui',
      }),
      ...(balanceAllocation.size > 0
        ? [db.insert(alokasiSaldoCuti).values(
          [...balanceAllocation.entries()].map(([tahunSaldo, jumlahHari]) => ({
            idCuti: newCutiId,
            tahunSaldo,
            jumlahHari,
          })),
        )]
        : []),
      db.insert(presensiHarian).values(attendanceRows).onConflictDoUpdate({
        target: [presensiHarian.idPegawai, presensiHarian.tgl],
        set: {
          sistemKerja: 'Cuti',
          cekIn: null,
          cekOut: null,
          jamHarusCheckout: null,
          jamMasukStandar: null,
          jamToleransiMasuk: null,
          jamPulangStandar: null,
          jamToleransiPulang: null,
          terlambat: 0,
          menitKerja: 0,
          kekuranganJamKerja: 0,
          jumlahMenitKekuranganHarian: 0,
          persentasePotonganHarian: null,
          statusAnomali: null,
          idCuti: newCutiId,
        },
      }),
    ];
    const [firstMutation, ...remainingMutations] = mutations;
    if (!firstMutation) throw new Error('Tidak ada operasi cuti yang disiapkan.');
    await db.batch([firstMutation, ...remainingMutations]);

    let followUpWarning = '';
    try {
      const affectedMonths = await updateMonthlyRecaps(idPegawai, {
        jenisCuti,
        tglMulai,
        tglSelesai,
      }, weekdays);
      await updateMonthlyTukin(idPegawai, affectedMonths);
    } catch (error) {
      console.error('Pengajuan tersimpan, tetapi rekap bulanan gagal diperbarui:', error);
      followUpWarning = ' Data cuti dan presensi tersimpan, tetapi rekap bulanan gagal diperbarui; hubungi administrator.';
    }

    revalidatePath('/admin/cuti');
    revalidatePath('/admin/presensi');
    revalidatePath('/admin/tukin');
    revalidatePath(`/admin/pegawai/${idPegawai}`);

    return {
      success: true,
      message: `Pengajuan cuti disetujui untuk ${weekdays.length} hari kerja. Saldo dan presensi harian telah diperbarui.${followUpWarning}`,
    };
  } catch (error) {
    console.error('Gagal menyimpan pengajuan cuti:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan pengajuan cuti.',
    };
  }
}

export async function hapusCuti(idCuti: string): Promise<{ success: boolean; message: string }> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'admin') {
    return { success: false, message: 'Hanya admin yang dapat menghapus pengajuan cuti.' };
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idCuti)) {
    return { success: false, message: 'ID pengajuan cuti tidak valid.' };
  }

  try {
    const [cuti] = await db.select({
      id: pengajuanCuti.id,
      idPegawai: pengajuanCuti.idPegawai,
      jenisCuti: pengajuanCuti.jenisCuti,
      tglMulai: pengajuanCuti.tglMulai,
      tglSelesai: pengajuanCuti.tglSelesai,
      statusPengajuan: pengajuanCuti.statusPengajuan,
    })
      .from(pengajuanCuti)
      .where(eq(pengajuanCuti.id, idCuti))
      .limit(1);

    if (!cuti) {
      return { success: false, message: 'Pengajuan cuti tidak ditemukan.' };
    }

    const weekdays = getWeekdayDates(cuti.tglMulai, cuti.tglSelesai);
    const isAnnualBalanceLeave = cuti.statusPengajuan === 'Disetujui'
      && (cuti.jenisCuti === 'Tahunan' || cuti.jenisCuti === 'Sakit');
    let refunds = new Map<number, number>();

    if (isAnnualBalanceLeave) {
      const [allocations, balanceRows] = await Promise.all([
        db.select({
          tahunSaldo: alokasiSaldoCuti.tahunSaldo,
          jumlahHari: alokasiSaldoCuti.jumlahHari,
        })
          .from(alokasiSaldoCuti)
          .where(eq(alokasiSaldoCuti.idCuti, cuti.id)),
        db.select({
          id: sisaCuti.id,
          tahun: sisaCuti.tahun,
          sisa: sisaCuti.sisa,
        })
          .from(sisaCuti)
          .where(eq(sisaCuti.idPegawai, cuti.idPegawai)),
      ]);

      const balances = new Map(balanceRows.map((row) => [row.tahun, row.sisa]));
      if (allocations.length > 0) {
        refunds = new Map(allocations.map(({ tahunSaldo, jumlahHari }) => [tahunSaldo, jumlahHari]));
      } else {
        const legacyRefund = allocateLegacyCutiRefund(
          getWeekdaysByYear(cuti.tglMulai, cuti.tglSelesai),
          balances,
        );
        if (!legacyRefund) {
          return {
            success: false,
            message: 'Saldo pengajuan lama tidak cukup untuk menentukan refund N-2, N-1, dan N dengan aman. Saldo perlu diperiksa dan dikoreksi manual sebelum pengajuan ini dihapus.',
          };
        }
        refunds = legacyRefund;
      }

      const refundTotal = [...refunds.values()].reduce((total, days) => total + days, 0);
      if (refundTotal !== weekdays.length) {
        return {
          success: false,
          message: 'Rincian pemotongan saldo cuti tidak sesuai dengan durasi pengajuan. Penghapusan dibatalkan agar saldo tidak berubah keliru.',
        };
      }

      const balanceByYear = new Map(balanceRows.map((row) => [row.tahun, row]));
      const balanceMutations = [...refunds.entries()].map(([tahun, jumlahHari]) => {
        const row = balanceByYear.get(tahun);
        if (row) {
          return db.update(sisaCuti)
            .set({ sisa: row.sisa + jumlahHari, updatedAt: new Date() })
            .where(eq(sisaCuti.id, row.id));
        }

        return db.insert(sisaCuti).values({
          id: randomUUID(),
          idPegawai: cuti.idPegawai,
          tahun,
          sisa: jumlahHari,
          updatedAt: new Date(),
        });
      });

      const mutations = [
        ...balanceMutations,
        db.delete(presensiHarian).where(eq(presensiHarian.idCuti, cuti.id)),
        db.delete(pengajuanCuti).where(eq(pengajuanCuti.id, cuti.id)),
      ];
      const [firstMutation, ...remainingMutations] = mutations;
      if (!firstMutation) throw new Error('Tidak ada operasi penghapusan cuti yang disiapkan.');
      await db.batch([firstMutation, ...remainingMutations]);
    } else {
      await db.batch([
        db.delete(presensiHarian).where(eq(presensiHarian.idCuti, cuti.id)),
        db.delete(pengajuanCuti).where(eq(pengajuanCuti.id, cuti.id)),
      ]);
    }

    let followUpWarning = '';
    try {
      const affectedMonths = await updateMonthlyRecaps(cuti.idPegawai, {
        jenisCuti: cuti.jenisCuti,
        tglMulai: cuti.tglMulai,
        tglSelesai: cuti.tglSelesai,
      }, weekdays);
      await updateMonthlyTukin(cuti.idPegawai, affectedMonths);
    } catch (error) {
      console.error('Pengajuan cuti dihapus, tetapi rekap bulanan gagal diperbarui:', error);
      followUpWarning = ' Rekap bulanan gagal diperbarui; hubungi administrator.';
    }

    revalidatePath('/admin/cuti');
    revalidatePath('/admin/presensi');
    revalidatePath('/admin/tukin');
    revalidatePath(`/admin/pegawai/${cuti.idPegawai}`);

    return {
      success: true,
      message: `Pengajuan cuti dihapus${isAnnualBalanceLeave ? ' dan saldo cuti dikembalikan' : ''}; presensi terkait juga dihapus.${followUpWarning}`,
    };
  } catch (error) {
    console.error('Gagal menghapus pengajuan cuti:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus pengajuan cuti.',
    };
  }
}
