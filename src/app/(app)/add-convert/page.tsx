"use client";

import Button from "@/src/components/Button";
import CurrencyInput from "@/src/components/CurrencyInput";
import Input from "@/src/components/Input";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { ArrowDownIcon, ArrowsDownUpIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Direction = "cash-to-card" | "card-to-cash";

export default function AddConvertPage() {
  const router = useRouter();
  const [direction, setDirection] = useState<Direction>("cash-to-card");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  const isCashToCard = direction === "cash-to-card";
  const fromLabel = isCashToCard ? "Cash" : "Card";
  const toLabel = isCashToCard ? "Card" : "Cash";

  const toggleDirection = () => {
    setDirection(isCashToCard ? "card-to-cash" : "cash-to-card");
  };

  const handleSubmit = async () => {
    const route = isCashToCard
      ? API_ROUTES.CONVERSION_CASH_TO_CARD
      : API_ROUTES.CONVERSION_CARD_TO_CASH;

    const body = {
      amount: parseFloat(amount) || 0,
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
      showToast(data.error || "Failed to add conversion", "error");
      return;
    }

    showToast(data.message);
    router.push(UI_ROUTES.TRANSACTIONS);
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold italic">I want to convert</h1>

      <div className="relative border-2 border-black">
        <div className="flex items-center gap-3 p-4">
          <span className="text-lg font-bold w-12">{fromLabel}</span>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            autoFocus
            className="flex-1! w-full!"
          />
        </div>

        <div className="flex justify-center">
          <ArrowDownIcon weight="bold" size={20} />
        </div>

        <div className="flex items-center gap-3 p-4">
          <span className="text-lg font-bold w-12">{toLabel}</span>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            className="flex-1! w-full!"
          />
        </div>

        <button
          type="button"
          onClick={toggleDirection}
          className="cursor-pointer absolute top-1/2 right-4 -translate-y-1/2 flex items-center justify-center w-11 h-11 border-2 border-black bg-blue-100 hover:bg-blue-200 active:bg-blue-300 transition hover:shadow-[2px_2px_0px_rgba(0,0,0,1)]"
          aria-label="Swap direction"
        >
          <ArrowsDownUpIcon weight="bold" size={22} />
        </button>
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
        color="cyan"
        size="lg"
        rounded="md"
        className="w-full mt-2 text-lg font-semibold"
      >
        Save
      </Button>
    </div>
  );
}
