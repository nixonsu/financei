"use client";

import Button from "@/src/components/Button";
import CurrencyInput from "@/src/components/CurrencyInput";
import FetchContent from "@/src/components/FetchContent";
import Input from "@/src/components/Input";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES } from "@/src/constants/routes";
import { useFetch } from "@/src/hooks/useFetch";
import {
  PERIODS,
  formatIsoRangeEnAu,
  getDefaultFinancialYear,
  periodToDateRange,
  type Period,
} from "@/src/utils/period-filter";
import type { Icon } from "@phosphor-icons/react";
import {
  ArrowsLeftRightIcon,
  BankIcon,
  BriefcaseIcon,
  PencilSimpleIcon,
  StorefrontIcon,
  TrashIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useMemo, useState } from "react";

type TransactionType = "INCOME" | "EXPENSE";
type TransactionCategory =
  | "SALE"
  | "INTEREST"
  | "BUSINESS"
  | "PERSONAL"
  | "CONVERT";

const TYPE_OPTIONS: { value: TransactionType | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

const CATEGORY_OPTIONS: {
  value: TransactionCategory | "ALL";
  label: string;
}[] = [
  { value: "ALL", label: "All" },
  { value: "SALE", label: "Sale" },
  { value: "INTEREST", label: "Interest" },
  { value: "BUSINESS", label: "Business" },
  { value: "PERSONAL", label: "Personal" },
  { value: "CONVERT", label: "Convert" },
];

type TransactionDTO = {
  id: number;
  type: "INCOME" | "EXPENSE";
  category: "SALE" | "INTEREST" | "BUSINESS" | "PERSONAL" | "CONVERT";
  cardAmount: string;
  cashAmount: string;
  notes: string | null;
  occurredAt: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
    email: string | null;
  } | null;
};

const CATEGORY_LABELS: Record<TransactionDTO["category"], string> = {
  SALE: "Client Sale",
  INTEREST: "Interest income",
  BUSINESS: "Business expense",
  PERSONAL: "Personal expense",
  CONVERT: "Conversion",
};

const CATEGORY_ICONS: Record<TransactionDTO["category"], Icon> = {
  SALE: StorefrontIcon,
  INTEREST: BankIcon,
  BUSINESS: BriefcaseIcon,
  PERSONAL: UserIcon,
  CONVERT: ArrowsLeftRightIcon,
};

const CATEGORY_ICON_BG: Record<TransactionDTO["category"], string> = {
  SALE: "bg-green-100",
  INTEREST: "bg-yellow-100",
  BUSINESS: "bg-red-100",
  PERSONAL: "bg-pink-100",
  CONVERT: "bg-blue-100",
};

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

function filterTransactions(
  txs: TransactionDTO[],
  typeFilter: TransactionType | "ALL",
  categoryFilter: TransactionCategory | "ALL",
): TransactionDTO[] {
  return txs.filter((tx) => {
    if (typeFilter !== "ALL" && tx.type !== typeFilter) return false;
    if (categoryFilter !== "ALL" && tx.category !== categoryFilter)
      return false;
    return true;
  });
}

