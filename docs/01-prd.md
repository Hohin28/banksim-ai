# 01 · Product Requirements Document (PRD)

| | |
|---|---|
| **Product** | BankSim AI — Learn Finance Through Interactive Simulations |
| **Version** | 0.1 (Planning draft) |
| **Date** | 2026-07-08 |
| **Status** | Awaiting review — no code written yet |

---

## 1. Problem statement

Financial literacy is taught, when it is taught at all, through static text: definitions of compound interest, formulas for EMI, warnings about credit scores. Students memorize the words without building intuition. The result is that most school and college students — and many working adults — cannot answer practical questions about their own money:

- How does a bank actually make money from my deposit?
- Why does a 2% interest-rate difference change my loan cost by lakhs?
- Is my savings account actually growing, once inflation is counted?
- What happens to my credit score if I miss one EMI?

Textbooks explain. **Nobody lets students experiment.** Real banking apps are the opposite: real money, real consequences, zero explanation.

## 2. Vision

BankSim AI is a **flight simulator for personal finance**. Every concept is a hands-on simulation: the user moves a slider, and the consequences animate in front of them — balances growing, interest compounding, EMIs stacking up, credit scores rising and falling, a virtual bank profiting or collapsing. An AI tutor sits alongside every simulation and explains what just happened in the language of a patient teacher, not a banker.

The product must feel like a **premium modern SaaS tool** — glassmorphism, smooth animation, delightful interactions — so that learning finance feels like playing a well-made game, not doing homework.

**This is explicitly NOT an online banking website.** No real money, no real accounts, no real financial advice. It is a safe sandbox where mistakes cost nothing and teach everything.

## 3. Target users & personas

### P1 — Ananya, 16, school student (primary persona)
- Class 11 commerce student. Has a savings account her parents opened; has never looked at the interest.
- **Needs:** zero-jargon explanations, instant visual feedback, small wins (quizzes, progress badges).
- **Success looks like:** she can explain compound interest to a friend using the visualizer, unprompted.

### P2 — Rohan, 20, college student (primary persona)
- Engineering undergrad considering an education loan; parents are asking him to "figure out the EMI."
- **Needs:** the loan simulator with real numbers, approval-chance intuition, what-if comparisons.
- **Success looks like:** he walks into a bank conversation knowing his EMI, total interest, and DTI ratio.

### P3 — Priya, 24, first-jobber (secondary persona)
- First salary, first credit card, vague anxiety about "building credit" and "investing."
- **Needs:** credit score simulator, investment comparison, goal planner for an emergency fund.
- **Success looks like:** she sets a 6-month emergency-fund goal and understands why an RD beats her savings account for it.

### P4 — Mr. Sharma, 41, educator / workshop facilitator (secondary persona)
- Runs financial-literacy workshops for schools and NGOs.
- **Needs:** projector-friendly visuals, guest mode (no signup for a class of 40), lesson sequencing, quiz results.
- **Success looks like:** he runs a 45-minute workshop entirely inside BankSim AI without preparing slides.

## 4. Goals & success metrics

| Goal | Metric | Target (first 6 months post-launch) |
|---|---|---|
| Users learn by doing | Avg. simulator interactions per session | ≥ 15 parameter changes |
| Concepts actually land | Quiz pass rate on first attempt after using the related simulator | ≥ 70% |
| The product is engaging | Median session duration | ≥ 8 minutes |
| Users return | 7-day return rate for signed-up users | ≥ 30% |
| Usable without accounts | Share of simulator usage available in guest mode | 100% of simulators |
| Educators adopt it | Workshops/classrooms using it | ≥ 10 documented uses |
| It performs like a premium product | Lighthouse performance / accessibility scores | ≥ 90 / ≥ 95 |

## 5. Guiding principles

1. **Learn by doing, always.** If a concept can be a slider, it must be a slider. Text is a supplement, never the medium.
2. **Instant feedback.** Every input change re-renders results in < 100 ms. All simulation math runs client-side; the network is never between a slider and its chart.
3. **Plain language first.** Every number on screen has a one-tap explanation written for a 15-year-old. Jargon appears only alongside its plain-language twin ("EMI — your fixed monthly repayment").
4. **Safe sandbox.** Nothing is real. The UI reinforces this ("simulation", play-money styling) so users experiment fearlessly.
5. **Honest numbers.** Formulas are the real ones banks use (EMI amortization, compound interest, real returns). Simplifications are labeled as simplifications.
6. **Guest-first.** Every simulator works without an account. Accounts only add persistence (saved scenarios, progress, goals).
7. **Not advice.** Persistent, visible disclaimers: educational demonstration only, not financial advice, and the ML demo is not a real banking decision system.

