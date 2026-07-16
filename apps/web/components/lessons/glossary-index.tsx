import { GLOSSARY, CATEGORY_LABELS, termsByCategory } from "@/lib/glossary";
import Link from "next/link";

/** Browsable index of every glossary term, grouped by category. */
export function GlossaryIndex() {
  const groups = termsByCategory();
  const total = groups.reduce((n, g) => n + g.ids.length, 0);

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 max-sm:px-4">
      <Link href="/learn" className="text-sm text-ink-2 hover:text-brand">
        ← Learning Hub
      </Link>

      <header className="mb-8 mt-3 flex flex-col gap-2">
        <h1 className="text-4xl font-semibold">Glossary</h1>
        <p className="max-w-2xl text-ink-2">
          {total} finance terms, each explained the same way: how it actually
          works, a worked example with real numbers, why it matters to you, and
          the mistake people usually make about it. No jargon left undefined.
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {groups.map((group) => (
          <section key={group.category}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-3">
              {CATEGORY_LABELS[group.category]}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.ids.map((id) => (
                <Link
                  key={id}
                  href={`/learn/glossary/${id}`}
                  className="group flex flex-col gap-1 rounded-card border border-line bg-surface p-4 transition-[border-color,transform] duration-120 hover:-translate-y-0.5 hover:border-brand"
                >
                  <span className="font-display text-lg font-semibold group-hover:text-brand-strong dark:group-hover:text-brand">
                    {GLOSSARY[id].term}
                  </span>
                  <span className="text-sm text-ink-2">{GLOSSARY[id].what}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
