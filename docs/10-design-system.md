# 10 · UI Design System — "Mint & Ink"

The visual identity must read as a premium simulation tool, not a bank clone and not a generic AI-gradient template. Direction: **deep ink surfaces, mint-emerald energy for growth, warm gold for money moments** — glassmorphism used sparingly, where depth means something (floating panels: tutor drawer, compare overlays, stat cards).

## 1. Design tokens — color

All tokens are CSS custom properties; Tailwind reads them via its config. Dark mode is **designed, not inverted** — every token has an explicitly chosen dark value.

### Brand & surfaces

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg-page` | `#f7f8f6` | `#0c1210` | Page plane |
| `--bg-surface` | `#ffffff` | `#131b18` | Cards, panels |
| `--bg-raised` | `#ffffff` | `#1a2420` | Modals, drawers |
| `--surface-chart` | `#fcfcfb` | `#1a1a19` | Chart plot surface (validator-locked — see §6) |
| `--brand` | `#0e9f6e` | `#10b981` | Primary actions, focus of energy |
| `--brand-strong` | `#046c4e` | `#34d399` | Hovers, emphasis |
| `--accent-gold` | `#b7791f` | `#f6c453` | "Money moments": final amounts, interest earned |
| `--danger` | `#c81e1e` | `#f87171` | Destructive, losses |
| `--ink-1` | `#0b1512` | `#f4f6f4` | Primary text |
| `--ink-2` | `#4b5563` | `#a8b3ae` | Secondary text |
| `--ink-3` | `#8a938e` | `#6e7a74` | Muted, captions, axis labels |
| `--line` | `#e4e7e3` | `#243029` | Hairline borders |
| `--focus-ring` | `#0e9f6e` | `#34d399` | 2px outer ring, always visible |

### Gradients (two, only two)

```css
--grad-hero:  linear-gradient(135deg, #0e9f6e 0%, #0891b2 100%);   /* mint→cyan: hero, CTAs */
--grad-gold:  linear-gradient(135deg, #f6c453 0%, #ed8936 100%);   /* gold: celebratory stats, badges */
```
Rules: gradients on surfaces and decorative shapes only — **never on body text, never on chart marks**. Large text on `--grad-hero` may use `background-clip: text` in the hero only.

### Glassmorphism recipe (one recipe, reused)

```css
.glass {
  background: rgba(255,255,255,.62);          /* dark: rgba(19,27,24,.66) */
  backdrop-filter: blur(14px) saturate(1.4);
  border: 1px solid rgba(255,255,255,.35);    /* dark: rgba(255,255,255,.08) */
  box-shadow: 0 8px 32px rgba(11,21,18,.10);
  border-radius: var(--radius-lg);
}
```
Applies to: tutor drawer, compare overlay, floating stat cards over the hero chart, mobile bottom-sheet controls. **Never** for text-dense reading surfaces (lessons, explainer panels) — those get solid `--bg-surface` for contrast reliability.

## 2. Typography

| Role | Face | Notes |
|---|---|---|
| Display / headings | **Space Grotesk** (600/500) | Distinctive, geometric, numbers look great |
| Body / UI | **Instrument Sans** (400/500) | Warm, highly legible; fallback `system-ui` |
| Numbers in tables, axes, formulas | Same faces + `font-variant-numeric: tabular-nums` | Columns must align |
| Code/formula blocks | **JetBrains Mono** | Explainer-panel formulas |

Scale (rem, 1.25 ratio): `12.8 → 16 (body) → 20 → 25 → 31.25 → 39 → 48.8 (hero stat)`.
Line-height: body 1.6, headings 1.15. Body text max measure 68ch. Hero numbers (`StatCard` big values) use 39–48.8 with `--accent-gold` when the value is "your money grew".

## 3. Space, radius, elevation

- **Spacing scale:** 4-px base — `4 8 12 16 24 32 48 64 96`. Section rhythm 48/64; card padding 24 (16 mobile).
- **Radii:** `--radius-sm 8px` (inputs) · `--radius-md 12px` (cards) · `--radius-lg 20px` (glass panels, modals) · `--radius-full` (pills, FAB).
- **Elevation:** 3 levels only — hairline border (resting), `0 4px 16px rgba(ink,.08)` (raised), `0 12px 40px rgba(ink,.16)` (floating/glass). No arbitrary shadows.

## 4. Core components (build order in [11-roadmap.md](11-roadmap.md) M0)

| Component | Spec highlights |
|---|---|
| `Button` | primary (brand fill) / secondary (outline) / ghost / destructive; sizes sm·md·lg; loading spinner state; min target 44×44 |
| `GlassCard` / `Card` | the two surface primitives above |
| `Slider` ★ | the product's hero control: 28px thumb, live value bubble, keyboard step + Shift×10, ARIA `slider` with `aria-valuetext` ("₹5,000 per month"), paired numeric input always visible |
| `Field` | label + input + error + help; currency variant with lakh/crore live formatting |
| `StatCard` | label (`--ink-2` caps 12.8) over value (tabular, big); optional delta chip ▲▼; counts up via Framer Motion |
| `Tabs` | underline style; used for Chart/Table/Year-by-year |
| `Badge / Chip` | risk levels, suggestion chips, streaks |
| `Modal / Drawer / BottomSheet` | focus-trapped, `Esc` closes, scroll-locked |
| `Toast` | 4 s, polite `aria-live` |
| `Gauge` | score & DTI: SVG arc, animated needle, band colors from **status palette** (§6), value also as text |
| `ExplainerPanel` | formula block (mono) + plain-language walkthrough + "Ask the tutor" link |
| `TutorDrawer` | glass, streaming message list, chips, feedback buttons |
| `ChartTableTab` | accessible data-table twin rendered behind every chart |

