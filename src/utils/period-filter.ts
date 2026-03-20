/** Preset range for list/overview filters; UI maps these to `from` / `to` ISO dates for APIs. */
export type Period = "1m" | "3m" | "1y" | "all" | "custom";

export const PERIODS: { value: Period; label: string }[] = [
  { value: "1m", label: "1M" },
  { value: "3m", label: "3M" },
  { value: "1y", label: "1Y" },
  { value: "all", label: "All" },
  { value: "custom", label: "Custom" },
];

const PERIOD_DAYS: Record<string, number> = {
  "1m": 30,
  "3m": 90,
  "1y": 365,
};

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Resolve preset or custom period to inclusive ISO date strings for API query params. */
export function periodToDateRange(
  period: Period,
  customFrom: string,
  customTo: string,
): { from: string; to: string } {
  if (period === "custom") return { from: customFrom, to: customTo };
  const to = new Date();
  const from = new Date();
  const days = PERIOD_DAYS[period];
  if (days) from.setDate(from.getDate() - days);
  else from.setFullYear(2000);
  return { from: toISODate(from), to: toISODate(to) };
}

export function getDefaultFinancialYear(): { from: string; to: string } {
  const today = new Date();
  const year =
    today.getMonth() >= 6 ? today.getFullYear() : today.getFullYear() - 1;
  return {
    from: `${year}-07-01`,
    to: `${year + 1}-06-30`,
  };
}
