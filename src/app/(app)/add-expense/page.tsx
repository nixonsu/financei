"use client";

import Button from "@/src/components/Button";
import CurrencyInput from "@/src/components/CurrencyInput";
import Input from "@/src/components/Input";
import Select from "@/src/components/Select";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { useRouter } from "next/navigation";
import { useState } from "react";

enum ExpenseType {
  Personal = "Personal",
  Business = "Business",
}

const EXPENSE_TYPE_OPTIONS = Object.values(ExpenseType);

export default function AddExpensePage() {
  const router = useRouter();
  const [expenseType, setExpenseType] = useState<string>(ExpenseType.Business);
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    const route =
      expenseType === ExpenseType.Personal
        ? API_ROUTES.EXPENSE_PERSONAL
        : API_ROUTES.EXPENSE_BUSINESS;

    const body = {
      cardAmount: parseFloat(cardAmount) || 0,
      cashAmount: parseFloat(cashAmount) || 0,
      date,
      notes,
    };

    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to add expense", "error");
      return;
    }

    showToast(data.message);
    router.push(UI_ROUTES.TRANSACTIONS);
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold italic">Add expense</h1>

      <Select
        options={EXPENSE_TYPE_OPTIONS}
        value={expenseType}
        onChange={setExpenseType}
        placeholder="Select type"
      />

      <div className="flex items-center gap-4">
        <div className="flex-1 flex items-center gap-2">
          <label className="text-lg font-medium">Card:</label>
          <CurrencyInput
            value={cardAmount}
            onChange={setCardAmount}
            className="flex-1! w-full!"
          />
        </div>
        <div className="flex-1 flex items-center gap-2">
          <label className="text-lg font-medium">Cash:</label>
          <CurrencyInput
            value={cashAmount}
            onChange={setCashAmount}
            className="flex-1! w-full!"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-lg font-medium w-14">Date:</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="flex-1 border-black border-2 p-2.5 focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
        />
      </div>

      <div className="flex items-center gap-3">
        <label className="text-lg font-medium w-14">Notes:</label>
        <Input
          value={notes}
          onChange={setNotes}
          placeholder="Optional notes..."
          className="flex-1! w-full!"
        />
      </div>

      <Button
        onClick={handleSubmit}
        color="red"
        size="lg"
        rounded="md"
        className="w-full mt-2 text-lg font-semibold"
      >
        Save
      </Button>
    </div>
  );
}
