"use client";

import {
  ArrowsCounterClockwiseIcon,
  MinusIcon,
  PlusIcon,
  XIcon,
} from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

const FANOUT_ANIM_MS = 220;
const FAB_SIZE_PX = 56;
const FAB_GAP_PX = 12;
const FAB_POS_STORAGE_KEY = "financee.fab-position";
const FAB_DRAG_THRESHOLD_PX = 10;
const FAB_MARGIN = 8;
const FAB_TOP_MARGIN = 8;
const MIN_BOTTOM_FROM_VIEWPORT = 88;

const FLICK_MIN_SPEED = 540;
const STOP_SPEED = 36;
const MAX_SPEED = 1100;
const FLICK_BOOST = 0.72;
const FLICK_VELOCITY_SCALE = 0.68;
const RESTITUTION = 0.32;
const FRICTION_PER_SEC = 4.6;
const DOCK_ANIM_MS = 340;

const fanoutActions = [
  {
    key: "income",
    href: "/add-income",
    label: "Add income",
    icon: <PlusIcon weight="bold" size={22} className="text-white" />,
  },
  {
    key: "expense",
    href: "/add-expense",
    label: "Add expense",
    icon: <MinusIcon weight="bold" size={22} className="text-white" />,
  },
  {
    key: "convert",
    href: "/add-convert",
    label: "Convert",
    icon: (
      <ArrowsCounterClockwiseIcon
        weight="bold"
        size={24}
        className="text-white"
      />
    ),
  },
] as const;

const STACK_HEIGHT_OPEN =
  FAB_SIZE_PX + fanoutActions.length * (FAB_SIZE_PX + FAB_GAP_PX);

type FabSide = "left" | "right";

type FabPersistV2 = { side: FabSide; bottom: number };
type FabPersistV1 = { right: number; bottom: number };

type FabLayout = { xLeft: number; bottom: number };

function dockedXLeft(side: FabSide, vw: number): number {
  return side === "left"
    ? FAB_MARGIN
    : vw - FAB_SIZE_PX - FAB_MARGIN;
}

function readStoredFabLayout(): FabLayout | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FAB_POS_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as FabPersistV2 & Partial<FabPersistV1>;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (p.side === "left" || p.side === "right") {
      if (typeof p.bottom !== "number") return null;
      return clampFabRect(
        dockedXLeft(p.side, vw),
        p.bottom,
        vw,
        vh,
        FAB_SIZE_PX,
        FAB_SIZE_PX,
      );
    }

    if (typeof p.right === "number" && typeof p.bottom === "number") {
      const xLeft = vw - p.right - FAB_SIZE_PX;
      const side: FabSide =
        xLeft + FAB_SIZE_PX / 2 < vw / 2 ? "left" : "right";
      return clampFabRect(
        dockedXLeft(side, vw),
        p.bottom,
        vw,
        vh,
        FAB_SIZE_PX,
        FAB_SIZE_PX,
      );
    }
    return null;
  } catch {
    return null;
  }
}

function clampFabRect(
  xLeft: number,
  bottom: number,
  vw: number,
  vh: number,
  fabW: number,
  fabH: number,
): FabLayout {
  const minX = FAB_MARGIN;
  const maxX = vw - fabW - FAB_MARGIN;
  const minBottom = MIN_BOTTOM_FROM_VIEWPORT;
  const maxBottom = vh - fabH - FAB_TOP_MARGIN;
  const xLo = Math.min(minX, maxX);
  const xHi = Math.max(minX, maxX);
  const bLo = Math.min(minBottom, maxBottom);
  const bHi = Math.max(minBottom, maxBottom);
  return {
    xLeft: Math.min(xHi, Math.max(xLo, xLeft)),
    bottom: Math.min(bHi, Math.max(bLo, bottom)),
  };
}

function snapDockX(xLeft: number, vw: number): number {
  const center = xLeft + FAB_SIZE_PX / 2;
  return center < vw / 2 ? dockedXLeft("left", vw) : dockedXLeft("right", vw);
}