## 6. Scope

### In scope (v1)
All 11 core features (see [02-features.md](02-features.md)):
savings simulator, compound interest visualizer, loan simulator, credit score simulator, bank manager simulation, investment comparison, inflation simulator, financial goal planner, AI finance tutor, ML loan-prediction demonstration, learning hub — plus authentication, a personal dashboard, dark/light mode, and full guest mode.

### Out of scope (v1) — explicitly deferred
- Real banking integrations of any kind (account aggregation, UPI, payments).
- Multiplayer / classroom management dashboards (v2 candidate for the educator persona).
- Mobile native apps (the web app must be fully responsive instead).
- Multiple languages (architecture must not block later i18n; INR + English at launch).
- Real-time market data (investment comparison uses published long-run historical averages, clearly labeled).
- Community features (comments, sharing scenarios publicly).

### Non-goals (never)
- Handling real money or personal financial data (bank statements, PAN, Aadhaar).
- Personalized financial advice ("you should buy X").
- Using the ML model for any real lending decision.

## 7. Assumptions & constraints

- **Currency & context:** INR-first. Credit scores use the Indian CIBIL-style 300–900 scale. Instruments include FD, RD, PPF-style examples. Formatting uses the Indian numbering system (lakh/crore) with a toggle.
- **Devices:** Mobile-first responsive; the classroom case also demands a good ≥1280 px projector layout.
- **Budget:** Hobby/portfolio-scale hosting initially (Vercel free/pro tier + one small API host). Architecture must run comfortably on ~$0–20/month until there is real traffic.
- **AI cost:** The AI tutor calls a paid LLM API. It must be rate-limited per user, cached for common questions, and degrade gracefully to pre-written explanations when unavailable.

## 8. Key user questions the product must answer

Each maps to at least one feature (traceability in [02-features.md](02-features.md)):

1. "If I save ₹1,000 today, what happens in 10 years?" → Savings Simulator
2. "If I raise the interest rate from 5% to 7%, what changes?" → Savings / Compound Visualizer
3. "If inflation is 8%, am I actually making money?" → Inflation Simulator, real-value overlays everywhere
4. "Why is my EMI so high?" → Loan Simulator
5. "What happens if I miss loan payments?" → Credit Score Simulator, Loan Simulator schedule view
6. "How do banks decide loan eligibility?" → Loan Simulator (DTI/FOIR), Bank Manager Simulation, ML Demo
7. "What's the safest place for my money?" → Investment Comparison (risk/liquidity axes)
8. "How much do I need to save monthly for a ₹80,000 laptop in 2 years?" → Goal Planner
9. "What even is a credit score?" → Credit Score Simulator + Learning Hub + AI Tutor

## 9. Risks & mitigations

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Financial math bugs destroy credibility | Medium | High | Golden-value unit tests against hand-computed and bank-published examples; property tests; the math library is the most-tested code in the repo ([12-testing-strategy.md](12-testing-strategy.md)) |
| Users mistake simulations for advice | Medium | High | Persistent disclaimers, "simulation" framing throughout, no "recommended for you" language |
| AI tutor hallucinates wrong finance | Medium | High | System prompt constrained to explain, not advise; grounded with the exact numbers from the active simulation; canned vetted answers for the top 50 questions; feedback flag on every AI answer |
| LLM API cost blowout | Medium | Medium | Per-user rate limits, response caching in Redis, small default model, hard monthly budget alarm |
| Scope is very large for one developer | High | Medium | Strict milestone order ([11-roadmap.md](11-roadmap.md)); every simulator ships standalone and guest-usable, so the product is demoable from M1 onward |
| ML demo perceived as discriminatory/real | Low | High | Prominent "educational demonstration" banner, bias discussion built into the feature, no protected attributes as inputs |

## 10. Glossary (product-wide plain-language pairs)

| Term | Plain-language twin shown in UI |
|---|---|
| EMI | Your fixed monthly loan repayment |
| Principal | The original amount (deposited or borrowed) |
| Compound interest | Interest that earns its own interest |
| DTI / FOIR | How much of your income already goes to repayments |
| NPA | A loan the bank has likely lost (unpaid > 90 days) |
| Credit utilization | How much of your credit card limit you're using |
| Real return | Growth after subtracting inflation |
| Liquidity | How fast you can turn it back into cash |
