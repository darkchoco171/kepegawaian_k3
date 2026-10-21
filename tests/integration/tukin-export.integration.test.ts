import assert from 'node:assert/strict';
import test from 'node:test';
import { loadEnvConfig } from '@next/env';
import * as XLSX from 'xlsx';

const expectedColumnByLeaveType = {
  Tahunan: 'Cuti Thn',
  Sakit: 'Cuti Sakit Bulan I',
  Besar: 'CT Bsr Bln I',
  Melahirkan: 'Cuti Melahirkan',
  'Alasan Penting': 'CT B/ CT AP < 1 Bln',
  'Gugur Kandungan': 'CT Gugur Kandungan',
} as const;

function isMappedLeaveType(value: string): value is keyof typeof expectedColumnByLeaveType {
  return Object.hasOwn(expectedColumnByLeaveType, value);
}

async function getIntegrationContext() {
  loadEnvConfig(process.cwd());
  assert.ok(process.env.DATABASE_URL, 'DATABASE_URL must point to a configured test database');

  const [{ db }, schema, operators, { getExportDataTukin }] = await Promise.all([
    import('../../src/lib/db'),
    import('../../src/db/schema'),
    import('drizzle-orm'),
    import('../../src/app/admin/tukin/excel-actions'),
  ]);

  return { db, schema, operators, getExportDataTukin };
}

function readExportRows(base64Data: string) {
  const workbook = XLSX.read(base64Data, { type: 'base64' });
  const sheet = workbook.Sheets['PNS & PPPK'];
  assert.ok(sheet, 'Export workbook should include the PNS & PPPK sheet');

  return XLSX.utils.sheet_to_json<(string | number)[]>(sheet, {
    header: 1,
    defval: '',
  });
}

test('Tukin export returns the 38-column workbook for an existing period', async (context) => {
  const { db, schema, operators, getExportDataTukin } = await getIntegrationContext();
  const [period] = await db
    .select({
      bulan: schema.tukinBulanan.bulan,
      tahun: schema.tukinBulanan.tahun,
    })
    .from(schema.tukinBulanan)
    .limit(1);

  if (!period) {
    context.skip('No Tukin data exists in the configured integration-test database');
    return;
  }

  const [expectedCount] = await db
    .select({ value: operators.count() })
    .from(schema.tukinBulanan)
    .where(operators.and(
      operators.eq(schema.tukinBulanan.bulan, period.bulan),
      operators.eq(schema.tukinBulanan.tahun, period.tahun),
    ));
  const rows = readExportRows(await getExportDataTukin(period.bulan, period.tahun));

  assert.equal(rows[1]?.length, 38, 'Export should preserve the 38-column layout');
  assert.equal(rows.length - 2, expectedCount?.value, 'Export should include every Tukin record for the selected period');
  assert.ok(
    rows.slice(2).every((row) => row.length === 38),
    'Every exported Tukin row should contain all columns',
  );
});

test('Tukin export includes an approved leave in its matching category column', async (context) => {
  const { db, schema, operators, getExportDataTukin } = await getIntegrationContext();
  const supportedLeaveTypes = Object.keys(expectedColumnByLeaveType) as Array<keyof typeof expectedColumnByLeaveType>;
  const approvedLeavePeriods = await db
    .select({
      nip: schema.pegawai.nip,
      bulan: schema.tukinBulanan.bulan,
      tahun: schema.tukinBulanan.tahun,
      jenisCuti: schema.pengajuanCuti.jenisCuti,
      tglMulai: schema.pengajuanCuti.tglMulai,
      tglSelesai: schema.pengajuanCuti.tglSelesai,
    })
    .from(schema.tukinBulanan)
    .innerJoin(schema.pegawai, operators.eq(schema.tukinBulanan.idPegawai, schema.pegawai.id))
    .innerJoin(schema.pengajuanCuti, operators.eq(schema.tukinBulanan.idPegawai, schema.pengajuanCuti.idPegawai))
    .where(operators.and(
      operators.eq(schema.pengajuanCuti.statusPengajuan, 'Disetujui'),
      operators.inArray(schema.pengajuanCuti.jenisCuti, supportedLeaveTypes),
      operators.lte(
        schema.pengajuanCuti.tglMulai,
        operators.sql`make_date(${schema.tukinBulanan.tahun}, ${schema.tukinBulanan.bulan}, 1) + interval '1 month - 1 day'`,
      ),
      operators.gte(
        schema.pengajuanCuti.tglSelesai,
        operators.sql`make_date(${schema.tukinBulanan.tahun}, ${schema.tukinBulanan.bulan}, 1)`,
      ),
    ));

  const matchingLeave = approvedLeavePeriods.find((leave) => {
    const periodStart = `${leave.tahun}-${String(leave.bulan).padStart(2, '0')}-01`;
    const periodEnd = new Date(Date.UTC(leave.tahun, leave.bulan, 0)).toISOString().slice(0, 10);
    const start = leave.tglMulai > periodStart ? leave.tglMulai : periodStart;
    const end = leave.tglSelesai < periodEnd ? leave.tglSelesai : periodEnd;

    let weekdays = 0;
    for (const date = new Date(`${start}T00:00:00Z`), lastDate = new Date(`${end}T00:00:00Z`);
      date <= lastDate;
      date.setUTCDate(date.getUTCDate() + 1)) {
      if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6) weekdays++;
    }

    if (leave.jenisCuti === 'Besar') return leave.tglMulai.slice(0, 7) === periodStart.slice(0, 7);
    return weekdays > 0;
  });

  if (!matchingLeave) {
    context.skip('No approved leave overlaps a Tukin period in the configured integration-test database');
    return;
  }

  const rows = readExportRows(await getExportDataTukin(matchingLeave.bulan, matchingLeave.tahun));
  const headers = rows[1]?.map(String);
  const exportedRow = rows.slice(2).find((row) => row[2] === `'${matchingLeave.nip}`);

  assert.ok(headers, 'Export should include a header row');
  assert.ok(exportedRow, 'Export should include the pegawai with Tukin in the selected period');
  assert.ok(isMappedLeaveType(matchingLeave.jenisCuti), 'Leave type should map to a workbook column');
  const expectedColumn = headers.indexOf(expectedColumnByLeaveType[matchingLeave.jenisCuti]);

  assert.notEqual(expectedColumn, -1, 'Export should include the cuti category column');
  assert.ok(
    Number(exportedRow[expectedColumn]) > 0,
    'Approved leave overlapping the Tukin period should produce a non-zero export value',
  );
});
