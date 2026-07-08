# 09 · Security Model

Scope note: BankSim holds **no real financial data** — the crown jewels are user credentials, learning history, and AI-conversation text. The threat model is sized accordingly: protect accounts and the LLM budget; keep the platform unembarrassable (defacement, XSS, data leak).

## 1. Threat model (STRIDE-lite)

| Threat | Vector | Primary defense |
|---|---|---|
| Credential stuffing / brute force | Auth endpoints | argon2id, per-IP+email fail limits, no user-enumeration in errors |
| Session theft | XSS, token leakage | HttpOnly/SameSite session cookie; API bearer token short-lived (≤15 min), memory-only, never localStorage |
| XSS | Lesson MDX, AI tutor output, user-named scenarios | React escaping, sanitized markdown rendering for tutor output, strict CSP |
| CSRF | State-changing requests | Auth.js built-in CSRF for cookie flows; API uses bearer tokens (immune to CSRF); SameSite=Lax cookies |
| SQL injection | All DB access | SQLAlchemy bound parameters exclusively; zero string-built SQL (CI grep gate) |
| IDOR | `/scenarios/{id}` etc. | Every repo query filters `user_id = current_user` — ownership in the query, not an afterthought check |
| Prompt injection → tutor misuse | `sim_state`/question fields | Context injected as structured data in the user turn, constrained system prompt, output length caps, no tools/actions attached to the LLM, answers rendered as sanitized markdown |
| LLM cost abuse | Tutor endpoint | Per-user/IP rate limits + monthly token budget kill-switch (Redis) |
| DoS-ish scraping | ML predict, public routes | Per-IP rate limits, Cloudflare/host-level protection |
| Supply chain | npm/pip deps | Lockfiles, Dependabot, `pnpm audit`/`pip-audit` in CI |
| Secrets leakage | Repo, logs | No secrets in repo (`.env.example` only), secret scanning in CI, structured logs scrub tokens/emails |

## 2. Authentication

- **Auth.js** with two providers: credentials (email+password) and Google OAuth.
- Passwords: **argon2id** (memory 64 MiB, iterations tuned to ~100 ms), min length 10, checked against a breached-password list (zxcvbn score ≥ 3).
- Email verification required before persistence features unlock (simulators stay open regardless).
- Session: JWT strategy, HttpOnly + Secure + SameSite=Lax cookie, 30-day rolling with 24 h re-issue.
- API access: `/api/token` mints a ≤15-min HS256 bearer (claims: `sub`, `role`, `exp`, `jti`) verified statelessly by FastAPI middleware. Clock-skew tolerance 30 s.
- Password reset: single-use tokens (Auth.js `verification_tokens`), 30-min expiry, sessions invalidated on reset (JWT `iat` cutoff stored per user).
- Account lock: 10 consecutive failures → 15-min lock + audit entry.

## 3. Authorization (RBAC)

| Role | Grants |
|---|---|
| `student` (default) | Own resources only |
| `educator` | = student (v1); reserved for classroom features (v2) |
| `admin` | Admin router; still cannot read other users' tutor conversations except flagged ones |

Enforcement: FastAPI dependency `require_role(...)` on routers + **ownership scoping inside every repository method** (`WHERE user_id = :uid`). No route trusts a client-supplied user id, ever.

## 4. Input validation

- **Client:** Zod schemas per form (UX-level).
- **Server (authoritative):** Pydantic models with tight bounds mirroring [07-api-design.md](07-api-design.md) — e.g. `score: int, ge=300, le=900`; `name: str, max 80, stripped`; JSONB payloads validated against versioned schemas before storage (no opaque blobs).
- Reject-by-default: unknown fields rejected (`model_config = ConfigDict(extra="forbid")`).
- Quiz scoring server-side only; game/state saves sanity-checked (round ≤ 12, capital within engine bounds) to keep leaderboard-adjacent data honest.

## 5. Rate limiting

Redis sliding-window (`rl:{scope}:{route}:{id}`), limits per [07-api-design.md](07-api-design.md) §4. Applied as FastAPI middleware; auth-route limiting lives in the Next.js layer. All `429`s carry `Retry-After`. Budget guard: tutor router consults `tutor:budget:{yyyymm}` before every LLM call — over budget ⇒ static-library-only mode + alert.

## 6. Web platform protections

**Security headers** (Next.js middleware + FastAPI):

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{r}';          # no unsafe-inline; nonce for Next runtime
  style-src 'self' 'unsafe-inline';        # Tailwind inline styles
  img-src 'self' data: blob:;
  connect-src 'self' https://api.banksim.app;
  frame-ancestors 'none'; base-uri 'self'; form-action 'self'
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
X-Frame-Options: DENY
```

- **XSS:** no `dangerouslySetInnerHTML` except the MDX renderer (build-time content, PR-reviewed) and the tutor markdown renderer (rehype-sanitize allowlist: p, em, strong, ul/ol/li, code — no html, no links with `javascript:`).
- **CSRF:** cookie-authenticated routes (Auth.js) use its double-submit CSRF token; the FastAPI surface is bearer-token-only and rejects cookie auth.
- **CORS:** exact-origin allowlist, no wildcard, no credentials.
- **Uploads:** none in v1 (no file upload surface at all).

## 7. Data protection & privacy

- PII collected: email, optional name/avatar. Nothing financial is real.
- At rest: managed-Postgres disk encryption; argon2id hashes; OAuth tokens stored only if provider requires (Google: not persisted beyond sign-in).
- IPs never stored raw — `ip_hash = sha256(ip + daily_salt)` in audit logs; raw IP exists only in transient rate-limit keys (TTL ≤ window).
- Account deletion: immediate lock, hard cascade delete after 7-day grace ([06-database.md](06-database.md)).
- Tutor conversations are the most sensitive text we hold: excluded from logs, admin-visible only when the user flags them.
- Minors are expected users → no ads, no third-party trackers; analytics limited to self-hosted/privacy-preserving counters.

## 8. Audit logging

`audit_logs` table ([06-database.md](06-database.md)) records: `auth.login`, `auth.fail`, `auth.lock`, `auth.password_reset`, `account.delete_requested/completed`, `scenario.create/delete`, `tutor.flagged`, `admin.*` (every admin action, with target). Append-only (no UPDATE/DELETE grants for the app role on this table); 180-day retention job.

## 9. Secrets & operations

- Secrets only in host env stores (Vercel/Railway) — never in git, never in client bundles (`NEXT_PUBLIC_` allowlist reviewed).
- Distinct DB roles: `app_rw` (no DDL), `migrator` (DDL, used by CI only).
- Key rotation: API JWT secret and daily IP salt rotatable without downtime (dual-key acceptance window).
- Dependabot weekly; `pip-audit` + `pnpm audit --prod` fail CI on high severity.
- Sentry scrubs: authorization headers, cookies, email fields.

## 10. Security testing (ties to [12-testing-strategy.md](12-testing-strategy.md))

- Unit tests for: ownership scoping (user A cannot fetch user B's scenario — explicit test per router), rate-limit behavior, JWT expiry/tamper rejection.
- CI static gates: eslint-plugin-security, `ruff` security rules (S-prefix), secret scanner (gitleaks).
- Pre-launch: OWASP ZAP baseline scan against staging; manual pass over the OWASP ASVS L1 checklist.
