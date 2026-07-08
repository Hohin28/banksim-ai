import Link from "next/link";

/**
 * Placeholder landing page — the real landing (live mini-simulator hero,
 * docs/04 W1) ships with M1 when finance-core exists. This page exists so
 * the deployment is never blank while modules land one by one.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-24 text-center">
      <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-ink-2">
        Under construction — M0: design system
      </span>
      <h1 className="max-w-2xl text-5xl font-semibold max-sm:text-4xl">
        Learn finance by{" "}
        <span className="bg-[image:var(--grad-hero)] bg-clip-text text-transparent">
          doing
        </span>
        , not reading.
      </h1>
      <p className="max-w-xl text-lg text-ink-2">
        BankSim AI teaches savings, loans, credit scores and investing through
        interactive simulations. The first simulators arrive in milestone M1.
      </p>
      <Link
        href="/styleguide"
        className="rounded-field bg-brand px-6 py-3 font-medium text-white transition-colors hover:bg-brand-strong"
      >
        View the design system →
      </Link>
    </main>
  );
}
