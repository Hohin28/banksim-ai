# BankSim AI — Learn Finance Through Interactive Simulations

An educational web platform that teaches personal finance and banking concepts through **interactive simulations** instead of text. Users change numbers with sliders and instantly see what happens to their money — through animated charts, timelines, and plain-language explanations.

> **Status:** 5 of 8 build milestones shipped. Seven interactive simulators + a Learning Hub are live and fully client-side (no account or backend required). The remaining milestones add accounts, an AI tutor, and an ML demo — see [Roadmap status](#roadmap-status).

## What works today

Run it locally and open [http://localhost:3000](http://localhost:3000):

```bash
pnpm install
pnpm dev
```

- **7 interactive simulators**, each with live charts, a plain-language "how this was calculated" explainer, and a shareable URL:
  - [Savings](apps/web/app/(sims)/savings) · [Compound Interest](apps/web/app/(sims)/compound-interest) · [Inflation](apps/web/app/(sims)/inflation)
  - [Loans/EMI](apps/web/app/(sims)/loans) (amortization, DTI/FOIR gauge, transparent approval estimate) · [Investments](apps/web/app/(sims)/investments) · [Goals](apps/web/app/(sims)/goals)
  - [Credit Score](apps/web/app/(sims)/credit-score) simulator and [Bank Manager](apps/web/app/(sims)/bank-game) game
- **Learning Hub** ([/learn](apps/web/app/learn)) — interactive lessons with embedded mini-simulators and quizzes; progress saved on-device.
- **Dark / light / system theming**, keyboard-operable controls, screen-reader data tables behind every chart.
- **Design system** preview at [/styleguide](apps/web/app/styleguide).

Everything runs in the browser and persists to `localStorage` in guest mode. All financial math lives in [`packages/finance-core`](packages/finance-core) — a pure, dependency-free TypeScript library with **120 tests at 100% coverage** (golden values cross-checked against published bank calculators).

## Tech stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Framer Motion · pnpm workspaces · Vitest + Testing Library + jest-axe.

*(Planned for backend milestones: FastAPI · PostgreSQL · Redis · Auth.js · scikit-learn/XGBoost · Docker.)*

## Repository layout

```
packages/finance-core   Pure TS financial engine (100% test coverage)
apps/web                Next.js app: simulators, learning hub, design system
docs/                   Full planning set (PRD → deployment) — see below
```

## Roadmap status

| Milestone | Status | Notes |
|-----------|--------|-------|
| M0 Design system | ✅ shipped | Tokens, components, styleguide |
| M1 Savings/Compound/Inflation | ✅ shipped | + landing page |
| M2 Loan suite | ✅ shipped | Loans, investments, goals |
| M4 Credit score + Bank game | ✅ shipped | Built before M3 (client-side) |
| M5 Learning Hub | ✅ shipped | 3 lessons, quizzes, progress |
| M3 Accounts & backend | ⏳ blocked | Needs PostgreSQL + Redis (install Docker to unblock) |
| M6 AI Finance Tutor | ⏳ blocked | Needs FastAPI + an `ANTHROPIC_API_KEY` |
| M7 ML loan-prediction demo | ⏳ pending | Needs the Python ML service (Python 3.12 is available) |
| M8 Hardening & production | ⏳ pending | Perf, a11y audit, CI/CD, deploy |

**To unblock the backend milestones:** install Docker Desktop (gives Postgres + Redis for M3), and provide an Anthropic API key for the tutor (M6). The ML demo (M7) only needs the Python toolchain, already present.

## Development

```bash
pnpm lint         # ESLint across the workspace
pnpm typecheck    # tsc --noEmit
pnpm test         # Vitest (finance-core + web)
pnpm build        # production build of the web app
```

## Planning documents

The full Phase-1 planning set lives in [`docs/`](docs/):

| # | Document | # | Document |
|---|----------|---|----------|
| 01 | [PRD](docs/01-prd.md) | 08 | [Folder Structure](docs/08-folder-structure.md) |
| 02 | [Feature Spec](docs/02-features.md) | 09 | [Security Model](docs/09-security.md) |
| 03 | [User Flows](docs/03-user-flows.md) | 10 | [Design System](docs/10-design-system.md) |
| 04 | [Wireframes](docs/04-wireframes.md) | 11 | [Roadmap](docs/11-roadmap.md) |
| 05 | [Architecture](docs/05-architecture.md) | 12 | [Testing Strategy](docs/12-testing-strategy.md) |
| 06 | [Database Design](docs/06-database.md) | 13 | [Deployment Plan](docs/13-deployment.md) |
| 07 | [API Design](docs/07-api-design.md) | | |

## The one-line pitch

> "If I save ₹1,000 a month at 7% for 10 years, what actually happens?" — BankSim AI answers questions like this by letting you *do it* and *watch it*, not by making you read about it.

> **Disclaimer:** BankSim AI is an educational simulation. Nothing in it is financial advice, a real bank product, or a real lending decision.
