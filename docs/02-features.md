# 02 · Feature Specification

Priorities: **P0** = MVP, product is not demoable without it · **P1** = launch release · **P2** = fast-follow after launch.

## Summary table

| # | Feature | Priority | Runs where | Needs account? |
|---|---------|----------|-----------|----------------|
| F1 | Savings Simulator | P0 | Client | No (save = yes) |
| F2 | Compound Interest Visualizer | P0 | Client | No |
| F3 | Loan Simulator | P0 | Client | No (save = yes) |
| F4 | Credit Score Simulator | P1 | Client + persisted state | No (persist = yes) |
| F5 | Bank Manager Simulation | P1 | Client + persisted state | No (persist = yes) |
| F6 | Investment Comparison | P1 | Client | No |
| F7 | Inflation Simulator | P0 | Client | No |
| F8 | Financial Goal Planner | P1 | Client + persisted | Yes for saving goals |
| F9 | AI Finance Tutor | P1 | Backend (LLM API) | No, but tighter rate limit as guest |
| F10 | ML Loan Prediction Demo | P2 | Backend (FastAPI + models) | No |
| F11 | Learning Hub | P1 (3 lessons at M1, full set P2) | Client (MDX) + progress persisted | No (progress = yes) |
| FX1 | Auth & Accounts | P1 | Backend | — |
| FX2 | Personal Dashboard | P1 | Client + backend | Yes |
| FX3 | Dark/Light theme, responsive, a11y | P0 | Client | No |

All simulators share one interaction pattern — the **Simulator Layout** (controls panel · animated results · "How this was calculated" explainer panel · AI-tutor entry point). See [04-wireframes.md](04-wireframes.md).

---

## F1 · Savings Simulator (P0)

**Teaches:** how deposits grow, why time and rate matter more than amount, what inflation quietly removes.

**Inputs** (all sliders + numeric fields): initial deposit (₹0–₹10L), monthly deposit (₹0–₹1L), annual interest rate (0–15%), years (1–40), compounding frequency (yearly/half-yearly/quarterly/monthly), inflation rate (0–12%).

**Outputs:**
- Final amount, total deposited, interest earned, total growth %, real (inflation-adjusted) value.
- Year-by-year animated area chart: deposits layer vs. interest layer (the "interest wedge" visibly overtakes deposits over long horizons — the core aha moment).
- Real-value overlay line (nominal vs. real).
- Comparison mode: pin scenario A, tweak into scenario B, see both charts side by side.
- Explainer panel: the exact formula with the user's numbers substituted, plus a plain-language walkthrough ("In year 1 you earned ₹700 interest. In year 10, ₹1,320 — on money the interest itself had created.").

**Math:** future value with periodic contributions, contributions at period end (ordinary annuity):
`FV = P·(1+i)^n + M·[((1+i)^n − 1)/i]` where `i` = rate/periods-per-year, `n` = total periods. Real value = `FV / (1+inflation)^years`.

**Acceptance criteria:** results update < 100 ms on input change; year-wise table downloadable; matches golden test values to the paisa.

---

## F2 · Compound Interest Visualizer (P0)

**Teaches:** the *mechanism* of compounding — visually separating principal, "flat" simple interest, and interest-on-interest.

- Three stacked layers animated year by year: principal (constant), simple-interest layer (linear), compounding bonus (the curve).
- Simple vs. compound toggle; the gap between the two lines is highlighted and labeled "interest earned by interest: ₹X".
- Frequency slider shows why monthly compounding beats yearly (small but real).
- "Rule of 72" callout: doubling time ≈ 72/rate, verified live against the chart.

**Acceptance criteria:** at 0 years the layers are equal; the compound − simple gap equals `P(1+r)^t − P(1+rt)` exactly.

---

## F3 · Loan Simulator (P0)

**Teaches:** why loans cost so much, what drives EMI, how banks judge you.

**Inputs:** loan amount, annual rate, tenure (months/years), monthly income, monthly expenses, existing EMIs, credit score (300–900 slider), employment type (salaried/self-employed/student).

