# 11 · Development Roadmap

Rules of the road:
- **One module at a time**, reviewed before the next starts (per the project's development rules).
- Every milestone ends with something **demoable in the browser** and deployed to a preview URL.
- `main` is always deployable; unfinished P2 features hide behind flags.
- Estimates assume one developer, part-time (~10–15 h/week). Take them as sequencing, not promises.

## Milestone map

| M | Name | Outcome (demo) | Est. |
|---|------|----------------|------|
| M0 | Foundations & design system | Styleguide page: every core component, both themes, motion | 2 wk |
| M1 | Finance core + first simulators | Savings + Compound + Inflation sims fully working (guest) | 3 wk |
| M2 | Loan suite | Loan simulator + Investment comparison + Goal planner (guest) | 3 wk |
| M3 | Accounts & persistence | Auth, dashboard, saved scenarios/goals; FastAPI + DB live | 3 wk |
| M4 | Behavioral sims | Credit-score simulator + Bank Manager game | 3 wk |
| M5 | Learning Hub | Hub framework + 3 lessons + quizzes + progress | 2 wk |
| M6 | AI Tutor | Context-grounded streaming tutor with all cost/safety controls | 2 wk |
| M7 | ML demonstration | Trained models, prediction UI, explanations, ethics panel | 2 wk |
| M8 | Hardening & production | Perf, a11y audit, security pass, tests to target, full CI/CD, monitoring, README polish | 3 wk |

Dependencies: M1←M0 · M2←M1 · M3←M1 (needs something worth saving) · M4←M3 (persistence useful) but game logic can start anytime · M5←M1 (embeds sims) · M6←M3 (rate limits want auth) · M7 independent after M3 · M8 last.

---

## M0 · Foundations & design system (Phase 2 of the project brief)

**Build:** repo scaffold per [08-folder-structure.md](08-folder-structure.md); Next.js app with Tailwind tokens from [10-design-system.md](10-design-system.md); fonts; theme switcher (light/dark/system); core components (Button, Card/GlassCard, Slider★, Field, Tabs, StatCard, Badge, Modal/Drawer/BottomSheet, Toast); motion utilities + `useReducedMotion` wiring; `/styleguide` route rendering everything; CI: lint + typecheck + component tests; Vercel preview deploys.
**Accept when:** styleguide page passes axe with 0 critical issues in both themes; slider fully keyboard-operable; CI green on PRs.

## M1 · Finance core + first simulators

**Build:** `packages/finance-core` — money (paise ints), savings, compound, inflation modules with **golden tests first** ([12-testing-strategy.md](12-testing-strategy.md)); `SimulatorShell` + charts (GrowthAreaChart, StatRow, ExplainerPanel, ChartTableTab); Savings (F1), Compound (F2), Inflation (F7) pages; URL-state serializer; landing page with live mini-sim.
**Why this order:** these three share the same math family and prove the whole simulator pattern end-to-end.
**Accept when:** golden tests pass to the paisa; slider→chart < 100 ms on a mid-range phone; each sim deep-linkable via URL; compare mode works on Savings.

## M2 · Loan suite

**Build:** finance-core loan module (EMI, amortization, DTI/FOIR, transparent approval heuristic), investments module (presets + variance bands), goals solver; Loan (F3), Investments (F6), Goals-preview (F8 without persistence) pages; what-if strip; AmortizationBars, DonutSplit, DTIGauge.
**Accept when:** EMI matches bank-published calculators on 10 reference cases; approval score itemization sums exactly to the headline; every figure in Investments carries its source footnote.

## M3 · Accounts & persistence (Phase 3 of the brief begins)

**Build:** FastAPI service skeleton (config, logging, error envelope, healthz); Postgres + Alembic baseline ([06-database.md](06-database.md)); Auth.js (credentials + Google, email verification) + `/api/token` mint + FastAPI JWT verify; scenarios & goals CRUD; preferences; dashboard v1; audit logging; rate-limit middleware; docker-compose for local dev; deploy API + DB + Redis to Railway/Render.
**Accept when:** sign-up→verify→save-scenario→see-on-dashboard works on production URLs; user A provably cannot read user B's data (tests); account deletion cascades verified.

## M4 · Behavioral sims

**Build:** finance-core credit-score engine (weighted factors, event effects, time decay) and bank-game engine (seeded applicant generator, default model, round resolution); Credit Score (F4) UI with gauge/timeline/factor bars; Bank Manager (F5) UI with round loop and post-mortem; autosave endpoints.
**Accept when:** credit engine unit-tested against the documented weight table; a saved bank game replays identically from its seed; game is completable and losable; both persist and resume.

## M5 · Learning Hub

**Build:** MDX pipeline + lesson component kit (`<MiniSim/>` embedding presets of F1–F3); hub index with progress; quiz component + server-side scoring endpoint; progress persistence; lessons: **Savings, Interest, Loans**.
**Accept when:** a new user can complete Lesson 1 end-to-end incl. quiz on mobile; progress survives sign-out/in; embedded mini-sims are live and interactive.

## M6 · AI Tutor

**Build:** tutor service in FastAPI (Claude API streaming via official SDK, prompt-cached system prompt); static answer library (top 50 Qs, vetted); Redis answer cache + rate limits + monthly budget kill-switch; context grounding (page + sim state injection); TutorDrawer UI with streaming, chips, feedback flags; conversation persistence; admin flagged-review endpoint.
**Accept when:** tutor answers grounded questions using the user's actual numbers; guest limits enforced; LLM outage degrades gracefully to library; budget kill-switch tested; 20-question eval sheet reviewed for correctness/tone.

## M7 · ML demonstration

**Build:** `ml/` training pipeline (fetch → preprocess → train logreg/RF/XGBoost → evaluate → export artifacts + model cards); FastAPI ml router (models, predict with contributions, recent); ML demo UI (inputs, three verdicts, contribution bars, report card, ethics panel); prediction logging.
**Accept when:** `make train` reproduces artifacts deterministically (fixed seeds); metrics on held-out set displayed match the model card; disagreement case documented in the UI copy; ethics panel reviewed.

## M8 · Hardening & production (Phases 4–5 of the brief)

**Build/do:**
- **Performance:** bundle analysis + code-splitting (target ≤ 180 kB gz first-load JS on sim pages), chart render profiling, image/font optimization, Lighthouse ≥ 90 perf.
- **Accessibility:** full audit against [10-design-system.md](10-design-system.md) §7, screen-reader pass (NVDA + VoiceOver) on Savings, Loan, a lesson, tutor.
- **Security:** ZAP baseline scan, ASVS L1 checklist, dependency audit, header verification ([09-security.md](09-security.md) §10).
- **Testing:** coverage to targets, E2E suite green in CI ([12-testing-strategy.md](12-testing-strategy.md)).
- **Ops:** production Docker image slimming, GitHub Actions full pipeline, Sentry + uptime checks + log retention, DB backup/restore drill ([13-deployment.md](13-deployment.md)).
- **Polish:** empty states, error states, 404/500 pages, og-images, professional README with architecture diagram + screenshots.
**Accept when:** the launch checklist in [13-deployment.md](13-deployment.md) §7 is fully ticked.

---

## Post-v1 backlog (ordered)

1. Remaining 8 lessons (content drops)
2. Scenario share links + presentation mode (educator persona)
3. Prepayment explorer; Monte-Carlo fan for equities
4. Educator classroom dashboard (v2 flagship)
5. i18n (Hindi first), PWA/offline simulators
