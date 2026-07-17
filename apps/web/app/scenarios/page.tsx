import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const metadata = {
  title: "Scenarios",
  description:
    "Short decision challenges — budget a paycheck through a surprise expense, and spot the predatory loan hiding in plain sight.",
};

const SCENARIOS = [
  {
    href: "/scenarios/predatory-loan",
    emoji: "🪤",
    title: "Spot the predatory loan",
    desc: "Three offers for the same loan. One is a trap dressed as a bargain. Pick the cheapest — then watch the real maths expose the “10% flat” loan as an 18% loan.",
    minutes: 4,
  },
  {
    href: "/scenarios/budget-paycheck",
    emoji: "💸",
    title: "Budget one paycheck",
    desc: "Split a ₹40,000 salary across needs, wants and savings — then a surprise expense hits mid-month. Did you leave a buffer, or did it become credit-card debt?",
    minutes: 4,
  },
];

export default function ScenariosPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 max-sm:px-4">
      <header className="mb-8 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Scenarios</h1>
        <p className="max-w-2xl text-ink-2">
          Not simulators — <em>decisions</em>. Each one puts you in a real
          money situation, lets you choose, and then reveals exactly what your
          choice cost or saved you, with the maths laid bare. No account needed.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {SCENARIOS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex flex-col gap-3 rounded-card border border-line bg-surface p-6 transition-[border-color,transform] duration-120 hover:-translate-y-0.5 hover:border-brand"
          >
            <div className="flex items-start justify-between">
              <span className="text-4xl" aria-hidden="true">{s.emoji}</span>
              <Badge variant="neutral">{s.minutes} min</Badge>
            </div>
            <div className="font-display text-xl font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
              {s.title}
            </div>
            <p className="text-sm text-ink-2">{s.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
