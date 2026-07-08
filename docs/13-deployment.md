# 13 · Deployment Plan

## 1. Environments

| Env | Web | API + data | Purpose |
|---|---|---|---|
| **local** | `pnpm dev` | docker-compose: postgres 16, redis 7, api (uvicorn --reload), mailpit | day-to-day dev; one command: `pnpm dev:all` |
| **preview** | Vercel preview per PR | shared staging API (`api-staging`) with its own DB/Redis | PR review, E2E target |
| **staging** | Vercel `staging` branch alias | `api-staging` | pre-release soak, ZAP scans, Lighthouse |
| **production** | Vercel prod | `api` service + managed Postgres + managed Redis | users |

Hosting: **Vercel** for the Next.js app (it cannot host the Python API or Redis); **Railway or Render** (final pick at M8 start — both fit; abstracted behind Docker + config-as-code in `infra/`) for FastAPI, PostgreSQL, Redis. Custom domain: `banksim.app` (web) + `api.banksim.app`.

## 2. Containerization

**`infra/docker/api.Dockerfile`** — multi-stage:
1. `python:3.12-slim` builder: install uv, resolve locked deps into a venv.
2. Runtime stage: copy venv + `app/` + `models_store/` + baked lesson answer keys; non-root `appuser`; `HEALTHCHECK` hits `/healthz`; run `uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2`.
Target image < 400 MB (sklearn/xgboost dominate). Web has a Dockerfile only for optional self-hosting; Vercel builds it natively.

**docker-compose (local):** postgres (volume), redis, api (bind-mounted for reload), mailpit (SMTP UI for verification emails). `make bootstrap` = compose up + alembic upgrade + seed.

## 3. Configuration (12-factor)

All config via env vars, documented in `.env.example`, validated at boot (pydantic-settings — the API refuses to start with missing/invalid config):

`DATABASE_URL`, `REDIS_URL`, `API_JWT_SECRET` (+ `API_JWT_SECRET_NEXT` for rotation), `AUTH_SECRET`, `GOOGLE_CLIENT_ID/SECRET`, `ANTHROPIC_API_KEY`, `TUTOR_MODEL`, `TUTOR_MONTHLY_BUDGET_INR`, `SENTRY_DSN`, `WEB_ORIGIN`, `ENV`, `SMTP_URL`, feature flags (`FLAG_SHARE_LINKS`, …).

Secrets live only in Vercel/Railway secret stores. `NEXT_PUBLIC_*` allowlist reviewed in PR ([09-security.md](09-security.md)).

## 4. CI/CD (GitHub Actions)

```
PR opened ──► web-ci ──► api-ci ──► e2e-smoke ──► ✅ mergeable
                 │           │
                 └── Vercel preview deploy (automatic)

merge to main ─► full test suite
              ─► build & push api image (ghcr.io, tagged sha + latest)
              ─► deploy api-staging ─► alembic upgrade (release phase)
              ─► e2e-full vs staging ─► Lighthouse budgets
              ─► manual approval gate (GitHub environment protection)
              ─► deploy production:
                    1. alembic upgrade (backward-compatible migrations only —
                       expand/contract pattern; destructive steps ship one release later)
                    2. rolling restart of api (healthcheck-gated)
                    3. Vercel promote to production
              ─► smoke check: /readyz, landing page, one live sim assertion
              ─► on failure: auto-rollback (previous image tag + Vercel instant rollback);
                 migrations are never auto-rolled-back — contract steps make that safe
```

Nightly workflow: full E2E, ZAP baseline, dependency audit, DB backup-restore verification (see §6).

## 5. Monitoring, logging, error tracking

| Concern | Tool | Notes |
|---|---|---|
| Error tracking | **Sentry** (web + API projects) | release-tagged, PII scrubbed (auth headers, cookies, emails) |
| Uptime | Better Uptime / UptimeRobot | `/readyz` + landing page, 1-min interval, alert to email/Telegram |
| API logs | structured JSON (structlog) → host log drain | request_id on every line = the id in error envelopes |
| Metrics | host dashboards + lightweight `/metrics` counters | p95 latency, 429 rate, tutor tokens/day |
| LLM spend | Redis `tutor:budget:{yyyymm}` + daily cron alert at 60/85/100% | 100% ⇒ automatic static-library mode |
| Frontend vitals | Vercel Analytics (privacy-friendly) | LCP/CLS/INP per route |

Alert policy: page-worthy = production down, error-rate spike, budget 100%. Everything else is a daily digest.

## 6. Data safety

- Managed Postgres daily snapshots (7-day retention) + weekly logical `pg_dump` to object storage (30-day retention).
- **Restore drill is part of M8 acceptance** and the nightly job restores the latest dump into a scratch DB and runs row-count sanity checks — a backup that isn't restored is a rumor.
- Redis is cache-only: flushable at any time by design; no backup needed.
- Runbooks in `docs/runbooks/`: restore-from-backup, rotate-jwt-secret, LLM-outage, host-region-outage (acceptance: each runbook executed once for real before launch).

## 7. Launch checklist (gates M8 completion)

- [ ] Domains + TLS + HSTS preload submitted
- [ ] All security headers verified on prod (securityheaders.com grade A)
- [ ] ZAP baseline: no medium+ findings unresolved
- [ ] Lighthouse prod: perf ≥ 90, a11y ≥ 95, best-practices ≥ 95 on landing, savings, loan, lesson
- [ ] E2E suite green against production config (staging)
- [ ] Backup restore drill performed and documented
- [ ] Sentry receiving events from both apps; uptime alerts firing on test
- [ ] Rate limits verified from a cold client (guest + user)
- [ ] LLM budget kill-switch tested in staging
- [ ] Legal pages: privacy policy, terms, "not financial advice" disclosure
- [ ] README: architecture diagram, screenshots/GIFs, local-dev quickstart, live URL
- [ ] Rollback rehearsed once (deploy previous tag on purpose)

## 8. Cost envelope (initial)

| Item | Est./month |
|---|---|
| Vercel hobby/pro | $0–20 |
| Railway/Render (api + pg + redis) | $10–20 |
| LLM API (budget-capped) | ≤ $10 hard cap |
| Sentry/dev tooling free tiers | $0 |
| Domain | ~$1.5 amortized |
| **Total** | **≈ $20–50** |

Scale triggers documented in runbooks: sustained p95 > 500 ms ⇒ +1 API worker; DB > 60% storage ⇒ tier bump; LLM cap raised only by explicit owner decision.
