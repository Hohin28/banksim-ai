# ml/ — offline training (never deployed)

Trains the three demonstration models for the **ML Loan Lab** (docs/02 F10)
and exports versioned artifacts + model cards to `apps/api/models_store/`,
which the FastAPI service loads at startup.

## Reproduce

```powershell
# from the repo root, once:
py -3.12 -m venv .venv
.venv\Scripts\python -m pip install -r ml\requirements.txt -r apps\api\requirements.txt

# fetch data + train + evaluate + export (deterministic, seed 42):
.venv\Scripts\python ml\src\train.py
```

Outputs into `apps/api/models_store/`:

- `logreg.joblib`, `rf.joblib`, `xgb.joblib` — full sklearn pipelines
  (one-hot + scaling + classifier), so the API predicts from raw feature dicts
- `model_cards.json` — metrics on the held-out 20% split, dataset provenance,
  feature spec (single source of truth for API + web validation)

Training asserts a **ROC-AUC ≥ 0.70 floor** per model (docs/12 §5) — a
retrain that regresses fails loudly.

## Dataset

[UCI Statlog German Credit](https://archive.ics.uci.edu/dataset/144/statlog+german+credit+data)
— 1,000 labelled loan applications from a German bank (1994, amounts in
Deutsche Mark). Downloaded to `ml/data/` (gitignored) by `fetch_data.py`.

We train on **9 of the 20 attributes** (the interpretable financial ones) and
**deliberately exclude** the protected/proxy attributes present in the raw
data — personal status & sex, age, foreign-worker status. The exclusions, and
why removing columns doesn't remove bias, are taught in the app's ethics
panel.

## Serving

```powershell
cd apps\api
..\..\.venv\Scripts\python -m uvicorn app.main:app --port 8000
```

Tests: `..\..\.venv\Scripts\python -m pytest` from `apps/api`.
