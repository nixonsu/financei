"use client";

import { Client } from "@/generated/prisma/client";
import Button from "@/src/components/Button";
import CurrencyInput from "@/src/components/CurrencyInput";
import Input from "@/src/components/Input";
import Select from "@/src/components/Select";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import {
  CaretRightIcon,
  MagnifyingGlassIcon,
  UserIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

enum IncomeType {
  Sale = "Sale",
  Interest = "Interest",
}

const INCOME_TYPE_OPTIONS = Object.values(IncomeType);

export default function AddIncomePage() {
  const router = useRouter();
  const [incomeType, setIncomeType] = useState<string>(IncomeType.Sale);
  const [cardAmount, setCardAmount] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");

  // Client selector state
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientPickerOpen, setClientPickerOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadClients() {
      const res = await fetch(API_ROUTES.CLIENTS);
      const data: Client[] = await res.json();
      setClients(data);
    }
    loadClients();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setClientPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const terms = clientSearch.toLowerCase().split(/\s+/);
    return clients.filter((c) => {
      const fullName = `${c.firstName} ${c.lastName}`.toLowerCase();
      return terms.every((t) => fullName.includes(t));
    });
  }, [clients, clientSearch]);

  const isInterestSelected = incomeType === IncomeType.Interest;

  const handleSubmit = async () => {
    const route = isInterestSelected
      ? API_ROUTES.INCOME_INTEREST
      : API_ROUTES.INCOME_SALE;
    const body = isInterestSelected
      ? {
          cardAmount: parseFloat(cardAmount) || 0,
          cashAmount: parseFloat(cashAmount) || 0,
          date,
          notes,
        }
      : {
          cardAmount: parseFloat(cardAmount) || 0,
          cashAmount: parseFloat(cashAmount) || 0,
          date,
          notes,
          clientId: selectedClient?.id,
        };

    const res = await fetch(route, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to add income", "error");
      return;
    }

    showToast(data.message);
    router.push(UI_ROUTES.TRANSACTIONS);
  };

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold italic">Add income</h1>

      <Select
        options={INCOME_TYPE_OPTIONS}
        value={incomeType}
        onChange={setIncomeType}
        placeholder="Select type"
      />

      {!isInterestSelected && (
        <div className="relative" ref={pickerRef}>
          <button
            type="button"
            className="flex w-full items-center gap-3 bg-white px-4 py-3 border-black border-2 focus:outline-none focus:shadow-[2px_2px_0px_rgba(0,0,0,1)] cursor-pointer"
            onClick={() => setClientPickerOpen(!clientPickerOpen)}
          >
            <UserIcon size={22} weight="bold" />
            <span className="flex-1 text-left text-lg border-b-2 border-black pb-0.5 truncate">
              {selectedClient
                ? `${selectedClient.firstName} ${selectedClient.lastName}`
                : "Select client"}
            </span>
            <CaretRightIcon size={20} weight="bold" />
          </button>

          {clientPickerOpen && (
            <div className="absolute left-0 right-0 z-20 mt-2 bg-white border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)] max-h-64 flex flex-col">
              <div className="flex items-center gap-2 px-3 py-2 border-b-2 border-black">
                <MagnifyingGlassIcon size={18} />
                <input
                  autoFocus
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && filteredClients.length > 0) {
                      setSelectedClient(filteredClients[0]);
                      setClientPickerOpen(false);
                      setClientSearch("");
                    }
                  }}
                  placeholder="Search clients..."
                  className="flex-1 outline-none text-sm bg-transparent"
                />
                {selectedClient && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClient(null);
                      setClientSearch("");
                    }}
                    className="text-gray-500 hover:text-black"
                  >
                    <XIcon size={16} weight="bold" />
                  </button>
                )}
              </div>

              <div className="overflow-y-auto">
                {filteredClients.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-4">
                    No clients found
                  </p>
                ) : (
                  filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#B8FF9F] border-b border-gray-200 last:border-b-0 ${
                        selectedClient?.id === client.id
                          ? "bg-[#e0ffcf] font-medium"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedClient(client);
                        setClientPickerOpen(false);
                        setClientSearch("");
                      }}
                    >
                      {client.firstName} {client.lastName}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

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
        color="lime"
        size="lg"
        rounded="md"
        className="w-full mt-2 text-lg font-semibold"
      >
        Save
      </Button>
    </div>
  );
}