## 5. Motion language (Framer Motion)

| Pattern | Spec |
|---|---|
| Durations | micro 120 ms · standard 240 ms · chart/data 400–700 ms · celebratory ≤ 1200 ms |
| Easing | `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out-quint) for entrances; springs (`stiffness 260, damping 24`) for gauges/thumbs |
| Number count-up | StatCards animate value changes over 400 ms, tabular so width doesn't jitter |
| Chart data change | Recharts/SVG morph 400 ms; **axes never animate** (they're reference, not data) |
| Year-by-year "play" | Simulators get a ▶ button that draws the timeline at 12 yrs/s — the signature moment |
| Page transitions | 160 ms fade/4-px rise; no slide carnival |
| Celebration | Goal achieved / quiz passed: one confetti burst, ≤ 1.2 s, honors reduced motion |
| **Reduced motion** | `useReducedMotion()` respected globally: count-ups snap, charts render final state, confetti off. Non-negotiable |

## 6. Data-visualization rules

Charts follow a strict, validated system (method: pick form → assign color by job → validate palette → mark specs → hover layer → a11y pass). These rules are binding for every chart in the product.

### Palette (validated reference set)

Categorical series (fixed slot order — assigned by entity, **never cycled, never re-assigned when filters change**):

| Slot | Light | Dark | | Slot | Light | Dark |
|---|---|---|---|---|---|---|
| 1 blue | `#2a78d6` | `#3987e5` | | 5 violet | `#4a3aa7` | `#9085e9` |
| 2 aqua | `#1baf7a` | `#199e70` | | 6 red | `#e34948` | `#e66767` |
| 3 yellow | `#eda100` | `#c98500` | | 7 magenta | `#e87ba4` | `#d55181` |
| 4 green | `#008300` | `#008300` | | 8 orange | `#eb6834` | `#d95926` |

Domain mapping (color follows the *entity*): deposits/principal → slot 1 · interest/growth → slot 2 · inflation/real-value overlays → slot 6 · comparison scenario B → slot 5.

- **Sequential** (magnitude, e.g. heat of amortization interest share): one hue, blue ramp `#cde2fb → #0d366b`, light = near zero.
- **Diverging** (gain/loss around zero, bank-game P&L): blue ↔ red with neutral gray midpoint (`#f0efec` light / `#383835` dark). Never a colored midpoint, never rainbow.
- **Status** (reserved — gauges, risk chips; never used as "series 4"): good `#0ca30c` · warning `#fab219` · serious `#ec835a` · critical `#d03b3b`, always paired with icon + label, never color alone.
- Dark mode uses the **dark columns above** — its own validated steps, not an automatic flip.
- `--surface-chart` is locked to `#fcfcfb`/`#1a1a19` (the surfaces this palette was validated against). Changing it requires re-running the palette validator against the new surface.

### Mark & anatomy rules

- Thin marks: 2 px lines, ≥ 8 px point markers, bars with 4 px rounded **data ends only** (baseline corners square).
- 2 px surface-colored gap between stacked segments and adjacent bars; 2 px surface ring on overlapping marks.
- **One axis. Never dual-axis.** Two measures of different scale → two charts or indexed lines.
- Grid: hairlines `#e1e0d9`/`#2c2c2a`, horizontal only where possible; axis text `--ink-3`.
- Text wears text tokens, never series color — a colored 8-px swatch carries identity next to neutral-ink labels.
- Legends: single series → no legend (title names it); 2–4 series → legend **and** direct labels at line ends; >4 → legend + hover emphasis. Never a number printed on every point — selective labels (ends, peaks, deltas).
- Currency ticks abbreviated Indian-style (`₹1.5L`, `₹2.3Cr`) with full value in tooltip.

### Interaction layer (default, not optional)

- Line/area charts: crosshair + shared tooltip (all series values at hovered year).
- Bars/donuts/gauges: per-mark hover tooltip; hit targets larger than the mark (≥ 24 px band).
- Tooltip: `--bg-raised`, hairline border, 12.8/16 type, values tabular.
- Filters/time-range controls sit in one row above the chart, never inside the plot.

### Chart accessibility

- Every chart has a `Table` tab (`ChartTableTab`) — same data, real `<table>`, screen-reader primary path; chart itself `role="img"` + one-sentence `aria-label` summary ("Savings growth: ₹12L deposited grows to ₹17.3L over 10 years").
- Identity never by color alone (direct labels/legend markers); texture fill (45°/135° lines) available under a "patterns" accessibility toggle and in forced-colors/print.

## 7. Accessibility (whole product)

- **WCAG 2.1 AA** minimum: text contrast ≥ 4.5:1 (checked per theme in CI via axe), UI components ≥ 3:1.
- Full keyboard operability — sliders (arrows/Shift/Home/End), tab order matches visual order, skip-to-content link, visible `--focus-ring` always (never `outline: none` without replacement).
- Touch targets ≥ 44 px; slider thumbs 28 px visual with 44 px hit area.
- `aria-live="polite"` regions announce recomputed headline results ("Final amount now ₹17.3 lakh") — throttled to slider release, not every tick.
- Forms: labels always visible (no placeholder-as-label), errors linked via `aria-describedby`.
- Language: plain-language pairs from the PRD glossary; reading level target ≈ grade 8.
- Theme toggle: light/dark/system persisted per user; charts and glass both re-tokened, both themes shipped from M0 (not retrofitted).

## 8. Voice & content style

- Second person, encouraging, never condescending: "Your money doubled — here's why," not "As can be observed…".
- Numbers are protagonists: bold the user's own figures in explanations.
- Every simplification labeled: "(banks vary — this uses the common formula)".
- Disclaimers standardized: short inline chip "simulation — not advice" + full text in footer.
