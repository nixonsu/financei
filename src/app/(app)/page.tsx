"use client";

import FetchContent from "@/src/components/FetchContent";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import type { Overview } from "@/src/features/overview/overview-service";
import { useFetch } from "@/src/hooks/useFetch";
import {
  PERIODS,
  type Period,
  periodToDateRange,
  getDefaultFinancialYear
} from "@/src/utils/period-filter";
import { CaretRightIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function fmt(n: number): string {
  return `$${Math.abs(n).toLocaleString("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtWhole(n: number): string {
  return n.toLocaleString("en-AU");
}

export default function Home() {
  const router = useRouter();
  const [period, setPeriod] = useState<Period>("1m");
  const [customFrom, setCustomFrom] = useState(() => getDefaultFinancialYear().from);
  const [customTo, setCustomTo] = useState(() => getDefaultFinancialYear().to);

  const overviewUrl = () => {
    const { from, to } = periodToDateRange(period, customFrom, customTo);
    return `${API_ROUTES.OVERVIEW}?${new URLSearchParams({ from, to })}`;
  };

  const { data: overview, loading } = useFetch<Overview>(overviewUrl);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold italic">Overview</h1>

      {/* Period selector */}
      <div className="grid grid-cols-5 border-2 border-black">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPeriod(p.value)}
            className={`cursor-pointer py-2.5 text-sm font-bold border-r-2 border-black last:border-r-0 transition-colors ${
              period === p.value
                ? "bg-cyan-300"
                : "bg-white hover:bg-gray-50 active:bg-gray-100"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === "custom" && (
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-sm font-semibold">From</label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-full border-black border-2 p-2.5 bg-white focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            />
          </div>
          <div className="flex-1 flex flex-col gap-1">
            <label className="text-sm font-semibold">To</label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-full border-black border-2 p-2.5 bg-white focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
            />
          </div>
        </div>
      )}

      <FetchContent data={overview} loading={loading}>
        {(data) => (
          <div className="flex flex-col gap-5">
            {/* Balance comparison */}
            <section>
              <p className="text-sm font-bold italic text-gray-600 mb-2">
                Balances
              </p>
              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                <div className="grid grid-cols-3 px-4 py-2.5 border-b-2 border-black bg-gray-50">
                  <span />
                  <span className="text-xs font-bold text-center uppercase tracking-wide">
                    Expected
                  </span>
                  <span className="text-xs font-bold text-center uppercase tracking-wide">
                    Actual
                  </span>
                </div>

                <div className="grid grid-cols-3 items-center px-4 py-3 border-b-2 border-black">
                  <span className="text-sm font-semibold">Card</span>
                  <span className="text-sm font-medium text-center">
                    {fmt(data.expectedCardBalance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(UI_ROUTES.CARD)}
                    className="cursor-pointer flex items-center justify-center gap-1 text-sm font-medium text-center hover:text-cyan-700 transition-colors"
                  >
                    {fmt(data.actualCardBalance)}
                    <CaretRightIcon size={14} weight="bold" />
                  </button>
                </div>

                <div className="grid grid-cols-3 items-center px-4 py-3 border-b-2 border-black">
                  <span className="text-sm font-semibold">Cash</span>
                  <span className="text-sm font-medium text-center">
                    {fmt(data.expectedCashBalance)}
                  </span>
                  <button
                    type="button"
                    onClick={() => router.push(UI_ROUTES.CASH)}
                    className="cursor-pointer flex items-center justify-center gap-1 text-sm font-medium text-center hover:text-cyan-700 transition-colors"
                  >
                    {fmt(data.actualCashBalance)}
                    <CaretRightIcon size={14} weight="bold" />
                  </button>
                </div>

                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-bold">Variance</span>
                  <span
                    className={`text-base font-bold ${
                      data.variance === 0
                        ? "text-green-600"
                        : Math.abs(data.variance) < 10
                          ? "text-yellow-600"
                          : "text-red-600"
                    }`}
                  >
                    {data.variance >= 0 ? "" : "-"}
                    {fmt(data.variance)}
                  </span>
                </div>
              </div>
            </section>

            {/* Money flow */}
            <section>
              <p className="text-sm font-bold italic text-gray-600 mb-2">
                Money Flow
              </p>
              <div className="flex flex-col gap-3">
                <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-green-700">Money In</span>
                    <span className="font-bold text-green-700">
                      {fmt(data.totalMoneyIn)}
                    </span>
                  </div>
                  <StatRow label="Card In" value={fmt(data.totalCardIn)} />
                  <StatRow label="Cash In" value={fmt(data.totalCashIn)} />
                </div>

                <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-red-700">Money Out</span>
                    <span className="font-bold text-red-700">
                      {fmt(data.totalMoneyOut)}
                    </span>
                  </div>
                  <StatRow label="Card Out" value={fmt(data.totalCardOut)} />
                  <StatRow label="Cash Out" value={fmt(data.totalCashOut)} />
                </div>

                <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold">Net Profit</span>
                    <span
                      className={`font-bold text-lg ${
                        data.netProfit >= 0
                          ? "text-green-700"
                          : "text-red-700"
                      }`}
                    >
                      {data.netProfit < 0 ? "-" : ""}
                      {fmt(data.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Statistics */}
            <section>
              <p className="text-sm font-bold italic text-gray-600 mb-2">
                Statistics
              </p>
              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)] p-4 flex flex-col gap-1.5">
                <StatRow
                  label="Sales Revenue"
                  value={fmt(data.totalSalesRevenue)}
                />
                <StatRow
                  label="Business Expenses"
                  value={fmt(data.totalBusinessExpenses)}
                />
                <StatRow
                  label="Personal Expenses"
                  value={fmt(data.totalPersonalExpenses)}
                />
                <StatRow
                  label="Interest Earned"
                  value={fmt(data.totalInterest)}
                />

                <div className="border-t border-gray-200 my-1" />

                <StatRow
                  label="Total Sales"
                  value={fmtWhole(data.saleCount)}
                />
                <StatRow
                  label="Unique Clients"
                  value={fmtWhole(data.uniqueClientCount)}
                />
                <StatRow
                  label="Avg Sale Value"
                  value={fmt(data.averageSaleValue)}
                />
                <StatRow
                  label="Transactions"
                  value={fmtWhole(data.transactionCount)}
                />
              </div>
            </section>
          </div>
        )}
      </FetchContent>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
