export function SiteFooter() {
  return (
    <footer className="border-t border-line py-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-sm text-ink-3 max-sm:px-4">
        <p>
          <strong className="text-ink-2">BankSim AI is an educational simulation.</strong>{" "}
          Nothing here is financial advice, a real bank product, or a real
          lending decision. Formulas are the standard ones; where banks vary,
          the simplification is labeled.
        </p>
        <p>Built as an open learning project · Milestone M1 of 8</p>
      </div>
    </footer>
  );
}
