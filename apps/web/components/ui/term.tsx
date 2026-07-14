"use client";

import { Modal } from "@/components/ui/modal";
import { GLOSSARY, type TermId } from "@/lib/glossary";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { useState, type ReactNode } from "react";

/**
 * Tap-able jargon (docs/01 §5: every term gets a plain-language twin).
 * `Term` marks a word inline; `TermStrip` offers a row of chips under a
 * page header. Both open the same explainer dialog: what it is, why it
 * matters, a "see it live" link into the app, and a Google search link.
 */

function TermDialog({
  id,
  open,
  onClose,
}: {
  id: TermId;
  open: boolean;
  onClose: () => void;
}) {
  const entry = GLOSSARY[id];
  return (
    <Modal open={open} onClose={onClose} title={entry.term}>
      <div className="flex flex-col gap-3 text-sm leading-relaxed">
        <p className="text-ink-1">{entry.what}</p>
        <p className="text-ink-2">
          <strong className="text-ink-1">Why it matters: </strong>
          {entry.why}
        </p>
        <div className="mt-1 flex flex-col gap-2 border-t border-line pt-3">
          {entry.tryIt && (
            <Link
              href={entry.tryIt.href}
              onClick={onClose}
              className="font-medium text-brand-strong underline-offset-2 hover:underline dark:text-brand"
            >
              ▶ {entry.tryIt.label}
            </Link>
          )}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(entry.searchQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink-2 underline-offset-2 hover:text-ink-1 hover:underline"
          >
            Read more on Google ↗
          </a>
        </div>
      </div>
    </Modal>
  );
}

/** Inline tap-able term: dotted underline, opens the explainer dialog. */
export function Term({
  id,
  children,
  className,
}: {
  id: TermId;
  children?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        title={`What is ${GLOSSARY[id].term}?`}
        className={cn(
          "inline cursor-help rounded-sm text-inherit underline decoration-brand/60 decoration-dotted underline-offset-4",
          "hover:decoration-brand hover:decoration-solid",
          className,
        )}
      >
        {children ?? GLOSSARY[id].term}
      </button>
      <TermDialog id={id} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

/** Chip row for page headers: "New to a term? Tap it." */
export function TermStrip({
  ids,
  className,
}: {
  ids: TermId[];
  className?: string;
}) {
  const [openId, setOpenId] = useState<TermId | null>(null);
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5",
        className,
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-ink-3">
        New to a term? Tap it:
      </span>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => setOpenId(id)}
          aria-haspopup="dialog"
          className="rounded-full border border-line bg-page px-2.5 py-0.5 text-xs font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand"
        >
          {GLOSSARY[id].term} ?
        </button>
      ))}
      {openId && (
        <TermDialog id={openId} open onClose={() => setOpenId(null)} />
      )}
    </div>
  );
}
