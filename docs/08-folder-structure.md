# 08 · Folder Structure

Monorepo (pnpm workspaces for JS, uv/pip for Python). One repo = one PR can touch contract + both sides.

```
banksim-ai/
├─ README.md
├─ docs/                          # ← these planning documents
├─ .github/
│  └─ workflows/
│     ├─ web-ci.yml               # lint, typecheck, unit, build (frontend + packages)
│     ├─ api-ci.yml               # ruff, mypy, pytest, docker build
│     ├─ e2e.yml                  # Playwright against preview deploy
│     └─ deploy.yml               # promote on main → Vercel + Railway
│
├─ packages/
│  └─ finance-core/               # ★ THE pure TS math/game library — zero deps, zero DOM
│     ├─ src/
│     │  ├─ savings.ts            # FV w/ contributions, real value
│     │  ├─ compound.ts           # simple vs compound, rule of 72
│     │  ├─ loan.ts               # EMI, amortization schedule, DTI/FOIR, approval heuristic
│     │  ├─ inflation.ts
│     │  ├─ investments.ts        # instrument presets + projections + variance bands
│     │  ├─ goals.ts              # required-monthly solver (both directions)
│     │  ├─ credit-score/         # transparent weighted model + event engine
│     │  ├─ bank-game/            # applicant generator (seeded RNG), round resolution
│     │  ├─ money.ts              # paise-integer arithmetic, formatting helpers
│     │  └─ index.ts
│     └─ tests/                   # golden values, property tests (see 12-testing-strategy)
│
├─ apps/
│  ├─ web/                        # Next.js (App Router, TypeScript)
│  │  ├─ app/
│  │  │  ├─ (marketing)/page.tsx            # landing
│  │  │  ├─ (sims)/
│  │  │  │  ├─ savings/page.tsx
│  │  │  │  ├─ compound-interest/page.tsx
│  │  │  │  ├─ loans/page.tsx
│  │  │  │  ├─ credit-score/page.tsx
│  │  │  │  ├─ inflation/page.tsx
│  │  │  │  ├─ investments/page.tsx
│  │  │  │  ├─ goals/page.tsx
│  │  │  │  └─ bank-game/page.tsx
│  │  │  ├─ learn/
│  │  │  │  ├─ page.tsx                     # hub index
│  │  │  │  └─ [slug]/page.tsx              # MDX lesson renderer
│  │  │  ├─ ml-demo/page.tsx
│  │  │  ├─ dashboard/page.tsx
│  │  │  ├─ auth/…                          # sign-in/up/verify pages
│  │  │  └─ api/
│  │  │     ├─ auth/[...nextauth]/route.ts  # Auth.js
│  │  │     └─ token/route.ts               # mint short-lived API bearer
│  │  ├─ components/
│  │  │  ├─ ui/                   # Button, GlassCard, Slider, Field, Tabs, Modal, Toast…
│  │  │  ├─ simulator/            # SimulatorShell, ControlsPanel, StatRow, ExplainerPanel…
│  │  │  ├─ charts/               # GrowthAreaChart, AmortizationBars, ScoreGauge,
│  │  │  │                        # DonutSplit, ChartTableTab (a11y twin)…
│  │  │  ├─ tutor/                # TutorFab, TutorDrawer, StreamedMessage…
│  │  │  └─ lessons/              # MDX component set incl. <MiniSim/>
│  │  ├─ content/lessons/         # *.mdx + quiz *.yaml (answer keys mirrored to API)
│  │  ├─ lib/                     # api client, auth helpers, url-state serializer,
│  │  │                           # formatMoney, feature flags, analytics
│  │  ├─ styles/                  # tailwind config lives at root of app; token css
│  │  ├─ public/
│  │  └─ tests/                   # component tests (Vitest + Testing Library)
│  │
│  └─ api/                        # FastAPI (Python 3.12)
│     ├─ pyproject.toml
│     ├─ alembic/                 # migrations (incl. auth-table baseline)
│     ├─ app/
│     │  ├─ main.py               # app factory, middleware stack
│     │  ├─ core/                 # config (pydantic-settings), security (JWT verify),
│     │  │                        # rate_limit.py, logging.py, errors.py
│     │  ├─ db/                   # engine/session, models/ (SQLAlchemy), repos/
│     │  ├─ routers/
│     │  │  ├─ me.py  scenarios.py  goals.py  credit_sim.py  bank_game.py
│     │  │  ├─ learn.py  tutor.py  ml.py  admin.py  system.py
│     │  ├─ schemas/              # Pydantic request/response models (mirror docs/07)
│     │  ├─ services/
│     │  │  ├─ tutor/             # llm client, static_library.yaml, cache, prompts.py
│     │  │  ├─ quiz_scoring.py    # server-side re-score w/ bundled answer keys
│     │  │  └─ ml_service.py      # artifact loading, predict, contributions
│     │  └─ audit.py
│     ├─ models_store/            # versioned .joblib artifacts + model_cards.json
│     └─ tests/                   # pytest: unit + httpx API tests + testcontainers-postgres
│
├─ ml/                            # offline training (never deployed)
│  ├─ data/                       # raw + processed dataset (gitignored; fetch script)
│  ├─ notebooks/                  # exploration (kept light, outputs stripped)
│  ├─ src/
│  │  ├─ fetch_data.py  preprocess.py  train.py  evaluate.py  export.py
│  └─ Makefile                    # `make train` → reproducible artifacts into models_store/
│
├─ infra/
│  ├─ docker/
│  │  ├─ api.Dockerfile
│  │  └─ web.Dockerfile           # only used for self-hosting; Vercel builds web natively
│  ├─ docker-compose.yml          # local: postgres + redis + api + web
│  └─ railway/ render/            # service config as code (whichever host wins at M8)
│
├─ package.json  pnpm-workspace.yaml               # JS workspace (pnpm -r runs tasks; no extra runner needed at this scale)
└─ .env.example                   # every env var documented, no secrets
```

## Rules that keep this structure honest

1. **`packages/finance-core` imports nothing** from apps, React, or the DOM. Apps import it; never the reverse. This is enforced with an ESLint boundary rule.
2. **Quiz answer keys** live once in `apps/web/content/lessons/*.yaml` and are copied into the API image at build time — the server is the only scorer ([07-api-design.md](07-api-design.md)).
3. **`ml/` is offline-only.** The API consumes versioned artifacts from `models_store/`; retraining is a PR that updates artifacts + `model_cards.json`, reviewed like code.
4. **Schemas mirror docs:** every Pydantic model in `apps/api/app/schemas/` and every Zod schema in `apps/web/lib/` must trace to [07-api-design.md](07-api-design.md). Drift is a review blocker.
5. **`.env.example` is the contract** for configuration; CI fails if a referenced env var is missing from it.
