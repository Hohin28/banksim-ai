"use client";

import { cn } from "@/lib/cn";
import type { SelectHTMLAttributes } from "react";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectInputProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  options: SelectOption[];
}

export function SelectInput({ options, className, ...rest }: SelectInputProps) {
  return (
    <select
      className={cn(
        "h-11 w-full appearance-none rounded-field border border-line bg-surface px-3 pr-9 text-ink-1",
        "focus-visible:border-brand",
        "bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%228%22%3E%3Cpath%20d%3D%22M1%201l5%205%205-5%22%20fill%3D%22none%22%20stroke%3D%22%238a938e%22%20stroke-width%3D%221.8%22%20stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E')]",
        "bg-[position:right_0.75rem_center] bg-no-repeat",
        className,
      )}
      {...rest}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
