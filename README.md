# BankSim AI — Learn Finance Through Interactive Simulations

An educational web platform that teaches personal finance and banking concepts through **interactive simulations** instead of text. Users change numbers with sliders and instantly see what happens to their money — through animated charts, timelines, and plain-language AI explanations.

> **Status: Phase 1 — Planning.** No application code has been written yet. All planning documents live in [`docs/`](docs/) and must be reviewed and approved before development begins.

## Planning documents

| # | Document | Covers |
|---|----------|--------|
| 01 | [Product Requirements Document](docs/01-prd.md) | Vision, personas, goals, success metrics, scope, non-goals, risks |
| 02 | [Feature Specification](docs/02-features.md) | All 11 core features + cross-cutting features, priorities, what each teaches |
| 03 | [User Flows](docs/03-user-flows.md) | Journeys through the app, guest vs. signed-in, per-feature flows |
| 04 | [Wireframes](docs/04-wireframes.md) | Low-fidelity layouts for every key screen |
| 05 | [System Architecture](docs/05-architecture.md) | Components, data flow, tech stack justification, key decisions |
| 06 | [Database Design](docs/06-database.md) | ER diagram, full schema DDL, Redis usage |
| 07 | [API Design](docs/07-api-design.md) | REST conventions, every endpoint, sample payloads, rate limits |
| 08 | [Folder Structure](docs/08-folder-structure.md) | Monorepo layout for frontend, backend, ML, infra |
| 09 | [Security Model](docs/09-security.md) | Threat model, authn/authz, validation, rate limiting, headers, audit |
| 10 | [UI Design System](docs/10-design-system.md) | Colors, typography, spacing, components, motion, chart rules, accessibility |
| 11 | [Development Roadmap](docs/11-roadmap.md) | Milestones M0–M8, deliverables, acceptance criteria |
| 12 | [Testing Strategy](docs/12-testing-strategy.md) | Test pyramid, financial-math golden tests, E2E, a11y, CI gates |
| 13 | [Deployment Plan](docs/13-deployment.md) | Environments, Docker, CI/CD, hosting, monitoring, backups |

## The one-line pitch

> "If I save ₹1,000 a month at 7% for 10 years, what actually happens?" — BankSim AI answers questions like this by letting you *do it* and *watch it*, not by making you read about it.

## Tech stack (planned)

Next.js + React + TypeScript + Tailwind CSS + Framer Motion · FastAPI + Python · scikit-learn + XGBoost · PostgreSQL + Redis · Auth.js · Docker + GitHub Actions · Vercel (web) + Railway/Render (API)
