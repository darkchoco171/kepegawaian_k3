// The imported opening balances currently cover 2024–2026; later years accrue 12 days.
export const LAST_IMPORTED_BALANCE_YEAR = 2026;
export const ANNUAL_CUTI_QUOTA = 12;

export function getWeekdayDates(startDate: string, endDate: string) {
  const weekdays: string[] = [];
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  for (const current = new Date(start); current <= end; current.setUTCDate(current.getUTCDate() + 1)) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      weekdays.push(current.toISOString().slice(0, 10));
    }
  }

  return weekdays;
}

export function getWeekdaysByYear(startDate: string, endDate: string) {
  const weekdaysByYear = new Map<number, number>();
  for (const date of getWeekdayDates(startDate, endDate)) {
    const year = Number(date.slice(0, 4));
    weekdaysByYear.set(year, (weekdaysByYear.get(year) || 0) + 1);
  }

  return weekdaysByYear;
}

export function allocateCutiByYear(
  weekdaysByYear: Map<number, number>,
  balances: Map<number, number>,
) {
  const allocation = new Map<number, number>();

  for (const [leaveYear, weekdays] of [...weekdaysByYear.entries()].sort(([a], [b]) => a - b)) {
    let remainingDays = weekdays;

    for (const balanceYear of [leaveYear - 2, leaveYear - 1, leaveYear]) {
      const available = balances.get(balanceYear) || 0;
      const deducted = Math.min(available, remainingDays);

      if (deducted > 0) {
        balances.set(balanceYear, available - deducted);
        allocation.set(balanceYear, (allocation.get(balanceYear) || 0) + deducted);
        remainingDays -= deducted;
      }
    }

    if (remainingDays > 0) {
      return null;
    }
  }

  return allocation;
}

export function allocateLegacyCutiRefund(
  weekdaysByYear: Map<number, number>,
  balances: Map<number, number>,
) {
  const projectedBalances = new Map(balances);
  const refund = new Map<number, number>();

  for (const [leaveYear, weekdays] of [...weekdaysByYear.entries()].sort(([a], [b]) => a - b)) {
    let remainingDays = weekdays;

    for (const balanceYear of getCutiBucketYears(leaveYear)) {
      const currentBalance = projectedBalances.get(balanceYear);
      if (currentBalance === undefined) continue;
      const availableRoom = Math.max(0, ANNUAL_CUTI_QUOTA - currentBalance);
      const restoredDays = Math.min(availableRoom, remainingDays);

      if (restoredDays > 0) {
        projectedBalances.set(balanceYear, currentBalance + restoredDays);
        refund.set(balanceYear, (refund.get(balanceYear) || 0) + restoredDays);
        remainingDays -= restoredDays;
      }
    }

    if (remainingDays > 0) return null;
  }

  return refund;
}

export function getCutiBucketYears(leaveYear: number) {
  return [leaveYear - 2, leaveYear - 1, leaveYear] as const;
}