**Outputs:**
- **EMI** = `P·r·(1+r)^n / ((1+r)^n − 1)`, r = monthly rate.
- Total interest, total payment, interest-vs-principal donut ("you borrow ₹5L, you repay ₹7.2L").
- Full amortization schedule (table + stacked bar per year: principal vs. interest portion) — shows that early EMIs are mostly interest.
- **Debt-to-income / FOIR gauge**: (existing EMIs + new EMI) / income, with the common bank comfort band (≤ 40–50%) marked.
- **Estimated approval chance** (rule-based, transparent): score from credit score band + FOIR + employment type + tenure-vs-age; every point is itemized ("−20: FOIR above 50%") so it teaches rather than mystifies.
- Risk level chip (Low/Medium/High) with reasons.
- What-if strip: "+1 year tenure → EMI ↓ ₹1,840, total interest ↑ ₹43,000" (the fundamental tenure trade-off).
- Prepayment explorer (P1): one extra payment of ₹X in month M → interest saved, months cut.

**Disclaimer:** approval chance is an educational heuristic, not any bank's actual policy.

---

## F4 · Credit Score Simulator (P1)

**Teaches:** what a credit score is, what moves it, how long damage lasts.

- Starts at 650 ("new to credit") or a user-chosen score. CIBIL-style 300–900 gauge.
- **Action buttons**, each animating the score and appending to a timeline: pay EMI on time (+), miss an EMI (−, large), high card utilization > 30% / > 80% (−), pay down card (+), open new loan (small −, then recovers), close oldest account (− via history length), apply for many loans quickly (− via inquiries).
- Time-step button ("advance 3 months") shows recovery and decay — missed payments hurt less as they age.
- Score is a transparent weighted model (payment history 35%, utilization 30%, credit age 15%, mix 10%, inquiries 10%) — weights shown to the user, labeled as representative of how bureaus broadly work.
- Side panel: current loan eligibility at this score (ties back to F3), plus 3 concrete suggestions to improve.
- Scenario history persisted for signed-in users; replay animation of the whole journey.

---

## F5 · Bank Manager Simulation (P1)

**Teaches:** the other side of the desk — banks balance profit against default risk; easy approvals feel good and destroy banks.

**Game loop (rounds = quarters):**
1. Bank starts with ₹10 Cr capital, pays 4% on deposits (cost of funds).
2. Each round deals 5–8 loan applications: income, credit score, age, amount, tenure, employment, brief history note. Each has a hidden default probability derived from its attributes.
3. Player approves (choosing a rate within a band) or rejects each.
4. Round resolves: approved loans pay EMIs; some default (lose remaining principal → NPA); rejected good customers reduce satisfaction; too-high rates drive customers away.
5. Scoreboard: profit/loss, NPA ratio (with the RBI-style "> 90 days overdue" definition taught), customer satisfaction, bank stability meter.

**End states:** stability collapse (NPA spiral) with a post-mortem ("you approved 3 applicants with FOIR > 60%..."), or survive 12 rounds → performance grade + what the trade-offs were.

**Design note:** attributes → default probability mapping is the same feature logic the ML demo (F10) learns, so the two features reinforce each other.

---

## F6 · Investment Comparison (P1)

**Teaches:** risk/return/liquidity/tax are a four-way trade-off; there is no "best," only "best for a purpose."

- Instruments: savings account, fixed deposit, recurring deposit, gold, index mutual fund (SIP), stocks (high-variance), government bonds.
- Inputs: monthly amount or lump sum, horizon (1–30y), risk tolerance display toggle.
- Growth chart of all selected instruments using published long-run average returns **with variance bands** for market-linked ones (not a single deceptive line).
- Comparison matrix: expected growth, risk level, liquidity, tax treatment (indicative), inflation-beating (real return > 0?).
- Monte-Carlo-lite (P2): shaded percentile fan for equities so "average 12%" ≠ "guaranteed 12%".
- Every figure footnoted with its source and "historical average, not a prediction."

---

## F7 · Inflation Simulator (P0)

