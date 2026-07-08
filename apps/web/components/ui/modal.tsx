"use client";

import { cn } from "@/lib/cn";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

/**
 * Centered modal on native <dialog>: focus containment, Esc-to-close and
 * top-layer stacking come from the platform (docs/10 §4).
 */
export function Modal({ open, onClose, title, children, className }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    else if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Backdrop click: the dialog element itself is the target only
        // when the click lands outside the padded content box.
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
      className={cn(
        "bs-modal m-auto w-[min(92vw,480px)] rounded-panel border border-line",
        "bg-raised p-6 shadow-2xl backdrop:bg-transparent",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="rounded-full p-1.5 text-ink-3 hover:bg-ink-1/5 hover:text-ink-1"
        >
          <CloseIcon />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}

export function CloseIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M5 5l10 10M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
