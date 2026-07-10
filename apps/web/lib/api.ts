/**
 * Client for the BankSim API (FastAPI). Until deployment (M8) the API runs
 * locally: `.venv\Scripts\python -m uvicorn app.main:app --port 8000` from
 * apps/api. Configurable per docs/13 §3.
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const err = body?.error;
    throw new ApiError(err?.code ?? "unknown", err?.message ?? res.statusText);
  }
  return body as T;
}