**Teaches:** money loses value while standing still.

- "₹1,000 today buys this basket" → animated shrinking of what it buys after 10/20/30 years at chosen inflation.
- Purchasing-power curve + everyday anchors (samosa index: "₹15 today, ₹32 in 10 years at 8%").
- Flip view: "to have today's ₹1L of purchasing power in 20 years you need ₹X."
- Direct link into F1 with inflation pre-set ("now see if your savings beat this").

---

## F8 · Financial Goal Planner (P1)

**Teaches:** turning a dream into a monthly number.

- Goal templates: bike, laptop, higher education, emergency fund, house down payment, vacation, custom.
- Inputs: target amount, target date (or monthly capacity — solves either direction), expected return (linked to instrument presets from F6), inflation adjustment of the target.
- Outputs: required monthly saving (`M = FV·i / ((1+i)^n − 1)`), timeline with milestone markers, interest contribution ("of your ₹80,000 laptop, ₹9,400 comes from interest"), suggested instrument types by horizon (rule-based, educational framing: "goals under 2 years usually suit low-risk instruments like RDs").
- Signed-in: goals saved, progress can be manually updated, dashboard shows all goals.

---

## F9 · AI Finance Tutor (P1)

**Teaches:** everything, conversationally — the patient teacher beside every simulator.

- Chat drawer available on every page; on simulator pages it is **context-grounded**: the current inputs/outputs are injected into the prompt so "why is my EMI so high?" is answered with *the user's actual numbers*.
- Persona: explains like a teacher to a 15-year-old; analogies first, formula second; never gives personalized advice ("should I take this loan?" → explains the factors to weigh, states it can't advise).
- Suggested-question chips per page ("What is EMI?", "Why does tenure change total interest?").
- Streaming responses (SSE). Conversations persisted for signed-in users.
- **Cost/safety controls:** per-user rate limit, Redis cache for common questions, top-50 questions answered from a vetted static library first, hard system-prompt constraints, thumbs-down feedback flag, graceful degradation to the static library if the LLM API is down.

---

## F10 · ML Loan Prediction Demonstration (P2)

**Teaches:** how machines learn approval patterns from data — and why that's powerful *and* dangerous.

- Trained offline on a public loan dataset (Kaggle Loan Prediction / German Credit) with a documented, reproducible training pipeline.
- Models: logistic regression, random forest, XGBoost — user can switch and compare accuracy/precision/recall/ROC on the held-out set.
- Interactive: enter an applicant profile → each model's approve/reject + confidence + default probability + risk category.
- **Explanation:** per-prediction feature contributions (odds ratios / SHAP-style bars): "credit history contributed +34% toward approval."
- **Ethics panel (required, not optional):** where the data came from, what bias means, why "the computer said no" is not a neutral statement. Permanent banner: *educational demonstration only — not a real banking decision system.*

---

## F11 · Learning Hub (P1 core / P2 full)

**Teaches:** structured curriculum wrapping the simulators.

- Lessons (MDX): savings, interest, loans, credit cards, taxes, insurance, inflation, investments, budgeting, fraud prevention, cybersecurity in banking.
- Each lesson = short animated sections + an embedded live mini-simulator (reusing F1–F8 components with fixed presets) + a 3–5 question quiz.
- Progress tracking, streaks, completion badges for signed-in users; guests can take everything, nothing persists.
- Launch set (P1): Savings, Interest, Loans. Remaining eight lessons are P2 content drops (framework ships at P1).

---

## FX · Cross-cutting features

- **FX1 Auth (P1):** email+password (argon2) and Google OAuth via Auth.js; email verification; account deletion (full data erase).
- **FX2 Dashboard (P1):** saved scenarios, goals with progress, lesson progress, credit-sim state, bank-game save, recent AI conversations.
- **FX3 Theming/a11y (P0):** dark + light from day one; WCAG 2.1 AA; reduced-motion support; keyboard-operable sliders; screen-reader data tables behind every chart.
- **FX4 Share (P2):** read-only public link for a saved scenario (for classrooms).
