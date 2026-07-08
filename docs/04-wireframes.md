# 04 · Wireframes (low-fidelity)

ASCII wireframes for the key screens. Desktop-first drawings; the **Responsive rules** section at the end defines how each collapses to mobile. Visual styling (glass, gradients, tokens) is specified in [10-design-system.md](10-design-system.md) — these are structure only.

---

## W1 · Landing page

```
+----------------------------------------------------------------------+
| ◐ BankSim AI      Simulators ▾   Learn   Bank Game   [Sign in] [🌙] |
+----------------------------------------------------------------------+
|                                                                      |
|   Learn finance by DOING,          +-----------------------------+   |
|   not reading.                     |  LIVE MINI SIMULATOR        |   |
|                                    |  Monthly ₹[1,000]  Rate 7%  |   |
|   Move the sliders. Watch your     |  Years ●————————○ 10        |   |
|   money behave. Understand it      |  ┌───────────────────────┐  |   |
|   for the first time.              |  │   ▁▂▂▃▄▅▆▇ chart      │  |   |
|                                    |  │   deposits ▓ interest░ │  |   |
|   [ Try the Savings Simulator ]    |  └───────────────────────┘  |   |
|   [ Browse all simulators ]        |  Final: ₹1,73,085           |   |
|                                    |  You deposited: ₹1,20,000   |   |
|                                    +-----------------------------+   |
|                                                                      |
|  ── What you can explore ──────────────────────────────────────────  |
|  [💰 Savings] [📈 Compound] [🏦 Loans] [📊 Credit Score]             |
|  [🎮 Run a Bank] [⚖ Investments] [🎈 Inflation] [🎯 Goals]           |
|                                                                      |
|  ── footer: About · Not financial advice · GitHub · Privacy ──────── |
+----------------------------------------------------------------------+
```

## W2 · Simulator Layout (shared shell for F1, F2, F3, F6, F7)

```
+----------------------------------------------------------------------+
| nav                                                                  |
+----------------------------------------------------------------------+
| Savings Simulator          [Compare +] [Save ⭑] [Reset ⟳] [Share ⤴] |
+--------------------+-------------------------------------------------+
| CONTROLS (~320px)  |  RESULTS                                        |
|                    |                                                 |
| Initial deposit    |  ┌ stat row ─────────────────────────────────┐  |
| ₹ [10,000]         |  │ FINAL ₹17.3L │ DEPOSITED ₹12L │ +₹5.3L │  |
| ●———○——————        |  └───────────────────────────────────────────┘  |
|                    |                                                 |
| Monthly deposit    |  ┌ main chart (animated area) ──────────────┐  |
| ₹ [5,000]          |  │              ..░░░░  ← interest           │  |
| ●————○—————        |  │        ..░░░░▓▓▓▓▓▓                       │  |
|                    |  │  ..░░░░▓▓▓▓▓▓▓▓▓▓▓▓  ← deposits           │  |
| Interest rate      |  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  --- real value      │  |
| [7.0]% ●——○———     |  └──────────────────── years ───────────────┘  |
|                    |  [Chart | Table | Year-by-year]     tab bar     |
| Years  [10] ●—○——  |                                                 |
| Compounding        |  ┌ HOW THIS WAS CALCULATED ─────────────────┐  |
|  (Yearly|Monthly…) |  │ FV = 10,000·(1.0058)^120 + 5,000·[...]    │  |
| Inflation [6]%     |  │ "Each month your balance earned 0.58%.    │  |
|                    |  │  In year 1 that was ₹700. By year 10..."  │  |
|                    |  └───────────────────────────[Ask the tutor]─┘  |
+--------------------+-------------------------------------------------+
                                                        (🎓) ← tutor FAB
```

## W3 · Loan Simulator results area (same shell, different results)

```
|  ┌ stat row ────────────────────────────────────────────────────┐   |
|  │ EMI ₹10,624/mo │ TOTAL INTEREST ₹2.75L │ TOTAL PAID ₹7.75L │   |
|  └──────────────────────────────────────────────────────────────┘   |
|  ┌ donut ──────────┐  ┌ DTI gauge ─────────┐ ┌ approval ───────┐   |
|  │  borrow ▓ 64%   │  │   ▂▄▆█ 38%         │ │  LIKELY ✓ 78%   │   |
|  │  interest ░ 36% │  │  comfort band ≤45% │ │ -10 short history│  |
|  └─────────────────┘  └────────────────────┘ │ +25 score 780    │  |
|                                              └──── itemized ────┘   |
|  ┌ amortization (stacked bars per year) ────────────────────────┐   |
|  │ y1 ░░░░░░░░▓▓   ← mostly interest first                      │   |
|  │ y5 ░░░░▓▓▓▓▓▓                                                │   |
|  └──────────────────────────────────────────────────────────────┘   |
|  WHAT IF:  [Tenure +1y: EMI −₹1,840, interest +₹43k]  [Rate −0.5%…] |
```

## W4 · Credit Score Simulator

```
+--------------------+-------------------------------------------------+
| ACTIONS            |            ┌─────────────┐                      |
|                    |            │   GAUGE     │   Eligibility now:   |
| [✓ Pay EMI on time]|            │  ╭─────╮    │   Personal loan ✓    |
| [✗ Miss an EMI]    |            │  │ 712 │    │   Home loan ~        |
| [💳 Card use 80%]  |            │  ╰─────╯    │   Best rates ✗       |
| [💳 Pay card down] |            │ 300 ─── 900 │                      |
| [+ Open new loan]  |            └─────────────┘                      |
| [− Close oldest]   |  FACTORS  payment ███████░ 35%                  |
| [⏩ Advance 3 mo]   |           utilization ██░░░ 30% ...             |
|                    |  TIMELINE ──●──●────●───●──▶                    |
|                    |   "Missed EMI: −62"  "3mo later: +18 recovery"  |
|                    |  SUGGESTIONS: 1. Get utilization under 30% ...  |
+--------------------+-------------------------------------------------+
```

