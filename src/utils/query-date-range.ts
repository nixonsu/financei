const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Start of calendar day in UTC (inclusive lower bound for YYYY-MM-DD query params). */
export function startOfUtcDay(isoDate: string): Date {
  if (!ISO_DATE.test(isoDate)) return new Date(NaN);
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * End of calendar day in UTC (inclusive upper bound).
 * `new Date("2025-03-20")` alone is midnight at the *start* of that day, so `lte` misses the rest of the day.
 */
export function endOfUtcDay(isoDate: string): Date {
  if (!ISO_DATE.test(isoDate)) return new Date(NaN);
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}
