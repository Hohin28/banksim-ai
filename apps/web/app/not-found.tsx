import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-5 px-6 py-24 text-center">
      <span className="font-display text-6xl font-semibold text-brand">404</span>
      <h1 className="text-2xl font-semibold">This page took an unplanned withdrawal</h1>
      <p className="max-w-md text-ink-2">
        We couldn&rsquo;t find what you were looking for. It may have moved, or
        never existed — either way, your money is safe (it was never real).
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="rounded-field bg-brand px-5 py-2.5 font-medium text-white transition-colors hover:bg-brand-strong"
        >
          Back to home
        </Link>
        <Link
          href="/savings"
          className="rounded-field border border-line bg-surface px-5 py-2.5 font-medium text-ink-1 transition-colors hover:border-brand hover:text-brand"
        >
          Open a simulator
        </Link>
      </div>
    </main>
  );
}
