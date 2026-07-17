import { MiniSavingsSim } from "@/components/site/mini-sim";
import Link from "next/link";

const EXPLORE: {
  emoji: string;
  title: string;
  desc: string;
  href?: string;
}[] = [
  {
    emoji: "💰",
    title: "Savings",
    desc: "Watch deposits grow — and interest overtake them.",
    href: "/savings",
  },
  {
    emoji: "📈",
    title: "Compound interest",
    desc: "Simple vs compound: see the gap open year by year.",
    href: "/compound-interest",
  },
  {
    emoji: "🎈",
    title: "Inflation",
    desc: "What today's ₹1,000 really buys in 10, 20, 30 years.",
    href: "/inflation",
  },
  {
    emoji: "🏦",
    title: "Loans & EMI",
    desc: "Why you repay ₹7.7L on a ₹5L loan.",
    href: "/loans",
  },
  {
    emoji: "⚖️",
    title: "Investments",
    desc: "FD vs gold vs index funds, honestly compared.",
    href: "/investments",
  },
  {
    emoji: "🎯",
    title: "Goals",
    desc: "Turn 'a laptop someday' into ₹/month.",
    href: "/goals",
  },
  {
    emoji: "📊",
    title: "Credit score",
    desc: "Miss an EMI, watch the damage — safely.",
    href: "/credit-score",
  },
  {
    emoji: "🎮",
    title: "Run a bank",
    desc: "Approve loans, balance profit against risk.",
    href: "/bank-game",
  },
  {
    emoji: "🪤",
    title: "Spot the trap",
    desc: "Three loan offers, one predatory. Can you tell?",
    href: "/scenarios/predatory-loan",
  },
  {
    emoji: "💸",
    title: "Budget a paycheck",
    desc: "Split a salary, then survive a surprise expense.",
    href: "/scenarios/budget-paycheck",
  },
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-6 py-16 max-sm:px-4 max-sm:py-10 lg:grid-cols-2">
        <div className="flex flex-col items-start gap-5">
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2">
            Free · no signup needed · nothing here is real money
          </span>
          <h1 className="text-5xl font-semibold leading-[1.1] max-sm:text-4xl">
            Learn finance by{" "}
            <span className="bg-[image:var(--grad-hero)] bg-clip-text text-transparent">
              doing
            </span>
            , not reading.
          </h1>
          <p className="max-w-xl text-lg text-ink-2">
            Move the sliders. Watch your money behave. BankSim AI turns
            savings, loans, credit scores and investing into interactive
            simulations that answer the question textbooks never do:{" "}
            <em>what happens to my money?</em>
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/savings"
              className="rounded-field bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-strong"
            >
              Try the Savings Simulator
            </Link>
            <Link
              href="/compound-interest"
              className="rounded-field border border-line bg-surface px-6 py-3 font-medium text-ink-1 transition-colors hover:border-brand hover:text-brand"
            >
              See compounding work
            </Link>
          </div>
        </div>
        <MiniSavingsSim />
      </section>

      {/* Explore grid */}
      <section className="mx-auto w-full max-w-6xl px-6 pb-16 max-sm:px-4">
        <h2 className="mb-5 text-2xl font-semibold">What you can explore</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE.map((item) =>
            item.href ? (
              <Link
                key={item.title}
                href={item.href}
                className="group rounded-card border border-line bg-surface p-5 transition-[border-color,transform] duration-120 hover:-translate-y-0.5 hover:border-brand"
              >
                <div className="text-2xl" aria-hidden="true">
                  {item.emoji}
                </div>
                <div className="mt-2 font-display text-lg font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
                  {item.title}
                </div>
                <p className="mt-1 text-sm text-ink-2">{item.desc}</p>
              </Link>
            ) : (
              <div
                key={item.title}
                className="rounded-card border border-dashed border-line bg-surface/50 p-5"
              >
                <div className="text-2xl opacity-60" aria-hidden="true">
                  {item.emoji}
                </div>
                <div className="mt-2 flex items-center gap-2 font-display text-lg font-semibold text-ink-2">
                  {item.title}
                  <span className="rounded-full bg-ink-1/5 px-2 py-0.5 text-[10px] font-medium uppercase text-ink-3">
                    soon
                  </span>
                </div>
                <p className="mt-1 text-sm text-ink-3">{item.desc}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </main>
  );
}
