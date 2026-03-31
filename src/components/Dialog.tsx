"use client";

import classNames from "classnames";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import Button from "@/src/components/Button";

export type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  cancelLabel?: string;
  confirmLabel: string;
  pendingConfirmLabel?: string;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  isPending?: boolean;
};

/**
 * Modal confirmation using the native dialog element.
 * Avoid unconditional `flex` on the dialog: it overrides the user-agent `display: none` when closed.
 */
export default function Dialog({
  open,
  onOpenChange,
  title,
  cancelLabel = "Cancel",
  confirmLabel,
  pendingConfirmLabel = "Closing…",
  onConfirm,
  confirmDisabled = false,
  isPending = false,
}: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  const dismiss = () => {
    if (isPending) return;
    onOpenChange(false);
  };

  return (
    <dialog
      ref={dialogRef}
      className={classNames(
        "fixed inset-0 z-50 m-0 h-screen w-screen max-h-none max-w-none border-none bg-transparent p-0",
        open ? "flex items-center justify-center" : "hidden",
      )}
      onClose={() => onOpenChange(false)}
      onClick={(e) => {
        if (e.target === e.currentTarget) dismiss();
      }}
    >
      <div className="mx-4 w-full max-w-lg border-4 border-black bg-white px-8 py-8 shadow-[8px_8px_0px_rgba(0,0,0,1)]">
        <div className="flex flex-col items-stretch gap-8">
          <h2 className="w-full min-w-0 text-left text-2xl font-bold leading-snug text-pretty">
            {title}
          </h2>
          <div className="flex flex-wrap items-center justify-start gap-3">
            <button
              type="button"
              className={classNames(
                "h-12 cursor-pointer border-2 border-black bg-white px-5 text-base font-bold",
                "hover:bg-gray-100 hover:shadow-[2px_2px_0px_rgba(0,0,0,1)] active:bg-gray-200",
                "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-white disabled:hover:shadow-none",
              )}
              onClick={dismiss}
              disabled={isPending}
            >
              {cancelLabel}
            </button>
            <Button
              onClick={onConfirm}
              disabled={confirmDisabled || isPending}
              color="cyan"
            >
              {isPending ? pendingConfirmLabel : confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
