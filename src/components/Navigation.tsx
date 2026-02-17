"use client";

import {
  ArrowsLeftRightIcon,
  CoinsIcon,
  GearIcon,
  HouseIcon,
  ListIcon,
  PlusSquareIcon,
  UserIcon,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const ICON_SIZE = 32;
const FANOUT_ANIM_MS = 200;

type NavItem =
  | { id: number; type: "link"; href: string; icon: React.ReactNode }
  | { id: number; type: "action"; icon: React.ReactNode };

export default function Navigation() {
  const pathname = usePathname();
  const router = useRouter();

  // fanoutOpen controls animation state
  const [fanoutOpen, setFanoutOpen] = useState(false);
  // fanoutMounted controls whether the DOM is rendered
  const [fanoutMounted, setFanoutMounted] = useState(false);

  const items: NavItem[] = useMemo(
    () => [
      {
        id: 1,
        type: "link",
        href: "/",
        icon: <HouseIcon weight="fill" size={ICON_SIZE} />,
      },
      {
        id: 2,
        type: "link",
        href: "/transactions",
        icon: <ListIcon weight="fill" size={ICON_SIZE} />,
      },
      {
        id: 3,
        type: "action",
        icon: <PlusSquareIcon weight="fill" size={ICON_SIZE} />,
      },
      {
        id: 4,
        type: "link",
        href: "/clients",
        icon: <UserIcon weight="fill" size={ICON_SIZE} />,
      },
      {
        id: 5,
        type: "link",
        href: "/settings",
        icon: <GearIcon weight="fill" size={ICON_SIZE} />,
      },
    ],
    [],
  );

  const openFanout = () => {
    setFanoutMounted(true);
    // next frame so transitions can animate from initial state
    requestAnimationFrame(() => setFanoutOpen(true));
  };

  const closeFanout = () => {
    setFanoutOpen(false);
    window.setTimeout(() => setFanoutMounted(false), FANOUT_ANIM_MS);
  };

  const toggleFanout = () => {
    if (fanoutOpen) closeFanout();
    else openFanout();
  };

  const go = (href: string) => {
    closeFanout();
    router.push(href);
  };

  // TODO: CORRECT COLORS
  return (
    <div className="relative">
      {/* Fanout */}
      {fanoutMounted && (
        <div className="pointer-events-none fixed bottom-28 left-1/2 z-50 w-[320px] -translate-x-1/2">
          <div className="relative mx-auto w-full">
            <div className="absolute left-1/2 -translate-x-1/2">
              {/* Income */}
              <button
                type="button"
                onClick={() => go("/add-income")}
                className={`absolute -left-32 -top-20 flex items-center justify-center p-1 border-3 bg-green-300 shadow transition duration-200 ${
                  fanoutOpen
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-90 opacity-0"
                }`}
                aria-label="Add income"
              >
                <CoinsIcon weight="fill" size={56} />
              </button>

              {/* Expense */}
              <button
                type="button"
                onClick={() => go("/add-expense")}
                className={`absolute left-1/2 -top-20 -translate-x-1/2 flex items-center justify-center p-1 border-3 bg-red-300 shadow transition duration-200 ${
                  fanoutOpen
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-90 opacity-0"
                }`}
                aria-label="Add expense"
              >
                <CoinsIcon weight="fill" size={56} />
              </button>

              {/* Convert */}
              <button
                type="button"
                onClick={() => go("/add-convert")}
                className={`absolute -right-32 -top-20 flex items-center justify-center p-1 border-3 bg-blue-300 shadow transition duration-200 ${
                  fanoutOpen
                    ? "pointer-events-auto scale-100 opacity-100"
                    : "pointer-events-none scale-90 opacity-0"
                }`}
                aria-label="Convert"
              >
                <ArrowsLeftRightIcon weight="fill" size={56} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom nav bar */}
      <div className="grid grid-cols-5">
        {items.map((item) => {
          if (item.type === "action") {
            return (
              <button
                key={item.id}
                type="button"
                onClick={toggleFanout}
                aria-expanded={fanoutOpen}
                aria-label="Open add menu"
                className={`relative z-50 flex h-16 flex-col items-center justify-center transition ${
                  fanoutOpen ? "opacity-100" : "opacity-80"
                }`}
              >
                <span
                  className={`transition ${fanoutOpen ? "scale-110" : "scale-100"}`}
                >
                  {item.icon}
                </span>
              </button>
            );
          }

          const active = pathname === item.href;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex h-16 flex-col items-center justify-center ${
                active ? "opacity-100" : "opacity-50"
              }`}
              onClick={() => {
                if (fanoutOpen) closeFanout();
              }}
            >
              <div />
              {item.icon}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
