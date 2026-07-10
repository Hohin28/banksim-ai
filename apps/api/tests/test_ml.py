"""API tests for the ML demonstration (docs/12 §3/§5)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)

VALID = {
    "checking": "A11",
    "credit_history": "A32",
    "savings": "A61",
    "employment": "A73",
    "housing": "A152",
    "duration_months": 24,
    "amount": 3500,
    "installment_rate": 3,
    "existing_credits": 1,
}


def test_healthz_reports_models_loaded():
    r = client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
    assert body["models_loaded"] is True


def test_model_cards_expose_metrics_and_disclaimer():
    r = client.get("/api/v1/ml/models")
    assert r.status_code == 200
    body = r.json()
    assert set(body["models"].keys()) == {"logreg", "rf", "xgb"}
    for metrics in body["models"].values():
        assert metrics["roc_auc"] >= 0.70  # quality floor, docs/12 §5
    assert "Not a lending decision" in body["disclaimer"]


def test_predict_returns_three_verdicts():
    r = client.post("/api/v1/ml/predict", json=VALID)
    assert r.status_code == 200
    body = r.json()
    results = body["results"]
    assert [x["model"] for x in results] == ["logreg", "rf", "xgb"]
    for x in results:
        assert 0.0 <= x["probability"] <= 1.0
        assert x["risk_band"] in {"low", "medium", "high"}
        assert x["approved"] == (x["probability"] >= 0.5)
    assert "disclaimer" in body


def test_predict_is_deterministic():
    a = client.post("/api/v1/ml/predict", json=VALID).json()
    b = client.post("/api/v1/ml/predict", json=VALID).json()
    assert a == b


def test_logreg_contributions_cover_all_nine_features():
    r = client.post("/api/v1/ml/predict", json=VALID).json()
    logreg = next(x for x in r["results"] if x["model"] == "logreg")
    features = {c["feature"] for c in logreg["contributions"]}
    assert features == {
        "checking", "credit_history", "savings", "employment", "housing",
        "duration_months", "amount", "installment_rate", "existing_credits",
    }


def test_stronger_profile_scores_higher():
    weak = client.post("/api/v1/ml/predict", json=VALID).json()
    strong = client.post(
        "/api/v1/ml/predict",
        json={**VALID, "checking": "A14", "credit_history": "A34", "savings": "A65"},
    ).json()
    # A14 (no checking a/c) + A34 + A65 are the dataset's strongest good-risk
    # signals; every model should rank this profile above the weak one.
    for m_weak, m_strong in zip(weak["results"], strong["results"]):
        assert m_strong["probability"] > m_weak["probability"]


def test_validation_errors_use_the_envelope():
    r = client.post("/api/v1/ml/predict", json={**VALID, "amount": 999999})
    assert r.status_code == 400
    body = r.json()
    assert body["error"]["code"] == "validation_error"
    assert any(d["field"] == "amount" for d in body["error"]["details"])


def test_unknown_enum_rejected():
    r = client.post("/api/v1/ml/predict", json={**VALID, "checking": "HACK"})
    assert r.status_code == 400


def test_extra_fields_rejected():
    r = client.post("/api/v1/ml/predict", json={**VALID, "age": 30})
    assert r.status_code == 400
