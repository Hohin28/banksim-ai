# 12 · Testing Strategy

Priority is explicit: **the financial math is the product.** A styling bug embarrasses us; a wrong EMI destroys the product's reason to exist. Test investment follows that order.

## 1. Test pyramid & targets

| Layer | Tooling | Coverage target | Runs |
|---|---|---|---|
| finance-core unit | Vitest (+ fast-check) | **100% lines, 100% branches** — enforced | every PR |
| API unit + integration | pytest, httpx, testcontainers-postgres, fakeredis | ≥ 85% on routers/services | every PR |
| Web component | Vitest + Testing Library | key components (Slider, SimulatorShell, TutorDrawer, forms) | every PR |
| E2E | Playwright (chromium + webkit, mobile viewport included) | 8 critical journeys | PR (smoke) + nightly (full) |
| Accessibility | axe-core in component tests + Playwright-axe on pages | 0 serious/critical violations | every PR |
| Performance | Lighthouse CI on 4 pages | perf ≥ 90, a11y ≥ 95 budgets | nightly + release |
| Security | gitleaks, pnpm/pip audit, eslint-security, ruff S-rules; ZAP baseline | no high findings | PR / pre-release |
| ML | pytest on pipeline + metric thresholds | see §5 | on `ml/` changes |

## 2. finance-core: the golden-value discipline

Every module ships with three test classes:

**a) Golden values** — hand-verified against independent sources (bank EMI calculators, RBI/textbook examples, spreadsheet recomputation). Stored as data tables:

```ts
// loan.golden.test.ts
const GOLDEN = [
  // P (₹),      rate %pa, months, expected EMI (paise)
  [500000_00,    9.5,      60,     1050090],   // verified vs 2 bank calculators
  [2500000_00,   8.5,      240,    2169607],
  [100000_00,    12,       12,      888488],
  // ... ≥ 10 cases per function, incl. min/max slider bounds
];
```

Rule: golden numbers are computed **outside the codebase** (spreadsheet + published calculator, sources cited in a comment) — never by running the code under test.

**b) Property tests** (fast-check) — invariants that must hold for all inputs:
- Amortization: sum of principal portions = principal (± 1 paisa rounding, absorbed in final installment); balance strictly decreases; last balance = 0.
- Savings FV monotonic in rate, years, monthly amount; FV(0 rate) = plain sum of deposits.
- Compound − simple gap ≥ 0, = 0 at t ≤ 1 period.
- Real value ≤ nominal for inflation ≥ 0.
- Credit score always ∈ [300, 900]; same event sequence ⇒ same score (determinism).
- Bank game: same seed ⇒ identical applicant stream and resolution.

**c) Boundary/rounding tests** — paise-integer arithmetic: no floats in money paths (lint rule bans `number` literals with decimals in `money.ts` consumers), rounding mode documented and tested (banker's vs half-up — decide once, test it).

## 3. API tests

- **Contract tests:** every endpoint in [07-api-design.md](07-api-design.md) has a happy-path + validation-failure + auth-failure test; error envelope shape asserted globally.
- **Ownership tests (security-critical):** for each resource router, an explicit "user A requests user B's id → 404" test. Named `test_idor_*` so their presence is greppable in review.
- **Rate-limit tests:** fakeredis, window rollover, `Retry-After` presence, budget kill-switch flips tutor to library mode.
- **JWT tests:** expired, tampered signature, wrong audience, clock skew.
- **Quiz scoring:** server re-scores; client-submitted scores ignored (test proves it).
- **Migrations:** CI job runs `alembic upgrade head` + `downgrade -1` + `upgrade head` against a fresh testcontainer.

## 4. E2E journeys (Playwright)

1. Guest: landing → savings sim → move sliders → results change → compare mode.
2. Guest→user: try save → sign up (mailpit for verification) → scenario on dashboard.
3. Loan: full inputs → EMI/schedule/approval render → what-if chip updates → save.
4. Credit sim: actions → score changes → advance time → resume after re-login.
5. Bank game: play 2 rounds → autosave → reload → identical state (seed check).
6. Lesson: complete lesson 1 incl. quiz fail → retry → pass → progress persisted.
7. Tutor: mocked LLM (fixture SSE server) → grounded question streams → flag answer; LLM-down fixture → static fallback.
8. Account deletion: delete → login blocked → (test hook fast-forwards grace) → data gone.

Mobile viewport (390×844) variants for journeys 1, 3, 6. LLM is **always mocked in CI** — a tiny SSE fixture server; real-API smoke test is manual pre-release.

## 5. ML pipeline tests

- Data validation on ingest (pandera-style schema: ranges, nulls, cardinality) — fails loudly on dataset drift.
- Determinism: fixed seeds → identical artifacts (hash-compared).
- Metric floors on held-out set (e.g. XGBoost AUC ≥ 0.75; thresholds set from first accepted training run) — retraining that regresses fails CI.
- Model-card sync: metrics displayed by the API must equal `model_cards.json` produced by the same training run.
- Prediction service: schema round-trip, contribution weights sum sanity, guest-vs-user logging.

## 6. Frontend component tests — what matters most

- `Slider`: keyboard (arrows/Shift/Home/End), `aria-valuetext`, paired-input sync.
- `SimulatorShell`: input change → recompute called once (memoization), URL updated, `aria-live` announcement throttled to release.
- `ChartTableTab`: table data equals chart series exactly.
- Currency formatting: lakh/crore vs international toggle snapshots.
- Reduced-motion: with `prefers-reduced-motion`, count-ups snap (asserted).

## 7. CI gates (blocking on PR)

1. Lint + typecheck (web, packages) / ruff + mypy (api)
2. finance-core tests at 100% (hard fail below)
3. API + component tests ≥ targets
4. axe: 0 serious/critical on styleguide + changed pages
5. Playwright smoke (journeys 1–3)
6. gitleaks + dependency audit (high severity fails)
7. Build succeeds (web + api docker image)

Nightly: full E2E matrix, Lighthouse budgets, ZAP baseline against staging.

## 8. Test data & fixtures

- Seed script personas: `student@test`, `educator@test`, `admin@test` (+ fixture scenarios/goals/progress).
- Factory helpers (pytest factories / TS builders) — no hand-rolled JSON blobs in tests.
- Golden-value spreadsheets committed under `docs/verification/` so reviewers can re-derive any number.
