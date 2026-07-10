"""Model loading + inference for the ML demonstration (docs/02 F10).

Loads the versioned artifacts produced by ml/src/train.py at startup and
serves per-model predictions. For logistic regression we also return signed
per-feature contributions (log-odds), grouped back onto the 9 input features
— the teaching payload behind the "why did it decide that?" bars.
"""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any

import joblib
import pandas as pd

STORE = Path(__file__).resolve().parents[1] / "models_store"
MODEL_NAMES = ("logreg", "rf", "xgb")

CATEGORICAL = ["checking", "credit_history", "savings", "employment", "housing"]
NUMERIC = ["duration_months", "amount", "installment_rate", "existing_credits"]
ALL_FEATURES = CATEGORICAL + NUMERIC


class ModelStoreError(RuntimeError):
    """Raised when artifacts are missing — run ml/src/train.py first."""


@lru_cache(maxsize=1)
def load_store() -> dict[str, Any]:
    cards_path = STORE / "model_cards.json"
    if not cards_path.exists():
        raise ModelStoreError(
            f"model_cards.json not found in {STORE}. Run: python ml/src/train.py"
        )
    cards = json.loads(cards_path.read_text())
    models = {name: joblib.load(STORE / f"{name}.joblib") for name in MODEL_NAMES}
    return {"cards": cards, "models": models}


def risk_band(p_good: float) -> str:
    if p_good >= 0.75:
        return "low"
    if p_good >= 0.5:
        return "medium"
    return "high"


def _logreg_contributions(pipeline: Any, frame: pd.DataFrame) -> list[dict[str, Any]]:
    """Per-original-feature signed log-odds contributions for one row."""
    pre = pipeline.named_steps["pre"]
    clf = pipeline.named_steps["clf"]
    transformed = pre.transform(frame)
    row = transformed.toarray()[0] if hasattr(transformed, "toarray") else transformed[0]
    names = pre.get_feature_names_out()

    grouped: dict[str, float] = {f: 0.0 for f in ALL_FEATURES}
    for name, value, coef in zip(names, row, clf.coef_[0]):
        stripped = name.split("__", 1)[1]  # "cat__checking_A14" -> "checking_A14"
        original = next(f for f in ALL_FEATURES if stripped.startswith(f))
        grouped[original] += float(value) * float(coef)

    return sorted(
        (
            {"feature": feature, "weight": round(weight, 4)}
            for feature, weight in grouped.items()
        ),
        key=lambda item: -abs(item["weight"]),
    )


def predict_all(features: dict[str, Any]) -> list[dict[str, Any]]:
    store = load_store()
    frame = pd.DataFrame([features], columns=ALL_FEATURES)

    results: list[dict[str, Any]] = []
    for name in MODEL_NAMES:
        pipeline = store["models"][name]
        p_good = float(pipeline.predict_proba(frame)[0, 1])
        result: dict[str, Any] = {
            "model": name,
            "approved": p_good >= 0.5,
            "probability": round(p_good, 4),
            "risk_band": risk_band(p_good),
        }
        if name == "logreg":
            result["contributions"] = _logreg_contributions(pipeline, frame)
        results.append(result)
    return results
