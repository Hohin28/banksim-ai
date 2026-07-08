"use client";

import { cn } from "@/lib/cn";
import { useTheme, type Theme } from "@/lib/theme";

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "light",
    label: "Light theme",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
        <circle cx="10" cy="10" r="4" stroke="currentColor" strokeWidth="1.6" />
        <path
          d="M10 1.5v2M10 16.5v2M18.5 10h-2M3.5 10h-2M16 4l-1.4 1.4M5.4 14.6 4 16M16 16l-1.4-1.4M5.4 5.4 4 4"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    value: "dark",
    label: "Dark theme",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
        <path
          d="M17 11.5A7 7 0 0 1 8.5 3 7 7 0 1 0 17 11.5Z"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    value: "system",
    label: "Follow system theme",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" className="size-4" aria-hidden="true">
        <rect
          x="2.5"
          y="4"
          width="15"
          height="10"
          rx="1.5"
          stroke="currentColor"
          strokeWidth="1.6"
        />
        <path d="M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

/** Light / dark / system segmented control, persisted per docs/10 §7. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5",
        className,
      )}
    >
      {OPTIONS.map((opt) => {
        const active = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-label={opt.label}
            aria-pressed={active}
            title={opt.label}
            onClick={() => setTheme(opt.value)}
            className={cn(
              "rounded-full p-2 transition-colors duration-120",
              active
                ? "bg-brand text-white"
                : "text-ink-3 hover:bg-ink-1/5 hover:text-ink-1",
            )}
          >
            {opt.icon}
          </button>
        );
      })}
    </div>
  );
}
