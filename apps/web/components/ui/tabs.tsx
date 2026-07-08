"use client";

import { cn } from "@/lib/cn";
import { useId, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";

export interface TabItem {
  id: string;
  label: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultId?: string;
  onChange?: (id: string) => void;
  className?: string;
}

/**
 * Underline tabs (docs/10 §4) with the WAI-ARIA automatic-activation
 * pattern: Arrow/Home/End move focus and select in one gesture.
 */
export function Tabs({ items, defaultId, onChange, className }: TabsProps) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(defaultId ?? items[0]?.id);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const select = (id: string) => {
    setActiveId(id);
    onChange?.(id);
    tabRefs.current.get(id)?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const idx = items.findIndex((t) => t.id === activeId);
    if (idx === -1) return;
    let next: number | null = null;
    if (e.key === "ArrowRight") next = (idx + 1) % items.length;
    else if (e.key === "ArrowLeft") next = (idx - 1 + items.length) % items.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = items.length - 1;
    if (next !== null) {
      e.preventDefault();
      const item = items[next];
      if (item) select(item.id);
    }
  };

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex gap-1 border-b border-line"
        onKeyDown={onKeyDown}
      >
        {items.map((item) => {
          const selected = item.id === activeId;
          return (
            <button
              key={item.id}
              ref={(el) => {
                if (el) tabRefs.current.set(item.id, el);
                else tabRefs.current.delete(item.id);
              }}
              type="button"
              role="tab"
              id={`${baseId}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(item.id)}
              className={cn(
                "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors duration-120",
                selected
                  ? "border-brand text-brand"
                  : "border-transparent text-ink-2 hover:text-ink-1",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${baseId}-panel-${item.id}`}
          aria-labelledby={`${baseId}-tab-${item.id}`}
          hidden={item.id !== activeId}
          tabIndex={0}
          className="pt-4 focus-visible:outline-none"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