function layoutToPersist(layout: FabLayout): FabPersistV2 {
  const vw = window.innerWidth;
  const side: FabSide =
    layout.xLeft + FAB_SIZE_PX / 2 < vw / 2 ? "left" : "right";
  return { side, bottom: layout.bottom };
}

function persistFabLayout(layout: FabLayout) {
  try {
    localStorage.setItem(
      FAB_POS_STORAGE_KEY,
      JSON.stringify(layoutToPersist(layout)),
    );
  } catch {
    /* ignore */
  }
}

export type AddTransactionFabHandle = {
  /** Close the fan-out menu and backdrop (e.g. when navigating via bottom bar). */
  closeMenu: () => void;
};

const AddTransactionFab = forwardRef<AddTransactionFabHandle>(
  function AddTransactionFab(_, ref) {
    const router = useRouter();

    const [fanoutOpen, setFanoutOpen] = useState(false);
    const [fanoutMounted, setFanoutMounted] = useState(false);
    const [fabPortalReady, setFabPortalReady] = useState(false);
    const [fabLayout, setFabLayout] = useState<FabLayout | null>(null);
    const [fabGliding, setFabGliding] = useState(false);
    const [fabDocking, setFabDocking] = useState(false);

    const fabLayoutRef = useRef<FabLayout | null>(null);
    const dockTimeoutRef = useRef(0);
    const fanoutMountedRef = useRef(fanoutMounted);
    const dragSessionRef = useRef<{
      pointerId: number;
      pointerStartX: number;
      pointerStartY: number;
      fabStartXLeft: number;
      fabStartBottom: number;
    } | null>(null);
    const velSamplesRef = useRef<Array<{ t: number; x: number; y: number }>>(
      [],
    );
    const didDragRef = useRef(false);
    const suppressClickRef = useRef(false);
    const physicsRafRef = useRef<number>(0);

    useLayoutEffect(() => {
      fabLayoutRef.current = fabLayout;
    }, [fabLayout]);

    useEffect(() => {
      fanoutMountedRef.current = fanoutMounted;
    }, [fanoutMounted]);

    const cancelDockAnimation = useCallback(() => {
      if (dockTimeoutRef.current) {
        window.clearTimeout(dockTimeoutRef.current);
        dockTimeoutRef.current = 0;
      }
      setFabDocking(false);
    }, []);

    const stopGlideOnly = useCallback(() => {
      if (physicsRafRef.current) {
        cancelAnimationFrame(physicsRafRef.current);
        physicsRafRef.current = 0;
      }
      setFabGliding(false);
    }, []);

    const stopPhysics = useCallback(() => {
      cancelDockAnimation();
      stopGlideOnly();
    }, [cancelDockAnimation, stopGlideOnly]);

    const smoothDockTo = useCallback(
      (target: FabLayout) => {
        stopGlideOnly();
        const cur = fabLayoutRef.current;
        if (!cur) {
          setFabLayout(target);
          fabLayoutRef.current = target;
          persistFabLayout(target);
          return;
        }
        const dx = Math.abs(cur.xLeft - target.xLeft);
        const dy = Math.abs(cur.bottom - target.bottom);
        if (dx < 0.5 && dy < 0.5) {
          setFabLayout(target);
          fabLayoutRef.current = target;
          persistFabLayout(target);
          return;
        }
        if (dockTimeoutRef.current) {
          window.clearTimeout(dockTimeoutRef.current);
          dockTimeoutRef.current = 0;
        }
        setFabDocking(true);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setFabLayout(target);
            fabLayoutRef.current = target;
          });
        });
        dockTimeoutRef.current = window.setTimeout(() => {
          dockTimeoutRef.current = 0;
          setFabDocking(false);
          persistFabLayout(target);
        }, DOCK_ANIM_MS + 60);
      },
      [stopGlideOnly],
    );

    useLayoutEffect(() => {
      setFabPortalReady(true); // eslint-disable-line react-hooks/set-state-in-effect -- client-only portal
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const stored = readStoredFabLayout();
      setFabLayout(
        stored ??
          clampFabRect(
            dockedXLeft("right", vw),
            112,
            vw,
            vh,
            FAB_SIZE_PX,
            FAB_SIZE_PX,
          ),
      );
    }, []);

    useEffect(() => {
      const onResize = () => {
        const fabH = fanoutMountedRef.current ? STACK_HEIGHT_OPEN : FAB_SIZE_PX;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        stopPhysics();
        const p = fabLayoutRef.current;
        if (!p) return;
        const side: FabSide =
          p.xLeft + FAB_SIZE_PX / 2 < vw / 2 ? "left" : "right";
        const next = clampFabRect(
          dockedXLeft(side, vw),
          p.bottom,
          vw,
          vh,
          FAB_SIZE_PX,
          fabH,
        );
        smoothDockTo(next);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }, [smoothDockTo, stopPhysics]);

    useEffect(() => () => stopPhysics(), [stopPhysics]);

    const closeFanout = useCallback(() => {
      if (!fanoutOpen) return;
      setFanoutOpen(false);
      window.setTimeout(() => {
        setFanoutMounted(false);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const p = fabLayoutRef.current;
        if (!p) return;
        const next = clampFabRect(
          snapDockX(p.xLeft, vw),
          p.bottom,
          vw,
          vh,
          FAB_SIZE_PX,
          FAB_SIZE_PX,
        );
        smoothDockTo(next);
      }, FANOUT_ANIM_MS);
    }, [fanoutOpen, smoothDockTo]);

    useImperativeHandle(
      ref,
      () => ({
        closeMenu: () => {
          closeFanout();
        },
      }),
      [closeFanout],
    );

    useEffect(() => {
      if (!fanoutOpen) return;
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeFanout();
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    }, [fanoutOpen, closeFanout]);

    const openFanout = () => {
      stopPhysics();
      setFanoutMounted(true);
      requestAnimationFrame(() => {
        setFanoutOpen(true);
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        setFabLayout((p) => {
          if (!p) return p;
          return clampFabRect(
            p.xLeft,
            p.bottom,
            vw,
            vh,
            FAB_SIZE_PX,
            STACK_HEIGHT_OPEN,
          );
        });
      });
    };

    const toggleFanout = () => {
      if (fanoutOpen) closeFanout();
      else openFanout();
    };

    const go = (href: string) => {
      closeFanout();
      router.push(href);
    };

    const runPhysicsFrame = useCallback(
      (state: {
        x: number;
        bottom: number;
        vx: number;
        vBottom: number;
        prevT: number;
      }) => {
        const step = (now: number) => {
          const fabH = fanoutMountedRef.current
            ? STACK_HEIGHT_OPEN
            : FAB_SIZE_PX;
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const dt = Math.min(
            0.05,
            Math.max(0.001, (now - state.prevT) / 1000),
          );
          state.prevT = now;

          let { x, bottom, vx, vBottom } = state;
          x += vx * dt;
          bottom += vBottom * dt;

          const minX = FAB_MARGIN;
          const maxX = vw - FAB_SIZE_PX - FAB_MARGIN;
          const minB = MIN_BOTTOM_FROM_VIEWPORT;
          const maxB = vh - fabH - FAB_TOP_MARGIN;

          if (x < minX) {
            x = minX;
            vx = Math.abs(vx) * RESTITUTION;
          } else if (x > maxX) {
            x = maxX;
            vx = -Math.abs(vx) * RESTITUTION;
          }

          if (bottom < minB) {
            bottom = minB;
            vBottom = Math.abs(vBottom) * RESTITUTION;
          } else if (bottom > maxB) {
            bottom = maxB;
            vBottom = -Math.abs(vBottom) * RESTITUTION;
          }

          const friction = Math.exp(-FRICTION_PER_SEC * dt);
          vx *= friction;
          vBottom *= friction;

          const speed = Math.hypot(vx, vBottom);
          if (speed < STOP_SPEED) {
            const snappedX = snapDockX(x, vw);
            const laid = clampFabRect(
              snappedX,
              bottom,
              vw,
              vh,
              FAB_SIZE_PX,
              fabH,
            );
            setFabGliding(false);
            physicsRafRef.current = 0;
            smoothDockTo(laid);
            return;
          }

          state.x = x;
          state.bottom = bottom;
          state.vx = vx;
          state.vBottom = vBottom;
          fabLayoutRef.current = { xLeft: x, bottom };
          setFabLayout({ xLeft: x, bottom });
          physicsRafRef.current = requestAnimationFrame(step);
        };
        physicsRafRef.current = requestAnimationFrame(step);
      },
      [smoothDockTo],
    );

    const handleFabPointerDown = useCallback(
      (e: React.PointerEvent<HTMLElement>) => {
        if (e.button !== 0) return;
        const layout = fabLayoutRef.current;
        if (!layout) return;
        stopPhysics();
        dragSessionRef.current = {
          pointerId: e.pointerId,
          pointerStartX: e.clientX,
          pointerStartY: e.clientY,
          fabStartXLeft: layout.xLeft,
          fabStartBottom: layout.bottom,
        };
        const t = performance.now();
        velSamplesRef.current = [{ t, x: e.clientX, y: e.clientY }];
        didDragRef.current = false;
        e.currentTarget.setPointerCapture(e.pointerId);
      },
      [stopPhysics],
    );

    const handleFabPointerMove = useCallback(
      (e: React.PointerEvent<HTMLElement>) => {
        const session = dragSessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;
        const dx = e.clientX - session.pointerStartX;
        const dy = e.clientY - session.pointerStartY;
        if (Math.hypot(dx, dy) > FAB_DRAG_THRESHOLD_PX)
          didDragRef.current = true;

        const now = performance.now();
        const vs = velSamplesRef.current;
        vs.push({ t: now, x: e.clientX, y: e.clientY });
        if (vs.length > 5) vs.splice(0, vs.length - 5);

        const fabH = fanoutMountedRef.current ? STACK_HEIGHT_OPEN : FAB_SIZE_PX;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const next = clampFabRect(
          session.fabStartXLeft + dx,
          session.fabStartBottom - dy,
          vw,
          vh,
          FAB_SIZE_PX,
          fabH,
        );
        fabLayoutRef.current = next;
        setFabLayout(next);
      },
      [],
    );

    const handleFabPointerUp = useCallback(
      (e: React.PointerEvent<HTMLElement>) => {
        const session = dragSessionRef.current;
        if (!session || e.pointerId !== session.pointerId) return;
        dragSessionRef.current = null;
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* already released */
        }

        if (!didDragRef.current) {
          velSamplesRef.current = [];
          return;
        }

        suppressClickRef.current = true;
        queueMicrotask(() => {
          suppressClickRef.current = false;
        });

        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const fabH = fanoutMountedRef.current ? STACK_HEIGHT_OPEN : FAB_SIZE_PX;
        const samples = velSamplesRef.current;
        velSamplesRef.current = [];

        let vx = 0;
        let vBottom = 0;
        if (samples.length >= 2) {
          const a = samples[0];
          const b = samples[samples.length - 1];
          const dt = Math.max(0.012, (b.t - a.t) / 1000);
          vx = ((b.x - a.x) / dt) * FLICK_BOOST;
          vBottom = (-(b.y - a.y) / dt) * FLICK_BOOST;
        } else if (samples.length === 1) {
          const a = samples[0];
          const dt = Math.max(0.012, (performance.now() - a.t) / 1000);
          vx = ((e.clientX - a.x) / dt) * FLICK_BOOST;
          vBottom = (-(e.clientY - a.y) / dt) * FLICK_BOOST;
        }

        vx *= FLICK_VELOCITY_SCALE;
        vBottom *= FLICK_VELOCITY_SCALE;

        const cur = fabLayoutRef.current;
        if (!cur) return;

        const speed = Math.hypot(vx, vBottom);
        if (speed > FLICK_MIN_SPEED) {
          const scale = Math.min(1, MAX_SPEED / speed);
          vx *= scale;
          vBottom *= scale;
          setFabGliding(true);
          runPhysicsFrame({
            x: cur.xLeft,
            bottom: cur.bottom,
            vx,
            vBottom,
            prevT: performance.now(),
          });
          return;
        }

        const snapped = clampFabRect(
          snapDockX(cur.xLeft, vw),
          cur.bottom,
          vw,
          vh,
          FAB_SIZE_PX,
          fabH,
        );
        smoothDockTo(snapped);
      },
      [runPhysicsFrame, smoothDockTo],
    );

    const fabDragProps = {
      onPointerDown: handleFabPointerDown,
      onPointerMove: handleFabPointerMove,
      onPointerUp: handleFabPointerUp,
      onPointerCancel: handleFabPointerUp,
    } as const;

    const fabShellClass =
      "flex size-14 shrink-0 cursor-grab touch-none active:cursor-grabbing items-center justify-center rounded-full border-3 border-black bg-black text-white shadow transition-[transform,opacity,bottom] duration-200 ease-out";

    const fabStack = fabLayout && (
      <div
        className="pointer-events-none fixed z-[60]"
        style={{
          left: fabLayout.xLeft,
          bottom: fabLayout.bottom,
          width: FAB_SIZE_PX,
          height: fanoutMounted ? STACK_HEIGHT_OPEN : FAB_SIZE_PX,
          transition: fabGliding
            ? "none"
            : fabDocking
              ? `left ${DOCK_ANIM_MS}ms cubic-bezier(0.22, 0.95, 0.36, 1), bottom ${DOCK_ANIM_MS}ms cubic-bezier(0.22, 0.95, 0.36, 1), height ${FANOUT_ANIM_MS}ms ease-out`
              : `height ${FANOUT_ANIM_MS}ms ease-out, left 0ms, bottom 0ms`,
        }}
      >
        <div className="relative size-full">
          {fanoutMounted &&
            fanoutActions.map((action, i) => {
              const step = i + 1;
              const openBottom = step * (FAB_SIZE_PX + FAB_GAP_PX);
              const reverseIndex = fanoutActions.length - 1 - i;
              const openDelay = reverseIndex * 40;
              const closeDelay = i * 35;
              return (
                <button
                  key={action.key}
                  type="button"
                  {...fabDragProps}
                  onClick={() => {
                    if (suppressClickRef.current) return;
                    go(action.href);
                  }}
                  className={`${fabShellClass} pointer-events-auto absolute right-0 ${
                    fanoutOpen
                      ? "translate-y-0 scale-100 opacity-100"
                      : "translate-y-2 scale-75 opacity-0"
                  }`}
                  style={{
                    bottom: fanoutOpen ? openBottom : 0,
                    transitionDelay: fanoutOpen
                      ? `${openDelay}ms`
                      : `${closeDelay}ms`,
                    zIndex: 5 - i,
                  }}
                  aria-label={action.label}
                >
                  {action.icon}
                </button>
              );
            })}

          <button
            type="button"
            {...fabDragProps}
            onClick={() => {
              if (suppressClickRef.current) return;
              toggleFanout();
            }}
            aria-expanded={fanoutOpen}
            aria-label={fanoutOpen ? "Close add menu" : "Open add menu"}
            className={`${fabShellClass} pointer-events-auto absolute bottom-0 right-0 z-10`}
          >
            {fanoutOpen ? (
              <XIcon weight="bold" size={24} className="text-white" />
            ) : (
              <PlusIcon weight="bold" size={26} className="text-white" />
            )}
          </button>
        </div>
      </div>
    );

    return (
      <>
        {fabPortalReady && fabStack && createPortal(fabStack, document.body)}
        {fanoutMounted &&
          createPortal(
            <div
              className={`fixed inset-0 z-[55] bg-black/50 transition-opacity duration-200 ${
                fanoutOpen ? "opacity-100" : "opacity-0"
              }`}
              onClick={closeFanout}
              aria-hidden
            />,
            document.body,
          )}
      </>
    );
  },
);

export default AddTransactionFab;
