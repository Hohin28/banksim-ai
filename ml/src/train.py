"""Train the M7 demonstration models (docs/02 F10, docs/12 §5).

Reproducible end-to-end: fixed seeds, stratified split, three classifiers
(logistic regression, random forest, XGBoost), metric floors asserted, and
artifacts + model cards exported to apps/api/models_store/.

Deliberate choices, surfaced in the UI's ethics panel:
- We use 9 of the 20 attributes — the interpretable financial ones.
- We EXCLUDE the protected/proxy attributes present in the raw data:
  personal status & sex (col 9), age (col 13), foreign worker (col 20).
  The original dataset would happily let a model learn from them.

Run:  .venv/Scripts/python ml/src/train.py
"""

from __future__ import annotations

import json
from datetime import date
from pathlib import Path

import joblib
import pandas as pd
from fetch_data import fetch
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from xgboost import XGBClassifier

SEED = 42
MODEL_VERSION = f"german-{date.today():%Y.%m}"
STORE = Path(__file__).resolve().parents[2] / "apps" / "api" / "models_store"

# Column positions in german.data (space-separated, no header).
COLUMNS = {
    "checking": 0,
    "duration_months": 1,
    "credit_history": 2,
    "amount": 4,
    "savings": 5,
    "employment": 6,
    "installment_rate": 7,
    "housing": 14,
    "existing_credits": 15,
}
LABEL_COL = 20  # 1 = good credit risk, 2 = bad

CATEGORICAL = ["checking", "credit_history", "savings", "employment", "housing"]
NUMERIC = ["duration_months", "amount", "installment_rate", "existing_credits"]

# Valid raw codes per categorical feature (from german.doc) — exported so the
# API and the web form validate against the same spec.
ENUMS = {
    "checking": ["A11", "A12", "A13", "A14"],
    "credit_history": ["A30", "A31", "A32", "A33", "A34"],
    "savings": ["A61", "A62", "A63", "A64", "A65"],
    "employment": ["A71", "A72", "A73", "A74", "A75"],
    "housing": ["A151", "A152", "A153"],
}
NUMERIC_RANGES = {
    "duration_months": [4, 72],
    "amount": [250, 20000],
    "installment_rate": [1, 4],
    "existing_credits": [1, 4],
}

# Quality floors (docs/12 §5): retraining that regresses below these fails.
AUC_FLOOR = 0.70


def load_frame() -> tuple[pd.DataFrame, pd.Series]:
    raw = pd.read_csv(fetch(), sep=" ", header=None)
    X = pd.DataFrame({name: raw[idx] for name, idx in COLUMNS.items()})
    y = (raw[LABEL_COL] == 1).astype(int)  # 1 = creditworthy
    return X, y


def make_preprocessor() -> ColumnTransformer:
    return ColumnTransformer(
        [
            ("cat", OneHotEncoder(handle_unknown="error"), CATEGORICAL),
            ("num", StandardScaler(), NUMERIC),
        ]
    )


def build_models() -> dict[str, Pipeline]:
    return {
        "logreg": Pipeline(
            [
                ("pre", make_preprocessor()),
                ("clf", LogisticRegression(max_iter=2000, random_state=SEED)),
            ]
        ),
        "rf": Pipeline(
            [
                ("pre", make_preprocessor()),
                (
                    "clf",
                    RandomForestClassifier(
                        n_estimators=200, max_depth=8, random_state=SEED
                    ),
                ),
            ]
        ),
        "xgb": Pipeline(
            [
                ("pre", make_preprocessor()),
                (
                    "clf",
                    XGBClassifier(
                        n_estimators=250,
                        max_depth=4,
                        learning_rate=0.08,
                        subsample=0.9,
                        colsample_bytree=0.9,
                        random_state=SEED,
                        eval_metric="logloss",
                    ),
                ),
            ]
        ),
    }


def main() -> None:
    X, y = load_frame()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )
    print(f"train={len(X_train)} test={len(X_test)} positive_rate={y.mean():.3f}")

    STORE.mkdir(parents=True, exist_ok=True)
    cards: dict[str, object] = {
        "version": MODEL_VERSION,
        "dataset": {
            "name": "UCI Statlog German Credit",
            "url": "https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data",
            "rows": int(len(X)),
            "year": 1994,
            "note": (
                "1,000 loan applications from a German bank; amounts are in "
                "1990s Deutsche Mark. Protected/proxy attributes present in the "
                "raw data (personal status & sex, age, foreign worker) are "
                "deliberately excluded from training."
            ),
        },
        "features": {"categorical": ENUMS, "numeric": NUMERIC_RANGES},
        "seed": SEED,
        "models": {},
    }

    for name, pipeline in build_models().items():
        pipeline.fit(X_train, y_train)
        proba = pipeline.predict_proba(X_test)[:, 1]
        pred = (proba >= 0.5).astype(int)
        metrics = {
            "accuracy": round(float(accuracy_score(y_test, pred)), 4),
            "precision": round(float(precision_score(y_test, pred)), 4),
            "recall": round(float(recall_score(y_test, pred)), 4),
            "f1": round(float(f1_score(y_test, pred)), 4),
            "roc_auc": round(float(roc_auc_score(y_test, proba)), 4),
        }
        assert metrics["roc_auc"] >= AUC_FLOOR, (
            f"{name} AUC {metrics['roc_auc']} below floor {AUC_FLOOR}"
        )
        joblib.dump(pipeline, STORE / f"{name}.joblib")
        cards["models"][name] = metrics  # type: ignore[index]
        print(f"{name}: {metrics}")

    (STORE / "model_cards.json").write_text(json.dumps(cards, indent=2))
    print(f"artifacts written to {STORE}")


if __name__ == "__main__":
    main()
