"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, GlassCard } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { CurrencyInput, Field, TextInput } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { Slider } from "@/components/ui/slider";
import { StatCard } from "@/components/ui/stat-card";
import { Tabs } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { ToastProvider, useToast } from "@/components/ui/toast";
import { formatMoney, formatMoneyCompact, formatPercent } from "@/lib/format";
import { fadeRise, staggerChildren } from "@/lib/motion";
import { motion } from "framer-motion";
import { useState } from "react";

/* Swatches reference the source tokens (real runtime custom properties);
   the `--color-*` names exist only inside Tailwind utilities via
   `@theme inline` and are not resolvable from inline styles. */
const COLOR_TOKENS: { name: string; cssVar: string }[] = [
  { name: "page", cssVar: "--bg-page" },
  { name: "surface", cssVar: "--bg-surface" },
  { name: "raised", cssVar: "--bg-raised" },
  { name: "brand", cssVar: "--brand" },
  { name: "brand-strong", cssVar: "--brand-strong" },
  { name: "gold", cssVar: "--accent-gold" },
  { name: "danger", cssVar: "--danger" },
  { name: "ink-1", cssVar: "--ink-1" },
  { name: "ink-2", cssVar: "--ink-2" },
  { name: "ink-3", cssVar: "--ink-3" },
  { name: "line", cssVar: "--line" },
  { name: "status-good", cssVar: "--status-good" },
  { name: "status-warning", cssVar: "--status-warning" },
  { name: "status-serious", cssVar: "--status-serious" },
  { name: "status-critical", cssVar: "--status-critical" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="border-b border-line pb-2 text-2xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function StyleguideContent() {
  const { toast } = useToast();
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(7);
  const [amount, setAmount] = useState<number | null>(150000);
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [statValue, setStatValue] = useState(1730850);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-12 px-6 py-12">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-semibold">Mint &amp; Ink</h1>
          <p className="mt-2 text-ink-2">
            BankSim AI design system — every core component, both themes.
            Spec: docs/10-design-system.md
          </p>
        </div>
        <ThemeToggle />
      </header>

      <Section title="Color tokens">
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
          {COLOR_TOKENS.map(({ name, cssVar }) => (
            <div key={name} className="flex flex-col gap-1.5">
              <div
                className="h-14 rounded-field border border-line"
                style={{ background: `var(${cssVar})` }}
              />
              <code className="text-xs text-ink-3">{name}</code>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex h-20 items-center justify-center rounded-card text-sm font-medium text-white [background:var(--grad-hero)]">
            grad-hero
          </div>
          <div className="flex h-20 items-center justify-center rounded-card text-sm font-medium text-ink-1 [background:var(--grad-gold)]">
            grad-gold
          </div>
        </div>
      </Section>

      <Section title="Typography">
        <div className="flex flex-col gap-2">
          <p className="font-display text-5xl font-semibold">Display 48.8</p>
          <p className="font-display text-4xl font-semibold">Heading 39</p>
          <p className="font-display text-2xl font-semibold">Heading 25</p>
          <p className="text-xl font-medium">Subhead 20</p>
          <p className="text-base">
            Body 16 — If you save ₹1,000 every month at 7% interest, compounding
            quietly does the heavy lifting for you.
          </p>
          <p className="text-sm text-ink-2">Secondary 14 — supporting detail</p>
          <p className="text-xs text-ink-3">Caption 12.8 — axis labels, hints</p>
          <p className="font-mono text-sm">
            mono: FV = P·(1+i)^n + M·[((1+i)^n − 1)/i]
          </p>
          <p className="text-2xl font-semibold tabular-nums text-gold">
            {formatMoney(1730850)}{" "}
            <span className="text-sm text-ink-3">
              ({formatMoneyCompact(1730850)} · {formatPercent(7.25)})
            </span>
          </p>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Neutral</Badge>
          <Badge variant="brand">Simulation</Badge>
          <Badge variant="gold">+₹5.2L interest</Badge>
          <Badge variant="danger">Overdue</Badge>
          <Badge variant="good">Low risk</Badge>
          <Badge variant="warning">Medium risk</Badge>
          <Badge variant="serious">High risk</Badge>
          <Badge variant="critical">Critical</Badge>
        </div>
      </Section>

      <Section title="Slider — the hero control">
        <Card className="flex flex-col gap-6">
          <Slider
            label="Monthly deposit"
            value={monthly}
            min={0}
            max={100000}
            step={500}
            onChange={setMonthly}
            formatValue={(v) => formatMoney(v)}
            valueText={(v) => `${formatMoney(v)} per month`}
          />
          <Slider
            label="Interest rate"
            value={rate}
            min={0}
            max={15}
            step={0.25}
            onChange={setRate}
            formatValue={(v) => formatPercent(v)}
            valueText={(v) => `${formatPercent(v)} per year`}
            unit="p.a."
          />
          <p className="text-sm text-ink-3">
            Keyboard: ←/→ step · Shift+←/→ ×10 · Home/End min/max
          </p>
        </Card>
      </Section>

      <Section title="Fields">
        <Card className="grid gap-6 sm:grid-cols-2">
          <Field label="Goal name" help="Shown on your dashboard.">
            {(props) => <TextInput {...props} placeholder="e.g. New laptop" />}
          </Field>
          <Field label="Target amount">
            {(props) => (
              <CurrencyInput {...props} value={amount} onChange={setAmount} />
            )}
          </Field>
          <Field label="Email" error="That doesn't look like an email address.">
            {(props) => <TextInput {...props} defaultValue="not-an-email" />}
          </Field>
        </Card>
      </Section>

      <Section title="Stat cards (count-up honors reduced motion)">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard
            label="Final amount"
            value={statValue}
            format={(v) => formatMoney(v)}
            gold
            delta={{ text: "+43%", tone: "good" }}
          />
          <StatCard
            label="Total deposited"
            value={1210000}
            format={(v) => formatMoney(v)}
          />
          <StatCard
            label="Interest earned"
            value={statValue - 1210000}
            format={(v) => formatMoney(v)}
            delta={{ text: "interest > deposits at yr 18", tone: "neutral" }}
          />
        </div>
        <Button
          variant="secondary"
          size="sm"
          className="self-start"
          onClick={() =>
            setStatValue((v) => (v === 1730850 ? 2894300 : 1730850))
          }
        >
          Animate values
        </Button>
      </Section>

      <Section title="Tabs">
        <Tabs
          items={[
            {
              id: "chart",
              label: "Chart",
              content: (
                <p className="text-ink-2">
                  Chart view — every chart also ships a Table twin for screen
                  readers (docs/10 §6).
                </p>
              ),
            },
            {
              id: "table",
              label: "Table",
              content: (
                <p className="text-ink-2">Accessible data table lives here.</p>
              ),
            },
            {
              id: "yearly",
              label: "Year-by-year",
              content: <p className="text-ink-2">Yearly breakdown.</p>,
            },
          ]}
        />
      </Section>

      <Section title="Glass, overlays & toasts">
        <div className="relative overflow-hidden rounded-panel p-8 [background:var(--grad-hero)]">
          <GlassCard className="max-w-sm">
            <p className="text-sm font-medium">Glass panel</p>
            <p className="mt-1 text-sm text-ink-2">
              Floating layers only: tutor drawer, compare overlay, hero stat
              cards.
            </p>
          </GlassCard>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>
            Open right drawer
          </Button>
          <Button variant="secondary" onClick={() => setSheetOpen(true)}>
            Open bottom sheet
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast("Scenario saved to your dashboard", "success")}
          >
            Success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast("Couldn't reach the server", "error")}
          >
            Error toast
          </Button>
        </div>
      </Section>

      <Section title="Motion — staggered entrance">
        <motion.ul
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-3 sm:grid-cols-3"
        >
          {["Savings", "Loans", "Credit score"].map((t) => (
            <motion.li key={t} variants={fadeRise}>
              <Card>
                <p className="font-medium">{t}</p>
                <p className="mt-1 text-sm text-ink-2">
                  fadeRise · 240ms · ease-out-quint
                </p>
              </Card>
            </motion.li>
          ))}
        </motion.ul>
      </Section>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Delete scenario?"
      >
        <p className="text-sm text-ink-2">
          This removes “Laptop fund” permanently. Your other scenarios are
          untouched.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setModalOpen(false);
              toast("Scenario deleted", "info");
            }}
          >
            Delete
          </Button>
        </div>
      </Modal>

      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Finance Tutor"
        side="right"
      >
        <p className="text-sm text-ink-2">
          The AI tutor drawer mounts here from M6. Glass surface, focus
          trapped, Esc to close.
        </p>
      </Drawer>

      <Drawer
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Adjust inputs"
        side="bottom"
      >
        <Slider
          label="Years"
          value={10}
          min={1}
          max={40}
          onChange={() => {}}
          formatValue={(v) => `${v} yrs`}
        />
      </Drawer>
    </main>
  );
}

export default function StyleguidePage() {
  return (
    <ToastProvider>
      <StyleguideContent />
    </ToastProvider>
  );
}
