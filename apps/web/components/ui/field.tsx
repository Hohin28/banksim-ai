"use client";

import { cn } from "@/lib/cn";
import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

export interface FieldProps {
  label: string;
  /** Short guidance under the input. */
  help?: string;
  /** Error message; also flips the input into its error style. */
  error?: string;
  children: (props: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: boolean;
  }) => ReactNode;
  className?: string;
}

/**
 * Form field wrapper: always-visible label (never placeholder-as-label),
 * help/error text linked via aria-describedby (docs/10 §7).
 */
export function Field({ label, help, error, children, className }: FieldProps) {
  const id = useId();
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy =
    [errorId, helpId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-2">
        {label}
      </label>
      {children({
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })}
      {error && (
        <p id={errorId} className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {help && !error && (
        <p id={helpId} className="text-sm text-ink-3">
          {help}
        </p>
      )}
    </div>
  );
}

type NativeInputProps = InputHTMLAttributes<HTMLInputElement>;

export function TextInput({ className, ...rest }: NativeInputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-field border border-line bg-surface px-3 text-ink-1",
        "placeholder:text-ink-3 focus-visible:border-brand",
        "aria-invalid:border-danger",
        className,
      )}
      {...rest}
    />
  );
}

export interface CurrencyInputProps
  extends Omit<NativeInputProps, "value" | "onChange" | "type"> {
  value: number | null;
  onChange: (rupees: number | null) => void;
}

const grouping = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

/** ₹ input with Indian digit grouping applied when not focused. */
export function CurrencyInput({
  value,
  onChange,
  className,
  ...rest
}: CurrencyInputProps) {
  const [focused, setFocused] = useState(false);

  const display =
    value === null
      ? ""
      : focused
        ? String(value)
        : grouping.format(value);

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-3"
      >
        ₹
      </span>
      <TextInput
        inputMode="numeric"
        className={cn("pl-7 tabular-nums", className)}
        value={display}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "");
          onChange(digits === "" ? null : Number(digits));
        }}
        {...rest}
      />
    </div>
  );
}
