"use client";

import { Client } from "@/generated/prisma/client";
import FetchContent from "@/src/components/FetchContent";
import IconButton from "@/src/components/IconButton";
import Input from "@/src/components/Input";
import { showToast } from "@/src/components/Toast";
import { API_ROUTES, UI_ROUTES } from "@/src/constants/routes";
import { SyncResult } from "@/src/features/clients/client-service";
import { useFetch } from "@/src/hooks/useFetch";
import { ArrowsClockwiseIcon, ArrowsCounterClockwiseIcon } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

export default function ClientsPage() {
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const router = useRouter();

  const {
    data: clients,
    loading,
    refetch,
  } = useFetch<Client[]>(API_ROUTES.CLIENTS);

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch(API_ROUTES.CLIENTS_SYNC, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || "Failed to sync clients", "error");
      setSyncing(false);
      return;
    }

    const result = data as SyncResult;
    refetch();
    showToast(
      `Synced ${result.total} clients - ${result.created} created, ${result.updated} updated`,
    );
    setSyncing(false);
  };

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    if (!search.trim()) return clients;
    const terms = search.toLowerCase().split(/\s+/);
    return clients.filter((client) => {
      const fullName = `${client.firstName} ${client.lastName}`.toLowerCase();
      return terms.every((term) => fullName.includes(term));
    });
  }, [clients, search]);

  const sortedClients = useMemo(() => {
    return [...filteredClients].sort((a, b) =>
      a.firstName.localeCompare(b.firstName),
    );
  }, [filteredClients]);

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-2xl font-bold">Clients</h1>

      <div className="flex items-stretch gap-2">
        <Input
          value={search}
          onChange={setSearch}
          placeholder="Looking for someone?"
          className="w-full!"
        />
        <IconButton
          onClick={handleSync}
          disabled={syncing}
          className="h-auto! w-auto! px-3"
        >
          <ArrowsCounterClockwiseIcon
            size={24}
            weight="bold"
            className={syncing ? "animate-spin" : ""}
          />
        </IconButton>
      </div>

      <div className="flex flex-col">
        <FetchContent
          data={clients}
          loading={loading}
          hasData={(c) => c.length > 0}
          emptyMessage="Nothing but crickets here..."
        >
          {() =>
            sortedClients.map((client, i) => {
              const letter = client.firstName.charAt(0).toUpperCase();
              const prevLetter =
                i > 0
                  ? sortedClients[i - 1].firstName.charAt(0).toUpperCase()
                  : null;
              const showSeparator = letter !== prevLetter;

              return (
                <div
                  key={client.id}
                  onClick={() =>
                    router.push(`${UI_ROUTES.ADD_INCOME}?clientId=${client.id}`)
                  }
                  className="cursor-pointer"
                >
                  {showSeparator && (
                    <div className="mt-4 mb-1">
                      <span className="text-sm font-bold text-gray-500">
                        {letter}
                      </span>
                      <hr className="border-gray-300" />
                    </div>
                  )}
                  <div className="py-3">
                    <h2 className="text-lg font-semibold">
                      {client.firstName} {client.lastName}
                    </h2>
                    <div className="text-sm text-gray-600 mt-0.5 opacity-50">
                      {client.phoneNumber && <p>{client.phoneNumber}</p>}
                      {client.email && (
                        <p className="truncate">{client.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          }
        </FetchContent>
      </div>
    </div>
  );
}
