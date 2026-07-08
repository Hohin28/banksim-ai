# 07 · API Design

FastAPI service, all routes under **`/api/v1`**. OpenAPI docs auto-generated at `/api/v1/docs` (disabled in production for non-admins).

## 1. Conventions

- **Auth:** `Authorization: Bearer <jwt>` (short-lived token minted from the Auth.js session — see [05-architecture.md](05-architecture.md) §3). Routes marked 🔓 accept unauthenticated (guest) calls; everything else returns `401` without a valid token.
- **Content:** JSON request/response, `snake_case` fields, timestamps in ISO-8601 UTC, money as integer paise inside JSONB payloads and decimal strings elsewhere.
- **Errors — one envelope everywhere:**

```json
{
  "error": {
    "code": "validation_error",
    "message": "target_amount must be greater than 0",
    "details": [{"field": "target_amount", "issue": "gt=0"}],
    "request_id": "req_8f3a…"
  }
}
```

| HTTP | `code` values |
|---|---|
| 400 | `validation_error`, `unsupported_engine_version` |
| 401 | `unauthenticated`, `token_expired` |
| 403 | `forbidden` |
| 404 | `not_found` |
| 409 | `conflict` (e.g. share slug taken) |
| 429 | `rate_limited` (+ `Retry-After` header) |
| 503 | `tutor_unavailable` (LLM down → client falls back to static library) |

- **Pagination:** cursor-based — `?limit=20&cursor=<opaque>` → `{items: [...], next_cursor: null | "..."}`.
- **Idempotency:** `PUT` state saves (bank game, credit sim) are last-write-wins with `updated_at` echo; clients send `If-Unmodified-Since` to detect conflicting tabs (`409`).
- **Versioning:** breaking change ⇒ `/api/v2`. Additive fields are non-breaking.

## 2. Endpoint catalog

### System
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/healthz` | 🔓 | Liveness (no deps touched) |
| GET | `/readyz` | 🔓 | Readiness (DB + Redis + models loaded) |

### Me / preferences
| Method | Path | Purpose |
|---|---|---|
| GET | `/me` | Profile + role + preferences |
| PATCH | `/me/preferences` | theme, number_format, reduced_motion |
| DELETE | `/me` | Start account deletion (7-day grace) |

### Scenarios
| Method | Path | Purpose |
|---|---|---|
| GET | `/scenarios?sim_type=&limit=&cursor=` | List own scenarios |
| POST | `/scenarios` | Save `{sim_type, name, inputs, summary, engine_ver}` |
| GET | `/scenarios/{id}` | Fetch one (own, or public via share slug route) |
| PATCH | `/scenarios/{id}` | Rename / update inputs+summary |
| DELETE | `/scenarios/{id}` | Delete |
| GET 🔓 | `/shared/{share_slug}` | P2: read-only public scenario |

### Goals
| Method | Path | Purpose |
|---|---|---|
| GET | `/goals` | List own goals |
| POST | `/goals` | Create |
| PATCH | `/goals/{id}` | Update fields / `saved_so_far` / status |
| DELETE | `/goals/{id}` | Delete |

*(Goal math is client-side; the API stores state. No compute endpoints.)*

### Credit-score simulator state
| Method | Path | Purpose |
|---|---|---|
| GET | `/credit-sim` | Fetch journey (404 if none) |
| PUT | `/credit-sim` | Upsert full state `{score, factors, events, sim_months}` |
| DELETE | `/credit-sim` | Reset journey |

### Bank game
| Method | Path | Purpose |
|---|---|---|
| GET | `/bank-game` | Fetch save slot |
| PUT | `/bank-game` | Upsert `{rng_seed, round, state, status}` |
| DELETE | `/bank-game` | Abandon save |

### Learning
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/learn/progress` | ✓ | All lesson progress + latest quiz results |
| PUT | `/learn/progress/{lesson_slug}` | ✓ | `{status, section_idx}` |
| POST | `/learn/quiz-attempts` | ✓ | `{lesson_slug, answers}` → server re-scores against the answer key bundled with API (never trust client score) → `{score_pct, passed, per_question}` |

### AI Tutor
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/tutor/conversations` | ✓ | List conversations |
| POST | `/tutor/conversations` | ✓ | Create `{page_ctx}` |
| GET | `/tutor/conversations/{id}/messages` | ✓ | History |
| POST 🔓 | `/tutor/messages` | both | Ask. Body: `{conversation_id?, question, page_ctx, sim_state?}`. **Response: SSE stream** (`text/event-stream`) of `{delta}` chunks, final event carries `{message_id, source}`. Guests: no persistence, low rate limit |
| POST | `/tutor/messages/{id}/flag` | ✓ | 👎 feedback |

### ML Demonstration
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET 🔓 | `/ml/models` | | Model cards: name, version, metrics (accuracy/precision/recall/ROC-AUC on test set), training-data description |
| POST 🔓 | `/ml/predict` | | Applicant features → per-model `{approved, probability, risk_band, contributions[]}` |
| GET 🔓 | `/ml/recent` | | Anonymized recent predictions (teaching table) |

### Admin (role = admin)
| Method | Path | Purpose |
|---|---|---|
| GET | `/admin/metrics` | Users, DAU, tutor spend, flagged answers count |
| GET | `/admin/tutor/flagged` | Review 👎 exchanges |
| GET | `/admin/audit-logs?user_id=&action=` | Query audit trail |
| PATCH | `/admin/users/{id}` | Set role / lock account |

## 3. Representative payloads

**POST `/scenarios`**
```json
{
  "sim_type": "savings",
  "name": "Laptop fund",
  "engine_ver": "1.4.0",
  "inputs": {"v": 1, "initial": 1000000, "monthly": 500000,
             "rate_bps": 700, "years": 10, "compounding": "monthly",
             "inflation_bps": 600},
  "summary": {"final": 17308500, "deposited": 12100000,
              "interest": 5208500, "real_final": 9664300}
}
```
*(money in paise, rates in basis points — integers end-to-end)*

**POST `/ml/predict` → 200**
```json
{
  "model_version": "2026.07-a",
  "results": [
    {"model": "logreg", "approved": true,  "probability": 0.71,
     "risk_band": "medium",
     "contributions": [{"feature": "credit_history", "weight": 0.34}, "…"]},
    {"model": "rf",  "approved": true,  "probability": 0.68, "…": "…"},
    {"model": "xgb", "approved": false, "probability": 0.54, "…": "…"}
  ],
  "disclaimer": "Educational demonstration only. Not a lending decision."
}
```

**Tutor SSE stream**
```
event: delta        data: {"text": "Great question! Think of interest as"}
event: delta        data: {"text": " rent paid on money…"}
event: done         data: {"message_id": "…", "source": "llm", "tokens": 214}
```

## 4. Rate limits (enforced in Redis, per [09-security.md](09-security.md))

| Route group | Guest (per IP) | Signed-in (per user) |
|---|---|---|
| `/tutor/messages` | 5 / day | 40 / day, 5 / min |
| `/ml/predict` | 20 / hour | 100 / hour |
| Auth endpoints (Next.js side) | 5 fails / 15 min / IP+email | — |
| Writes (scenarios, goals, saves) | — | 60 / min |
| Everything else | 120 / min | 240 / min |

`429` responses always include `Retry-After`; the client surfaces a friendly countdown, never a raw error.

## 5. Cross-origin & transport

- CORS: allow only the web origin(s) (`https://banksim.app`, preview URLs via env allowlist); credentials not needed (bearer tokens, not cookies, cross-service).
- TLS everywhere; HSTS at the edge.
- SSE endpoints send heartbeat comments every 15 s to survive proxies.
