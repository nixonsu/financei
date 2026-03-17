"use client";

import { API_ROUTES } from "@/src/constants/routes";
import { UserIcon, XIcon } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

type TransactionDTO = {
  id: number;
  type: "INCOME" | "EXPENSE";
  category: "SALE" | "INTEREST" | "BUSINESS" | "PERSONAL" | "CONVERT";
  cardAmount: string;
  cashAmount: string;
  notes: string | null;
  occurredAt: string;
  client: { id: number; firstName: string; lastName: string } | null;
};

const CATEGORY_LABELS: Record<TransactionDTO["category"], string> = {
  SALE: "Client Sale",
  INTEREST: "Interest income",
  BUSINESS: "Business expense",
  PERSONAL: "Personal expense",
  CONVERT: "Conversion",
};

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return toISODate(d);
}

function formatDateHeading(iso: string): string {
  const [year, month, day] = iso.split("-");
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function totalAmount(tx: TransactionDTO): number {
  return parseFloat(tx.cardAmount) + parseFloat(tx.cashAmount);
}

function formatCurrency(n: number): string {
  return `$${Math.abs(n).toFixed(2)}`;
}

function groupByDate(
  transactions: TransactionDTO[],
): [string, TransactionDTO[]][] {
  const groups = new Map<string, TransactionDTO[]>();
  for (const tx of transactions) {
    const key = tx.occurredAt.slice(0, 10);
    const list = groups.get(key);
    if (list) list.push(tx);
    else groups.set(key, [tx]);
  }
  return Array.from(groups.entries());
}

export default function TransactionsPage() {
  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(() => toISODate(new Date()));
  const [transactions, setTransactions] = useState<TransactionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TransactionDTO | null>(null);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ from, to });
      const res = await fetch(`${API_ROUTES.TRANSACTIONS}?${params}`);
      if (res.ok) {
        setTransactions(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const grouped = groupByDate(transactions);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold italic">Transactions</h1>

      {/* Date filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-sm font-semibold">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full border-black border-2 p-2.5 bg-white focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          />
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <label className="text-sm font-semibold">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full border-black border-2 p-2.5 bg-white focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          />
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <p className="text-center text-gray-500 py-8">Loading...</p>
      ) : transactions.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No transactions found for this period.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([date, txs]) => (
            <div key={date}>
              <p className="text-sm font-bold italic text-gray-600 mb-2">
                {formatDateHeading(date)}
              </p>

              <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                {txs.map((tx, i) => {
                  const total = totalAmount(tx);
                  const isIncome = tx.type === "INCOME";

                  return (
                    <button
                      key={tx.id}
                      type="button"
                      onClick={() => setSelected(tx)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${
                        i < txs.length - 1
                          ? "border-b-2 border-black"
                          : ""
                      }`}
                    >
                      <div className="shrink-0 w-10 h-10 border-2 border-black flex items-center justify-center bg-gray-100">
                        <UserIcon size={22} weight="bold" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-base truncate">
                          {tx.category === "SALE" && tx.client
                            ? `${tx.client.firstName} ${tx.client.lastName}`
                            : CATEGORY_LABELS[tx.category]}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {tx.notes || "No notes"}
                        </p>
                      </div>

                      <p
                        className={`font-bold text-base whitespace-nowrap ${
                          isIncome ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {isIncome ? "" : "-"}
                        {formatCurrency(total)}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="mx-4 w-full max-w-sm bg-white border-3 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-xl font-bold italic">
                {CATEGORY_LABELS[selected.category]}
              </h2>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="cursor-pointer p-1 hover:bg-gray-100 border-2 border-black"
              >
                <XIcon size={20} weight="bold" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {selected.client && (
                <DetailRow
                  label="Client"
                  value={`${selected.client.firstName} ${selected.client.lastName}`}
                />
              )}
              <DetailRow
                label="Date"
                value={formatDateHeading(selected.occurredAt.slice(0, 10))}
              />
              <DetailRow
                label="Card amount"
                value={formatCurrency(parseFloat(selected.cardAmount))}
              />
              <DetailRow
                label="Cash amount"
                value={formatCurrency(parseFloat(selected.cashAmount))}
              />

              <div className="border-t-2 border-black pt-3 mt-1">
                <DetailRow
                  label="Total"
                  value={`${selected.type === "EXPENSE" ? "-" : ""}${formatCurrency(totalAmount(selected))}`}
                  bold
                  color={
                    selected.type === "INCOME"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                />
              </div>

              {selected.notes && (
                <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-1">
                  <p className="text-sm font-semibold text-gray-500">Notes</p>
                  <p className="text-base">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  bold,
  color,
}: {
  label: string;
  value: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <p className="text-sm text-gray-500">{label}</p>
      <p
        className={`text-base ${bold ? "font-bold" : "font-medium"} ${color ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}
