import assert from 'node:assert/strict';
import test from 'node:test';
import {
  allocateCutiByYear,
  getCutiBucketYears,
  getWeekdayDates,
  getWeekdaysByYear,
} from '../../src/app/admin/cuti/cuti-utils';

test('getWeekdayDates returns weekdays and excludes weekend dates', () => {
  assert.deepEqual(
    getWeekdayDates('2026-10-16', '2026-10-19'),
    ['2026-10-16', '2026-10-19'],
  );
});

test('getWeekdaysByYear splits working days across calendar years', () => {
  assert.deepEqual(
    [...getWeekdaysByYear('2026-12-31', '2027-01-04').entries()],
    [[2026, 1], [2027, 2]],
  );
});

test('getCutiBucketYears orders N-2, N-1, and N balances', () => {
  assert.deepEqual(getCutiBucketYears(2028), [2026, 2027, 2028]);
});

test('allocateCutiByYear spends older balances before newer balances', () => {
  const balances = new Map([
    [2026, 2],
    [2027, 3],
    [2028, 5],
  ]);

  assert.deepEqual(
    [...allocateCutiByYear(new Map([[2028, 7]]), balances)!.entries()],
    [[2026, 2], [2027, 3], [2028, 2]],
  );
  assert.deepEqual([...balances.entries()], [[2026, 0], [2027, 0], [2028, 3]]);
});

test('allocateCutiByYear carries remaining balances between leave years', () => {
  const balances = new Map([
    [2025, 2],
    [2026, 3],
    [2027, 3],
    [2028, 3],
  ]);

  assert.deepEqual(
    [...allocateCutiByYear(new Map([[2027, 3], [2028, 4]]), balances)!.entries()],
    [[2025, 2], [2026, 3], [2027, 2]],
  );
  assert.deepEqual([...balances.entries()], [[2025, 0], [2026, 0], [2027, 1], [2028, 3]]);
});

test('allocateCutiByYear rejects requests exceeding all available balances', () => {
  const allocation = allocateCutiByYear(
    new Map([[2028, 4]]),
    new Map([[2026, 1], [2027, 1], [2028, 1]]),
  );

  assert.equal(allocation, null);
});