function sumIncomeAndExpense(txs: TransactionDTO[]): {
  income: number;
  expense: number;
} {
  let income = 0;
  let expense = 0;
  for (const tx of txs) {
    const t = totalAmount(tx);
    if (tx.type === "INCOME") income += t;
    else expense += t;
  }
  return { income, expense };
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
  const [period, setPeriod] = useState<Period>("thisMonth");
  const [customFrom, setCustomFrom] = useState(getDefaultFinancialYear().from);
  const [customTo, setCustomTo] = useState(getDefaultFinancialYear().to);
  const [typeFilter, setTypeFilter] = useState<TransactionType | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<
    TransactionCategory | "ALL"
  >("ALL");
  const [selected, setSelected] = useState<TransactionDTO | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editDate, setEditDate] = useState("");
  const [editCardAmount, setEditCardAmount] = useState("");
  const [editCashAmount, setEditCashAmount] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const openSelected = (tx: TransactionDTO) => {
    setSelected(tx);
    setEditing(false);
    setConfirmingDelete(false);
  };

  const closeSelected = () => {
    setSelected(null);
    setEditing(false);
    setConfirmingDelete(false);
  };

  const startEditing = () => {
    if (!selected) return;
    setEditDate(selected.occurredAt.slice(0, 10));
    setEditCardAmount(parseFloat(selected.cardAmount).toString());
    setEditCashAmount(parseFloat(selected.cashAmount).toString());
    setEditNotes(selected.notes ?? "");
    setEditing(true);
  };

  const handleSave = async () => {
    if (!selected) return;
    const body = {
      id: selected.id,
      cardAmount: parseFloat(editCardAmount) || 0,
      cashAmount: parseFloat(editCashAmount) || 0,
      date: editDate,
      notes: editNotes,
    };

    const res = await fetch(API_ROUTES.TRANSACTIONS, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to update transaction", "error");
      return;
    }

    showToast("Transaction updated");
    setSelected(null);
    setEditing(false);
    refetch();
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      const res = await fetch(API_ROUTES.TRANSACTIONS, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast(data.error || "Failed to delete transaction", "error");
        return;
      }

      showToast("Transaction deleted");
      closeSelected();
      refetch();
    } finally {
      setDeleting(false);
    }
  };

  const txUrl = () => {
    const { from, to } = periodToDateRange(period, customFrom, customTo);
    return `${API_ROUTES.TRANSACTIONS}?${new URLSearchParams({ from, to })}`;
  };
  const {
    data: transactions,
    loading,
    refetch,
  } = useFetch<TransactionDTO[]>(txUrl);

  const filteredTransactions = useMemo(
    () =>
      transactions
        ? filterTransactions(transactions, typeFilter, categoryFilter)
        : [],
    [transactions, typeFilter, categoryFilter],
  );

  const filterTotals = useMemo(
    () => sumIncomeAndExpense(filteredTransactions),
    [filteredTransactions],
  );

  const periodRange = useMemo(
    () => periodToDateRange(period, customFrom, customTo),
    [period, customFrom, customTo],
  );
  const periodRangeLabel = useMemo(
    () => formatIsoRangeEnAu(periodRange.from, periodRange.to),
    [periodRange.from, periodRange.to],
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Transactions</h1>

      {/* Period selector */}
      <div className="grid grid-cols-5 border-2 border-black">
        {PERIODS.map((p) => (
          <button
            key={p.value}
            type="button"
            title={p.title}
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

      <p className="text-sm font-medium text-gray-600">{periodRangeLabel}</p>

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

      {/* Type filter */}
      <div
        className={`grid border-2 border-black`}
        style={{
          gridTemplateColumns: `repeat(${TYPE_OPTIONS.length}, minmax(0, 1fr))`,
        }}
      >
        {TYPE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTypeFilter(opt.value)}
            className={`cursor-pointer py-2 text-sm font-bold border-r-2 border-black last:border-r-0 transition-colors ${
              typeFilter === opt.value
                ? "bg-cyan-300"
                : "bg-white hover:bg-gray-50 active:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Category filter */}
      <div
        className={`grid border-2 border-black`}
        style={{
          gridTemplateColumns: `repeat(${CATEGORY_OPTIONS.length}, minmax(0, 1fr))`,
        }}
      >
        {CATEGORY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setCategoryFilter(opt.value)}
            className={`cursor-pointer py-2 text-xs font-bold border-r-2 border-black last:border-r-0 transition-colors ${
              categoryFilter === opt.value
                ? "bg-cyan-300"
                : "bg-white hover:bg-gray-50 active:bg-gray-100"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {transactions && transactions.length > 0 && (
        <div className="border-2 border-black bg-white px-4 py-3 shadow-[4px_4px_0px_0_#000] flex flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
          <p className="text-sm font-bold text-gray-700 shrink-0">
            {filteredTransactions.length === 1
              ? `${filteredTransactions.length} transaction`
              : `${filteredTransactions.length} transactions`}
          </p>
          <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 text-sm font-bold text-right min-w-0">
            {typeFilter === "INCOME" && (
              <span className="text-green-600 whitespace-nowrap">
                Total: {formatCurrency(filterTotals.income)}
              </span>
            )}
            {typeFilter === "EXPENSE" && (
              <span className="text-red-600 whitespace-nowrap">
                Total: -{formatCurrency(filterTotals.expense)}
              </span>
            )}
          </div>
        </div>
      )}

      <FetchContent
        data={transactions}
        loading={loading}
        hasData={(txs) => txs.length > 0}
        emptyMessage="No transactions found for this period."
      >
        {() => {
          if (filteredTransactions.length === 0) {
            return (
              <p className="text-center text-gray-500 py-8">
                Nuffing here :o Were you expecting something? Maybe try a
                different period?
              </p>
            );
          }

          const grouped = groupByDate(filteredTransactions);
          return (
            <div className="flex flex-col gap-6">
              {grouped.map(([date, dateTxs]) => (
                <div key={date}>
                  <p className="text-sm font-bold italic text-gray-600 mb-2">
                    {formatDateHeading(date)}
                  </p>

                  <div className="border-2 border-black bg-white shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                    {dateTxs.map((tx, i) => {
                      const total = totalAmount(tx);
                      const isIncome = tx.type === "INCOME";

                      return (
                        <button
                          key={tx.id}
                          type="button"
                          onClick={() => openSelected(tx)}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer hover:bg-gray-50 active:bg-gray-100 ${
                            i < dateTxs.length - 1
                              ? "border-b-2 border-black"
                              : ""
                          }`}
                        >
                          <div
                            className={`shrink-0 w-10 h-10 border-2 border-black flex items-center justify-center ${CATEGORY_ICON_BG[tx.category]}`}
                          >
                            {(() => {
                              const Icon = CATEGORY_ICONS[tx.category];
                              return <Icon size={22} weight="bold" />;
                            })()}
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
          );
        }}
      </FetchContent>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={closeSelected}
        >
          <div
            className="mx-4 w-full max-w-sm bg-white border-3 border-black shadow-[8px_8px_0px_rgba(0,0,0,1)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold italic">
                {CATEGORY_LABELS[selected.category]}
              </h2>
              <div className="flex items-center gap-2">
                {!editing && (
                  <>
                    <button
                      type="button"
                      onClick={startEditing}
                      className="cursor-pointer p-1 hover:bg-cyan-100 border-2 border-black"
                    >
                      <PencilSimpleIcon size={20} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="cursor-pointer p-1 hover:bg-red-100 border-2 border-black"
                    >
                      <TrashIcon size={20} weight="bold" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={closeSelected}
                  className="cursor-pointer p-1 hover:bg-gray-100 border-2 border-black"
                >
                  <XIcon size={20} weight="bold" />
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              {selected.client && (
                <div className="pb-3 mb-1 border-b-2 border-black">
                  <p className="text-sm font-bold italic mb-2">Client</p>
                  <div className="flex flex-col gap-2">
                    <DetailRow
                      label="Name"
                      value={`${selected.client.firstName} ${selected.client.lastName}`}
                    />
                    {selected.client.email && (
                      <DetailRow label="Email" value={selected.client.email} />
                    )}
                    {selected.client.phoneNumber && (
                      <DetailRow
                        label="Phone"
                        value={selected.client.phoneNumber}
                      />
                    )}
                  </div>
                </div>
              )}

              {editing ? (
                <>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-14">Date</label>
                    <input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="flex-1 border-black border-2 p-2.5 focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-14">Card</label>
                    <CurrencyInput
                      value={editCardAmount}
                      onChange={setEditCardAmount}
                      className="flex-1! w-full!"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-14">Cash</label>
                    <CurrencyInput
                      value={editCashAmount}
                      onChange={setEditCashAmount}
                      className="flex-1! w-full!"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-500 w-14">Notes</label>
                    <Input
                      value={editNotes}
                      onChange={setEditNotes}
                      placeholder="Optional notes..."
                      className="flex-1! w-full!"
                    />
                  </div>

                  <div className="flex gap-3 mt-2">
                    <Button
                      onClick={() => setEditing(false)}
                      color="red"
                      size="md"
                      rounded="md"
                      className="flex-1 font-semibold"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      color="lime"
                      size="md"
                      rounded="md"
                      className="flex-1 font-semibold"
                    >
                      Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <DetailRow
                    label="Date"
                    value={formatDateHeading(selected.occurredAt.slice(0, 10))}
                  />
                  {(() => {
                    const isExpense = selected.type === "EXPENSE";
                    const card = parseFloat(selected.cardAmount);
                    const cash = parseFloat(selected.cashAmount);
                    const total = card + cash;
                    const signFor = (n: number) =>
                      isExpense && n > 0 ? "-" : "";
                    return (
                      <>
                        <DetailRow
                          label="Card amount"
                          value={`${signFor(card)}${formatCurrency(card)}`}
                        />
                        <DetailRow
                          label="Cash amount"
                          value={`${signFor(cash)}${formatCurrency(cash)}`}
                        />

                        <div className="border-t-2 border-black pt-3 mt-1">
                          <DetailRow
                            label="Total"
                            value={`${signFor(total)}${formatCurrency(total)}`}
                            bold
                            color={
                              isExpense ? "text-red-600" : "text-green-600"
                            }
                          />
                        </div>
                      </>
                    );
                  })()}

                  {selected.notes && (
                    <div className="border-t-2 border-dashed border-gray-300 pt-3 mt-1">
                      <p className="text-sm font-semibold text-gray-500">
                        Notes
                      </p>
                      <p className="text-base">{selected.notes}</p>
                    </div>
                  )}

                  {confirmingDelete && (
                    <div className="border-t-2 border-black pt-3 mt-2 flex items-center justify-between gap-3">
                      <p className="text-sm font-bold text-red-600">Delete?</p>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setConfirmingDelete(false)}
                          color="cyan"
                          size="sm"
                          rounded="md"
                          className="font-semibold"
                        >
                          No
                        </Button>
                        <Button
                          onClick={handleDelete}
                          disabled={deleting}
                          color="red"
                          size="sm"
                          rounded="md"
                          className="font-semibold"
                        >
                          {deleting ? "Deleting..." : "Yes, delete"}
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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
