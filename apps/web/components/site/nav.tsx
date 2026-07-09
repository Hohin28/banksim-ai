"use client";

import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS: { href: string; label: string; soon?: boolean }[] = [
  { href: "/savings", label: "Savings" },
  { href: "/loans", label: "Loans" },
  { href: "/credit-score", label: "Credit" },
  { href: "/bank-game", label: "Bank Game" },
  { href: "/investments", label: "Investments" },
  { href: "/goals", label: "Goals" },
  { href: "/compound-interest", label: "Compound" },
  { href: "/inflation", label: "Inflation" },
  { href: "/learn", label: "Learn" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-page/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-4 px-6 max-sm:px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-semibold"
        >
          <span
            aria-hidden="true"
            className="grid size-7 place-items-center rounded-full text-sm text-white [background:var(--grad-hero)]"
          >
            ₹
          </span>
          BankSim AI
        </Link>

        <nav
          aria-label="Simulators"
          className="ml-4 flex min-w-0 flex-1 items-center gap-1 overflow-x-auto max-sm:ml-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {LINKS.map((l) =>
            l.soon ? (
              <span
                key={l.href}
                aria-disabled="true"
                title="Coming in a later milestone"
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-sm text-ink-3"
              >
                {l.label}
                <span className="ml-1 align-middle text-[10px] uppercase">soon</span>
              </span>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                aria-current={pathname === l.href ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors duration-120",
                  pathname === l.href
                    ? "bg-brand/10 font-medium text-brand-strong dark:text-brand"
                    : "text-ink-2 hover:bg-ink-1/5 hover:text-ink-1",
                )}
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <ThemeToggle />
      </div>
    </header>
  );
}