## W5 · Bank Manager Simulation

```
+----------------------------------------------------------------------+
| ROUND 4 / 12   Capital ₹9.2Cr  Profit +₹14L  NPA 3.1%  Satisf. 72%  |
| Stability ████████░░                                                 |
+----------------------------------------------------------------------+
|  APPLICATIONS THIS ROUND                                             |
|  ┌ card ─────────────┐ ┌ card ─────────────┐ ┌ card ────────────┐    |
|  │ Meera, 34, ₹8L    │ │ Arjun, 23, ₹15L   │ │ Devi, 51, ₹3L    │    |
|  │ salaried · 15k/mo │ │ student · no inc. │ │ self-emp · 40k   │    |
|  │ score 760         │ │ score —(new)      │ │ score 590        │    |
|  │ hist: clean       │ │ hist: none        │ │ hist: 1 default  │    |
|  │ [Approve @ 11%▾]  │ │ [Approve▾][Reject]│ │ [Approve][Reject]│    |
|  └───────────────────┘ └───────────────────┘ └──────────────────┘    |
|                                        [ End round → resolve ]      |
+----------------------------------------------------------------------+
```

## W6 · Learning Hub index & lesson

```
HUB INDEX                              LESSON PAGE
+---------------------------+          +---------------------------------+
| Your path  ◐◐◐○○○○○○○○    |          | Lesson 3: Loans        ◐ 2/5    |
| ┌────────┐ ┌────────┐     |          |  §1 text + animation            |
| │Savings │ │Interest│     |          |  §2 ┌ embedded mini-sim ──────┐ |
| │  ✓done │ │ ◐ 60%  │     |          |     │ (live F3 with presets)  │ |
| └────────┘ └────────┘     |          |     └────────────────────────-┘ |
| ┌────────┐ ┌────────┐     |          |  §3 text                        |
| │ Loans  │ │Credit  │     |          |  QUIZ  Q1/4  ○ A ● B ○ C        |
| │  start │ │ locked─│     |          |  "Right! because..." [Next]     |
| └────────┘ └────────┘     |          +---------------------------------+
+---------------------------+
```

## W7 · AI Tutor drawer (overlays any page, right side)

```
                              +------- 🎓 Finance Tutor ------- ✕ -+
                              | context: Savings sim, ₹5k/mo @7%  |
                              |-----------------------------------|
                              | [Explain my result]               |
                              | [Why does interest speed up?]     |
                              | [What is compounding?]            |
                              |-----------------------------------|
                              | You: why is my final amount...    |
                              | 🎓: Great question! Think of...   |
                              |    (streams in)        👍 👎      |
                              |-----------------------------------|
                              | [ type a question…          ➤ ]  |
                              | educational info, not advice      |
                              +-----------------------------------+
```

## W8 · Dashboard (signed-in)

```
+----------------------------------------------------------------------+
| Hi Rohan 👋            [Continue lesson: Loans ▸]                    |
+------------------+------------------+--------------------------------+
| SAVED SCENARIOS  | GOALS            | LEARNING                       |
| ⭑ "Laptop fund"  | 🎯 Emergency fund| ◐◐◐○○ 3/11 lessons             |
|   savings · ₹5k  |  ▓▓▓░░ 45%      | 🔥 4-day streak                |
| ⭑ "Bike loan"    |  ₹2,700/mo needed| quizzes avg 82%                |
|   loan · ₹80k    | [+ new goal]     |                                |
+------------------+------------------+--------------------------------+
| CREDIT JOURNEY: 712 ▲  [resume]  |  BANK GAME: round 4 saved [play] |
+----------------------------------------------------------------------+
```

## W9 · ML Demonstration

```
+----------------------------------------------------------------------+
| ⚠ EDUCATIONAL DEMONSTRATION — not a real banking decision system     |
+----------------------------------------------------------------------+
| APPLICANT INPUTS          | MODEL VERDICTS                           |
| income   [45,000]         | ┌ LogReg ──┐ ┌ RandForest ┐ ┌ XGBoost ┐  |
| loan amt [6,00,000]       | │ ✓ 71%    │ │ ✓ 68%      │ │ ✗ 54%   │  |
| credit hist (yes/no)      | └──────────┘ └────────────┘ └─────────┘  |
| dependents, education,    | models disagree → why? [explain]         |
| property area...          | FEATURE CONTRIBUTIONS (XGBoost)          |
| [Predict]                 |  credit_history ██████████ +34%          |
|                           |  income/loan    ████ +11%                |
|                           |  ...                                     |
+----------------------------------------------------------------------+
| MODEL REPORT CARD: accuracy · precision · recall · ROC (test set)    |
| ETHICS: where this data came from, what could go wrong, bias 101     |
+----------------------------------------------------------------------+
```

---

## Responsive rules

| Breakpoint | Layout change |
|---|---|
| ≥ 1280 px | As drawn. Simulator: controls left rail + results right. |
| 768–1279 px | Controls collapse to a top accordion above results; stat rows wrap 2×2. |
| < 768 px (mobile) | Single column: sticky compact stat bar on top → chart → controls in a bottom sheet opened by a persistent **"Adjust ⚙"** button → explainer below. Tutor drawer becomes full-screen sheet. Bank-game cards become a swipeable stack. |
| Projector (educator) | ≥ 1280 layout + a "presentation mode" toggle (P2): larger type, hidden nav chrome. |

Charts always keep a `Table` tab — that is also the screen-reader path (see [10-design-system.md](10-design-system.md) §Accessibility).
