"""BankSim API — M7 scope: health + ML demonstration router.

The full business API (auth, scenarios, goals, tutor…) arrives with M3 once
Postgres/Redis exist (docs/05 §3). Everything here already follows the
conventions in docs/07-api-design.md: /api/v1 prefix, snake_case JSON, and
the single error envelope.
"""

from __future__ import annotations

from typing import Literal

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from .ml_service import ModelStoreError, load_store, predict_all

DISCLAIMER = (
    "Educational demonstration only — trained on the public 1994 German "
    "Credit dataset. Not a lending decision."
)

app = FastAPI(title="BankSim API", version="0.1.0", docs_url="/api/v1/docs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["content-type"],
)


def error_envelope(code: str, message: str, status: int, details: list | None = None) -> JSONResponse:
    """docs/07 §1: one error envelope everywhere."""
    return JSONResponse(
        status_code=status,
        content={"error": {"code": code, "message": message, "details": details or []}},
    )


@app.exception_handler(RequestValidationError)
async def on_validation_error(_: Request, exc: RequestValidationError) -> JSONResponse:
    details = [
        {"field": ".".join(str(p) for p in err["loc"][1:]), "issue": err["msg"]}
        for err in exc.errors()
    ]
    return error_envelope("validation_error", "Invalid request body", 400, details)


@app.exception_handler(ModelStoreError)
async def on_missing_models(_: Request, exc: ModelStoreError) -> JSONResponse:
    return error_envelope("models_unavailable", str(exc), 503)


class ApplicantFeatures(BaseModel):
    """The 9 training features. Codes follow the dataset's documentation;
    the web UI shows friendly labels for them."""

    model_config = {"extra": "forbid"}

    checking: Literal["A11", "A12", "A13", "A14"]
    credit_history: Literal["A30", "A31", "A32", "A33", "A34"]
    savings: Literal["A61", "A62", "A63", "A64", "A65"]
    employment: Literal["A71", "A72", "A73", "A74", "A75"]
    housing: Literal["A151", "A152", "A153"]
    duration_months: int = Field(ge=4, le=72)
    amount: int = Field(ge=250, le=20000)
    installment_rate: int = Field(ge=1, le=4)
    existing_credits: int = Field(ge=1, le=4)


@app.get("/healthz")
def healthz() -> dict:
    try:
        load_store()
        models_loaded = True
    except ModelStoreError:
        models_loaded = False
    return {"status": "ok", "models_loaded": models_loaded}


@app.get("/api/v1/ml/models")
def model_cards() -> dict:
    return {**load_store()["cards"], "disclaimer": DISCLAIMER}


@app.post("/api/v1/ml/predict")
def predict(features: ApplicantFeatures) -> dict:
    return {
        "model_version": load_store()["cards"]["version"],
        "results": predict_all(features.model_dump()),
        "disclaimer": DISCLAIMER,
    }
